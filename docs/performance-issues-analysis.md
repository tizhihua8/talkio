# Avatar 性能问题深度分析报告

> 分析日期：2026-02-18  
> 分析范围：聊天页面卡顿、WebView 跳转、预览加载慢三大问题  
> **代码版本校验：已通过 double check（第二轮）**

---

## 问题 A：进入对话页面卡顿

### 现象
从对话列表点击进入对话时有明显卡顿，消息越多越明显，20 条以内也能感知。

### 根本原因分析

#### 1. 首屏全量消息渲染（UI 层未启用分页）✅ 准确

**数据库层支持分页**：
```typescript
// src/storage/database.ts 第 193-210 行
export async function getMessages(
  conversationId: string,
  branchId?: string | null,
  limit = 100,    // ← 支持分页
  offset = 0,
): Promise<Message[]> {
  const rows = await db
    .select()
    .from(messages)
    .where(and(...conditions))
    .orderBy(asc(messages.createdAt))
    .limit(limit)
    .offset(offset);
  return rows.map(rowToMessage);
}
```

**但 UI 层未使用**：
```typescript
// src/stores/chat-store.ts 第 126 行
const messages = await dbGetMessages(conversationId, get().activeBranchId);
// ⚠️ 没有传入 limit/offset 参数，默认加载全部（limit=100）
```

#### 2. JSON 解析开销 ✅ 准确
```typescript
// src/storage/database.ts 第 83-99 行
function rowToMessage(row: typeof messages.$inferSelect): Message {
  return {
    images: JSON.parse((row as any).images || "[]"),           // 第 1 次
    generatedImages: safeJsonParse((row as any).generatedImages, []), // 第 2 次
    toolCalls: JSON.parse(row.toolCalls || "[]"),              // 第 3 次
    toolResults: JSON.parse(row.toolResults || "[]"),          // 第 4 次
  };
}
```

#### 3. Markdown 解析阻塞主线程 ✅ 准确
```typescript
// src/components/chat/MessageBubble.tsx 第 154-156 行
message.isStreaming
  ? <Text className="text-[15px] leading-relaxed text-gray-800">{markdownContent}</Text>
  : <MarkdownRenderer content={markdownContent} />
```
- 非流式消息使用 `MarkdownRenderer`，需要完整 AST 解析

#### 4. LegendList 布局计算 ✅ 准确
- `recycleItems` + `maintainScrollAtEnd` 组合
- 首次渲染需要计算所有 item 高度

### 修复建议
| 问题 | 修复方案 |
|------|----------|
| 分页未启用 | 在 `chat-store.ts` 的 `loadMessages` 中传入 `limit=20` |
| JSON 解析 | 考虑缓存或使用 relational queries |
| Markdown 阻塞 | 使用 `onViewableItemsChanged` 懒渲染 |

---

## 问题 B：点击 WebView 预览区域后列表滚动到顶部

### 现象
触摸 HtmlPreview 的 WebView 预览内容区域，消息列表突然滚动到顶部。仅首次出现，后续点击不再复现。

### 根本原因分析

#### ⚠️ 未修复

**当前代码**（动态测高仍然存在）：
```typescript
// src/components/common/HtmlPreview.tsx 第 20 行
const [webViewHeight, setWebViewHeight] = useState(300);

// 第 63-69 行 - MutationObserver 动态测高
function sendHeight() {
  const h = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, 100);
  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'height', value: h }));
}
new MutationObserver(sendHeight).observe(document.body, { childList: true, subtree: true });

// 第 77-84 行 - handleMessage 回调
const handleMessage = (event: any) => {
  const data = JSON.parse(event.nativeEvent.data);
  if (data.type === "height" && data.value > 0) {
    setWebViewHeight(Math.min(Math.max(data.value + 24, 150), 500));
  }
};

// 第 174-185 行 - WebView 始终挂载（display:none 隐藏）
<View style={{ display: activeTab === "preview" ? "flex" : "none" }}>
  <WebView
    source={webViewSource}
    style={{ height: webViewHeight }}
    scrollEnabled={false}
    onMessage={handleMessage}
  />
</View>
```

**问题链路**：
1. WebView 首次 mount 时，MutationObserver 多次触发 `sendHeight`
2. `handleMessage` → `setWebViewHeight` → 组件高度变化
3. LegendList 在 `recycleItems` + `maintainScrollAtEnd` 下重算布局 → 滚动位置重置

### 修复方案
- 移除 `webViewHeight` 状态、`handleMessage`、`MutationObserver`
- 改为固定高度（如 400px），WebView 内部可滚动
- WebView 懒加载：只在 `activeTab === "preview"` 时才渲染

### 结论
**问题 B 未修复**，需要实施上述方案。

---

## 问题 C：HtmlPreview 预览加载慢

### 现象
切换到 Preview 标签后等待较长时间（超过 2 秒）才显示。

### 根本原因分析

