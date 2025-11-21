# 测试AI Bridge单例模式

## 概述

本文档介绍如何测试AI Bridge的单例模式功能，验证多个VS Code实例能否共享同一个WebSocket服务器。

## 方法1：手动测试

### 步骤1：启动第一个VS Code实例
1. 打开项目文件夹
2. 在VS Code中按 `F5` 启动调试会话
3. 观察通知消息，应该显示："AI Bridge started as singleton server"

### 步骤2：启动第二个VS Code实例
1. 打开另一个项目文件夹
2. 在VS Code中按 `F5` 启动调试会话
3. 观察通知消息，应该显示："Connected to existing AI Bridge singleton server"

### 步骤3：启动WebSocket客户端
1. 打开终端，进入 `client` 目录
2. 运行 `npm start` 启动本地服务器
3. 在浏览器中打开 `http://localhost:8080`
4. 观察客户端状态，应该显示："Connected"

### 步骤4：测试功能
1. 在第一个VS Code实例中选择一些文本
2. 观察WebSocket客户端是否接收到消息
3. 在第二个VS Code实例中选择一些文本
4. 观察WebSocket客户端是否接收到消息
5. 客户端应该能接收到来自两个VS Code实例的消息

## 方法2：自动化测试

运行提供的测试脚本：

```bash
node test-singleton.js
```

这个脚本会模拟：
1. 第一个扩展实例成为单例服务器
2. 第二个扩展实例连接到单例服务器
3. 两个WebSocket客户端连接到服务器
4. 消息在客户端之间正确转发

## 预期结果

### 成功情况
- 第一个VS Code实例显示："AI Bridge started as singleton server"
- 后续VS Code实例显示："Connected to existing AI Bridge singleton server"
- WebSocket客户端显示："Connected"
- 客户端能接收到来自所有VS Code实例的消息
- 没有端口冲突错误

### 故障情况
- 如果多个实例都显示"started as singleton server"，说明端口检测有问题
- 如果实例显示"Failed to start or connect to AI Bridge server"，说明连接有问题
- 如果客户端无法连接，检查扩展是否正常运行

## 故障排除

### 问题：端口冲突
错误：多个实例都尝试成为单例服务器

解决：
1. 重新加载其中一个VS Code实例
2. 重新加载的实例应该会连接到现有的服务器

### 问题：连接失败
错误：实例无法连接到单例服务器

解决：
1. 检查防火墙设置
2. 确保没有其他程序占用3011端口
3. 重新启动VS Code实例

### 问题：客户端连接失败
错误：WebSocket客户端显示"Disconnected"

解决：
1. 确保至少有一个VS Code实例运行了AI Bridge扩展
2. 检查端口是否确实是3011
3. 查看VS Code开发者控制台的错误信息

## 高级测试

### 测试故障转移
1. 启动两个VS Code实例（一个单例，一个客户端）
2. 启动WebSocket客户端并确认连接正常
3. 关闭单例VS Code实例
4. 观察客户端实例是否自动成为新的单例
5. 观察WebSocket客户端是否自动重连

### 测试多客户端
1. 启动多个WebSocket客户端（打开多个浏览器标签）
2. 在VS Code中进行操作
3. 确认所有客户端都接收到相同的消息

## 开发者信息

### 消息格式
扩展实例加入时发送的消息：
```json
{
  "type": "extension_join",
  "data": {
    "instanceId": "进程ID",
    "timestamp": "ISO时间戳"
  }
}
```

### 关键函数
- `isPortInUse(port)` - 检查端口是否被占用
- `becomeSingleton()` - 成为单例服务器
- `connectToSingleton()` - 连接到现有单例服务器
- `broadcastToAllClients(message)` - 向所有客户端广播消息

### 调试信息
单例模式的日志信息：
- "AI Bridge singleton server started on port 3011"
- "Connected to existing AI Bridge singleton server"
- "Extension instance {id} joined"
- "New connection to singleton server"