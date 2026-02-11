# Avatar 项目生产级审查报告

> 日期：2026-02-11  
> 审查范围：架构、逻辑闭环、代码质量、安全、稳定性、可观测性、工程化交付

## 1. 总体判定

- 当前状态：MVP 可用/可演示，未达到生产级 AI Chat App 发布标准。
- 主要风险集中在：逻辑闭环、数据一致性、安全真实性、工程化基线。

## 2. P0 问题（发布阻塞）

### P0-1 分支会话逻辑产生重复消息

- 证据：
  - `src/stores/chat-store.ts:179` 分支时复制原消息并生成新 ID。
  - `src/storage/database.ts:164` 查询分支时包含 `branchId is null` 主线消息。
- 影响：分支历史出现重复消息，导致上下文污染与回放不可信。

### P0-2 MCP 工具调用链未闭环

- 证据：
  - `src/services/chat-service.ts:151` 仅执行工具并更新本地 `toolResults`。
  - 未将工具结果作为 `tool` 消息回传模型继续推理。
  - `src/services/chat-service.ts:160` 持久化未写入 `toolResults`。
- 影响：模型无法基于工具结果继续回答，刷新后工具结果丢失。

### P0-3 安全声明与实现不一致

- 证据：
  - `src/storage/mmkv.ts:21` MMKV 未配置加密密钥。
  - `src/storage/mmkv.ts:23` Expo Go 回退 AsyncStorage。
  - 文案宣称“端到端加密”（`src/i18n/locales/en.json:99`、`src/i18n/locales/en.json:194`）。
  - WebDAV 凭据通过设置落盘（`app/(tabs)/settings/sync.tsx:67`）。
- 影响：敏感信息明文持久化风险，存在合规与信任风险。

### P0-4 代码质量门禁失效

- 证据：
  - `package.json:84` 使用 ESLint v9。
  - 配置仍为 `.eslintrc.js`（` .eslintrc.js:1`）。
  - `npm run lint` 直接失败（缺少 `eslint.config.*`）。
- 影响：无法建立稳定静态质量门禁，回归风险不可控。

### P0-5 备份恢复为不可逆清空且无事务保护

- 证据：
  - `src/services/backup-service.ts:65`、`src/services/backup-service.ts:66` 先清空再恢复。
  - 无事务与回滚，异常中断会永久丢失数据。
- 影响：一旦暴露到 UI，属于生产事故级风险。

## 3. P1 问题（建议上线前修复）

### P1-1 会话列表摘要与真实回复不同步

- 证据：
  - 用户消息更新 `conversations` store（`src/stores/chat-store.ts:153`）。
  - AI 回复仅更新数据库（`src/services/chat-service.ts:177`），未回写 `conversations` store。
- 影响：列表最后一条消息与详情页不一致。

### P1-2 会话切换存在异步竞态

- 证据：
  - `src/stores/chat-store.ts:99` 直接触发异步 `loadMessages`，无请求序列校验。
- 影响：快速切换会话可能出现错会话内容闪现。

### P1-3 群聊身份分配未落地

- 证据：
  - 仅处理首参与者身份（`app/chat/[id].tsx:39`）。
  - 群聊禁用身份滑块（`app/chat/[id].tsx:184`）。
- 影响：与 Spec 的“群内每模型独立身份”不一致。

### P1-4 `@` 解析机制鲁棒性不足

- 证据：
  - `src/components/chat/ChatInput.tsx:36` 采用 `includes("@displayName")`。
  - 专业解析器已存在但未接入（`src/utils/mention-parser.ts:10`）。
- 影响：误匹配/漏匹配，群聊调度不稳定。

### P1-5 模型能力探测未接入页面

- 证据：
  - 能力探测逻辑存在（`src/stores/provider-store.ts:142`）。
  - 设置页无“单模型探测”入口（`app/(tabs)/settings/provider-edit.tsx`）。
- 影响：能力标签可信度不足，需人工判断。

### P1-6 多处关键交互为占位实现

- 证据：
  - 聊天导出/清空历史无逻辑（`app/chat/[id].tsx:152`）。
  - 复制消息无实现（`app/chat/[id].tsx:137`）。
  - WebDAV 测试未实现（`app/(tabs)/settings/sync.tsx:16`）。
- 影响：功能闭环断裂，生产可用性不足。

## 4. P2 问题（优化项）

### P2-1 日志写入性能不佳

- 证据：
  - `src/services/logger.ts:110`-`src/services/logger.ts:116` 通过“读全量+写全量”追加。
- 影响：日志体量增大后写入成本高。

### P2-2 Web 端数据不持久

- 证据：
  - `src/storage/database.web.ts:3` 使用纯内存数组。
- 影响：刷新即丢失聊天记录，不满足长期使用场景。

### P2-3 i18n 细节未统一

- 证据：
  - `app/(tabs)/chats/index.tsx:213` 返回硬编码 `"yesterday"`。
- 影响：多语言一致性缺失。

### P2-4 HTML 预览潜在注入风险

- 证据：
  - `src/components/common/HtmlPreview.tsx:26` 直接拼接 HTML。
  - `src/components/common/HtmlPreview.tsx:43` 开启 `javaScriptEnabled`。
- 影响：若接入不可信内容，存在注入面。

## 5. 宏观评分（生产级视角）

- 架构分层：6/10
- 逻辑闭环：4/10
- 安全与隐私：3/10
- 稳定性与容错：4/10
- 工程化质量：3/10
- 可观测性：5/10

## 6. 与 PRD/Spec 闭环对照

- 已落地：
  - 四 Tab、Provider CRUD、模型拉取、单聊流式、身份卡、本地存储骨架。
- 部分落地：
  - 群聊、`@` 基础、MCP 框架雏形。
- 未闭环：
  - 群聊身份分配、能力探测入口、长按动作完整能力、工具结果二次推理链路。

## 7. 已执行检查

- `npm run typecheck`：通过。
- `npm run lint`：失败（ESLint v9 与配置模式不兼容）。
- 自动化测试与 CI：未发现测试文件与 workflow。
- `npm audit`：受网络环境限制失败（`ENOTFOUND registry.npmjs.org`）。

## 8. 整改路线（按优先级）

1. P0：修分支数据模型、补 MCP 闭环回传、落实敏感信息加密、恢复 lint 门禁、备份恢复事务化。
2. P1：修会话摘要一致性与竞态、落地群聊身份、接入 mention 解析器、补齐占位交互。
3. P2：优化日志写盘、补 Web 持久化策略、统一 i18n 与安全边界。
