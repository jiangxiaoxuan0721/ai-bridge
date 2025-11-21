# AI Bridge - VS Code 扩展

一个强大的 VS Code 扩展，通过 WebSocket 实现与外部应用程序的实时通信。

## 功能特性

- 🌐 **WebSocket 服务器**: 智能端口检测，自动使用 VSCode 服务器端口或自动分配可用端口
- 📝 **文本选择监听**: 实时获取用户在 VS Code 中选择的文本
- 📁 **文件内容获取**: 支持获取当前活动文件的内容
- 💬 **自定义消息**: 支持发送自定义消息到客户端
- 🔄 **双向通信**: 客户端可以请求文件内容、执行 VS Code 命令
- 📡 **心跳检测**: 支持 ping/pong 心跳机制
- 🎯 **实时广播**: 所有连接的客户端都会收到消息
- 🤖 **自动监听**: 无需手动调用命令，自动监听编辑器事件
- 📍 **光标跟踪**: 实时跟踪光标位置变化
- 📝 **文档变化**: 自动监听文档内容变化
- 📂 **文件操作**: 监听文件打开、保存等操作
- ⚙️ **可配置**: 支持详细的配置选项控制监听行为

## 🚀 快速开始

### 1. 启动扩展
1. 在 VS Code 中打开此项目文件夹
2. 按 `F5` 启动调试会话
3. 会打开一个新的 VS Code 窗口（扩展开发主机）

### 2. 多实例支持
AI Bridge 扩展支持**单例模式**，允许多个VS Code实例共享同一个WebSocket服务器：

- 第一个VS Code实例将**成为单例服务器**，占用3011端口
- 后续VS Code实例将**自动连接到现有服务器**，作为客户端
- 所有实例功能完全相同，用户无需关心哪个是服务器
- 如果单例服务器关闭，其他实例会自动接管

📖 **技术详情**：查看 [单例模式说明](./SINGLETON_MODE.md) 了解实现细节。
- **测试指南**：查看 [测试单例模式](./TEST_SINGLETON.md) 了解如何测试功能。

### 2. 测试连接
1. 在浏览器中打开 `test-client.html` 文件
2. 页面会自动连接到 WebSocket 服务器
3. 状态显示为 "Connected" 表示连接成功

### 🎯 重要提示：端口检测
- **默认行为**：AI Bridge 会自动检测并使用 VSCode 服务器的端口
- **避免冲突**：不再使用固定的 3011 端口
- **智能检测**：扫描常见 VSCode 端口（3000-3005, 8080-8081）
- **自动回退**：检测失败时自动分配可用端口

### 3. 体验功能
在新打开的 VS Code 窗口中：
- **选择文本**：观察浏览器实时显示选中的内容
- **移动光标**：浏览器会实时更新光标位置
- **编辑文件**：浏览器会显示文档变化
- **保存文件**：浏览器会显示保存事件

📖 **详细指南**：查看 [快速开始指南](./QUICK_START.md) 获取完整的使用说明。

### VSCode 端口自动检测

AI Bridge 现在支持自动检测并使用 openvscode-server 的端口：

- **自动检测**: 扩展会尝试检测当前 VSCode 实例使用的端口
- **智能匹配**: 检查常见 VSCode 端口（3000-3005, 8080-8081）
- **端口验证**: 验证端口是否确实运行着 VSCode 服务器
- **回退机制**: 如果检测失败，自动回退到随机端口分配

#### 使用方法

```javascript
// 使用新的模块化客户端
// 请参考 client/README.md 了解更多详情
```

#### 配置选项

你仍然可以通过设置手动指定端口：

```json
{
  "aiBridge.server.port": 3011,
  "aiBridge.server.host": "127.0.0.1"
}
```

设置为 `0` 启用自动检测（默认行为）。

## 自动监听功能

### 概述

扩展现在支持自动监听 VS Code 编辑器事件，无需手动调用命令即可实时获取编辑器状态变化。

### 监听的事件

- **文本选择变化** - 用户选择文本时自动发送
- **光标位置变化** - 光标移动时实时更新
- **文档内容变化** - 编辑内容时自动同步
- **文件操作** - 文件打开、保存时通知
- **编辑器切换** - 切换不同文件时通知

### 配置选项

在 VS Code 设置中可以配置自动监听功能：

```json
{
  "aiBridge.autoMonitoring.enabled": true,
  "aiBridge.autoMonitoring.selectionChanges": true,
  "aiBridge.autoMonitoring.cursorPosition": true,
  "aiBridge.autoMonitoring.documentChanges": true,
  "aiBridge.autoMonitoring.fileOperations": true,
  "aiBridge.autoMonitoring.debounceDelay": 300
}
```

### 手动控制

- 使用命令 `AI Bridge: Toggle Auto Monitoring` 可以开启/关闭自动监听
- 也可以通过 VS Code 设置面板配置各项监听功能

详细的自动监听功能说明请参考 [自动监听功能演示](./AUTO_MONITORING_DEMO.md)。

## WebSocket API

### 服务器到客户端的消息类型

