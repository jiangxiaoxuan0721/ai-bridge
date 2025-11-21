# AI Bridge WebSocket API 文档

## 概述

AI Bridge 扩展提供了一个 WebSocket 服务器，允许外部应用程序与 VS Code 进行通讯。服务器默认运行在端口 3011 上。

## 连接信息

- **WebSocket 服务器地址**: `ws://localhost:3011`
- **协议**: WebSocket (RFC 6455)
- **数据格式**: JSON

## 消息格式

所有消息都采用以下 JSON 格式：

```json
{
  "type": "消息类型",
  "data": {
    // 消息数据
  }
}
```

## 服务器发送的消息类型

### 1. welcome
客户端连接成功时发送。

```json
{
  "type": "welcome",
  "data": {
    "message": "Connected to AI Bridge VS Code Extension",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "clientId": 1
  }
}
```

### 2. contextMenuFile
当用户在文件资源管理器中右键点击文件并选择 "Send File to AI Bridge" 时发送。

```json
{
  "type": "contextMenuFile",
  "data": {
    "fileName": "/path/to/selected/file.js",
    "content": "文件完整内容...",
    "languageId": "javascript",
    "lineCount": 42,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. contextMenuDirectory
当用户在文件资源管理器中右键点击文件夹并选择 "Send File to AI Bridge" 时发送。

```json
{
  "type": "contextMenuDirectory",
  "data": {
    "directory": {
      "name": "src",
      "path": "/path/to/selected/src",
      "timestamp": "2024-01-01T00:00:00.000Z"
    },
    "files": [
      {
        "name": "index.js",
        "path": "/path/to/selected/src/index.js",
        "isDirectory": false,
        "size": 2048,
        "lastModified": "2024-01-01T00:00:00.000Z"
      },
      {
        "name": "components",
        "path": "/path/to/selected/src/components",
        "isDirectory": true,
        "size": 4096,
        "lastModified": "2024-01-01T00:00:00.000Z"
      }
    ],
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4. selectedText
当用户在 VS Code 中选择文本并执行 "Get Selected Text" 命令时发送。

```json
{
  "type": "selectedText",
  "data": {
    "text": "选中的文本内容",
    "fileName": "/path/to/file.js",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. fileContent
当用户执行 "Send Current File Content" 命令时发送。

```json
{
  "type": "fileContent",
  "data": {
    "fileName": "/path/to/file.js",
    "content": "文件完整内容",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4. customMessage
当用户执行 "Send Custom Message" 命令时发送。

```json
{
  "type": "customMessage",
  "data": {
    "message": "用户自定义消息",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### 5. selectionChanged
当用户选择文本时自动发送（如果启用了自动监听）。

```json
{
  "type": "selectionChanged",
  "data": {
    "text": "选中的文本内容",
    "fileName": "/path/to/file.js",
    "startLine": 10,
    "endLine": 15,
    "startCharacter": 5,
    "endCharacter": 20,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### 6. selectionCleared
当用户清除选择时发送。

```json
{
  "type": "selectionCleared",
  "data": {
    "fileName": "/path/to/file.js",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### 7. activeEditorChanged
当用户切换到不同的编辑器时发送。

```json
{
  "type": "activeEditorChanged",
  "data": {
    "fileName": "/path/to/file.js",
    "languageId": "javascript",
    "lineCount": 150,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### 8. documentChanged
当文档内容发生变化时发送。

```json
{
  "type": "documentChanged",
  "data": {
    "fileName": "/path/to/file.js",
    "changes": [
      {
        "text": "新增的文本",
        "range": {
          "start": { "line": 10, "character": 5 },
          "end": { "line": 10, "character": 5 }
        },
        "rangeLength": 0
      }
    ],
    "version": 2,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### 9. cursorPositionChanged
当光标位置发生变化时发送。

```json
{
  "type": "cursorPositionChanged",
  "data": {
    "fileName": "/path/to/file.js",
    "line": 25,
    "character": 10,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### 10. fileSaved
当文件被保存时发送。

```json
{
  "type": "fileSaved",
  "data": {
    "fileName": "/path/to/file.js",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### 11. fileOpened
当文件被打开时发送。

```json
{
  "type": "fileOpened",
  "data": {
    "fileName": "/path/to/file.js",
    "languageId": "javascript",
    "lineCount": 150,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### 12. pong
响应客户端的 ping 消息。

```json
{
  "type": "pong",
  "data": {
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### 13. fileResponse
响应客户端的文件请求。

```json
{
  "type": "fileResponse",
  "data": {
    "fileName": "requested-file.js",
    "content": "文件内容",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### 14. commandResponse
响应客户端的命令执行请求。

```json
{
  "type": "commandResponse",
  "data": {
    "command": "workbench.action.files.save",
    "result": "命令执行结果",
    "success": true,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### 15. error
发生错误时发送。

```json
{
  "type": "error",
  "data": {
    "message": "错误描述",
    "fileName": "相关文件名（可选）"
  }
}
```

## 客户端发送的消息类型

### 1. ping
心跳检测消息。

```json
{
  "type": "ping",
  "data": {
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. requestFile
请求读取文件内容。

```json
{
  "type": "requestFile",
  "data": {
    "fileName": "path/to/file.js"
  }
}
```

**安全限制**: 只能读取工作区内的文件。

### 3. executeCommand
请求执行 VS Code 命令。

```json
{
  "type": "executeCommand",
  "data": {
    "command": "workbench.action.files.save",
    "args": ["参数1", "参数2"]
  }
}
```

### 4. customMessage
发送自定义消息。

```json
{
  "type": "customMessage",
  "data": {
    "message": "自定义消息内容",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## VS Code 命令

扩展提供了以下命令：

1. **ai-bridge.getSelectedText**: 获取当前选中的文本并广播给所有客户端
2. **ai-bridge.getFileContent**: 发送当前文件的完整内容给所有客户端
3. **ai-bridge.sendMessage**: 发送自定义消息给所有客户端
4. **ai-bridge.toggleAutoMonitoring**: 切换自动监听状态

## 使用示例

### JavaScript 客户端示例

```javascript
const ws = new WebSocket('ws://localhost:3011');

ws.onopen = function() {
    console.log('Connected to AI Bridge');
};

ws.onmessage = function(event) {
    const message = JSON.parse(event.data);
    console.log('Received:', message.type, message.data);
};

// 请求文件
ws.send(JSON.stringify({
    type: 'requestFile',
    data: {
        fileName: 'src/index.js'
    }
}));

// 执行命令
ws.send(JSON.stringify({
    type: 'executeCommand',
    data: {
        command: 'workbench.action.files.save'
    }
}));
```

### Python 客户端示例

```python
import websocket
import json

def on_message(ws, message):
    data = json.loads(message)
    print(f"Received: {data['type']} - {data['data']}")

def on_open(ws):
    print("Connected to AI Bridge")
    # 请求文件
    ws.send(json.dumps({
        "type": "requestFile",
        "data": {"fileName": "src/index.js"}
    }))

ws = websocket.WebSocketApp("ws://localhost:3011",
                           on_message=on_message,
                           on_open=on_open)

ws.run_forever()
```

## 自动监听功能

### 概述

扩展支持自动监听 VS Code 编辑器事件，无需手动调用命令即可实时获取编辑器状态变化：

### 监听的事件类型
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

### 防抖处理

为了避免过多的消息，所有事件都使用了防抖处理：
- 选择变化：默认 300ms 防抖
- 文档变化：默认 450ms 防抖
- 可通过 `aiBridge.autoMonitoring.debounceDelay` 配置

### 手动控制

- 使用命令 `AI Bridge: Toggle Auto Monitoring` 可以开启/关闭自动监听
- 也可以通过 VS Code 设置面板配置各项监听功能

## 错误处理

- 如果端口 3011 被占用，扩展会显示错误消息
- 客户端发送无效格式的消息会收到错误响应
- 请求工作区外的文件会被拒绝
- 执行不存在的命令会返回错误信息

## 安全注意事项

1. WebSocket 服务器只监听本地接口 (localhost)
2. 文件读取限制在工作区范围内
3. 命令执行受 VS Code 权限系统限制
4. 建议在生产环境中使用适当的认证机制

## 故障排除

1. **连接失败**: 检查 VS Code 是否已启动并加载了扩展
2. **端口被占用**: 修改 extension.js 中的端口号
3. **文件读取失败**: 确保文件路径正确且在工作区内
4. **命令执行失败**: 检查命令名称是否正确

## 性能优化

- 使用防抖技术减少消息频率
- 智能过滤重复事件
- 内存优化和及时清理
- 可配置的监听选项