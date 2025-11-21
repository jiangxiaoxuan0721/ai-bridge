#!/usr/bin/env node

/**
 * WebSocket 测试客户端
 * 用于测试 AI Bridge 扩展的 WebSocket 功能
 * 注意：此脚本需要在 VS Code 扩展运行时使用
 */

const WebSocket = require('ws');

console.log('AI Bridge WebSocket Test Client');
console.log('================================');

// 连接到 WebSocket 服务器
const ws = new WebSocket('ws://localhost:3011');

ws.on('open', function open() {
    console.log('✓ Connected to WebSocket server');
    
    // 发送测试消息
    setTimeout(() => {
        console.log('Sending ping...');
        ws.send(JSON.stringify({
            type: 'ping',
            data: {
                timestamp: new Date().toISOString()
            }
        }));
    }, 1000);
    
    // 请求文件测试
    setTimeout(() => {
        console.log('Requesting file...');
        ws.send(JSON.stringify({
            type: 'requestFile',
            data: {
                fileName: 'package.json'
            }
        }));
    }, 2000);
    
    // 执行命令测试
    setTimeout(() => {
        console.log('Executing command...');
        ws.send(JSON.stringify({
            type: 'executeCommand',
            data: {
                command: 'workbench.action.showCommands'
            }
        }));
    }, 3000);
    
    // 发送自定义消息
    setTimeout(() => {
        console.log('Sending custom message...');
        ws.send(JSON.stringify({
            type: 'customMessage',
            data: {
                message: 'Hello from test client!',
                timestamp: new Date().toISOString()
            }
        }));
    }, 4000);
});

ws.on('message', function incoming(data) {
    try {
        const message = JSON.parse(data);
        console.log(`\n📨 Received: ${message.type}`);
        
        // 特殊处理不同类型的消息
        if (message.type === 'contextMenuDirectory') {
            console.log('📁 Directory contents:');
            console.log(`   Path: ${message.data.directory.path}`);
            console.log(`   Files count: ${message.data.files.length}`);
            
            // 列出前10个文件
            const maxFiles = 10;
            const filesToShow = message.data.files.slice(0, maxFiles);
            
            filesToShow.forEach(file => {
                const icon = file.isDirectory ? '📁' : '📄';
                const size = file.isDirectory ? '' : ` (${file.size} bytes)`;
                console.log(`   ${icon} ${file.name}${size}`);
            });
            
            if (message.data.files.length > maxFiles) {
                console.log(`   ... and ${message.data.files.length - maxFiles} more files`);
            }
        } else {
            // 对于其他消息类型，完整显示
            console.log(JSON.stringify(message.data, null, 2));
        }
    } catch {
        console.log(`\n📨 Raw message: ${data}`);
    }
});

ws.on('close', function close() {
    console.log('\n✗ Disconnected from WebSocket server');
});

ws.on('error', function error(err) {
    console.error('\n❌ WebSocket error:', err.message);
    
    if (err.code === 'ECONNREFUSED') {
        console.log('\n💡 Make sure:');
        console.log('   1. VS Code is running');
        console.log('   2. AI Bridge extension is installed and activated');
        console.log('   3. WebSocket server started successfully');
    }
});

// 5秒后自动关闭连接
setTimeout(() => {
    console.log('\n🏁 Test completed, closing connection...');
    ws.close();
}, 5000);

console.log('Connecting to ws://localhost:3011...');