# AI Bridge 单例模式说明

## 概述

AI Bridge 扩展支持单例模式，允许多个VS Code实例共享同一个WebSocket服务器，避免端口冲突问题。

## 工作原理

当启动多个VS Code实例时：

1. **第一个实例** - 成为单例服务器，占用3011端口
2. **后续实例** - 连接到已存在的单例服务器，作为客户端

这样所有VS Code实例都可以通过同一个WebSocket服务器与外部客户端通信。

## 技术实现

### 端口检测

使用Node.js的`net`模块检测3011端口是否已被占用：

```javascript
function isPortInUse(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        
        server.listen(port, () => {
            server.once('close', () => {
                resolve(false);
            });
            server.close();
        });
        
        server.on('error', () => {
            resolve(true);
        });
    });
}
```

### 单例服务器

成为单例服务器的实例：

1. 创建WebSocket服务器（端口3011）
2. 管理所有客户端连接
3. 转发所有扩展实例的消息到客户端
4. 显示"AI Bridge started as singleton server"通知

### 客户端实例

作为客户端连接到单例的实例：

1. 创建WebSocket客户端连接到localhost:3011
2. 发送`extension_join`消息标识自己
3. 将所有消息通过单例服务器转发

## 消息流程

```
VS Code实例A (单例)           VS Code实例B (客户端)            WebSocket客户端
        |                           |                             |
        |<-- 启动单例服务器 --------|                             |
        |                           |<-- 连接到单例服务器 --------|
        |                           |                             |
        |<-- 用户操作 ---------------|                             |
        |---- 广播消息 ----------->|                             |
        |                           |---- 转发消息 ------------->|
        |                           |                             |
        |                           |<-- 用户操作 ----------------|
        |<-- 接收消息 --------------|                             |
        |---- 转发消息 ----------->|                             |
```

## 优势

1. **避免端口冲突** - 多个VS Code实例不会因为端口占用而启动失败
2. **资源共享** - 所有VS Code实例共享同一个连接池
3. **透明操作** - 用户无需关心哪个实例是单例服务器
4. **自动恢复** - 单例服务器关闭后，其他实例可以成为新的单例

## 用户体验

启动多个VS Code实例时：

1. 第一个实例显示："AI Bridge started as singleton server"
2. 后续实例显示："Connected to existing AI Bridge singleton server"
3. 所有实例的功能完全相同
4. 客户端无法区分消息来自哪个VS Code实例

## 故障处理

1. **单例服务器意外关闭**：
   - 客户端实例检测到连接断开
   - 尝试重新连接（最多5次）
   - 如果重新连接失败，尝试成为新的单例

2. **端口被其他程序占用**：
   - 显示错误消息："Failed to start or connect to AI Bridge server"
   - 提供重试选项

## 开发者注意事项

1. **消息同步**：所有实例的消息通过单例服务器转发，需要确保消息格式一致
2. **状态管理**：每个实例维护自己的监听状态，不影响其他实例
3. **扩展卸载**：单例服务器关闭时，所有客户端连接也会断开

## 配置选项

当前单例模式是自动启用的，未来可能添加配置选项：

```json
{
  "aiBridge.singleton.enabled": true,
  "aiBridge.singleton.port": 3011,
  "aiBridge.singleton.reconnectAttempts": 5,
  "aiBridge.singleton.reconnectDelay": 2000
}
```

## 故障排除

### 问题：多个实例都显示"Started as singleton server"

原因：端口检测延迟或竞态条件

解决：重新加载其中一个实例，它应该会连接到现有的服务器

### 问题：客户端无法连接到单例服务器

原因：防火墙阻止本地连接

解决：检查防火墙设置，确保允许localhost:3011连接