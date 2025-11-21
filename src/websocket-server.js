const webSocket = require('ws');
const vscode = require('vscode');

// WebSocket server instance
let wss = null;
let clients = new Set();

// 监听状态，从外部设置
let isMonitoringEnabled = false;

/**
 * 设置监听状态
 * @param {boolean} enabled 监听是否启用
 */
function setMonitoringState(enabled) {
    isMonitoringEnabled = enabled;
}

/**
 * 启动WebSocket服务器
 */
function startServer() {
    try {
        wss = new webSocket.Server({ port: 3011 });
        
        console.log('WebSocket server started on port 3011');
        vscode.window.showInformationMessage('AI Bridge started - Auto monitoring enabled on port 3011');

        wss.on('connection', function connection(ws) {
            console.log('New client connected');
            clients.add(ws);
            
            // Send welcome message
            ws.send(JSON.stringify({
                type: 'welcome',
                data: {
                    message: 'Connected to AI Bridge VS Code Extension',
                    monitoringEnabled: isMonitoringEnabled,
                    timestamp: new Date().toISOString(),
                    clientId: clients.size
                }
            }));
            
            // Send initial state to new client
            setTimeout(() => sendInitialState(), 100);

            ws.on('message', function incoming(message) {
                try {
                    const data = JSON.parse(message);
                    console.log('Received from client:', data);
                    
                    switch (data.type) {
                        case 'ping':
                            ws.send(JSON.stringify({
                                type: 'pong',
                                data: { timestamp: new Date().toISOString() }
                            }));
                            break;
                        case 'requestFile':
                            handleFileRequest(ws, data.data);
                            break;
                        case 'executeCommand':
                            handleCommandRequest(ws, data.data);
                            break;
                        case 'customMessage':
                            broadcastToClients({
                                type: 'customMessage',
                                data: {
                                    message: data.data.message,
                                    timestamp: new Date().toISOString()
                                }
                            });
                            break;
                    }
                } catch (error) {
                    console.error('Error parsing message:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        data: { message: 'Invalid JSON format' }
                    }));
                }
            });

            ws.on('close', function close() {
                console.log('Client disconnected');
                clients.delete(ws);
            });

            ws.on('error', function error(err) {
                console.error('WebSocket error:', err);
                clients.delete(ws);
            });
        });
    } catch (error) {
        console.error('Failed to start WebSocket server:', error);
        vscode.window.showErrorMessage(`Failed to start WebSocket server: ${error.message}`);
    }
}

/**
 * 向所有连接的客户端广播消息
 * @param {Object} message 要广播的消息对象
 */
function broadcastToClients(message) {
    const messageStr = JSON.stringify(message);
    console.log('Broadcasting message:', message.type);
    
    clients.forEach(client => {
        if (client.readyState === webSocket.OPEN) {
            try {
                client.send(messageStr);
            } catch (error) {
                console.error('Error sending message to client:', error);
                // Remove dead client
                clients.delete(client);
            }
        } else {
            // Remove dead client
            clients.delete(client);
        }
    });
}

/**
 * 处理文件请求
 * @param {WebSocket} ws WebSocket连接
 * @param {Object} data 请求数据
 */
function handleFileRequest(ws, data) {
    const fileName = data.fileName;
    vscode.workspace.findFiles(fileName, null, 1).then(files => {
        if (files.length > 0) {
            vscode.workspace.openTextDocument(files[0]).then(document => {
                ws.send(JSON.stringify({
                    type: 'fileResponse',
                    data: {
                        fileName: fileName,
                        content: document.getText(),
                        timestamp: new Date().toISOString()
                    }
                }));
            });
        } else {
            ws.send(JSON.stringify({
                type: 'error',
                data: { message: `File not found: ${fileName}` }
            }));
        }
    });
}

/**
 * 处理命令请求
 * @param {WebSocket} ws WebSocket连接
 * @param {Object} data 请求数据
 */
function handleCommandRequest(ws, data) {
    const command = data.command;
    vscode.commands.executeCommand(command).then(result => {
        ws.send(JSON.stringify({
            type: 'commandResponse',
            data: {
                command: command,
                result: result,
                timestamp: new Date().toISOString()
            }
        }));
    }).catch(error => {
        ws.send(JSON.stringify({
            type: 'error',
            data: { message: `Failed to execute command: ${error.message}` }
        }));
    });
}

/**
 * 发送初始状态到客户端
 */
function sendInitialState() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        broadcastToClients({
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

/**
 * 停止WebSocket服务器
 */
function stopServer() {
    if (wss) {
        wss.close(() => {
            console.log('WebSocket server closed');
        });
    }
    clients.clear();
}

/**
 * 获取连接的客户端数量
 * @returns {number} 连接的客户端数量
 */
function getClientCount() {
    return clients.size;
}

/**
 * 检查服务器是否正在运行
 * @returns {boolean} 服务器是否正在运行
 */
function isServerRunning() {
    return wss !== null;
}

module.exports = {
    startServer,
    stopServer,
    broadcastToClients,
    getClientCount,
    isServerRunning,
    sendInitialState,
    setMonitoringState
};