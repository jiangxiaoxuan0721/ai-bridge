const vscode = require('vscode');
const { startSingletonServer, stopSingletonServer, broadcastToAllClients, getClientCount, isServerRunning, sendInitialState, setMonitoringState } = require('./websocket-singleton');
const { enableMonitoring, toggleMonitoring, isMonitoringActive, setMonitoringStateCallback } = require('./event-monitoring');
const { registerCommands } = require('./commands');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('AI Bridge extension is now active!');

    // 设置监听状态回调
    setMonitoringStateCallback(setMonitoringState);

    // 启动或连接到单例WebSocket服务器
    startSingletonServer(context).then(success => {
        if (success) {
            // 启用自动监听
            enableMonitoring(context, broadcastToAllClients);
            
            // 发送初始状态到客户端
            setTimeout(() => {
                sendInitialState();
            }, 500);
        } else {
            // 如果启动失败，显示提示，允许用户手动启动
            vscode.window.showInformationMessage(
                'AI Bridge could not start automatically. You can start it manually.',
                'Start Server'
            ).then(selection => {
                if (selection === 'Start Server') {
                    vscode.commands.executeCommand('ai-bridge.startServer');
                }
            });
        }
    });

    // 注册所有命令
    registerCommands(context, broadcastToAllClients);

    // 注册切换监听命令
    const toggleMonitoringCommand = vscode.commands.registerCommand('ai-bridge.toggleAutoMonitoring', function () {
        toggleMonitoring(context, broadcastToAllClients);
    });

    // 注册显示状态命令
    const showBridgeStatusCommand = vscode.commands.registerCommand('ai-bridge.internal.showStatus', function () {
        const status = `AI Bridge Status:
        
WebSocket Server: ${isServerRunning() ? 'Running (Singleton)' : 'Stopped'}
Port: 3011
Connected Clients: ${getClientCount()}
Auto Monitoring: ${isMonitoringActive() ? 'Enabled' : 'Disabled'}

Active Editor: ${vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.fileName : 'None'}`;
        
        vscode.window.showInformationMessage(status, { modal: true });
    });

    // 将新命令添加到上下文中
    context.subscriptions.push(toggleMonitoringCommand, showBridgeStatusCommand);
}

// this method is called when your extension is deactivated
function deactivate() {
    // 标记为手动停止，避免自动重启
    stopSingletonServer(true, null);
}

module.exports = {
    activate,
    deactivate
};