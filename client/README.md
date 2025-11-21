# AI Bridge 客户端

这是一个模块化的 WebSocket 客户端，用于与 AI Bridge VS Code 扩展进行通信。

## 项目结构

```
client/
├── index.html              # 主HTML页面
├── styles.css              # 样式文件
├── modules/                # JavaScript模块目录
│   ├── app.js              # 主应用程序模块
│   ├── websocket-manager.js # WebSocket连接管理
│   ├── ui-manager.js       # UI管理
│   └── event-handlers.js   # 事件处理器
└── README.md               # 本文档
```

## 模块说明

### 1. app.js
主应用程序模块，负责：
- 初始化应用程序
- 协调其他模块
- 处理应用程序生命周期

### 2. websocket-manager.js
WebSocket连接管理模块，负责：
- 建立和维护WebSocket连接
- 自动重连机制
- 心跳检测
- 消息发送和接收

### 3. ui-manager.js
UI管理模块，负责：
- 更新连接状态
- 显示和格式化消息
- 管理监控状态指示器
- 显示通知

### 4. event-handlers.js
事件处理器模块，负责：
- 处理WebSocket事件
- 绑定UI交互事件
- 处理特殊消息类型

## 功能特性

- **自动连接**：页面加载后自动连接到WebSocket服务器
- **自动重连**：连接断开后自动尝试重新连接
- **心跳检测**：定期发送心跳消息保持连接
- **实时消息显示**：格式化显示所有事件消息
- **状态监控**：实时显示各类事件的监听状态
- **手动测试**：支持手动发送各种测试消息
- **消息清理**：一键清空消息历史
- **响应式设计**：适配不同屏幕尺寸

## 使用方法

1. 在浏览器中打开 `index.html` 文件
2. 页面会自动连接到 `ws://localhost:3011`
3. 如果连接成功，状态指示器会显示为"Connected"
4. 在VS Code中进行各种操作，观察客户端的实时反馈
5. 可以使用手动命令面板发送测试消息

## 手动命令

- **Request File**：请求指定文件内容
- **Execute Command**：执行VS Code命令
- **Send Message**：发送自定义消息

## 消息类型

客户端支持以下消息类型：

- `welcome` - 连接成功消息
- `selectedText` - 选中文本
- `fileContent` - 文件内容
- `customMessage` - 自定义消息
- `contextMenuSelection` - 右键菜单选择
- `contextMenuFile` - 右键菜单文件
- `contextMenuDirectory` - 右键菜单文件夹
- `selectionChanged` - 文本选择变化
- `selectionCleared` - 选择被清除
- `activeEditorChanged` - 活动编辑器变化
- `documentChanged` - 文档内容变化
- `cursorPositionChanged` - 光标位置变化
- `fileSaved` - 文件保存
- `fileOpened` - 文件打开
- `fileResponse` - 文件请求响应
- `commandResponse` - 命令执行响应
- `error` - 错误消息
- `initialState` - 初始状态
- `monitoringStatusChanged` - 监听状态变化

## 开发说明

### 添加新功能

1. **新的消息类型**：
   - 在 `ui-manager.js` 的 `formatMessageContent` 方法中添加新的消息格式化逻辑
   - 在 `event-handlers.js` 的 `handleSpecialMessages` 方法中添加特殊处理逻辑

2. **新的UI交互**：
   - 在 `index.html` 中添加HTML元素
   - 在 `styles.css` 中添加样式
   - 在 `event-handlers.js` 中绑定事件处理

3. **新的WebSocket操作**：
   - 在 `websocket-manager.js` 中添加新的发送消息方法

### 模块间通信

模块间主要通过直接方法调用和事件回调进行通信：

- `app.js` 初始化其他模块并传递引用
- `event-handlers.js` 调用 `websocket-manager.js` 和 `ui-manager.js` 的方法
- `websocket-manager.js` 通过回调函数通知 `event-handlers.js` 事件发生

### 调试

1. 打开浏览器开发者工具的控制台查看日志
2. 使用Network面板查看WebSocket连接和消息
3. 使用Elements面板检查和调试UI元素

## 浏览器兼容性

- 支持所有现代浏览器
- 需要WebSocket支持
- 建议使用Chrome、Firefox、Safari或Edge最新版本