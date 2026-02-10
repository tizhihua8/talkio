# Avatar — 移动端多模型 AI Chat 客户端产品规格说明 (Spec)

> 版本：v0.1 | 日期：2026-02-10

---

## 1. 产品概述

### 1.1 产品定位

一款**微信式交互**的移动端多模型 AI 聊天客户端。核心理念：

- **去助手化**：用户不是在"使用工具"，而是在"和专家聊天"
- **模型即联系人**：通讯录里只有模型本体，没有"助手"的概念
- **身份可插拔**：System Prompt 以"身份卡"的形式动态挂载/卸载，而非绑死在某个聊天窗口
- **多模型协作**：支持群聊模式，让多个模型基于共享上下文进行交叉验证

### 1.2 目标用户

| 用户类型 | 痛点 | 价值主张 |
|----------|------|----------|
| 非技术办公族 | 现有 AI App 界面太复杂 | 微信级交互，零学习成本 |
| 极客开发者 | 需要多模型对比，频繁切换 App | 一个容器管理所有模型，群聊协作 |
| BYOK 用户 | 不想被单一平台锁定 | 自带 Key，自由切换供应商 |

### 1.3 技术栈

| 层级 | 选型 | 理由 |
|------|------|------|
| 框架 | React Native + Expo | JS 栈无缝衔接，Expo 处理原生打包 |
| 路由 | Expo Router | 文件系统路由，类 Next.js |
| 样式 | NativeWind (Tailwind CSS) | 熟悉的 Tailwind 语法，快速还原微信 UI |
| 列表 | @shopify/flash-list | 千条消息不卡顿 |
| 状态管理 | Zustand | 轻量，适合消息流 |
| 本地存储 | MMKV (KV) + SQLite (结构化) | MMKV 秒读配置，SQLite 全文检索 |
| 流式通信 | SSE (Server-Sent Events) | 流式输出 + 远程 MCP |

---

## 2. 信息架构

### 2.1 核心概念关系

```
Provider (供应商)
 ├── apiKey, baseUrl, status
 └── Model (模型) ── 1:N
      ├── id, name, capabilities
      └── 在对话中可挂载 → Identity (身份卡) ── M:N
                              ├── systemPrompt, params
                              └── 绑定 → MCP Tool ── 1:N
```

**关键原则**：

- **Provider 是基础设施**：提供 API 连接
- **Model 是原子实体**：通讯录中的"联系人"
- **Identity 是可插拔 Buff**：给模型临时穿上的"职业装"
- **MCP Tool 是能力扩展**：挂在身份上或全局可用

### 2.2 数据模型定义

#### Provider (供应商)

```json
{
  "id": "provider_001",
  "name": "DeepSeek",
  "type": "official | aggregator | local",
  "baseUrl": "https://api.deepseek.com/v1",
  "apiKey": "sk-***",
  "status": "connected | disconnected | error",
  "createdAt": "2026-02-10T00:00:00Z"
}
```

#### Model (模型)

```json
{
  "id": "model_001",
  "providerId": "provider_001",
  "modelId": "deepseek-r1",
  "displayName": "DeepSeek-R1",
  "avatar": "deepseek_r1.png",
  "capabilities": {
    "vision": true,
    "toolCall": true,
    "reasoning": true,
    "streaming": true
  },
  "capabilitiesVerified": true,
  "maxContextLength": 128000
}
```

#### Identity (身份卡)

```json
{
  "id": "identity_001",
  "name": "高级架构师",
  "icon": "architect",
  "systemPrompt": "你是一位拥有 10 年经验的全栈架构师...",
  "params": {
    "temperature": 0.3,
    "topP": 0.9,
    "maxTokens": 4096
  },
  "mcpToolIds": ["mcp_fs_reader", "mcp_github"],
  "createdAt": "2026-02-10T00:00:00Z"
}
```

#### MCP Tool (工具)

