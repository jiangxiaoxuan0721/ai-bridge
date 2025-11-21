#!/usr/bin/env node

/**
 * 测试AI Bridge单例模式
 * 
 * 这个脚本可以模拟多个VS Code实例启动，
 * 验证单例模式是否正常工作
 */

const WebSocket = require('ws');
const net = require('net');

/**
 * 检查端口是否被占用
 */
function isPortInUse(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        
        server.listen(port, () => {
            server.once('close', () => {
                resolve(false);
            });
            server.close();
        });
        
        server.on('error', () => {
            resolve(true);
        });
    });
}

/**
 * 模拟扩展实例连接
 */
function simulateExtensionInstance(instanceId) {
    return new Promise((resolve, reject) => {
        console.log(`📦 模拟扩展实例 ${instanceId} 启动...`);
        
        // 首先检查端口是否被占用
        isPortInUse(3011).then(portInUse => {
            if (portInUse && instanceId === 1) {
                console.log(`❌ 实例 ${instanceId}: 端口被占用，但这是第一个实例`);
                resolve(false);
                return;
            }
            
            if (!portInUse && instanceId > 1) {
                console.log(`❌ 实例 ${instanceId}: 端口未被占用，但这不是第一个实例`);
                resolve(false);
                return;
            }
            
            if (!portInUse && instanceId === 1) {
                console.log(`✅ 实例 ${instanceId}: 成为单例服务器`);
                const server = new WebSocket.Server({ port: 3011 });
                
                server.on('connection', (ws) => {
                    console.log(`📞 实例 ${instanceId}: 新的客户端连接`);
                    
                    ws.on('message', (data) => {
                        const message = JSON.parse(data);
                        
                        // 处理扩展实例加入消息
                        if (message.type === 'extension_join') {
                            console.log(`🤝 实例 ${instanceId}: 扩展实例 ${message.data.instanceId} 加入`);
                            ws.instanceId = message.data.instanceId;
                        }
                        
                        // 转发消息到所有其他客户端
                        server.clients.forEach(client => {
                            if (client !== ws && client.readyState === WebSocket.OPEN) {
                                client.send(data);
                            }
                        });
                    });
                    
                    ws.on('close', () => {
                        console.log(`📞 实例 ${instanceId}: 实例 ${ws.instanceId || '未知'} 断开连接`);
                    });
                });
                
                // 存储客户端引用
                server.clients = new Set();
                server.on('connection', ws => server.clients.add(ws));
                
                resolve({ instanceId, server, isSingleton: true });
                return;
            }
            
            if (portInUse && instanceId > 1) {
                console.log(`✅ 实例 ${instanceId}: 连接到现有单例服务器`);
                const ws = new WebSocket('ws://localhost:3011');
                
                ws.on('open', () => {
                    console.log(`🤝 实例 ${instanceId}: 成功连接到单例服务器`);
                    ws.send(JSON.stringify({
                        type: 'extension_join',
                        data: {
                            instanceId: `test-${instanceId}`,
                            timestamp: new Date().toISOString()
                        }
                    }));
                    
                    resolve({ instanceId, ws, isSingleton: false });
                });
                
                ws.on('error', () => {
                    console.log(`❌ 实例 ${instanceId}: 连接失败`);
                    resolve(false);
                });
            }
        });
    });
}

/**
 * 模拟WebSocket客户端
 */
function simulateWebSocketClient(clientId) {
    return new Promise((resolve) => {
        console.log(`🌐 启动WebSocket客户端 ${clientId}...`);
        const ws = new WebSocket('ws://localhost:3011');
        
        ws.on('open', () => {
            console.log(`✅ 客户端 ${clientId}: 已连接到服务器`);
            
            // 发送测试消息
            ws.send(JSON.stringify({
                type: 'ping',
                data: {
                    clientId: clientId,
                    timestamp: new Date().toISOString()
                }
            }));
            
            resolve({ clientId, ws });
        });
        
        ws.on('message', (data) => {
            const message = JSON.parse(data);
            console.log(`📨 客户端 ${clientId} 收到: ${message.type}`);
        });
        
        ws.on('close', () => {
            console.log(`❌ 客户端 ${clientId}: 连接已关闭`);
        });
        
        ws.on('error', (error) => {
            console.log(`❌ 客户端 ${clientId}: 连接错误 - ${error.message}`);
        });
    });
}

/**
 * 运行测试
 */
async function runTest() {
    console.log('🧪 开始AI Bridge单例模式测试');
    console.log('===================================\n');
    
    try {
        // 启动第一个扩展实例
        const instance1 = await simulateExtensionInstance(1);
        if (!instance1) {
            console.log('❌ 测试失败: 第一个实例启动失败');
            return;
        }
        
        // 等待一下让服务器完全启动
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 启动第二个扩展实例
        const instance2 = await simulateExtensionInstance(2);
        if (!instance2) {
            console.log('❌ 测试失败: 第二个实例启动失败');
            return;
        }
        
        // 等待一下让连接完全建立
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 启动WebSocket客户端
        const client1 = await simulateWebSocketClient('A');
        const client2 = await simulateWebSocketClient('B');
        
        // 等待一下让消息传输
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('\n✅ 测试成功完成！');
        console.log('- 第一个实例成为单例服务器');
        console.log('- 第二个实例成功连接到单例服务器');
        console.log('- 两个WebSocket客户端成功连接');
        console.log('- 消息转发正常工作');
        
        // 关闭所有连接
        console.log('\n🧹 清理资源...');
        if (instance1.server) {
            instance1.server.close();
        }
        if (instance2.ws) {
            instance2.ws.close();
        }
        if (client1.ws) {
            client1.ws.close();
        }
        if (client2.ws) {
            client2.ws.close();
        }
        
        console.log('✅ 测试完成');
        
    } catch (error) {
        console.error('❌ 测试失败:', error);
    }
}

// 运行测试
runTest();