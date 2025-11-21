# AI Bridge 快速开始指南

## 🚀 5分钟快速体验

### 第一步：启动扩展
1. 在 VS Code 中打开此项目文件夹
2. 按 `F5` 启动调试会话
3. 会打开一个新的 VS Code 窗口（扩展开发主机）

### 第二步：打开测试客户端
1. 在浏览器中打开 `test-client.html` 文件
2. 页面会自动连接到 WebSocket 服务器
3. 状态显示为 "Connected" 表示连接成功

### 第三步：体验自动监听
在新打开的 VS Code 窗口中：

1. **选择文本**：任意选择一些代码，观察浏览器实时显示选中的内容
2. **移动光标**：在文件中移动光标，浏览器会实时更新光标位置
3. **编辑文件**：修改文件内容，浏览器会显示文档变化
4. **保存文件**：按 `Ctrl+S` 保存，浏览器会显示保存事件
5. **切换文件**：打开不同的文件，浏览器会显示文件切换事件

## 📋 功能清单

### ✅ 已实现功能

- [x] WebSocket 服务器（端口 3011）
- [x] 手动命令获取选中文本
- [x] 手动命令发送文件内容
- [x] 双向通信（客户端请求文件、执行命令）
- [x] 心跳检测（ping/pong）
- [x] **自动监听文本选择变化**
- [x] **自动监听光标位置变化**
- [x] **自动监听文档内容变化**
- [x] **自动监听文件操作（打开/保存）**
- [x] **自动监听编辑器切换**
- [x] **可配置的监听选项**
- [x] **防抖处理优化性能**
- [x] **实时状态显示**
- [x] **完整的测试客户端**

### 🎯 核心特性

1. **零配置自动监听**：扩展启动后自动开始监听所有编辑器事件
2. **智能防抖**：避免过多消息，性能优化
3. **可配置控制**：通过 VS Code 设置精细控制监听行为
4. **实时反馈**：测试客户端提供直观的状态显示
5. **完整 API**：支持双向通信和丰富的消息类型

## 🛠️ 配置选项

在 VS Code 设置中搜索 "aiBridge" 可以找到以下配置：

```json
{
  "aiBridge.autoMonitoring.enabled": true,              // 总开关
  "aiBridge.autoMonitoring.selectionChanges": true,     // 文本选择
  "aiBridge.autoMonitoring.cursorPosition": true,      // 光标位置
  "aiBridge.autoMonitoring.documentChanges": true,     // 文档变化
  "aiBridge.autoMonitoring.fileOperations": true,      // 文件操作
  "aiBridge.autoMonitoring.debounceDelay": 300          // 防抖延迟
}
```

## 📱 测试客户端功能

测试客户端 `test-client.html` 提供：

- **自动连接**：页面加载后自动连接 WebSocket
- **实时消息显示**：格式化显示所有事件消息
- **状态监控**：实时显示各类事件的监听状态
- **手动测试**：支持手动发送各种测试消息
- **消息清理**：一键清空消息历史

## 🔧 常用命令

在 VS Code 命令面板（`Ctrl+Shift+P`）中：

- `AI Bridge: Get Selected Text` - 手动获取选中文本
- `AI Bridge: Send Current File Content` - 手动发送文件内容
- `AI Bridge: Send Custom Message` - 发送自定义消息
- `AI Bridge: Toggle Auto Monitoring` - 切换自动监听

## 📚 文档链接

- [WebSocket API 详细文档](./WEBSOCKET_API.md)
- [自动监听功能演示](./AUTO_MONITORING_DEMO.md)
- [项目说明](./README.md)

## 🎮 体验建议

1. **先体验自动监听**：直接在 VS Code 中操作，观察浏览器反馈
2. **尝试手动命令**：使用命令面板体验手动功能
3. **调整配置选项**：在设置中关闭某些监听类型，观察效果
4. **查看 API 文档**：了解完整的消息格式和用法

## ❓ 常见问题

**Q: 为什么没有收到消息？**
A: 确保扩展已启动（按 F5），浏览器已连接到 test-client.html

**Q: 消息太多怎么办？**
A: 调整 `aiBridge.autoMonitoring.debounceDelay` 增加防抖延迟，或关闭不需要的监听类型

**Q: 如何只监听特定事件？**
A: 在 VS Code 设置中关闭不需要的监听选项

**Q: 可以连接多个客户端吗？**
A: 可以，WebSocket 服务器支持多客户端同时连接，所有客户端都会收到广播消息

---

🎉 **恭喜！** 你已经成功体验了 AI Bridge 的核心功能。这个扩展现在可以实时监听 VS Code 的所有编辑器事件，并通过 WebSocket 发送给客户端应用，为 AI 辅助编程、实时协作等场景提供了强大的基础设施。