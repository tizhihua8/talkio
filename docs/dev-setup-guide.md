# Avatar 本地开发环境搭建与问题修复指南

## 一、环境准备

### 1. 安装 Android Studio
- 安装路径：`D:\android studio`
- 安装时勾选 Android SDK、Android SDK Platform、Android Virtual Device

### 2. 安装 JDK 17
React Native / Expo SDK 54 要求 JDK 17（不是更新的 21）。

```powershell
winget install ojdkbuild.openjdk.17.jdk
```

安装路径：`C:\Program Files\ojdkbuild\java-17-openjdk-17.0.3.0.6-1`

### 3. 配置环境变量
每次构建前设置（或添加到系统环境变量）：

```powershell
$env:ANDROID_HOME = "C:\Users\lee\AppData\Local\Android\Sdk"
$env:JAVA_HOME = "C:\Program Files\ojdkbuild\java-17-openjdk-17.0.3.0.6-1"
$env:Path = "$env:Path;C:\Users\lee\AppData\Local\Android\Sdk\platform-tools"
```

### 4. 启用 Windows 长路径支持
以管理员身份运行 PowerShell：

```powershell
reg add "HKLM\SYSTEM\CurrentControlSet\Control\FileSystem" /v LongPathsEnabled /t REG_DWORD /d 1 /f
```

需要重启电脑生效。

### 5. 创建短路径 Junction（解决 Ninja 260 字符限制）
即使启用了 Windows 长路径，Ninja 构建工具仍不支持超过 260 字符的路径。解决方案：

```powershell
# 以管理员身份运行
cmd /c "mklink /J C:\av C:\Users\lee\Desktop\avatar"
```

**重要**：`C:\av` 是 `C:\Users\lee\Desktop\avatar` 的 junction 链接。

---

## 二、构建流程

### 构建规则（关键！）
- **构建 APK**：从短路径 `C:\av` 执行（避免路径过长）
- **启动 Metro**：从原始路径 `C:\Users\lee\Desktop\avatar` 执行（避免模块路径不一致）

### 1. Prebuild（生成 android 目录）
```powershell
# 从原始路径执行
cd C:\Users\lee\Desktop\avatar
npx expo prebuild --clean --platform android
```

### 2. 构建 APK
```powershell
# 从短路径执行！
cd C:\av
npx expo run:android
```

### 3. 启动 Metro 开发服务器
```powershell
# 从原始路径执行！
cd C:\Users\lee\Desktop\avatar
adb reverse tcp:8081 tcp:8081
npx expo start --dev-client
```

### 4. 手机连接
- 扫描终端中的二维码，或
- 手机上打开应用点击 Reload

---

## 三、已修复的问题

### 问题 1：expo doctor 报告 5 个问题
| 问题 | 修复方式 |
|------|---------|
| `softwareKeyboardLayoutMode` 无效值 | `app.json` 中改为 `"resize"` |
| 缺少 peer dependencies | `npx expo install expo-font expo-asset expo-constants` |
| `@expo/vector-icons` 重复 | `package.json` 添加 `overrides` |
| CNG/Prebuild 配置冲突 | `.gitignore` 添加 `android/` 和 `ios/` |
| 包版本不匹配 | `npx expo install --check` |

### 问题 2 & 3：供应商添加逻辑
**原问题**：
- 无法添加供应商（地址/key 正确但失败）
- 测试连接失败仍然保存了供应商

**修复**：新增 `addProviderWithTest` 方法（`src/stores/provider-store.ts`），先测试连接再保存：
```typescript
addProviderWithTest: async (data) => {
  const tempProvider = { ...data, id: generateId(), status: "pending", ... };
  const client = new ApiClient(tempProvider);
  const connected = await client.testConnection();
  if (!connected) return { success: false, provider: null };
  // 只有连接成功才保存
  tempProvider.status = "connected";
  const providers = [...get().providers, tempProvider];
  set({ providers });
  setItem(STORAGE_KEYS.PROVIDERS, providers);
  return { success: true, provider: tempProvider };
}
```

**涉及文件**：
- `src/stores/provider-store.ts` — 新增 `addProviderWithTest`
- `app/(tabs)/settings/provider-edit.tsx` — 新建供应商时使用 `addProviderWithTest`
- `app/(tabs)/settings/web-config.tsx` — 网页配置使用 `addProviderWithTest`

### 问题 4：网页配置服务浏览器无法访问
**原因**：
1. 缺少 `android.permission.INTERNET` 权限
2. 生产版缺少 `android:usesCleartextTraffic="true"`（Android 9+ 默认禁止明文 HTTP）
3. `expo-network` 的 `getIpAddressAsync()` 在 Android 12+ 需要位置权限+GPS 才能获取 WiFi IP，返回 `0.0.0.0`

**修复**：
1. `app.json` 添加 `INTERNET`、`ACCESS_WIFI_STATE`、`ACCESS_NETWORK_STATE` 权限
2. 创建 Expo 配置插件 `plugins/withCleartextTraffic.js`，自动添加 `usesCleartextTraffic`
3. 创建本地原生模块 `modules/expo-ip`，用 Java `NetworkInterface` 获取 WiFi IP（无需位置权限）
4. `startConfigServer` 启动前强制 `server.stop()` 防止热重载后端口冲突

**使用方式**：手机和电脑需在同一 WiFi 下，访问手机上显示的地址（如 `http://手机IP:19280`）

---

## 四、踩坑记录

### Windows 路径长度限制
- **现象**：Ninja 报错 `Filename longer than 260 characters`
- **根因**：`react-native-keyboard-controller` 的 CMake 中间文件路径极长
- **解决**：创建 `C:\av` junction 链接，从短路径构建

### Metro 必须从原始路径启动
- **现象**：手机报 `UnableToResolveError`，URL 中包含错误路径
- **根因**：从 junction 路径启动 Metro，`node_modules` 解析路径与实际路径不一致
- **解决**：构建用 `C:\av`，Metro 用 `C:\Users\lee\Desktop\avatar`

### APK 安装失败 INSTALL_FAILED_UPDATE_INCOMPATIBLE
- **解决**：`adb uninstall com.avatar.app` 卸载旧版后重新安装

### APK 安装失败 INSTALL_FAILED_USER_RESTRICTED
- **解决**：手机开发者选项中启用"USB 安装"

---

## 五、待办事项

- [ ] 开发版和生产版共存（需要在 `build.gradle` 中为 debug 构建添加 `applicationIdSuffix ".dev"`）

---

## 六、常用命令速查

```powershell
# 设置环境变量
$env:ANDROID_HOME = "C:\Users\lee\AppData\Local\Android\Sdk"
$env:JAVA_HOME = "C:\Program Files\ojdkbuild\java-17-openjdk-17.0.3.0.6-1"
$env:Path = "$env:Path;C:\Users\lee\AppData\Local\Android\Sdk\platform-tools"

# 构建 APK（从短路径）
cd C:\av
npx expo run:android

# 启动 Metro（从原始路径）
cd C:\Users\lee\Desktop\avatar
adb reverse tcp:8081 tcp:8081
npx expo start --dev-client

# 查看已连接设备
adb devices

# 卸载应用
adb uninstall com.avatar.app

# 端口转发（网页配置服务）
adb forward tcp:19280 tcp:19280
```