1. **selectedText** - 用户选择的文本
2. **fileContent** - 当前文件内容
3. **customMessage** - 自定义消息
4. **pong** - 心跳响应
5. **selectionChanged** - 文本选择变化（自动监听）
6. **selectionCleared** - 选择被清除（自动监听）
7. **activeEditorChanged** - 活动编辑器变化（自动监听）
8. **documentChanged** - 文档内容变化（自动监听）
9. **cursorPositionChanged** - 光标位置变化（自动监听）
10. **fileSaved** - 文件保存（自动监听）
11. **fileOpened** - 文件打开（自动监听）
12. **fileResponse** - 文件请求响应
13. **commandResponse** - 命令执行响应
14. **error** - 错误消息

### 客户端到服务器的消息类型

1. **ping** - 心跳检测
2. **requestFile** - 请求文件内容
3. **executeCommand** - 执行 VS Code 命令
4. **customMessage** - 发送自定义消息

详细的 API 文档请参考 [WebSocket API 文档](./WEBSOCKET_API.md)。

## 命令

扩展提供以下命令：

- `AI Bridge: Get Selected Text` - 获取当前选中的文本
- `AI Bridge: Send Current File Content` - 发送当前文件内容
- `AI Bridge: Send Custom Message` - 发送自定义消息
- `AI Bridge: Toggle Auto Monitoring` - 切换自动监听状态

## 📱 测试客户端

项目包含两个测试客户端：

### 1. 模块化客户端 (推荐)
位置：`client/index.html`

#### 功能特性
- ✅ **模块化架构**：代码组织清晰，易于维护和扩展
- ✅ **自动连接**：页面加载后自动连接 WebSocket
- ✅ **自动重连**：连接断开后自动尝试重新连接
- ✅ **心跳检测**：定期发送心跳消息保持连接
- ✅ **实时消息显示**：格式化显示所有事件消息
- ✅ **状态监控**：实时显示各类事件的监听状态
- ✅ **手动测试**：支持手动发送各种测试消息
- ✅ **消息清理**：一键清空消息历史
- ✅ **响应式设计**：适配不同屏幕尺寸

#### 使用方法
1. 进入 `client` 目录
2. 运行 `npm install` (可选，仅当需要使用npx serve时)
3. 使用以下任一命令启动本地服务器：
   - `npm start` (使用Python内置服务器)
   - `npm run serve` (使用npx serve)
4. 在浏览器中打开 `http://localhost:8080`
5. 页面会自动连接到 WebSocket 服务器
6. 在 VS Code 中进行各种操作，观察客户端的实时反馈

#### 开发说明
详细的开发文档请参考 [客户端README](./client/README.md)

### 2. 单文件客户端
位置：`test-client.html` (保留以确保向后兼容)

#### 功能特性
- ✅ **自动连接**：页面加载后自动连接 WebSocket
- ✅ **实时消息显示**：格式化显示所有事件消息
- ✅ **状态监控**：实时显示各类事件的监听状态
- ✅ **手动测试**：支持手动发送各种测试消息
- ✅ **消息清理**：一键清空消息历史

#### 使用方法
1. 在浏览器中直接打开 `test-client.html`
2. 页面会自动连接到 WebSocket 服务器
3. 在 VS Code 中进行各种操作，观察客户端的实时反馈

📖 **使用示例**：查看 [使用示例集合](./USAGE_EXAMPLES.md) 了解如何集成到你的应用中。

## 开发

### 项目结构

```
ai-bridge/
├── src/                      # 源代码目录
│   ├── extension.js          # 主入口文件
│   ├── websocket-server.js   # WebSocket服务器管理模块
│   ├── event-monitoring.js   # 事件监听模块
│   ├── commands.js           # 命令处理模块
│   └── utils.js              # 工具函数模块
├── extension.js              # 向后兼容入口点
├── package.json              # 扩展配置
├── test-client.html          # 测试客户端
├── WEBSOCKET_API.md          # WebSocket API 文档
├── AUTO_MONITORING_DEMO.md   # 自动监听功能演示
├── QUICK_START.md            # 快速开始指南
├── USAGE_EXAMPLES.md         # 使用示例
├── CHANGELOG.md              # 更新日志
├── PROJECT_STRUCTURE.md      # 项目结构说明
└── README.md                 # 项目说明
```

### 调试

1. 在 VS Code 中打开项目
2. 按 `F5` 启动调试会话
3. 在新的 VS Code 窗口中测试扩展功能
4. 查看调试控制台的日志输出

### 扩展功能

要添加新的事件监听器，可以在 `extension.js` 的 `setupEventListeners` 函数中添加相应的 VS Code 事件监听代码。

## 📚 相关文档

- [🚀 快速开始指南](./QUICK_START.md) - 5分钟快速体验
- [📖 WebSocket API 文档](./WEBSOCKET_API.md) - 完整的 API 参考
- [🎯 自动监听演示](./AUTO_MONITORING_DEMO.md) - 自动监听功能详解
- [💡 使用示例集合](./USAGE_EXAMPLES.md) - 各种集成示例
- [📝 更新日志](./CHANGELOG.md) - 版本更新记录

## 🛠️ 开发指南

### 调试
1. 在 VS Code 中打开项目
2. 按 `F5` 启动调试会话
3. 在新的 VS Code 窗口中测试扩展功能
4. 查看调试控制台的日志输出

### 扩展功能
要添加新的事件监听器，可以在 `extension.js` 的 `setupEventListeners` 函数中添加相应的 VS Code 事件监听代码。

### 配置选项
在 VS Code 设置中搜索 "aiBridge" 可以找到所有配置选项。

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**🎉 现在就开始体验吧！** 这个扩展为 AI 辅助编程、实时协作等场景提供了强大的基础设施。