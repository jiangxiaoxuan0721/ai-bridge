const vscode = require('vscode');
const { debounce } = require('./utils');

// 监听状态
let monitoringDisposables = [];
let isMonitoringEnabled = false;

// 引用WebSocket服务器的setMonitoringState函数
let monitoringStateCallback = null;

/**
 * 设置WebSocket服务器的状态更新回调
 * @param {Function} callback 回调函数
 */
function setMonitoringStateCallback(callback) {
    monitoringStateCallback = callback;
}

/**
 * 启用事件监听
 * @param {vscode.ExtensionContext} context 扩展上下文
 * @param {Function} broadcastToAllClients 广播函数
 */
function enableMonitoring(context, broadcastToAllClients) {
    if (isMonitoringEnabled) {
        console.log('Monitoring is already enabled');
        return;
    }

    console.log('Enabling auto monitoring');
    isMonitoringEnabled = true;

    // 设置防抖延迟
    const selectionDebounceDelay = getConfiguration('aiBridge.autoMonitoring.debounceDelay', 300);
    const documentDebounceDelay = getConfiguration('aiBridge.autoMonitoring.debounceDelay', 450);

    // 跟踪之前的选择状态，以区分选择清除和光标移动
    let previousSelection = null;
    
    // 文本选择变化监听
    if (getConfiguration('aiBridge.autoMonitoring.selectionChanges', true)) {
        const selectionChangeDisposable = vscode.window.onDidChangeTextEditorSelection(
            debounce((event) => {
                const editor = event.textEditor;
                
                if (editor.selection.isEmpty) {
                    // 检查之前是否有选择（选择被清除）
                    if (previousSelection && !previousSelection.isEmpty) {
                        // 选择被清除
                        broadcastToAllClients({
                            type: 'selectionCleared',
                            data: {
                                fileName: editor.document.fileName,
                                timestamp: new Date().toISOString()
                            }
                        });
                    } else {
                        // 只是光标移动，发送光标位置变化消息
                        broadcastToAllClients({
                            type: 'cursorPositionChanged',
                            data: {
                                fileName: editor.document.fileName,
                                line: editor.selection.active.line + 1,
                                character: editor.selection.active.character + 1,
                                timestamp: new Date().toISOString()
                            }
                        });
                    }
                } else {
                    // 有新的选择
                    const selectedText = editor.document.getText(editor.selection);
                    broadcastToAllClients({
                        type: 'selectionChanged',
                        data: {
                            text: selectedText,
                            fileName: editor.document.fileName,
                            startLine: editor.selection.start.line + 1,
                            endLine: editor.selection.end.line + 1,
                            startCharacter: editor.selection.start.character + 1,
                            endCharacter: editor.selection.end.character + 1,
                            timestamp: new Date().toISOString()
                        }
                    });
                }
                
                // 更新之前的选择状态
                previousSelection = editor.selection;
            }, selectionDebounceDelay)
        );
        monitoringDisposables.push(selectionChangeDisposable);
    }

    // 活动编辑器变化监听
    if (getConfiguration('aiBridge.autoMonitoring.cursorPosition', true)) {
        const activeEditorChangeDisposable = vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor) {
                broadcastToAllClients({
                    type: 'activeEditorChanged',
                    data: {
                        fileName: editor.document.fileName,
                        languageId: editor.document.languageId,
                        lineCount: editor.document.lineCount,
                        timestamp: new Date().toISOString()
                    }
                });

                // 也发送光标位置
                setTimeout(() => {
                    if (editor === vscode.window.activeTextEditor) {
                        broadcastToAllClients({
                            type: 'cursorPositionChanged',
                            data: {
                                fileName: editor.document.fileName,
                                line: editor.selection.active.line + 1,
                                character: editor.selection.active.character + 1,
                                timestamp: new Date().toISOString()
                            }
                        });
                    }
                }, 100);
            }
        });
        monitoringDisposables.push(activeEditorChangeDisposable);
    }

    // 文档内容变化监听
    if (getConfiguration('aiBridge.autoMonitoring.documentChanges', true)) {
        const documentChangeDisposable = vscode.workspace.onDidChangeTextDocument(
            debounce((event) => {
                const editor = vscode.window.visibleTextEditors.find(
                    e => e.document === event.document
                );
                
                if (editor) {
                    const changes = event.contentChanges.map(change => ({
                        range: {
                            start: {
                                line: change.range.start.line + 1,
                                character: change.range.start.character + 1
                            },
                            end: {
                                line: change.range.end.line + 1,
                                character: change.range.end.character + 1
                            }
                        },
                        text: change.text,
                        rangeLength: change.rangeLength
                    }));
                    
                    broadcastToAllClients({
                        type: 'documentChanged',
                        data: {
                            fileName: event.document.fileName,
                            changes: changes,
                            timestamp: new Date().toISOString()
                        }
                    });
                }
            }, documentDebounceDelay)
        );
        monitoringDisposables.push(documentChangeDisposable);
    }

    // 文件保存监听
    if (getConfiguration('aiBridge.autoMonitoring.fileOperations', true)) {
        const fileSaveDisposable = vscode.workspace.onDidSaveTextDocument((document) => {
            broadcastToAllClients({
                type: 'fileSaved',
                data: {
                    fileName: document.fileName,
                    timestamp: new Date().toISOString()
                }
            });
        });
        monitoringDisposables.push(fileSaveDisposable);
    }

    // 文件打开监听
    if (getConfiguration('aiBridge.autoMonitoring.fileOperations', true)) {
        const fileOpenDisposable = vscode.workspace.onDidOpenTextDocument((document) => {
            broadcastToAllClients({
                type: 'fileOpened',
                data: {
                    fileName: document.fileName,
                    languageId: document.languageId,
                    lineCount: document.lineCount,
                    timestamp: new Date().toISOString()
                }
            });
        });
        monitoringDisposables.push(fileOpenDisposable);
    }

    // 更新WebSocket服务器中的监听状态
    if (monitoringStateCallback) {
        monitoringStateCallback(true);
    }

    // 发送监听已启用状态
    broadcastToAllClients({
        type: 'monitoringStatusChanged',
        data: {
            enabled: true,
            timestamp: new Date().toISOString()
        }
    });
}

