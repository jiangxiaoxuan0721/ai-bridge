const webSocket = require('ws');
const net = require('net');
const vscode = require('vscode');

// 单例WebSocket服务器
let singletonServer = null;
let isSingletonRunning = false;
let connectionAttempts = 0;
const maxConnectionAttempts = 5;

// 客户端集，用于所有扩展实例共享
let allClients = new Set();
let monitoringStates = new Map(); // 存储每个扩展实例的监听状态
let isMonitoringEnabled = false; // 全局监听状态

// 当前活动的编辑器状态（用于在实例间同步）
let currentEditorState = null;

// 服务器生命周期管理
let serverInstance = null; // 当前作为服务器的实例
let serverHeartbeatTimer = null; // 服务器心跳计时器
let serverShutdownTimer = null; // 服务器关闭倒计时
const SHUTDOWN_DELAY = 5000; // 5秒无客户端后关闭服务器
const HEARTBEAT_INTERVAL = 3000; // 3秒心跳间隔

// 客户端心跳管理
let clientHeartbeatInterval = null; // 客户端心跳发送间隔
let lastPongTime = null; // 最后一次收到pong的时间
let heartbeatTimeoutId = null; // 心跳超时检测ID

/**
 * 设置监听状态
 * @param {boolean} enabled 监听是否启用
 */
function setMonitoringState(enabled) {
    isMonitoringEnabled = enabled;
    // 可以在这里将状态变化通知到所有扩展实例
    if (isSingletonRunning && allClients.size > 0) {
        broadcastToAllClients({
            type: 'monitoringStatusChanged',
            data: {
                enabled: enabled,
                timestamp: new Date().toISOString()
            }
        });
    }
}

/**
 * 检查端口是否被占用
 * @param {number} port 端口号
 * @returns {Promise<boolean>} 端口是否被占用
 */
function isPortInUse(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        
        server.listen(port, () => {
            console.log(`Instance ${process.pid}: Port ${port} is available`);
            server.once('close', () => {
                resolve(false);
            });
            server.close();
        });
        
        server.on('error', () => {
            console.log(`Instance ${process.pid}: Port ${port} is already in use`);
            resolve(true);
        });
    });
}

/**
 * 连接到已存在的单例服务器
 * @param {vscode.ExtensionContext} context 扩展上下文
 * @returns {Promise<boolean>} 是否成功连接
 */
async function connectToSingleton(context) {
    return new Promise((resolve) => {
        try {
            console.log(`Instance ${process.pid} attempting to connect to ws://localhost:3011`);
            const ws = new webSocket('ws://localhost:3011');
            
            ws.on('open', () => {
                console.log(`Instance ${process.pid} connected to existing AI Bridge singleton server`);
                
                ws.send(JSON.stringify({
                    type: 'extension_join',
                    data: {
                        instanceId: process.pid,
                        timestamp: new Date().toISOString()
                    }
                }));
                
                // 启动客户端心跳
                startClientHeartbeat(ws);
                
                // 监听来自单例服务器的消息
                ws.on('message', (data) => {
                    try {
                        const message = JSON.parse(data);
                        
                        // 处理心跳响应
                        if (message.type === 'pong') {
                            console.log('Received pong from server');
                            lastPongTime = new Date(); // 更新最后收到pong的时间
                            return;
                        }
                        
                        handleSingletonMessage(message);
                    } catch (error) {
                        console.error('Error parsing message from singleton:', error);
                    }
                });

                // 请求当前编辑器状态
                setTimeout(() => {
                    ws.send(JSON.stringify({
                        type: 'request_current_state',
                        data: {
                            instanceId: process.pid,
                            timestamp: new Date().toISOString()
                        }
                    }));
                }, 500);
                
                // 发送当前编辑器状态
                setTimeout(() => {
                    const editor = vscode.window.activeTextEditor;
                    if (editor) {
                        ws.send(JSON.stringify({
                            type: 'activeEditorChanged',
                            data: {
                                fileName: editor.document.fileName,
                                languageId: editor.document.languageId,
                                lineCount: editor.document.lineCount,
                                timestamp: new Date().toISOString()
                            }
                        }));
                        
                        ws.send(JSON.stringify({
                            type: 'cursorPositionChanged',
                            data: {
                                fileName: editor.document.fileName,
                                line: editor.selection.active.line + 1,
                                character: editor.selection.active.character + 1,
                                timestamp: new Date().toISOString()
                            }
                        }));
                    }
                }, 1000);
                
                ws.on('close', () => {
                    console.log(`Instance ${process.pid}: Disconnected from singleton server`);
                    
                    // 停止客户端心跳
                    if (clientHeartbeatInterval) {
                        clearInterval(clientHeartbeatInterval);
                        clientHeartbeatInterval = null;
                    }
                    
                    // 清理心跳超时
                    if (heartbeatTimeoutId) {
                        clearTimeout(heartbeatTimeoutId);
                        heartbeatTimeoutId = null;
                    }
                    
                    // 重置心跳状态
                    lastPongTime = null;
                    
                    // 重置连接状态
                    isSingletonRunning = false;
                    
                    // 尝试重新连接或成为新的服务器
                    setTimeout(() => {
                        if (isSingletonRunning) {
                            // 首先尝试重新连接
                            connectToSingleton(context).catch(() => {
                                // 如果重新连接失败，尝试成为新的单例
                                becomeSingleton(context).then(success => {
                                    if (success) {
                                        // 成功成为服务器后，启用自动监听
                                        const { enableMonitoring } = require('./event-monitoring');
                                        enableMonitoring(context, broadcastToAllClients);
                                    }
                                }).catch(() => {
                                    console.error('Failed to reconnect or become singleton');
                                });
                            });
                        }
                    }, 2000);
                });
                
                ws.on('error', (error) => {
                    console.error('WebSocket error connecting to singleton:', error);
                    resolve(false);
                });
                
                console.log(`Instance ${process.pid}: Connected to singleton server successfully`);
                isSingletonRunning = true;
                resolve(true);
            });
            
            ws.on('error', () => {
                console.error(`Instance ${process.pid}: Error connecting to singleton server`);
                resolve(false);
            });
        } catch (error) {
            console.error(`Instance ${process.pid}: Error connecting to singleton:`, error);
            resolve(false);
        }
    });
}

