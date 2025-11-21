# AI Bridge 使用示例

## 📋 目录

1. [基础使用示例](#基础使用示例)
2. [自动监听示例](#自动监听示例)
3. [客户端集成示例](#客户端集成示例)
4. [高级应用场景](#高级应用场景)

## 基础使用示例

### 1. 获取选中文本

```javascript
// 在 VS Code 中选择文本后，客户端会收到：
{
  "type": "selectedText",
  "data": {
    "text": "function hello() { console.log('Hello World'); }",
    "fileName": "/path/to/file.js",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. 从文件资源管理器发送文件/文件夹

```javascript
// 右键点击文件并选择"Send File to AI Bridge"后，客户端会收到：
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

// 右键点击文件夹并选择"Send File to AI Bridge"后，客户端会收到：
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

### 3. 获取文件内容

```javascript
// 客户端发送请求
{
  "type": "requestFile",
  "data": {
    "fileName": "/path/to/file.js"
  }
}

// 服务器响应
{
  "type": "fileResponse",
  "data": {
    "fileName": "/path/to/file.js",
    "content": "文件完整内容...",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4. 执行 VS Code 命令

```javascript
// 客户端发送命令
{
  "type": "executeCommand",
  "data": {
    "command": "workbench.action.files.save"
  }
}

// 服务器响应
{
  "type": "commandResponse",
  "data": {
    "command": "workbench.action.files.save",
    "result": "Command executed successfully",
    "success": true,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## 自动监听示例

### 1. 文本选择监听

```javascript
// 用户选择文本时自动发送
{
  "type": "selectionChanged",
  "data": {
    "text": "选中的代码片段",
    "fileName": "/home/user/project/src/app.js",
    "startLine": 15,
    "endLine": 20,
    "startCharacter": 8,
    "endCharacter": 25,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}

// 用户取消选择时
{
  "type": "selectionCleared",
  "data": {
    "fileName": "/home/user/project/src/app.js",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. 光标位置监听

```javascript
// 光标移动时实时更新
{
  "type": "cursorPositionChanged",
  "data": {
    "fileName": "/home/user/project/src/app.js",
    "line": 25,
    "character": 12,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. 文档变化监听

```javascript
// 编辑文档时自动发送变化
{
  "type": "documentChanged",
  "data": {
    "fileName": "/home/user/project/src/app.js",
    "changes": [
      {
        "text": "const",
        "range": {
          "start": { "line": 10, "character": 0 },
          "end": { "line": 10, "character": 3 }
        },
        "rangeLength": 3
      }
    ],
    "version": 42,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4. 文件操作监听

```javascript
// 文件保存时
{
  "type": "fileSaved",
  "data": {
    "fileName": "/home/user/project/src/app.js",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}

// 文件打开时
{
  "type": "fileOpened",
  "data": {
    "fileName": "/home/user/project/src/app.js",
    "languageId": "javascript",
    "lineCount": 150,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}

// 切换编辑器时
{
  "type": "activeEditorChanged",
  "data": {
    "fileName": "/home/user/project/src/style.css",
    "languageId": "css",
    "lineCount": 85,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## 客户端集成示例

### 1. JavaScript 客户端

```javascript
class AIBridgeClient {
  constructor(url = 'ws://localhost:3011') {
    this.url = url;
    this.ws = null;
    this.handlers = {};
  }

  connect() {
    this.ws = new WebSocket(this.url);
    
    this.ws.onopen = () => {
      console.log('Connected to AI Bridge');
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
    
    this.ws.onclose = () => {
      console.log('Disconnected from AI Bridge');
    };
  }

  on(eventType, handler) {
    if (!this.handlers[eventType]) {
      this.handlers[eventType] = [];
    }
    this.handlers[eventType].push(handler);
  }

  handleMessage(message) {
    const handlers = this.handlers[message.type] || [];
    handlers.forEach(handler => handler(message.data));
  }

  requestFile(fileName) {
    this.send({
      type: 'requestFile',
      data: { fileName }
    });
  }

  executeCommand(command) {
    this.send({
      type: 'executeCommand',
      data: { command }
    });
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
}

// 使用示例
const client = new AIBridgeClient();

client.connect();

// 监听文本选择
client.on('selectionChanged', (data) => {
  console.log('User selected:', data.text);
  console.log('File:', data.fileName);
  console.log('Range:', `${data.startLine}:${data.startCharacter} - ${data.endLine}:${data.endCharacter}`);
});

// 监听文档变化
client.on('documentChanged', (data) => {
  console.log('Document changed:', data.fileName);
  data.changes.forEach(change => {
    console.log('Change:', change.text);
  });
});

// 监听光标位置
client.on('cursorPositionChanged', (data) => {
  console.log('Cursor at:', `${data.line}:${data.character}`);
});
```

### 2. Python 客户端

```python
import asyncio
import websockets
import json

class AIBridgeClient:
    def __init__(self, url='ws://localhost:3011'):
        self.url = url
        self.handlers = {}
    
    def on(self, event_type, handler):
        if event_type not in self.handlers:
            self.handlers[event_type] = []
        self.handlers[event_type].append(handler)
    
    async def handle_message(self, message):
        data = json.loads(message)
        event_type = data['type']
        event_data = data['data']
        
        if event_type in self.handlers:
            for handler in self.handlers[event_type]:
                await handler(event_data)
    
    async def connect(self):
        async with websockets.connect(self.url) as websocket:
            print("Connected to AI Bridge")
            
            async for message in websocket:
                await self.handle_message(message)
    
    async def send_message(self, message):
        async with websockets.connect(self.url) as websocket:
            await websocket.send(json.dumps(message))

# 使用示例
async def on_selection_changed(data):
    print(f"Selected: {data['text'][:50]}...")
    print(f"File: {data['fileName']}")

async def on_document_changed(data):
    print(f"Document changed: {data['fileName']}")
    for change in data['changes']:
        print(f"  Change: {change['text']}")

client = AIBridgeClient()
client.on('selectionChanged', on_selection_changed)
client.on('documentChanged', on_document_changed)

# 启动客户端
asyncio.run(client.connect())
```

### 3. Node.js 客户端

```javascript
const WebSocket = require('ws');

class AIBridgeClient {
  constructor(url = 'ws://localhost:3011') {
    this.url = url;
    this.ws = null;
    this.handlers = {};
  }

  connect() {
    this.ws = new WebSocket(this.url);
    
    this.ws.on('open', () => {
      console.log('Connected to AI Bridge');
    });
    
    this.ws.on('message', (data) => {
      const message = JSON.parse(data);
      this.handleMessage(message);
    });
    
    this.ws.on('close', () => {
      console.log('Disconnected from AI Bridge');
    });
  }

  on(eventType, handler) {
    if (!this.handlers[eventType]) {
      this.handlers[eventType] = [];
    }
    this.handlers[eventType].push(handler);
  }

  handleMessage(message) {
    const handlers = this.handlers[message.type] || [];
    handlers.forEach(handler => handler(message.data));
  }

  requestFile(fileName) {
    this.send({
      type: 'requestFile',
      data: { fileName }
    });
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
}

// 使用示例
const client = new AIBridgeClient();
client.connect();

// 监听所有事件
client.on('selectionChanged', (data) => {
  console.log('Selection:', data.text.substring(0, 30) + '...');
});

client.on('fileSaved', (data) => {
  console.log('File saved:', data.fileName);
});

client.on('activeEditorChanged', (data) => {
  console.log('Switched to:', data.fileName);
});
```

## 高级应用场景

### 1. AI 代码助手

```javascript
class AICodeAssistant {
  constructor() {
    this.client = new AIBridgeClient();
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // 监听代码选择，提供智能建议
    this.client.on('selectionChanged', async (data) => {
      if (this.isCodeSelection(data.text)) {
        const suggestions = await this.getCodeSuggestions(data.text);
        this.displaySuggestions(suggestions);
      }
    });

    // 监听文档变化，实时分析
    this.client.on('documentChanged', async (data) => {
      const analysis = await this.analyzeCode(data.fileName, data.changes);
      if (analysis.issues.length > 0) {
        this.highlightIssues(analysis.issues);
      }
    });
  }

  async getCodeSuggestions(code) {
    // 调用 AI API 获取代码建议
    // 这里只是示例
    return [
      { type: 'refactor', suggestion: 'Extract this into a function' },
      { type: 'optimize', suggestion: 'Use arrow function for better performance' }
    ];
  }

  async analyzeCode(fileName, changes) {
    // 分析代码变更
    return {
      issues: [],
      metrics: {}
    };
  }

  displaySuggestions(suggestions) {
    console.log('AI Suggestions:', suggestions);
  }

  highlightIssues(issues) {
    console.log('Code Issues:', issues);
  }
}

const assistant = new AICodeAssistant();
```

### 2. 实时协作编辑

```javascript
class CollaborationManager {
  constructor(roomId) {
    this.roomId = roomId;
    this.client = new AIBridgeClient();
    this.server = new WebSocketServer({ port: 8080 });
    this.peers = new Map();
    this.setupHandlers();
  }

  setupHandlers() {
    // 监听本地编辑器事件，广播给其他用户
    this.client.on('selectionChanged', (data) => {
      this.broadcast({
        type: 'peerSelection',
        peerId: 'local',
        data: data
      });
    });

    this.client.on('documentChanged', (data) => {
      this.broadcast({
        type: 'peerChange',
        peerId: 'local',
        data: data
      });
    });

    // 处理远程连接
    this.server.on('connection', (ws) => {
      this.handlePeerConnection(ws);
    });
  }

  handlePeerConnection(ws) {
    const peerId = this.generatePeerId();
    this.peers.set(peerId, ws);

    ws.on('message', (message) => {
      const data = JSON.parse(message);
      this.handlePeerMessage(peerId, data);
    });

    ws.on('close', () => {
      this.peers.delete(peerId);
      this.broadcast({
        type: 'peerLeft',
        peerId: peerId
      });
    });
  }

  handlePeerMessage(peerId, message) {
    // 处理来自其他用户的消息
    switch (message.type) {
      case 'selection':
        this.displayPeerSelection(peerId, message.data);
        break;
      case 'change':
        this.applyPeerChange(peerId, message.data);
        break;
    }
  }

  broadcast(message) {
    this.peers.forEach((peer) => {
      if (peer.readyState === WebSocket.OPEN) {
        peer.send(JSON.stringify(message));
      }
    });
  }

  generatePeerId() {
    return Math.random().toString(36).substr(2, 9);
  }
}
```

### 3. 代码质量监控

```javascript
class CodeQualityMonitor {
  constructor() {
    this.client = new AIBridgeClient();
    this.metrics = {
      changes: 0,
      saves: 0,
      errors: 0,
      warnings: 0
    };
    this.setupMonitoring();
  }

  setupMonitoring() {
    this.client.on('documentChanged', (data) => {
      this.metrics.changes += data.changes.length;
      this.updateMetrics();
    });

    this.client.on('fileSaved', (data) => {
      this.metrics.saves++;
      this.analyzeFile(data.fileName);
    });

    this.client.on('activeEditorChanged', (data) => {
      this.trackFileAccess(data.fileName);
    });
  }

  async analyzeFile(fileName) {
    // 分析文件质量
    const analysis = await this.runLinting(fileName);
    this.metrics.errors += analysis.errors;
    this.metrics.warnings += analysis.warnings;
    
    if (analysis.errors > 0) {
      this.notifyErrors(analysis.errors);
    }
  }

  async runLinting(fileName) {
    // 运行代码检查
    return { errors: 0, warnings: 0 };
  }

  updateMetrics() {
    console.log('Code Quality Metrics:', this.metrics);
  }

  notifyErrors(errorCount) {
    console.log(`Found ${errorCount} errors in the code`);
  }

  trackFileAccess(fileName) {
    console.log('Accessing file:', fileName);
  }
}
```

---

这些示例展示了 AI Bridge 扩展的各种使用方式，从基础的文本获取到复杂的 AI 辅助编程和实时协作场景。你可以根据自己的需求选择合适的集成方式。