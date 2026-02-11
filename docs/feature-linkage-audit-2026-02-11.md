# Avatar 功能链路通断审查（静态代码复核）

> 日期：2026-02-11  
> 范围：功能完整性、页面跳转连通性、关键动作闭环性  
> 说明：本报告基于代码静态复核，不包含真机端到端点击回归。

## 状态定义

- `通`：入口存在且业务动作已落地。
- `半通`：入口存在，但只完成部分链路或有明显缺口。
- `断`：缺少入口或核心动作未实现。

## 1. 路由与页面连通性

| 模块 | 链路 | 状态 | 证据 |
|---|---|---|---|
| 启动 | `/` -> `/(tabs)/chats` | 通 | `app/index.tsx:4` |
| 会话列表 | 聊天项 -> `/chat/:id` | 通 | `app/(tabs)/chats/index.tsx:112` |
| 会话列表 | 右上角 -> 模型页 | 通 | `app/(tabs)/chats/index.tsx:40` |
| 模型页 | 创建单聊 -> `/chat/:id` | 通 | `app/(tabs)/experts/index.tsx:42`, `app/(tabs)/experts/index.tsx:45` |
| 模型页 | 创建群聊 -> `/chat/:id` | 通 | `app/(tabs)/experts/index.tsx:59`, `app/(tabs)/experts/index.tsx:62` |
| 模型页空状态 | 去供应商设置 | 通 | `app/(tabs)/experts/index.tsx:91` |
| 发现页 | 身份卡编辑弹窗路由 | 通 | `app/(tabs)/discover/index.tsx:85`, `app/(tabs)/discover/_layout.tsx:18` |
| 发现页 | MCP 工具编辑弹窗路由 | 通 | `app/(tabs)/discover/index.tsx:101`, `app/(tabs)/discover/_layout.tsx:19` |
| 设置页 | Providers / Sync / Privacy 入口 | 通 | `app/(tabs)/settings/index.tsx:30`, `app/(tabs)/settings/index.tsx:38`, `app/(tabs)/settings/index.tsx:45` |
| 供应商页 | 新增/编辑供应商页 | 通 | `app/(tabs)/settings/providers.tsx:31`, `app/(tabs)/settings/providers.tsx:58` |

结论：页面级跳转主干是连通的。

## 2. 功能动作闭环（按用户可感知功能）

| 功能 | 状态 | 结论 | 证据 |
|---|---|---|---|
| 发送消息 | 通 | 输入后可触发 `sendMessage`，链路贯通到服务层 | `app/chat/[id].tsx:93`, `src/stores/chat-store.ts:124` |
| 单聊身份挂载 | 通 | 选择身份后更新参与者身份 | `app/chat/[id].tsx:100`, `src/stores/chat-store.ts:109` |
| 会话删除 | 通 | 列表滑动删除已连接 store 删除逻辑 | `app/(tabs)/chats/index.tsx:59`, `src/stores/chat-store.ts:88` |
| 群聊 @ 选择器 | 半通 | UI 可选成员并注入 `@model`，但解析规则较粗糙（字符串包含） | `src/components/chat/ChatInput.tsx:55`, `src/components/chat/ChatInput.tsx:36` |
| 分支入口 | 半通 | 可触发分支，但分支数据模型会造成重复消息 | `app/chat/[id].tsx:110`, `src/stores/chat-store.ts:179`, `src/storage/database.ts:164` |
| 长按复制 | 断 | 复制按钮为空实现 | `app/chat/[id].tsx:137` |
| 长按删除消息 | 断 | iOS 有“删除”按钮但无处理分支；Android未提供删除动作 | `app/chat/[id].tsx:127`, `app/chat/[id].tsx:132` |
| 聊天菜单 搜索/导出/清空 | 断 | ActionSheet 回调为空 | `app/chat/[id].tsx:148`, `app/chat/[id].tsx:152` |
| 输入框 “+” 扩展按钮 | 断 | 没有 `onPress` 行为 | `src/components/chat/ChatInput.tsx:93` |
| Provider 测连 | 通 | 已调用 `testConnection` | `app/(tabs)/settings/provider-edit.tsx:62`, `app/(tabs)/settings/provider-edit.tsx:88` |
| Provider 拉取模型 | 通 | 已调用 `fetchModels` | `app/(tabs)/settings/provider-edit.tsx:97`, `app/(tabs)/settings/provider-edit.tsx:101` |
| Provider 全选/反选模型 | 通 | 可切换模型启用状态 | `app/(tabs)/settings/provider-edit.tsx:221`, `src/stores/provider-store.ts:120` |
| 模型能力“探测”按钮 | 断 | 有探测能力但无页面入口调用 | `src/stores/provider-store.ts:142`, `src/stores/provider-store.ts:151` |
| WebDAV 测试连接 | 断 | 明确占位提示 `notImplemented` | `app/(tabs)/settings/sync.tsx:16` |
| 二维码同步按钮 | 断 | 按钮无 `onPress` | `app/(tabs)/settings/sync.tsx:88` |
| MCP 工具执行闭环 | 半通 | 可执行工具，但未把工具结果回传模型生成最终答复 | `src/services/chat-service.ts:151`, `src/services/chat-service.ts:160` |
| 备份导入导出 | 断 | 服务存在但未发现 UI 入口调用 | `src/services/backup-service.ts:16`, `src/services/backup-service.ts:50` |

## 3. 汇总判断

- 页面跳转连通性：`高`（主路径基本可达）
- 功能完整性：`中低`（多处操作按钮为占位或空实现）
- 业务链路闭环：`中低`（分支/MCP/同步链路存在关键断点）

## 4. 关键断点优先级（建议）

1. 聊天页动作闭环：复制、删除消息、搜索/导出/清空历史。  
2. 同步闭环：WebDAV 连接测试与二维码同步。  
3. 能力探测闭环：给 `probeModelCapabilities` 增加 UI 入口。  
4. 分支与 MCP 闭环：修复分支重复消息；补齐工具结果回传模型的二次推理链。  
