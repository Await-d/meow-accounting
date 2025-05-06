const fetch = require('node-fetch');

// 基础配置
const API_BASE_URL = 'http://localhost:3001/api';
let token = null;

// 登录获取token
async function login() {
    try {
        const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'password123'
            })
        });

        const loginData = await loginResponse.json();
        
        if (!loginResponse.ok) {
            console.error('登录失败:', loginData.message || '未知错误');
            return false;
        }

        token = loginData.token;
        console.log('✅ 登录成功，获取到令牌');
        return true;
    } catch (error) {
        console.error('登录请求错误:', error.message);
        return false;
    }
}

// 测试路由预测API
async function testRoutePredictions() {
    try {
        const response = await fetch(`${API_BASE_URL}/routes/predictions?user_id=1`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error('获取路由预测失败:', data.message || '未知错误');
            return false;
        }

        console.log('✅ 路由预测API测试成功');
        console.log('数据示例:', JSON.stringify(data.topRoutes[0], null, 2));
        return true;
    } catch (error) {
        console.error('路由预测请求错误:', error.message);
        return false;
    }
}

// 测试路由优化建议API
async function testRouteOptimization() {
    try {
        const response = await fetch(`${API_BASE_URL}/routes/1/optimization`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error('获取路由优化建议失败:', data.message || '未知错误');
            return false;
        }

        console.log('✅ 路由优化建议API测试成功');
        console.log('数据示例:', JSON.stringify(data[0], null, 2));
        return true;
    } catch (error) {
        console.error('路由优化建议请求错误:', error.message);
        return false;
    }
}

// 测试导出报告API
async function testExportReport() {
    try {
        const response = await fetch(`${API_BASE_URL}/routes/export?format=json&startDate=2024-01-01T00:00:00.000Z&endDate=2024-12-31T23:59:59.999Z`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('导出报告失败:', errorText);
            return false;
        }

        console.log('✅ 导出报告API测试成功');
        console.log('响应状态:', response.status);
        console.log('内容类型:', response.headers.get('content-type'));
        return true;
    } catch (error) {
        console.error('导出报告请求错误:', error.message);
        return false;
    }
}

// 测试可视化数据API
async function testVisualizationData() {
    try {
        const response = await fetch(`${API_BASE_URL}/routes/visualization?type=performance&startDate=2024-01-01T00:00:00.000Z&endDate=2024-12-31T23:59:59.999Z`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error('获取可视化数据失败:', data.message || '未知错误');
            return false;
        }

        console.log('✅ 可视化数据API测试成功');
        console.log('数据类型:', data.type);
        console.log('数据示例:', JSON.stringify(data.data[0], null, 2));
        return true;
    } catch (error) {
        console.error('可视化数据请求错误:', error.message);
        return false;
    }
}

// 运行所有测试
async function runTests() {
    console.log('🚀 开始测试路由管理API...');
    
    // 登录获取token
    const loggedIn = await login();
    if (!loggedIn) {
        console.error('❌ 登录失败，无法继续测试');
        return;
    }
    
    // 测试各个API
    const results = {
        predictions: await testRoutePredictions(),
        optimization: await testRouteOptimization(),
        export: await testExportReport(),
        visualization: await testVisualizationData()
    };
    
    // 输出测试结果摘要
    console.log('\n📊 测试结果摘要:');
    console.log('路由预测API:', results.predictions ? '✅ 通过' : '❌ 失败');
    console.log('路由优化建议API:', results.optimization ? '✅ 通过' : '❌ 失败');
    console.log('导出报告API:', results.export ? '✅ 通过' : '❌ 失败');
    console.log('可视化数据API:', results.visualization ? '✅ 通过' : '❌ 失败');
    
    const success = Object.values(results).every(Boolean);
    console.log('\n总体结果:', success ? '✅ 所有测试通过' : '❌ 部分测试失败');
}

// 运行测试
runTests().catch(error => {
    console.error('测试过程中发生错误:', error);
});