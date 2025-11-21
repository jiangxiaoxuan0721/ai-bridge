# AI Bridge 自动监听功能演示

## 功能概述

AI Bridge 扩展现在支持自动监听 VS Code 编辑器事件，无需手动调用命令即可实时获取编辑器状态变化。

## 快速开始

### 1. 启动扩展

1. 在 VS Code 中按 `F5` 启动调试会话
2. 扩展会自动启动 WebSocket 服务器（端口 3011）

### 2. 打开测试客户端

1. 在浏览器中打开 `test-client.html`
2. 页面会自动连接到 WebSocket 服务器
3. 连接成功后，状态会显示为 "Connected"

### 3. 测试自动监听功能

在 VS Code 中进行以下操作，观察测试客户端的实时反馈：

#### 文本选择监听
- 在任意文件中选择一些文本
- 客户端会立即显示选中的文本内容和位置信息
- 取消选择时，客户端会显示选择已清除

#### 光标位置监听
- 在文件中移动光标
- 客户端会实时更新光标位置（行号:列号）

#### 文档变化监听
- 编辑文件内容
- 客户端会显示文档变化信息（变化内容、版本号等）

#### 文件操作监听
- 打开新文件
- 保存文件
- 切换编辑器标签
- 客户端会显示相应的文件操作事件

## 配置选项

在 VS Code 设置中可以自定义监听行为：

```json
{
  "aiBridge.autoMonitoring.enabled": true,              // 启用/禁用自动监听
  "aiBridge.autoMonitoring.selectionChanges": true,     // 监听文本选择变化
  "aiBridge.autoMonitoring.cursorPosition": true,      // 监听光标位置变化
  "aiBridge.autoMonitoring.documentChanges": true,     // 监听文档内容变化
  "aiBridge.autoMonitoring.fileOperations": true,      // 监听文件操作
  "aiBridge.autoMonitoring.debounceDelay": 300          // 防抖延迟（毫秒）
}
```

## 事件类型说明

### selectionChanged
当用户选择文本时触发：
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

### cursorPositionChanged
当光标位置变化时触发：
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

### documentChanged
当文档内容变化时触发：
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

### fileSaved / fileOpened
当文件被保存或打开时触发：
```json
{
  "type": "fileSaved",
  "data": {
    "fileName": "/path/to/file.js",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### activeEditorChanged
当切换到不同编辑器时触发：
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

## 性能优化

### 防抖处理
为了避免过多的消息，所有事件都使用了防抖处理：
- 选择变化：默认 300ms 防抖
- 文档变化：默认 450ms 防抖
- 可通过 `aiBridge.autoMonitoring.debounceDelay` 配置

### 智能过滤
- 只发送有实际变化的事件
- 避免重复发送相同的选择内容
- 只监听活动编辑器的事件

## 手动控制

### 命令控制
- 使用命令面板（Ctrl+Shift+P）搜索 "AI Bridge: Toggle Auto Monitoring"
- 可以快速开启/关闭自动监听功能

### 设置控制
- 在 VS Code 设置中搜索 "aiBridge"
- 可以单独配置每种事件的监听状态

## 使用场景

### 1. 实时协作
- 多人协作编辑时实时同步编辑状态
- 显示其他用户的选择和光标位置

### 2. 代码审查
- 实时跟踪代码变更
- 自动记录编辑历史

### 3. AI 辅助编程
- 实时获取用户编辑上下文
- 提供更精准的代码建议

### 4. 教学演示
- 实时展示编辑操作
- 记录教学过程

## 故障排除

### 连接问题
- 确保 VS Code 扩展已启动
- 检查 WebSocket 服务器是否运行在 3011 端口
- 确认防火墙没有阻止本地连接

### 性能问题
- 调整防抖延迟设置
- 关闭不需要的监听类型
- 检查客户端处理逻辑

### 事件丢失
- 确认网络连接稳定
- 检查客户端消息处理逻辑
- 查看扩展日志输出

## 扩展开发

如果需要自定义事件处理，可以修改 `extension.js` 中的 `setupEventListeners` 函数，添加新的事件监听器或修改现有的事件处理逻辑。

详细的 WebSocket API 文档请参考 [WebSocket API 文档](./WEBSOCKET_API.md)。

## 示例代码

### JavaScript 客户端示例

```javascript
const ws = new WebSocket('ws://localhost:3011');

ws.onopen = () => {
    console.log('Connected to AI Bridge');
};

ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    
    switch (message.type) {
        case 'selectionChanged':
            console.log('User selected:', message.data.text);
            break;
        case 'cursorPositionChanged':
            console.log('Cursor at:', `${message.data.line}:${message.data.character}`);
            break;
        case 'documentChanged':
            console.log('Document changed:', message.data.changes.length, 'changes');
            break;
    }
};
```

### Python 客户端示例

```python
import websocket
import json

def on_message(ws, message):
    data = json.loads(message)
    event_type = data['type']
    event_data = data['data']
    
    if event_type == 'selectionChanged':
        print(f"Selected: {event_data['text'][:50]}...")
    elif event_type == 'cursorPositionChanged':
        print(f"Cursor: {event_data['line']}:{event_data['character']}")

ws = websocket.WebSocketApp("ws://localhost:3011", on_message=on_message)
ws.run_forever()
```

---

通过自动监听功能，AI Bridge 扩展为开发者提供了强大的实时编辑器事件处理能力，可以用于构建各种创新的应用场景。