/**
 * 处理来自单例服务器的消息
 * @param {Object} message 消息对象
 */
function handleSingletonMessage(message) {
    // 处理当前编辑器状态消息
    if (message.type === 'current_editor_state') {
        currentEditorState = message.data;
        console.log('Received current editor state from singleton');
        return;
    }
    
    // 对于其他类型的消息，只记录日志，不需要转发
    // 服务器已经负责转发所有消息给所有客户端
    console.log('Received from singleton:', message.type);
}

/**
 * 检查消息是否为编辑器状态消息
 * @param {string} messageType 消息类型
 * @returns {boolean} 是否为编辑器状态消息
 */
function isEditorStateMessage(messageType) {
    const editorStateMessages = [
        'selectionChanged',
        'selectionCleared',
        'cursorPositionChanged',
        'activeEditorChanged',
        'documentChanged',
        'fileSaved',
        'fileOpened'
    ];
    return editorStateMessages.includes(messageType);
}

/**
 * 成为单例服务器
 * @param {vscode.ExtensionContext} context 扩展上下文
 * @returns {Promise<boolean>} 是否成功成为单例
 */
async function becomeSingleton(context) {
    try {
        // 检查端口是否可用
        const portInUse = await isPortInUse(3011);
        
        if (portInUse) {
            return false;
        }
        
        singletonServer = new webSocket.Server({ port: 3011 });
        isSingletonRunning = true;
        serverInstance = process.pid; // 记录服务器实例PID
        
        console.log(`Instance ${process.pid}: AI Bridge singleton server started on port 3011`);
        vscode.window.showInformationMessage('AI Bridge started as singleton server');
        
        // 启动服务器心跳和生命周期管理
        startServerLifecycleManagement();
        
        // 使用context参数以避免警告
        if (context) {
            console.log('Server started with context:', context.extensionPath);
        }
        
        // 处理新连接
        singletonServer.on('connection', (ws) => {
            console.log('New connection to singleton server');
            console.log(`Total clients after connection: ${allClients.size + 1}`);
            allClients.add(ws);
            
            // 有新客户端连接，取消服务器关闭倒计时
            if (serverShutdownTimer) {
                clearTimeout(serverShutdownTimer);
                serverShutdownTimer = null;
                console.log('Server shutdown cancelled - new client connected');
            }
            
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    
                    // 处理心跳消息
                    if (message.type === 'heartbeat') {
                        ws.send(JSON.stringify({
                            type: 'pong',
                            data: {
                                timestamp: new Date().toISOString(),
                                serverPid: serverInstance
                            }
                        }));
                        return;
                    }
                    
                    // 处理扩展实例加入消息
                    if (message.type === 'extension_join') {
                        console.log(`Extension instance ${message.data.instanceId} joined`);
                        ws.instanceId = message.data.instanceId;
                        
                        // 发送当前编辑器状态给新加入的实例
                        if (currentEditorState) {
                            ws.send(JSON.stringify({
                                type: 'current_editor_state',
                                data: currentEditorState
                            }));
                        }
                    }
                    
                    // 处理状态同步请求
                    if (message.type === 'request_current_state') {
                        if (currentEditorState) {
                            ws.send(JSON.stringify({
                                type: 'current_editor_state',
                                data: currentEditorState
                            }));
                        }
                    }
                    
                    // 转发所有消息到所有其他客户端
                    const messageStr = JSON.stringify(message);
                    let forwardedCount = 0;
                    
                    allClients.forEach(client => {
                        if (client !== ws && client.readyState === webSocket.OPEN) {
                            client.send(messageStr);
                            forwardedCount++;
                        }
                    });
                    
                    console.log(`Forwarded message to ${forwardedCount} clients`);
                    
                    // 如果是编辑器状态消息，更新当前状态
                    if (isEditorStateMessage(message.type)) {
                        currentEditorState = message.data;
                        console.log('Updated current editor state for type:', message.type);
                    }
                } catch (error) {
                    console.error('Error parsing message in singleton:', error);
                }
            });
            
            ws.on('close', () => {
                console.log(`Connection closed for instance ${ws.instanceId || 'unknown'}`);
                allClients.delete(ws);
                console.log(`Total clients after close: ${allClients.size}`);
                
                // 如果没有客户端了，启动关闭倒计时
                if (allClients.size === 0) {
                    console.log('No clients connected, starting shutdown countdown');
                    serverShutdownTimer = setTimeout(() => {
                        console.log('Shutting down server due to inactivity');
                        stopSingletonServer();
                    }, SHUTDOWN_DELAY);
                }
            });
            
            ws.on('error', (error) => {
                console.error('WebSocket error in singleton:', error);
                allClients.delete(ws);
                
                // 如果没有客户端了，启动关闭倒计时
                if (allClients.size === 0) {
                    console.log('No clients connected, starting shutdown countdown');
                    serverShutdownTimer = setTimeout(() => {
                        console.log('Shutting down server due to inactivity');
                        stopSingletonServer();
                    }, SHUTDOWN_DELAY);
                }
            });
        });
        
        return true;
    } catch (error) {
        console.error('Error starting singleton server:', error);
        return false;
    }
}

