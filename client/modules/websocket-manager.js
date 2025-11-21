/**
 * WebSocket连接管理模块
 */
class WebSocketManager {
    constructor(url, onConnect, onDisconnect, onMessage, onError) {
        this.url = url;
        this.ws = null;
        this.onConnect = onConnect;
        this.onDisconnect = onDisconnect;
        this.onMessage = onMessage;
        this.onError = onError;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // 1秒
        this.heartbeatInterval = null;
    }

    /**
     * 连接到WebSocket服务器
     */
    connect() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('Already connected');
            return;
        }

        console.log(`Connecting to ${this.url}...`);
        
        try {
            this.ws = new WebSocket(this.url);
            this.setupEventHandlers();
        } catch (error) {
            console.error('Error creating WebSocket connection:', error);
            if (this.onError) {
                this.onError(error);
            }
        }
    }

    /**
     * 设置WebSocket事件处理器
     */
    setupEventHandlers() {
        this.ws.onopen = () => {
            console.log('Connected to WebSocket server');
            this.reconnectAttempts = 0;
            
            if (this.onConnect) {
                this.onConnect();
            }
            
            // 启动心跳检测
            this.startHeartbeat();
        };

        this.ws.onmessage = (event) => {
            try {
                console.log('Raw message received:', event.data);
                let message = JSON.parse(event.data);
                console.log('Parsed message:', message);
                
                // 处理pong消息
                if (message.type === 'pong') {
                    return; // 不需要将pong消息传递给UI
                }
                
                // 确保消息有正确的结构
                if (!message.data && message.content) {
                    // 处理旧格式的消息
                    message = {
                        type: message.type,
                        data: message.content
                    };
                }
                
                // 确保消息有data属性
                if (!message.data) {
                    console.warn('Message missing data property:', message);
                    // 尝试修复消息格式
                    if (message.type) {
                        message.data = {};
                    } else {
                        // 如果没有type属性，创建一个raw消息
                        this.onMessage({ 
                            type: 'raw', 
                            data: { content: event.data }
                        });
                        return;
                    }
                }
                
                console.log('Final message to be sent to handlers:', message);
                
                if (this.onMessage) {
                    this.onMessage(message);
                }
            } catch (error) {
                console.error('Error parsing message:', error);
                console.error('Raw message data:', event.data);
                // 显示原始消息
                if (this.onMessage) {
                    this.onMessage({ 
                        type: 'raw', 
                        data: { content: event.data }
                    });
                }
            }
        };

        this.ws.onclose = (event) => {
            console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
            
            // 停止心跳
            this.stopHeartbeat();
            
            if (this.onDisconnect) {
                this.onDisconnect(event.code, event.reason);
            }
            
            // 自动重连
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                
                setTimeout(() => {
                    this.connect();
                }, this.reconnectDelay * this.reconnectAttempts);
            }
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            
            if (this.onError) {
                this.onError(error);
            }
        };
    }

    /**
     * 启动心跳检测
     */
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.sendMessage({
                    type: 'ping',
                    data: { 
                        timestamp: new Date().toISOString() 
                    }
                });
            }
        }, 30000); // 每30秒发送一次心跳
    }

    /**
     * 停止心跳检测
     */
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * 发送消息
     * @param {Object} message 要发送的消息对象
     */
    sendMessage(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const messageStr = JSON.stringify(message);
            this.ws.send(messageStr);
            console.log('Sent message:', message.type);
            return true;
        } else {
            console.error('WebSocket is not connected');
            return false;
        }
    }

    /**
     * 请求文件内容
     * @param {string} fileName 文件名
     */
    requestFile(fileName) {
        this.sendMessage({
            type: 'requestFile',
            data: { fileName }
        });
    }

    /**
     * 执行VS Code命令
     * @param {string} command 命令名称
     */
    executeCommand(command) {
        this.sendMessage({
            type: 'executeCommand',
            data: { command }
        });
    }

    /**
     * 发送自定义消息
     * @param {string} message 自定义消息内容
     */
    sendCustomMessage(message) {
        this.sendMessage({
            type: 'customMessage',
            data: { 
                message,
                timestamp: new Date().toISOString()
            }
        });
    }

    /**
     * 断开连接
     */
    disconnect() {
        this.reconnectAttempts = this.maxReconnectAttempts; // 防止自动重连
        this.stopHeartbeat();
        
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    /**
     * 获取连接状态
     * @returns {number} WebSocket状态
     */
    getReadyState() {
        return this.ws ? this.ws.readyState : WebSocket.CLOSED;
    }

    /**
     * 获取状态描述
     * @returns {string} 状态描述
     */
    getStateDescription() {
        const state = this.getReadyState();
        
        switch (state) {
            case WebSocket.CONNECTING:
                return 'Connecting...';
            case WebSocket.OPEN:
                return 'Connected';
            case WebSocket.CLOSING:
                return 'Disconnecting...';
            case WebSocket.CLOSED:
                return 'Disconnected';
            default:
                return 'Unknown';
        }
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebSocketManager;
} else {
    window.WebSocketManager = WebSocketManager;
}