```json
{
  "id": "mcp_001",
  "name": "日历读取",
  "type": "local | remote",
  "scope": "global | identity-bound | ad-hoc",
  "description": "读取手机日历事件",
  "endpoint": null,
  "nativeModule": "CalendarModule",
  "permissions": ["calendar.read"],
  "enabled": true
}
```

#### Conversation (会话)

```json
{
  "id": "conv_001",
  "type": "single | group",
  "title": "架构讨论",
  "participants": [
    { "modelId": "model_001", "identityId": "identity_001" },
    { "modelId": "model_002", "identityId": null }
  ],
  "createdAt": "2026-02-10T00:00:00Z",
  "updatedAt": "2026-02-10T00:00:00Z"
}
```

> 说明：单聊时 `participants` 长度为 1，群聊为 N。身份卡通过 `participants[].identityId` 统一管理，无需单独的 `activeIdentityId`。

#### Shortcut (快捷方式)

```json
{
  "id": "shortcut_001",
  "displayName": "翻译官",
  "modelId": "model_001",
  "identityId": "identity_003",
  "pinned": true,
  "createdAt": "2026-02-10T00:00:00Z"
}
```

#### Message (消息)

```json
{
  "id": "msg_001",
  "conversationId": "conv_001",
  "role": "user | assistant | system",
  "senderModelId": null,
  "senderName": "DeepSeek-R1",
  "identityId": null,
  "content": "...",
  "reasoningContent": "...",
  "toolCalls": [],
  "toolResults": [],
  "branchId": null,
  "parentMessageId": null,
  "createdAt": "2026-02-10T00:00:00Z"
}
```

---

## 3. 页面结构与导航

### 3.1 底部 Tab 导航

```
┌─────────────────────────────────────┐
│                                     │
│          [页面内容区域]               │
│                                     │
├─────────┬─────────┬────────┬────────┤
│  消息   │ 通讯录  │  发现  │   我   │
│ Chats   │ Models  │ Skills │  Me    │
└─────────┴─────────┴────────┴────────┘
```

### 3.2 页面清单

| 页面 | 路由 | 功能 |
|------|------|------|
| 消息列表 | `/chats` | 最近会话列表（单聊+群聊） |
| 聊天详情 | `/chats/[conversationId]` | 单聊/群聊会话界面 |
| 通讯录 | `/models` | 按供应商分组的模型列表 |
| 模型详情 | `/models/[modelId]` | 模型信息、能力标签、开启新对话 |
| 发现-身份卡 | `/skills/identities` | 身份卡仓库管理 |
| 发现-MCP 工具 | `/skills/tools` | MCP 工具管理 |
| 身份卡编辑 | `/skills/identities/[id]` | 编辑 System Prompt、参数、绑定 MCP |
| 设置首页 | `/settings` | 设置入口 |
| 供应商管理 | `/settings/providers` | 添加/编辑供应商、API Key |
| 供应商详情 | `/settings/providers/[id]` | 模型列表拉取、能力检测 |
| 数据同步 | `/settings/sync` | WebDAV / 二维码同步 |
| 隐私设置 | `/settings/privacy` | MCP 权限开关 |

---

## 4. 核心交互流程

### 4.1 单聊流程

```
用户点击 [通讯录] → 选择模型（如 DeepSeek-R1）
  → 进入聊天界面（默认白板状态，无 System Prompt）
  → 直接对话
  → [可选] 点击标题栏 → 弹出身份卡滑块
    → 选择"架构师" → 标题变为 "DeepSeek-R1 · 架构师"
    → 后续消息自动注入该身份的 System Prompt
  → [可选] 点击 × 卸载身份 → 恢复白板状态
```

**身份注入逻辑**：

```
发送 API 请求时：
  if (activeIdentityId) {
    messages = [
      { role: "system", content: identity.systemPrompt },
      ...chatHistory
    ]
    tools = [...globalTools, ...identity.mcpTools]
    params = { ...defaultParams, ...identity.params }
  } else {
    messages = [...chatHistory]
    tools = [...globalTools]
    params = { ...defaultParams }
  }
```