#### 1. 初始状态是 "code" 标签页 ✅ 仍然存在
```typescript
// src/components/common/HtmlPreview.tsx 第 14 行
const [activeTab, setActiveTab] = useState<"preview" | "code">("code");  // ← 默认是 code 标签
```

#### 2. 2秒 codeStable 等待 ✅ 仍然存在
```typescript
// 第 33-40 行
const stableTimer = setTimeout(() => {
  setCodeStable(true);
  if (!userSwitchedRef.current) {
    setActiveTab("preview");  // ← 2秒后才自动切换
  }
}, 2000);
```

#### 3. 占位态阻止预览 ✅ 仍然存在
```typescript
// 第 80-95 行
if (!codeStable) {
  return (
    <View className="...">
      <Text>{language.toUpperCase()} {t("htmlPreview.writing")}</Text>
    </View>
  );
}
```

#### 4. WebView 未懒加载 ⚠️ 待优化
```typescript
// 第 174-185 行 - WebView 始终挂载，仅用 display:none 隐藏
<View style={{ display: activeTab === "preview" ? "flex" : "none" }}>
  <WebView source={webViewSource} style={{ height: webViewHeight }} ... />
</View>
```
- WebView 在组件 mount 时就创建，即使用户在 Code 标签页
- 应改为条件渲染：只在 `activeTab === "preview"` 时才创建 WebView 实例

### 问题 C 的完整时序
```
用户: "帮我写个 HTML 页面"
AI: 流式输出 HTML 代码...

时间线:
0.0s  ├─ 用户看到代码块，默认在"Code"标签
0.5s  ├─ HTML代码流式输出完成
      ├─ 用户点击"Preview"标签
      ├─ ❌ 但 !codeStable，显示"HTML 编写中..."占位态
2.0s  ├─ codeStable = true，自动切换到 Preview
      ├─ WebView 开始创建实例（懒加载，首次才创建）
2.3s  ├─ WebView 初始化完成
2.5s  ├─ 内容渲染完成

用户感知: "点击 Preview 后要等很久(2秒+)"
```

### 修复建议

```typescript
// 方案 1：默认显示 Preview
const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");

// 方案 2：缩短 codeStable 等待时间
const stableTimer = setTimeout(() => {
  setCodeStable(true);
  if (!userSwitchedRef.current) {
    setActiveTab("preview");
  }
}, 500);  // ← 缩短到 500ms

// 方案 3：用户手动切换时立即显示
const handleTabSwitch = (tab: "preview" | "code") => {
  setUserSwitched(true);
  setActiveTab(tab);  // ← 立即切换，不等待 codeStable
};

// 方案 4：占位态检查时考虑用户手动切换
if (!codeStable && !userSwitched) {
  // 只在用户未手动操作时显示占位态
  return <Placeholder />;
}
```

---

## Double Check 总结（第二轮）

| 问题 | 原分析 | 当前代码状态 | 需要修正 |
|------|--------|-------------|----------|
| **A - 分页** | 无分页 | ⚠️ 数据库支持，UI 层未启用 | 待修复 |
| **A - JSON** | 4次/条 | ✅ 确认存在 | 待优化 |
| **A - Markdown** | 阻塞 | ✅ 确认存在 | 待优化 |
| **B - 跳转顶部** | 动态测高 | ⚠️ **未修复** - 动态测高仍在 | 待修复 |
| **B - WebView** | 预创建 | ⚠️ **未优化** - 仍用 display:none | 待修复 |
| **C - 预览加载** | 2秒等待 | ✅ 确认存在 | 待修复 |

---

## 修复优先级建议（更新版）

| 优先级 | 问题 | 状态 | 修复复杂度 |
|--------|------|------|------------|
| 🔴 P0 | **B** - 跳转顶部（动态测高） | 未修复 | **中**（移除测高 + 固定高度 + 懒加载） |
| 🔴 P0 | **C** - 预览加载慢（2秒等待） | 未修复 | **低**（改默认值或缩短等待） |
| 🟡 P1 | **A** - 进入卡顿 | 未修复 | **低**（加 limit 参数） |

---

## 附录：当前代码关键版本（第二轮校验）

| 文件 | 关键代码 | 状态 |
|------|----------|------|
| `HtmlPreview.tsx` | `webViewHeight` 动态测高 + MutationObserver | ⚠️ 待修复（问题 B 根因） |
| `HtmlPreview.tsx` | WebView 始终挂载（display:none 隐藏） | ⚠️ 待修复（改为条件渲染） |
| `HtmlPreview.tsx` | `activeTab = "code"` 默认值 | ⚠️ 待优化 |
| `HtmlPreview.tsx` | `codeStable` 2秒等待 | ⚠️ 待优化 |
| `database.ts` | `getMessages` 支持 `limit=100, offset=0` | ✅ 支持 |
| `chat-store.ts` | `dbGetMessages` 未传分页参数 | ⚠️ 待优化 |
| `MessageBubble.tsx` | 非流式消息用 MarkdownRenderer | ⚠️ 待优化 |
