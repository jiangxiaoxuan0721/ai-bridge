/**
 * 事件处理器模块
 */
class EventHandlers {
    constructor(webSocketManager, uiManager) {
        this.wsManager = webSocketManager;
        this.uiManager = uiManager;
        this.monitoringStatus = {
            selectionChanges: false,
            cursorPosition: false,
            documentChanges: false,
            fileOperations: false,
            autoMonitoring: false
        };
    }

    /**
     * 初始化事件处理器
     */
    init() {
        // 连接成功事件
        this.wsManager.onConnect = () => {
            this.uiManager.updateConnectionStatus('Connected');
            this.uiManager.showMessage({ type: 'system', data: { message: 'Connected to server' } });
            
            // 更新连接按钮状态
            const connectBtn = document.getElementById('connect-btn');
            if (connectBtn) {
                connectBtn.textContent = 'Connected';
                connectBtn.disabled = true;
            }
        };

        // 连接断开事件
        this.wsManager.onDisconnect = (code, reason) => {
            this.uiManager.updateConnectionStatus('Disconnected', this.wsManager.reconnectAttempts);
            this.uiManager.showMessage({ 
                type: 'system', 
                data: { message: `Disconnected: ${code} - ${reason}` } 
            });
            
            // 更新连接按钮状态
            const connectBtn = document.getElementById('connect-btn');
            if (connectBtn) {
                connectBtn.textContent = 'Connect';
                connectBtn.disabled = false;
            }
            
            // 重置监控状态
            this.resetMonitoringStatus();
        };

        // 错误事件
        this.wsManager.onError = (error) => {
            this.uiManager.showNotification(`Connection error: ${error.message}`, 'error');
            this.uiManager.updateConnectionStatus('Error');
            
            // 更新连接按钮状态
            const connectBtn = document.getElementById('connect-btn');
            if (connectBtn) {
                connectBtn.textContent = 'Connect';
                connectBtn.disabled = false;
            }
        };

        // 消息接收事件
        this.wsManager.onMessage = (message) => {
            // 确保消息格式正确
            if (!message.type) {
                message = {
                    type: 'raw',
                    data: message
                };
            }
            
            this.uiManager.showMessage(message);
            this.handleSpecialMessages(message);
        };
    }

    /**
     * 处理特殊消息类型
     * @param {Object} message 消息对象
     */
    handleSpecialMessages(message) {
        switch (message.type) {
            case 'welcome':
                this.monitoringStatus.autoMonitoring = message.data.monitoringEnabled;
                break;
                
            case 'selectionChanged':
                this.monitoringStatus.selectionChanges = true;
                break;
                
            case 'cursorPositionChanged':
                this.monitoringStatus.cursorPosition = true;
                break;
                
            case 'documentChanged':
                this.monitoringStatus.documentChanges = true;
                break;
                
            case 'fileSaved':
            case 'fileOpened':
                this.monitoringStatus.fileOperations = true;
                break;
                
            case 'monitoringStatusChanged':
                this.monitoringStatus.autoMonitoring = message.data.enabled;
                break;
                
            case 'initialState':
                this.monitoringStatus.autoMonitoring = message.data.monitoringEnabled;
                break;
        }
        
        // 更新UI中的监控状态
        this.uiManager.updateMonitoringStatus(this.monitoringStatus);
    }

    /**
     * 重置监控状态
     */
    resetMonitoringStatus() {
        this.monitoringStatus = {
            selectionChanges: false,
            cursorPosition: false,
            documentChanges: false,
            fileOperations: false,
            autoMonitoring: false
        };
        
        this.uiManager.updateMonitoringStatus(this.monitoringStatus);
    }

    /**
     * 绑定按钮事件
     */
    bindButtonEvents() {
        // 连接按钮
        const connectBtn = document.getElementById('connect-btn');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => {
                if (this.wsManager.getReadyState() === WebSocket.OPEN) {
                    this.wsManager.disconnect();
                } else {
                    this.wsManager.connect();
                }
            });
        }

        // 请求文件按钮
        const requestFileBtn = document.getElementById('request-file-btn');
        if (requestFileBtn) {
            requestFileBtn.addEventListener('click', () => {
                const fileName = document.getElementById('file-name').value;
                if (fileName) {
                    this.wsManager.requestFile(fileName);
                } else {
                    this.uiManager.showNotification('Please enter a file name', 'error');
                }
            });
        }

        // 执行命令按钮
        const executeCommandBtn = document.getElementById('execute-command-btn');
        if (executeCommandBtn) {
            executeCommandBtn.addEventListener('click', () => {
                const command = document.getElementById('command-input').value;
                if (command) {
                    this.wsManager.executeCommand(command);
                } else {
                    this.uiManager.showNotification('Please enter a command', 'error');
                }
            });
        }

        // 发送自定义消息按钮
        const sendCustomBtn = document.getElementById('send-custom-btn');
        if (sendCustomBtn) {
            sendCustomBtn.addEventListener('click', () => {
                const customMessage = document.getElementById('custom-message').value;
                if (customMessage) {
                    this.wsManager.sendCustomMessage(customMessage);
                } else {
                    this.uiManager.showNotification('Please enter a message', 'error');
                }
            });
        }

        // 清空消息按钮
        const clearMessagesBtn = document.getElementById('clear-messages-btn');
        if (clearMessagesBtn) {
            clearMessagesBtn.addEventListener('click', () => {
                this.uiManager.clearMessages();
                this.uiManager.showNotification('Messages cleared', 'info');
            });
        }
    }

    /**
     * 绑定键盘事件
     */
    bindKeyboardEvents() {
        // Enter键发送命令
        const commandInput = document.getElementById('command-input');
        if (commandInput) {
            commandInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    document.getElementById('execute-command-btn').click();
                }
            });
        }

        // Enter键发送自定义消息
        const customMessageInput = document.getElementById('custom-message');
        if (customMessageInput) {
            customMessageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    document.getElementById('send-custom-btn').click();
                }
            });
        }
    }

    /**
     * 绑定所有事件
     */
    bindAllEvents() {
        this.bindButtonEvents();
        this.bindKeyboardEvents();
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventHandlers;
} else {
    window.EventHandlers = EventHandlers;
}