const vscode = require('vscode');
const { getLanguageId, readDirectory, readFileContent } = require('./utils');

/**
 * 注册所有命令
 * @param {vscode.ExtensionContext} context 扩展上下文
 * @param {Function} broadcastToAllClients 广播函数
 */
function registerCommands(context, broadcastToAllClients) {
    // 获取选中文本命令
    const getSelectedTextCommand = vscode.commands.registerCommand('ai-bridge.getSelectedText', function () {
        const editor = vscode.window.activeTextEditor;
        if (editor.selection.isEmpty) {
            vscode.window.showInformationMessage('Please select some text to use this command.');
            return;
        }
        const text = editor.document.getText(editor.selection);
        console.log('Selected text:', text);
        vscode.window.showInformationMessage(text);
        
        broadcastToAllClients({
            type: 'selectedText',
            data: {
                text: text,
                fileName: editor.document.fileName,
                timestamp: new Date().toISOString()
            }
        });
    });

    // 获取文件内容命令
    const getFileContentCommand = vscode.commands.registerCommand('ai-bridge.getFileContent', function () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }
        
        const content = editor.document.getText();
        const fileName = editor.document.fileName;
        
        broadcastToAllClients({
            type: 'fileContent',
            data: {
                fileName: fileName,
                content: content,
                timestamp: new Date().toISOString()
            }
        });
        
        vscode.window.showInformationMessage(`File content sent: ${fileName}`);
    });

    // 发送自定义消息命令
    const sendMessageCommand = vscode.commands.registerCommand('ai-bridge.sendMessage', function () {
        vscode.window.showInputBox({
            prompt: 'Enter message to send to WebSocket clients'
        }).then(message => {
            if (message) {
                broadcastToAllClients({
                    type: 'customMessage',
                    data: {
                        message: message,
                        timestamp: new Date().toISOString()
                    }
                });
                vscode.window.showInformationMessage('Message sent to clients');
            }
        });
    });

    // 发送选中文本到AI桥命令
    const sendSelectionToBridgeCommand = vscode.commands.registerCommand('ai-bridge.sendSelectionToBridge', function () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor');
            return;
        }
        
        if (editor.selection.isEmpty) {
            vscode.window.showWarningMessage('No text selected');
            return;
        }
        
        const text = editor.document.getText(editor.selection);
        broadcastToAllClients({
            type: 'contextMenuSelection',
            data: {
                text: text,
                fileName: editor.document.fileName,
                startLine: editor.selection.start.line + 1,
                endLine: editor.selection.end.line + 1,
                timestamp: new Date().toISOString()
            }
        });
        
        vscode.window.showInformationMessage('Selection sent to AI Bridge');
    });

    // 发送文件到AI桥命令（支持右键菜单）
    const sendFileToBridgeCommand = vscode.commands.registerCommand('ai-bridge.sendFileToBridge', function (uri) {
        // 如果通过右键菜单调用，uri会是选中的文件/文件夹URI
        // 如果通过命令面板调用，uri可能是undefined，这时使用当前活动编辑器
        if (!uri) {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('No active editor and no file selected');
                return;
            }
            
            const content = editor.document.getText();
            broadcastToAllClients({
                type: 'contextMenuFile',
                data: {
                    fileName: editor.document.fileName,
                    content: content,
                    languageId: editor.document.languageId,
                    lineCount: editor.document.lineCount,
                    timestamp: new Date().toISOString()
                }
            });
            
            vscode.window.showInformationMessage(`File sent to AI Bridge: ${editor.document.fileName}`);
            return;
        }
        
        // 处理通过右键菜单选中的文件或文件夹
        const path = require('path');
        
        // 检查是否是文件夹
        if (require('fs').statSync(uri.fsPath).isDirectory()) {
            // 如果是文件夹，发送文件夹信息和内容列表
            const directoryInfo = {
                name: path.basename(uri.fsPath),
                path: uri.fsPath,
                timestamp: new Date().toISOString()
            };
            
            try {
                // 读取文件夹内容
                const files = readDirectory(uri.fsPath);
                
                // 发送文件夹信息
                broadcastToAllClients({
                    type: 'contextMenuDirectory',
                    data: {
                        directory: directoryInfo,
                        files: files,
                        timestamp: new Date().toISOString()
                    }
                });
                
                vscode.window.showInformationMessage(`Directory sent to AI Bridge: ${uri.fsPath}`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to read directory: ${error.message}`);
            }
        } else {
            // 如果是文件，读取并发送文件内容
            try {
                const content = readFileContent(uri.fsPath);
                const languageId = getLanguageId(path.extname(uri.fsPath));
                
                broadcastToAllClients({
                    type: 'contextMenuFile',
                    data: {
                        fileName: uri.fsPath,
                        content: content,
                        languageId: languageId,
                        lineCount: content.split('\n').length,
                        timestamp: new Date().toISOString()
                    }
                });
                
                vscode.window.showInformationMessage(`File sent to AI Bridge: ${uri.fsPath}`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to read file: ${error.message}`);
            }
        }
    });

    // 显示桥状态命令
    const showBridgeStatusCommand = vscode.commands.registerCommand('ai-bridge.showBridgeStatus', function () {
        // 注意：这个函数需要访问wss和clients，我们将在主文件中传递这些参数
        // 这里只是定义命令，具体实现将在主文件中处理
        vscode.commands.executeCommand('ai-bridge.internal.showStatus');
    });

    // 将所有命令添加到上下文中
    context.subscriptions.push(
        getSelectedTextCommand,
        getFileContentCommand,
        sendMessageCommand,
        sendSelectionToBridgeCommand,
        sendFileToBridgeCommand,
        showBridgeStatusCommand
    );
}

module.exports = {
    registerCommands
};