### 4.2 多模型群聊流程

```
用户点击 [消息] 右上角 "+" → "发起群聊"
  → 从通讯录勾选模型（DeepSeek-R1, Claude-3.5, GPT-4o）
  → 进入群聊界面
  → [可选] 给每个模型分配身份卡（如 DeepSeek=架构师, Claude=安全专家）
  → 用户发消息并 @ 某个模型
    → App 识别 @ 目标
    → 将完整群聊 context 发送给被 @ 的模型
    → 其他未被 @ 的模型不发起 API 请求
```

**@ 触发机制**：

- 输入 `@` 后弹出群成员选择浮窗
- 浮窗显示"模型名 (身份名)"，如 `DeepSeek-R1 (架构师)`
- 只有被 @ 的模型发起 API 调用，节省 Token

**模型身份标签（解决"分不清敌我"问题）**：

```json
// 发送给被 @ 模型的 messages 数组
[
  { "role": "user", "content": "我们讨论下架构" },
  { "role": "assistant", "name": "DeepSeek_R1", "content": "建议用微服务..." },
  { "role": "user", "content": "@Claude_3.5 你觉得呢？" }
]
```

- 每条 assistant 消息携带 `name` 字段标识来源模型
- 对于不识别 `name` 的模型，在 `content` 前注入元数据：`[系统注：以下内容由 DeepSeek-R1 生成]`

### 4.3 供应商配置与模型探测流程

```
用户进入 [我] → [供应商管理] → 添加供应商
  → 填写 Name、Base URL、API Key
  → 点击 "连接测试" → 验证 Key 有效性
  → 点击 "拉取模型" → 调用 /models 接口获取列表
  → 模型列表自动通过关键词推断能力标签（Vision/Tools/Reasoning）
  → 用户可点击单个模型的 "⚡️ 检测" 按钮
    → App 发送探测请求：
      - Vision: 发送 1x1 像素图片 + "这是什么颜色？"
      - Tool Call: 定义 get_weather 工具 + "现在天气？"
      - Reasoning: 检查返回中是否有 reasoning_content 字段
    → 根据结果自动更新能力标签
```

### 4.4 MCP 工具调用流程

```
用户在聊天中发送消息（当前身份绑定了 MCP 工具）
  → App 将 globalTools + identityTools 注入 API 请求的 tools 字段
  → 模型返回 tool_calls
  → App 判断工具类型：
    - local: 调用 React Native 原生模块（如 CalendarModule）
    - remote: 通过 SSE 请求远程 MCP Server
  → [如需权限] 在聊天气泡中弹出授权确认卡片
  → 用户点击"允许" → 执行工具 → 返回结果给模型
  → 模型生成最终回复
  → 在对话中显示工具调用卡片（如 [已读取日历：3个事件]）
```

---

## 5. MCP 工具分类

| 分类 | 挂载位置 | 生命周期 | 示例 |
|------|----------|----------|------|
| **全局通用型** | 设置中启用，对所有对话生效 | 常驻 | 剪贴板读取、获取当前时间、提醒事项写入 |
| **身份绑定型** | 绑定在身份卡上 | 随身份挂载/卸载 | SQL 查询（SQL专家）、文件系统读取（架构师） |
| **动态补位型** | 用户在对话中手动临时开启 | 单次会话 | 特定远程 API 调用 |

### 本地 MCP 能力矩阵

| 身份场景 | 本地系统能力 | React Native 模块 |
|----------|-------------|-------------------|
| 日程管家 | 读取日历、写入提醒 | react-native-calendars |
| 知识考古 | 相册 OCR、文件检索 | react-native-camera, react-native-fs |
| 财务审计 | 短信/通知解析 | Notification Listener (Android) |
| 智能家居 | Matter 协议控制 | react-native-matter (TBD) |
| 健康导师 | HealthKit / Health Connect | react-native-health |
| 系统极客 | 亮度、蓝牙、电池 | expo-brightness, expo-battery |

