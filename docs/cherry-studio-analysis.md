# Cherry Studio App 最佳实践分析报告

> 对比 Avatar 项目，提取可落地的改进清单

## 一、技术栈对比

| 维度 | Cherry Studio | Avatar | 建议 |
|------|--------------|--------|------|
| **SDK** | Expo 54 + New Arch | Expo 54 + New Arch | ✅ 一致 |
| **构建** | Development Build (`expo-dev-client`) | Expo Go | ⚠️ **切换 Dev Build** |
| **包管理** | pnpm + workspace | npm | 可选迁移 |
| **数据库** | Drizzle ORM + expo-sqlite | 手写 SQL + expo-sqlite | **[推荐] 迁移 Drizzle** |
| **状态管理** | Redux Toolkit + redux-persist | Zustand + MMKV | Zustand 更轻量，保留 |
| **偏好存储** | PreferenceService (SQLite-backed) | MMKV (AsyncStorage fallback) | **[推荐] 参考 PreferenceService 模式** |
| **AI SDK** | Vercel AI SDK (`ai` 5.x) + 多供应商适配器 | 手写 SSE 解析 (expo/fetch) | **[推荐] 迁移 AI SDK** |
| **流式处理** | AiSdkToChunkAdapter + StreamProcessor | 手动 ReadableStream 解析 | **[推荐] 引入 Chunk 抽象层** |
| **消息列表** | @legendapp/list (LegendList) | @legendapp/list (刚迁移) | ✅ 一致 |
| **Markdown** | react-native-nitro-markdown (原生 AST) + 自定义组件 | react-native-markdown-display | ⚠️ nitro 需要 Dev Build |
| **键盘处理** | react-native-keyboard-controller | KeyboardAvoidingView | **[推荐] 迁移 keyboard-controller** |
| **样式** | uniwind (TailwindCSS 4) + heroui-native | NativeWind v4 | 保留 NativeWind |
| **导航** | React Navigation (手动配置) | Expo Router v6 | Expo Router 更便捷，保留 |
| **国际化** | i18next + react-i18next | 无 | 后期添加 |
| **日志** | LoggerService (分级 + 文件写入) | console.log | **[推荐] 引入 LoggerService** |
| **编译优化** | React Compiler (`reactCompiler: true`) | 无 | **[推荐] 启用** |
| **类型路由** | `typedRoutes: true` | 无 | **[推荐] 启用** |
| **测试** | Jest + @testing-library/react-native | 无 | 后期添加 |

## 二、架构模式对比

### 1. 消息架构：Block 模型 vs 扁平模型

**Cherry Studio** 采用 **Message + MessageBlock** 二级结构：
- `Message`: 一条对话消息 (user/assistant)
- `MessageBlock`: 消息内的内容块 (MAIN_TEXT, THINKING, TOOL, IMAGE, ERROR, CITATION)
- 支持：一条消息内同时包含文本+思考+工具调用+图片

**Avatar** 采用扁平结构：
- `Message`: 所有内容平铺在一条消息内 (content, reasoningContent, toolCalls, toolResults)

**建议**：当前阶段保持扁平结构（简单），但在支持多模态/MCP 工具调用时考虑迁移 Block 模型。

### 2. 服务层架构

**Cherry Studio** 有清晰的服务层分离：
```
screens → hooks → services → database
```
- `MessagesService`: 消息生命周期管理
- `TopicService`: 话题/会话管理
- `ProviderService`: 供应商管理
- `StreamProcessingService`: 流式处理回调分发
- `PreferenceService`: 偏好管理 (SQLite + 内存缓存 + Observer)
- `LoggerService`: 分级日志 (console + 文件)

**Avatar** 的服务层较薄：
```
screens → stores (Zustand) → database/api-client
```

**建议**：引入 Service 层，将业务逻辑从 store 中抽离。Store 只管状态，Service 管业务流程。

### 3. 流式处理架构

**Cherry Studio**:
```
AI SDK streamText → fullStream (ReadableStream)
  → AiSdkToChunkAdapter (转换为统一 Chunk 类型)
    → createStreamProcessor (分发回调)
      → callbacks.onTextChunk / onThinkingChunk / onToolCall / onError
        → BlockManager (智能节流 + DB 持久化)
```