/**
 * 禁用事件监听
 * @param {Function} broadcastToAllClients 广播函数
 */
function disableMonitoring(broadcastToAllClients) {
    if (!isMonitoringEnabled) {
        return;
    }

    console.log('Disabling auto monitoring');
    isMonitoringEnabled = false;

    monitoringDisposables.forEach(disposable => {
        if (disposable && disposable.dispose) {
            disposable.dispose();
        }
    });
    monitoringDisposables = [];

    // 更新WebSocket服务器中的监听状态
    if (monitoringStateCallback) {
        monitoringStateCallback(false);
    }

    // 发送监听已禁用状态
    broadcastToAllClients({
        type: 'monitoringStatusChanged',
        data: {
            enabled: false,
            timestamp: new Date().toISOString()
        }
    });
}

/**
 * 切换监听状态
 * @param {vscode.ExtensionContext} context 扩展上下文
 * @param {Function} broadcastToAllClients 广播函数
 */
function toggleMonitoring(context, broadcastToAllClients) {
    if (isMonitoringEnabled) {
        disableMonitoring(broadcastToAllClients);
        vscode.window.showInformationMessage('AI Bridge auto monitoring disabled');
    } else {
        enableMonitoring(context, broadcastToAllClients);
        vscode.window.showInformationMessage('AI Bridge auto monitoring enabled');
    }
}

/**
 * 获取配置值
 * @param {string} key 配置键
 * @param {*} defaultValue 默认值
 * @returns {*} 配置值
 */
function getConfiguration(key, defaultValue) {
    const config = vscode.workspace.getConfiguration('aiBridge');
    return config.get(key, defaultValue);
}

/**
 * 检查监听是否启用
 * @returns {boolean} 监听是否启用
 */
function isMonitoringActive() {
    return isMonitoringEnabled;
}

module.exports = {
    enableMonitoring,
    disableMonitoring,
    toggleMonitoring,
    isMonitoringActive,
    getConfiguration,
    setMonitoringStateCallback
};