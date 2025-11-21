/**
 * UI管理模块
 */
class UIManager {
    constructor() {
        this.messagesContainer = document.getElementById('messages');
        this.connectionStatus = document.getElementById('connection-status');
        this.reconnectCount = document.getElementById('reconnect-count');
        this.statusIndicators = {
            selectionChanges: document.getElementById('selection-status'),
            cursorPosition: document.getElementById('cursor-status'),
            documentChanges: document.getElementById('document-status'),
            fileOperations: document.getElementById('file-status')
        };
    }

    /**
     * 更新连接状态
     * @param {string} status 连接状态
     * @param {number} reconnectCount 重连次数
     */
    updateConnectionStatus(status, reconnectCount = 0) {
        this.connectionStatus.textContent = status;
        this.reconnectCount.textContent = reconnectCount > 0 ? ` (${reconnectCount})` : '';
        
        // 更新状态颜色
        this.connectionStatus.className = 'connection-status';
        
        if (status === 'Connected') {
            this.connectionStatus.classList.add('connected');
        } else if (status === 'Connecting...') {
            this.connectionStatus.classList.add('connecting');
        } else {
            this.connectionStatus.classList.add('disconnected');
        }
    }

    /**
     * 更新状态指示器
     * @param {string} indicator 状态指示器名称
     * @param {boolean} active 是否激活
     */
    updateStatusIndicator(indicator, active) {
        if (this.statusIndicators[indicator]) {
            const statusElement = this.statusIndicators[indicator];
            
            if (active) {
                statusElement.textContent = '✅';
                statusElement.classList.add('active');
                statusElement.classList.remove('inactive');
                
                // 2秒后恢复为暂停状态
                setTimeout(() => {
                    if (this.statusIndicators[indicator]) {
                        statusElement.textContent = '⏸️';
                        statusElement.classList.remove('active');
                        statusElement.classList.add('inactive');
                    }
                }, 2000);
            } else {
                statusElement.textContent = '⏸️';
                statusElement.classList.add('inactive');
                statusElement.classList.remove('active');
            }
        }
    }

    /**
     * 更新监听状态
     * @param {Object} status 监听状态对象
     */
    updateMonitoringStatus(status) {
        // 对于临时状态，不需要特殊处理
        // 使用表情符号和动画效果
        
        // 更新各个状态指示器
        this.updateStatusIndicator('selectionChanges', status.selectionChanges);
        this.updateStatusIndicator('cursorPosition', status.cursorPosition);
        this.updateStatusIndicator('documentChanges', status.documentChanges);
        this.updateStatusIndicator('fileOperations', status.fileOperations);
    }

    /**
     * 显示消息
     * @param {Object} message 消息对象
     */
    showMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        
        // 确保data对象存在
        const data = message.data || {};
        const messageContent = this.formatMessageContent(message.type, data);
        
        messageElement.innerHTML = `
            <div class="message-header">
                <div class="message-type">${message.type}</div>
                <div class="message-timestamp">${new Date().toLocaleTimeString()}</div>
            </div>
            <div class="message-content">${messageContent}</div>
        `;
        
        this.messagesContainer.appendChild(messageElement);
        