---

## 6. UI 规格

### 6.1 微信视觉参数

| 元素 | 规格 |
|------|------|
| 聊天背景色 | `#EDEDED` |
| 用户气泡色 | `#95EC69` (绿色) |
| AI 气泡色 | `#FFFFFF` (白色) |
| 气泡圆角 | `4px` |
| 头像形状 | 圆角方形 `8px` |
| 字体大小 | 正文 `16px`，时间 `12px` |

### 6.2 关键 UI 组件

| 组件 | 说明 |
|------|------|
| **身份卡滑块** | 标题栏点击后弹出横向滚动卡片，选中后标题追加身份名 |
| **@ 选择器** | 输入 `@` 后弹出群成员浮窗，显示模型+身份组合 |
| **思维链折叠** | reasoning_content 默认折叠，显示"正在深度思考...(已耗时 Xs)"，点击展开 |
| **工具调用卡片** | 类似微信位置/名片卡片，展示 MCP 调用过程和结果 |
| **Artifacts 预览** | 代码/图表以小卡片展示，点击全屏打开交互容器 |
| **长按菜单** | 复制、转发、重写、翻译、分叉，复刻微信长按气泡交互 |
| **快捷 Prompt 栏** | 输入框上方横向滚动，常用指令（翻译、润色、总结）一键触发 |

### 6.3 语音交互

| 模式 | 交互 | 实现 |
|------|------|------|
| 异步模式 | 按住说话 → 自动转文字 → AI 回复语音条 | react-native-audio-recorder-player |
| 实时模式 | 右上角耳机图标 → 双工通话界面 | WebRTC / Realtime API |

---

## 7. 技术约束与边界

### 7.1 不做的事情

| 功能 | 原因 |
|------|------|
| 移动端本地知识库 (RAG) | 手机端不适合向量数据库，吃内存/电池。需要时上 PC |
| stdio 本地 MCP Server | 手机 OS 进程限制，改用 App 内置工具 + 远程 SSE |
| 模型间自动对话 | 群聊中模型不互相对话，只响应用户 @ |

### 7.2 性能要求

| 指标 | 目标 |
|------|------|
| 消息列表渲染 | 10000+ 条消息无卡顿 (FlashList) |
| 聊天记录加载 | < 100ms (MMKV) |
| 流式首字响应 | < 500ms (SSE) |
| 身份卡切换 | < 50ms (内存操作) |

### 7.3 安全与隐私

- API Key 本地加密存储，不上传云端
- MCP 调用本地敏感数据时，弹出原生权限申请弹窗
- 身份卡卸载后，对应 MCP 权限自动断开
- 支持离线降级：远程 MCP 不可用时，身份卡置灰提示

---

## 8. 统一聊天容器架构

基于讨论中的洞察：**"群聊是单聊的超集，单聊是群聊的特例"**。

```
UnifiedChatContainer
  ├── participants: ModelInstance[]     // 单聊=1个, 群聊=N个
  ├── messages: Message[]              // 统一消息数组
  ├── activeIdentityMap: Map<modelId, identityId>  // 每个模型当前的身份
  ├── isGroup: boolean                 // UI 展示切换
  │
  ├── onSend(text, mentionedModelIds?)
  │    → 单聊: 直接发给唯一 participant
  │    → 群聊: 根据 @ 解析发给指定模型
  │
  ├── buildApiPayload(targetModelId)
  │    → 注入 System Prompt (if identity active)
  │    → 注入 tools (global + identity-bound)
  │    → 标记其他模型消息的 name 字段
  │
  └── onModelSwitch(newModelId)        // 单聊切换模型
       → 更新 participants
       → 历史消息保持, name 字段自动区分来源
```
