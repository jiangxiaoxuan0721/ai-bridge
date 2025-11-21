# AI Bridge 项目结构

## 目录结构

```
ai-bridge/
├── src/                     # 源代码目录
│   ├── extension.js         # 主入口文件
│   ├── websocket-server.js  # WebSocket服务器管理模块
│   ├── event-monitoring.js  # 事件监听模块
│   ├── commands.js          # 命令处理模块
│   └── utils.js             # 工具函数模块
├── extension.js             # 向后兼容入口点
├── package.json             # 扩展配置文件
├── test-client.html         # HTML测试客户端
├── test-websocket.js        # Node.js测试客户端
├── README.md                # 项目说明文档
├── QUICK_START.md           # 快速开始指南
├── USAGE_EXAMPLES.md        # 使用示例
├── WEBSOCKET_API.md         # WebSocket API文档
├── AUTO_MONITORING_DEMO.md  # 自动监听功能演示
├── CHANGELOG.md             # 更新日志
└── test/                    # 测试文件目录
```

## 模块说明

### 1. extension.js (src/extension.js)
主入口文件，负责：
- 扩展的激活和停用
- 初始化各个模块
- 协调模块间的交互

### 2. websocket-server.js
WebSocket服务器管理模块，负责：
- 启动和停止WebSocket服务器
- 管理客户端连接
- 处理客户端消息
- 广播消息到所有客户端

### 3. event-monitoring.js
事件监听模块，负责：
- 监听VS Code编辑器事件（文本选择、文档变化等）
- 防抖处理，避免消息泛滥
- 可配置的监听选项

### 4. commands.js
命令处理模块，负责：
- 注册所有VS Code命令
- 处理用户交互（右键菜单、命令面板等）
- 文件和文件夹处理

### 5. utils.js
工具函数模块，提供：
- 语言ID检测
- 防抖函数
- 文件系统操作

## 依赖关系

```
extension.js
├── websocket-server.js
├── event-monitoring.js
└── commands.js
    └── utils.js
event-monitoring.js
└── utils.js
websocket-server.js
└── (与event-monitoring.js通过回调通信)
```

## 通信机制

1. **模块间通信**:
   - 使用回调函数实现模块间通信
   - 主入口点协调各模块初始化

2. **与VS Code通信**:
   - 通过VS Code扩展API获取编辑器状态
   - 注册命令和事件监听器

3. **与客户端通信**:
   - 通过WebSocket协议
   - JSON格式的消息

## 配置

扩展的配置选项在VS Code设置中，前缀为`aiBridge`:

- `autoMonitoring.enabled`: 是否启用自动监听
- `autoMonitoring.selectionChanges`: 是否监听文本选择变化
- `autoMonitoring.cursorPosition`: 是否监听光标位置变化
- `autoMonitoring.documentChanges`: 是否监听文档内容变化
- `autoMonitoring.fileOperations`: 是否监听文件操作
- `autoMonitoring.debounceDelay`: 事件防抖延迟时间

## 扩展开发

要添加新功能：

1. 确定功能属于哪个模块
2. 在相应模块中添加代码
3. 如需要，在`package.json`中添加配置或命令
4. 更新相关文档

例如，添加新的事件监听：

1. 在`event-monitoring.js`中的`enableMonitoring`函数添加监听器
2. 在`package.json`中添加配置选项（如果需要）
3. 在`WEBSOCKET_API.md`中添加新消息类型说明
4. 在测试客户端中添加对消息的处理