/**
 * 启动单例WebSocket服务器或连接到现有服务器
 * @param {vscode.ExtensionContext} context 扩展上下文
 * @returns {Promise<boolean>} 是否成功启动或连接
 */
async function startSingletonServer(context) {
    if (isSingletonRunning) {
        return true;
    }
    
    connectionAttempts++;
    
    try {
        // 首先尝试连接到已存在的单例服务器
        const connected = await connectToSingleton(context);
        
        if (connected) {
            isSingletonRunning = true;
            connectionAttempts = 0;
            return true;
        }
        
        // 如果连接失败，尝试成为新的单例
        const becameSingleton = await becomeSingleton(context);
        
        if (becameSingleton) {
            isSingletonRunning = true;
            connectionAttempts = 0;
            return true;
        }
        
        // 如果都失败了，显示错误
        vscode.window.showErrorMessage(
            `Failed to start or connect to AI Bridge server (${connectionAttempts}/${maxConnectionAttempts})`
        );
        
        // 如果没有达到最大尝试次数，稍后重试
        if (connectionAttempts < maxConnectionAttempts) {
            setTimeout(() => {
                if (!isSingletonRunning) {
                    startSingletonServer(context);
                }
            }, 2000);
        }
        
        return false;
    } catch (error) {
        console.error('Error in startSingletonServer:', error);
        return false;
    }
}

/**
 * 启动服务器生命周期管理
 */
function startServerLifecycleManagement() {
    // 清除现有的心跳计时器
    if (serverHeartbeatTimer) {
        clearInterval(serverHeartbeatTimer);
    }
    
    // 启动服务器心跳
    serverHeartbeatTimer = setInterval(() => {
        // 检查所有客户端连接状态
        const activeClients = Array.from(allClients).filter(client => 
            client.readyState === webSocket.OPEN
        );
        
        console.log(`Server heartbeat: ${activeClients.length} active clients`);
        
        // 如果没有活跃的客户端，启动关闭倒计时
        if (activeClients.length === 0 && !serverShutdownTimer) {
            console.log('No active clients, starting shutdown countdown');
            serverShutdownTimer = setTimeout(() => {
                console.log('Shutting down server due to inactivity');
                stopSingletonServer();
            }, SHUTDOWN_DELAY);
        }
    }, HEARTBEAT_INTERVAL);
}

/**
 * 启动客户端心跳
 * @param {WebSocket} ws WebSocket连接
 */