        // 滚动到最新消息
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        
        // 更新监控状态和当前状态
        this.updateMonitoringStatusByType(message.type);
        this.updateCurrentState(message.type, data);
    }

    /**
     * 格式化消息内容
     * @param {string} type 消息类型
     * @param {Object} data 消息数据
     * @returns {string} 格式化后的HTML
     */
    formatMessageContent(type, data) {
        switch (type) {
            case 'welcome':
            case 'initialState':
            case 'current_editor_state':
                return `
                    <strong>🔌 Connected to AI Bridge</strong><br>
                    <strong>Message:</strong> ${data.message || 'Connected'}<br>
                    ${data.fileName ? `<strong>File:</strong> ${data.fileName}<br>` : ''}
                    ${data.languageId ? `<strong>Language:</strong> ${data.languageId}<br>` : ''}
                    ${data.cursorPosition ? `<strong>Cursor:</strong> Line ${data.cursorPosition.line}:${data.cursorPosition.character}<br>` : ''}
                    ${data.line ? `<strong>Line:</strong> ${data.line}<br>` : ''}
                    ${data.character ? `<strong>Character:</strong> ${data.character}<br>` : ''}
                    ${data.monitoringEnabled !== undefined ? `<strong>Monitoring:</strong> ${data.monitoringEnabled ? 'Enabled ✅' : 'Disabled ❌'}<br>` : ''}
                    ${data.clientId ? `<strong>Clients:</strong> ${data.clientId}` : ''}
                `;
                
            case 'selectedText':
                return `
                    <strong>📝 Selected Text</strong><br>
                    <strong>File:</strong> ${data.fileName}<br>
                    <strong>Content:</strong> <pre>${this.escapeHtml(data.text)}</pre>
                `;
                
            case 'fileContent':
                return `
                    <strong>📄 File Content</strong><br>
                    <strong>File:</strong> ${data.fileName}<br>
                    <strong>Lines:</strong> ${data.lineCount || data.content.split('\n').length}<br>
                    <strong>Content:</strong> <pre>${this.escapeHtml(data.content.substring(0, 500))}${data.content.length > 500 ? '...' : ''}</pre>
                `;
                
            case 'customMessage':
                return `
                    <strong>💬 Custom Message</strong><br>
                    <strong>Message:</strong> ${this.escapeHtml(data.message)}
                `;
                
            case 'contextMenuSelection':
                return `
                    <strong>🎯 Context Menu Selection</strong><br>
                    <strong>File:</strong> ${data.fileName}<br>
                    <strong>Lines:</strong> ${data.startLine} - ${data.endLine}<br>
                    <strong>Content:</strong> <pre>${this.escapeHtml(data.text)}</pre>
                `;
                
            case 'contextMenuFile':
                return `
                    <strong>📄 Full File from Context Menu</strong><br>
                    <strong>File:</strong> ${data.fileName}<br>
                    <strong>Language:</strong> ${data.languageId}<br>
                    <strong>Lines:</strong> ${data.lineCount}<br>
                    <strong>Content Length:</strong> ${data.content.length} characters
                `;
                
            case 'contextMenuDirectory':
                return `
                    <strong>📁 Directory from Context Menu</strong><br>
                    <strong>Directory:</strong> ${data.directory.path}<br>
                    <strong>Files Count:</strong> ${data.files.length}<br>
                    <strong>Files:</strong> ${data.files.map(f => 
                        f.isDirectory ? `📁 ${f.name}/` : `📄 ${f.name}`
                    ).join(', ')}
                `;
                
            case 'selectionChanged':
                return `
                    <strong>🖱️ Selection Changed</strong><br>
                    <strong>File:</strong> ${data.fileName}<br>
                    <strong>Lines:</strong> ${data.startLine} - ${data.endLine}<br>
                    <strong>Position:</strong> (${data.startLine}, ${data.startCharacter}) - (${data.endLine}, ${data.endCharacter})<br>
                    <strong>Content:</strong> <pre>${this.escapeHtml(data.text.substring(0, 200))}${data.text.length > 200 ? '...' : ''}</pre>
                `;
                
            case 'selectionCleared':
                return `
                    <strong>❌ Selection Cleared</strong><br>
                    <strong>File:</strong> ${data.fileName}
                `;
                
            case 'activeEditorChanged':
                return `
                    <strong>📝 Active Editor Changed</strong><br>
                    <strong>File:</strong> ${data.fileName}<br>
                    <strong>Language:</strong> ${data.languageId}<br>
                    <strong>Lines:</strong> ${data.lineCount}
                `;
                
            case 'documentChanged':
                return `
                    <strong>✏️ Document Changed</strong><br>
                    <strong>File:</strong> ${data.fileName}<br>
                    <strong>Changes:</strong> ${data.changes.length} change(s)<br>
                    <strong>Details:</strong> <pre>${JSON.stringify(data.changes, null, 2)}</pre>
                `;
                
            case 'cursorPositionChanged':
                return `
                    <strong>📍 Cursor Position Changed</strong><br>
                    <strong>File:</strong> ${data.fileName}<br>
                    <strong>Line:</strong> ${data.line}<br>
                    <strong>Character:</strong> ${data.character}
                `;
                
            case 'fileSaved':
                return `
                    <strong>💾 File Saved</strong><br>
                    <strong>File:</strong> ${data.fileName}
                `;
                
            case 'fileOpened':
                return `
                    <strong>📂 File Opened</strong><br>
                    <strong>File:</strong> ${data.fileName}<br>
                    <strong>Language:</strong> ${data.languageId}<br>
                    <strong>Lines:</strong> ${data.lineCount}
                `;
                
            case 'fileResponse':
                return `
                    <strong>📄 File Response</strong><br>
                    <strong>File:</strong> ${data.fileName}<br>
                    <strong>Content:</strong> <pre>${this.escapeHtml(data.content.substring(0, 500))}${data.content.length > 500 ? '...' : ''}</pre>
                `;
                
            case 'commandResponse':
                return `
                    <strong>⚡ Command Response</strong><br>
                    <strong>Command:</strong> ${data.command}<br>
                    <strong>Result:</strong> <pre>${JSON.stringify(data.result, null, 2)}</pre>
                `;
                
            case 'monitoringStatusChanged':
                return `
                    <strong>Monitoring Status:</strong> ${data.enabled ? 'Enabled ✅' : 'Disabled ❌'}
                `;
                
            case 'initialState':
                return `
                    <strong>🏠 Initial State</strong><br>
                    <strong>File:</strong> ${data.fileName}<br>
                    <strong>Language:</strong> ${data.languageId}<br>
                    <strong>Lines:</strong> ${data.lineCount}<br>
                    <strong>Cursor:</strong> Line ${data.cursorPosition.line}, Char ${data.cursorPosition.character}<br>
                    <strong>Selection:</strong> ${data.hasSelection ? 'Yes' : 'No'}<br>
                    <strong>Monitoring:</strong> ${data.monitoringEnabled ? 'Enabled' : 'Disabled'}
                `;
                
            case 'error':
                return `
                    <strong>❌ Error</strong><br>
                    <strong>Message:</strong> ${this.escapeHtml(data.message)}
                `;
                
            case 'raw':
                return `
                    <strong>📨 Raw Message</strong><br>
                    <pre>${this.escapeHtml(data)}</pre>
                `;
                
            default:
                return `<pre>${this.escapeHtml(JSON.stringify(data, null, 2))}</pre>`;
        }
    }

    /**
     * 转义HTML字符
     * @param {string} text 要转义的文本
     * @returns {string} 转义后的文本
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 清空消息
     */
    clearMessages() {
        this.messagesContainer.innerHTML = '';
    }

    /**
     * 根据消息类型更新监控状态
     * @param {string} type 消息类型
     */
    updateMonitoringStatusByType(type) {
        const statusMap = {
            'selectionChanged': { indicator: 'selectionChanges', emoji: '✅' },
            'selectionCleared': { indicator: 'selectionChanges', emoji: '⏸️' },
            'cursorPositionChanged': { indicator: 'cursorPosition', emoji: '✅' },
            'documentChanged': { indicator: 'documentChanges', emoji: '✅' },
            'fileSaved': { indicator: 'fileOperations', emoji: '💾' },
            'fileOpened': { indicator: 'fileOperations', emoji: '📂' },
            'activeEditorChanged': { indicator: 'fileOperations', emoji: '📄' }
        };
        
        const status = statusMap[type];
        if (status) {
            const statusElement = this.statusIndicators[status.indicator];
            if (statusElement) {
                statusElement.textContent = status.emoji;
                statusElement.classList.add('active');
                
                // 2秒后恢复为暂停状态
                setTimeout(() => {
                    if (this.statusIndicators[status.indicator]) {
                        statusElement.textContent = '⏸️';
                        statusElement.classList.remove('active');
                    }
                }, 2000);
            }
        }
    }

    /**
     * 更新当前编辑器状态
     * @param {string} type 消息类型
     * @param {Object} data 消息数据
     */
    updateCurrentState(type, data) {
        const currentFile = document.getElementById('currentFile');
        const currentLanguage = document.getElementById('currentLanguage');
        const currentCursor = document.getElementById('currentCursor');
        const currentSelection = document.getElementById('currentSelection');
        
        if (!currentFile || !currentLanguage || !currentCursor || !currentSelection) {
            return;
        }
        
        switch (type) {
            case 'initialState':
            case 'current_editor_state':
            case 'activeEditorChanged':
                if (data.fileName) {
                    const fileName = data.fileName.split(/[/\\]/).pop();
                    currentFile.textContent = fileName;
                }
                if (data.languageId) {
                    currentLanguage.textContent = data.languageId;
                }
                if (data.cursorPosition) {
                    currentCursor.textContent = `${data.cursorPosition.line}:${data.cursorPosition.character}`;
                } else if (data.line && data.character) {
                    currentCursor.textContent = `${data.line}:${data.character}`;
                }
                if (data.hasSelection !== undefined) {
                    currentSelection.textContent = data.hasSelection ? 'Active' : 'None';
                }
                break;
            case 'cursorPositionChanged':
                currentCursor.textContent = `${data.line}:${data.character}`;
                break;
            case 'selectionChanged':
                currentSelection.textContent = `${data.text.length} chars`;
                break;
            case 'selectionCleared':
                currentSelection.textContent = 'None';
                break;
        }
    }

    /**
     * 显示通知
     * @param {string} message 通知消息
     * @param {string} type 通知类型 (info, success, error)
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 自动移除
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
} else {
    window.UIManager = UIManager;
}