**Avatar**:
```
expo/fetch → ReadableStream → 手动解析 SSE lines → yield StreamDelta → store 直接更新
```

**建议**：
- **短期**：引入 Chunk 类型系统，统一流式事件处理
- **中期**：迁移到 Vercel AI SDK，获得多供应商支持 + 标准化流式处理

### 4. 数据库层

**Cherry Studio** 使用 **Drizzle ORM**：
- Schema 定义 (`db/schema/`)
- Relations 声明式关联
- Queries 封装 (`db/queries/`)
- Mappers 数据转换 (`db/mappers/`)
- Migrations 自动化 (`drizzle/migrations`)
- `useLiveQuery` 实时数据绑定

**Avatar** 使用手写 SQL：
- 直接拼接 SQL 字符串
- 手动处理 JOIN/序列化
- 无迁移工具

**建议**：**迁移 Drizzle ORM** 是最高优先级改进之一。收益巨大：
- 类型安全的查询
- 自动迁移
- `useLiveQuery` 消除手动刷新
- 减少 SQL 注入风险

## 三、可落地改进清单（按优先级排序）

### P0 - 立即可做

| # | 改进项 | 工作量 | 收益 |
|---|--------|--------|------|
| 1 | **启用 React Compiler** | 1行配置 | 自动 memo 优化渲染性能 |
| 2 | **启用 typedRoutes** | 1行配置 | 路由类型安全 |
| 3 | **切换 Development Build** | `npx expo run:android` | 解决 Expo Go 所有限制 (MMKV/nitro) |

### P1 - 本周可做

| # | 改进项 | 工作量 | 收益 |
|---|--------|--------|------|
| 4 | **引入 LoggerService** | 0.5天 | 分级日志 + 文件持久化，调试效率大幅提升 |
| 5 | **react-native-keyboard-controller** | 0.5天 | 解决键盘处理所有平台差异 |
| 6 | **Drizzle ORM 迁移** | 1-2天 | 类型安全查询 + 自动迁移 + useLiveQuery |

### P2 - 两周内

| # | 改进项 | 工作量 | 收益 |
|---|--------|--------|------|
| 7 | **Service 层抽离** | 1天 | Store 瘦身，业务逻辑可测试 |
| 8 | **Chunk 类型系统** | 1天 | 统一流式事件处理，支持 thinking/tool/image 块 |
| 9 | **Vercel AI SDK** | 2-3天 | 多供应商适配 + 标准化流式 + reasoning/tool 支持 |

### P3 - 月度规划

| # | 改进项 | 工作量 | 收益 |
|---|--------|--------|------|
| 10 | **Block 消息模型** | 3-5天 | 支持多模态/MCP/引用/翻译等复杂场景 |
| 11 | **nitro-markdown 迁移** | 2天 | 原生 Markdown 解析，性能和渲染质量大幅提升 |
| 12 | **i18n 国际化** | 1-2天 | 多语言支持 |
| 13 | **Jest 测试覆盖** | 持续 | 核心 service/store 单元测试 |

## 四、Cherry Studio 的亮点模式（值得直接借鉴）

### 1. PreferenceService (SQLite + Observer)
- 内存缓存 + `useSyncExternalStore` = 极快读取
- 修改时立即更新 UI（乐观更新），后台异步持久化
- 类型安全：`PreferenceKeyType` 枚举所有 key

### 2. BlockManager (智能节流)
- 流式输出时不是每个 delta 都写 DB，而是节流合批
- 块类型变化时立即 flush
- 块完成时取消节流并立即写入

### 3. 代码高亮
- `react-native-code-highlighter` + `react-syntax-highlighter`
- 按语言显示图标
- HTML 代码块可跳转预览

### 4. 手势导航
- `PanGestureHandler` 实现右滑打开 Drawer、左滑打开 Topic 列表
- 阈值+速度双判断，体验流畅

### 5. 动画
- `moti` (Framer Motion for RN) 实现消息入场动画
- `react-native-reanimated` 处理模糊/过渡效果

## 五、不建议照搬的部分

| 项目 | 原因 |
|------|------|
| Redux Toolkit | Zustand 更轻量，我们已用且运行良好 |
| uniwind | NativeWind 生态更成熟 |
| React Navigation (手动) | Expo Router 更便捷 |
| Monorepo (pnpm workspace) | 当前项目规模不需要 |