function startClientHeartbeat(ws) {
    // 清除现有的心跳间隔和超时
    if (clientHeartbeatInterval) {
        clearInterval(clientHeartbeatInterval);
        clientHeartbeatInterval = null;
    }
    if (heartbeatTimeoutId) {
        clearTimeout(heartbeatTimeoutId);
        heartbeatTimeoutId = null;
    }
    
    // 初始化心跳状态
    lastPongTime = new Date();
    let heartbeatCount = 0;
    
    // 启动心跳超时检测
    const checkHeartbeatTimeout = () => {
        const now = new Date();
        const timeSinceLastPong = now - lastPongTime;
        
        if (timeSinceLastPong > HEARTBEAT_INTERVAL * 3) { // 超过3个心跳间隔没有收到pong
            console.log(`Heartbeat timeout: ${timeSinceLastPong}ms since last pong, reconnecting...`);
            clearInterval(clientHeartbeatInterval);
            clientHeartbeatInterval = null;
            
            // 关闭当前连接并重新连接
            ws.terminate();
            
            // 尝试重新连接
            const vscode = require('vscode');
            setTimeout(() => {
                // 使用传入的context参数，而不是尝试从extension获取
                const extensionContext = vscode.extensions.getExtension('ai-bridge')?.extensionContext;
                connectToSingleton(extensionContext)
                    .then(() => {
                        console.log('Reconnected after heartbeat timeout');
                    })
                    .catch(error => {
                        console.error('Failed to reconnect after heartbeat timeout:', error);
                    });
            }, 1000);
        } else {
            // 继续检查
            heartbeatTimeoutId = setTimeout(checkHeartbeatTimeout, HEARTBEAT_INTERVAL);
        }
    };
    
    // 启动心跳发送
    clientHeartbeatInterval = setInterval(() => {
        if (ws.readyState === webSocket.OPEN) {
            heartbeatCount++;
            console.log(`Sending heartbeat #${heartbeatCount} to server`);
            
            ws.send(JSON.stringify({
                type: 'heartbeat',
                data: {
                    timestamp: new Date().toISOString(),
                    clientPid: process.pid
                }
            }));
            
            // 启动或重启超时检查
            if (!heartbeatTimeoutId) {
                checkHeartbeatTimeout();
            }
        } else {
            // 连接已关闭，停止心跳
            clearInterval(clientHeartbeatInterval);
            clientHeartbeatInterval = null;
            if (heartbeatTimeoutId) {
                clearTimeout(heartbeatTimeoutId);
                heartbeatTimeoutId = null;
            }
        }
    }, HEARTBEAT_INTERVAL);
}

/**
 * 停止单例服务器
 */
function stopSingletonServer() {
    if (!isSingletonRunning) {
        return;
    }
    
    isSingletonRunning = false;
    serverInstance = null;
    
    // 清除计时器
    if (serverHeartbeatTimer) {
        clearInterval(serverHeartbeatTimer);
        serverHeartbeatTimer = null;
    }
    
    if (serverShutdownTimer) {
        clearTimeout(serverShutdownTimer);
        serverShutdownTimer = null;
    }
    
    if (singletonServer) {
        singletonServer.close(() => {
            console.log('Singleton server closed');
        });
        singletonServer = null;
    }
    
    allClients.clear();
    monitoringStates.clear();
    currentEditorState = null;
}

/**
 * 向所有客户端广播消息
 * @param {Object} message 要广播的消息对象
 */
function broadcastToAllClients(message) {
    const messageStr = JSON.stringify(message);
    console.log('Broadcasting message:', message.type, 'with data:', JSON.stringify(message.data));
    
    let sentCount = 0;
    allClients.forEach(client => {
        if (client.readyState === webSocket.OPEN) {
            try {
                client.send(messageStr);
                sentCount++;
            } catch (error) {
                console.error('Error sending message to client:', error);
                allClients.delete(client);
            }
        }
    });
    
    console.log(`Message sent to ${sentCount} clients`);
    
    // 如果是编辑器状态消息，更新当前状态
    if (isEditorStateMessage(message.type)) {
        currentEditorState = message.data;
        console.log('Updated current editor state for type:', message.type);
    }
}

/**
 * 获取连接的客户端数量
 * @returns {number} 连接的客户端数量
 */
function getClientCount() {
    return allClients.size;
}

/**
 * 检查服务器是否正在运行
 * @returns {boolean} 服务器是否正在运行
 */
function isServerRunning() {
    return isSingletonRunning;
}

/**
 * 发送初始状态到客户端
 */
function sendInitialState() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        broadcastToAllClients({
            type: 'initialState',
            data: {
                fileName: editor.document.fileName,
                languageId: editor.document.languageId,
                lineCount: editor.document.lineCount,
                cursorPosition: {
                    line: editor.selection.active.line + 1,
                    character: editor.selection.active.character + 1
                },
                hasSelection: !editor.selection.isEmpty,
                monitoringEnabled: isMonitoringEnabled,
                timestamp: new Date().toISOString()
            }
        });
    }
}

module.exports = {
    startSingletonServer,
    stopSingletonServer,
    broadcastToAllClients,
    getClientCount,
    isServerRunning,
    sendInitialState,
    setMonitoringState
};