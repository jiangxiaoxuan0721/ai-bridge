/**
 * 主应用程序模块
 */
class App {
    constructor() {
        this.wsManager = null;
        this.uiManager = null;
        this.eventHandlers = null;
        this.initialized = false;
    }

    /**
     * 初始化应用程序
     */
    async init() {
        if (this.initialized) {
            console.log('App already initialized');
            return;
        }

        try {
            // 检查WebSocket支持
            if (!window.WebSocket) {
                throw new Error('WebSocket is not supported in your browser');
            }

            // 初始化UI管理器
            this.uiManager = new UIManager();

            // 初始化WebSocket管理器
            this.wsManager = new WebSocketManager(
                'ws://192.168.130.30:3011',
                this.onConnect.bind(this),
                this.onDisconnect.bind(this),
                this.onMessage.bind(this),
                this.onError.bind(this)
            );

            // 初始化事件处理器
            this.eventHandlers = new EventHandlers(this.wsManager, this.uiManager);
            this.eventHandlers.init();
            this.eventHandlers.bindAllEvents();

            // 初始UI状态
            this.uiManager.updateConnectionStatus('Disconnected');
            this.uiManager.showNotification('Application initialized', 'success');

            // 自动连接
            this.wsManager.connect();

            this.initialized = true;
            console.log('App initialized successfully');
        } catch (error) {
            console.error('Error initializing app:', error);
            this.uiManager.showNotification(`Initialization error: ${error.message}`, 'error');
        }
    }

    /**
     * 连接成功事件处理器
     */
    onConnect() {
        console.log('Connected to server');
        this.uiManager.updateConnectionStatus('Connected');
        this.uiManager.showNotification('Connected to server', 'success');
    }

    /**
     * 连接断开事件处理器
     */
    onDisconnect(code, reason) {
        console.log(`Disconnected from server: ${code} - ${reason}`);
        this.uiManager.updateConnectionStatus('Disconnected', this.wsManager.reconnectAttempts);
        this.uiManager.showNotification(`Disconnected: ${code} - ${reason}`, 'info');
    }

    /**
     * 消息接收事件处理器
     */
    onMessage(message) {
        console.log('Received message:', message.type);
        // 确保消息格式正确
        if (!message.type) {
            message = {
                type: 'raw',
                data: message
            };
        }
        
        // 确保所有消息都有数据对象
        if (!message.data) {
            message.data = message;
        }
        
        // UI管理器已经在EventHandlers中处理
        this.uiManager.showMessage(message);
    }

    /**
     * 错误事件处理器
     */
    onError(error) {
        console.error('Connection error:', error);
        this.uiManager.updateConnectionStatus('Error');
        this.uiManager.showNotification(`Connection error: ${error.message}`, 'error');
    }

    /**
     * 销毁应用程序
     */
    destroy() {
        if (!this.initialized) {
            return;
        }

        // 断开WebSocket连接
        if (this.wsManager) {
            this.wsManager.disconnect();
        }

        // 清理资源
        this.wsManager = null;
        this.uiManager = null;
        this.eventHandlers = null;

        this.initialized = false;
        console.log('App destroyed');
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
} else {
    window.App = App;
}