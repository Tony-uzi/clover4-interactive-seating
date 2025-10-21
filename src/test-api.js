// 🧪 API 测试脚本
// 在浏览器控制台中运行此脚本来测试前后端连接

import * as api from './lib/api';

// 测试配置
const TEST_USER = {
  name: '22d@11',
  email: `22d@11`,
  password: 'A8762188110'
};

// 测试结果收集
const results = {
  passed: [],
  failed: []
};

// 辅助函数：测试单个API
async function testAPI(name, fn) {
  try {
    console.log(`🧪 测试: ${name}...`);
    const result = await fn();
    console.log(`✅ ${name} - 成功`, result);
    results.passed.push(name);
    return result;
  } catch (error) {
    console.error(`❌ ${name} - 失败:`, error.message);
    results.failed.push({ name, error: error.message });
    throw error;
  }
}

// 主测试函数
export async function runAllTests() {
  console.log('🚀 开始API测试...\n');
  
  let token = null;
  let conferenceEventId = null;
  let tradeshowEventId = null;

  try {
    // ==================== 认证测试 ====================
    console.log('\n📝 === 认证测试 ===\n');

    // 测试注册
    await testAPI('用户注册', async () => {
      const response = await fetch('/api/auth/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(TEST_USER)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || '注册失败');
      return data;
    });

    // 测试登录
    const loginData = await testAPI('用户登录', async () => {
      const response = await fetch('/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: TEST_USER.email,
          password: TEST_USER.password
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || '登录失败');
      
      // 保存token
      localStorage.setItem('token', data.token);
      token = data.token;
      return data;
    });

    // ==================== 设计稿API测试 ====================
    console.log('\n📐 === 设计稿API测试 ===\n');

    // 创建设计稿
    const design = await testAPI('创建设计稿', async () => {
      return await api.createOrGetDesign('测试设计稿', 'conference');
    });

    // 获取设计稿列表
    await testAPI('获取设计稿列表', async () => {
      return await api.listDesigns();
    });

    // 创建设计稿版本
    await testAPI('创建设计稿版本', async () => {
      return await api.saveDesignVersion(design.id, {
        items: [{ type: 'table', x: 10, y: 10 }]
      }, '第一个版本');
    });

    // 获取最新版本
    await testAPI('获取最新版本', async () => {
      return await api.getLatestDesign(design.id);
    });

    // ==================== 会议API测试 ====================
    console.log('\n🏛️ === 会议API测试 ===\n');

    // 创建会议事件
    const conferenceEvent = await testAPI('创建会议事件', async () => {
      return await api.createConferenceEvent({
        name: '测试会议 ' + new Date().toLocaleString(),
        description: 'API测试创建的会议',
        room_width: 24,
        room_height: 16
      });
    });
    conferenceEventId = conferenceEvent.id;

    // 获取会议列表
    await testAPI('获取会议列表', async () => {
      return await api.listConferenceEvents();
    });

    // 更新会议
    await testAPI('更新会议', async () => {
      return await api.updateConferenceEvent(conferenceEventId, {
        description: '更新后的描述'
      });
    });

    // 创建会议元素
    const elements = await testAPI('创建会议元素', async () => {
      return await api.createConferenceElements(conferenceEventId, [
        {
          element_type: 'table_round',
          label: 'T1',
          seats: 8,
          position_x: 10,
          position_y: 10,
          width: 1.8,
          height: 1.8,
          rotation: 0
        },
        {
          element_type: 'chair',
          label: 'C1',
          seats: 1,
          position_x: 5,
          position_y: 5,
          width: 0.6,
          height: 0.6,
          rotation: 0
        }
      ]);
    });

    // 导入嘉宾
    const guests = await testAPI('导入会议嘉宾', async () => {
      return await api.importConferenceGuests(conferenceEventId, [
        {
          name: '张三',
          email: 'zhangsan@example.com',
          dietary_requirements: 'Vegetarian',
          company: 'Test Company'
        },
        {
          name: '李四',
          email: 'lisi@example.com',
          dietary_requirements: 'None',
          company: 'Another Company'
        }
      ]);
    });

    // 获取嘉宾列表
    await testAPI('获取嘉宾列表', async () => {
      return await api.listConferenceGuests(conferenceEventId);
    });

    // 创建分享令牌
    const shareToken = await testAPI('创建会议分享令牌', async () => {
      return await api.createConferenceShareToken(conferenceEventId);
    });

    // ==================== 展会API测试 ====================
    console.log('\n🏢 === 展会API测试 ===\n');

    // 创建展会事件
    const tradeshowEvent = await testAPI('创建展会事件', async () => {
      return await api.createTradeshowEvent({
        name: '测试展会 ' + new Date().toLocaleString(),
        description: 'API测试创建的展会',
        hall_width: 40,
        hall_height: 30
      });
    });
    tradeshowEventId = tradeshowEvent.id;

    // 获取展会列表
    await testAPI('获取展会列表', async () => {
      return await api.listTradeshowEvents();
    });

    // 创建展位
    const booths = await testAPI('创建展位', async () => {
      return await api.createTradeshowBooths(tradeshowEventId, [
        {
          booth_type: 'booth_standard',
          category: 'booth',
          label: 'A1',
          position_x: 5,
          position_y: 5,
          width: 3,
          height: 3,
          rotation: 0
        }
      ]);
    });

    // 导入展商
    const vendors = await testAPI('导入展商', async () => {
      return await api.importTradeshowVendors(tradeshowEventId, [
        {
          company_name: '科技公司A',
          contact_name: '王经理',
          contact_email: 'wang@companya.com',
          category: 'Technology'
        }
      ]);
    });

    // ==================== 测试总结 ====================
    console.log('\n\n📊 === 测试总结 ===\n');
    console.log(`✅ 通过: ${results.passed.length} 个测试`);
    console.log(`❌ 失败: ${results.failed.length} 个测试`);
    
    if (results.passed.length > 0) {
      console.log('\n通过的测试:');
      results.passed.forEach(name => console.log(`  ✅ ${name}`));
    }
    
    if (results.failed.length > 0) {
      console.log('\n失败的测试:');
      results.failed.forEach(({ name, error }) => {
        console.log(`  ❌ ${name}: ${error}`);
      });
    }

    console.log('\n\n🎉 测试完成！');
    
    return {
      success: results.failed.length === 0,
      total: results.passed.length + results.failed.length,
      passed: results.passed.length,
      failed: results.failed.length,
      results
    };

  } catch (error) {
    console.error('\n\n💥 测试过程中出现严重错误:', error);
    return {
      success: false,
      error: error.message,
      results
    };
  }
}

// 快速测试连接性
export async function quickTest() {
  console.log('🔌 快速连接测试...\n');
  
  try {
    // 测试后端是否可达
    const backendResponse = await fetch('/api/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test', password: 'test' })
    });
    
    if (backendResponse.status === 400 || backendResponse.status === 404) {
      console.log('✅ 后端服务器连接成功！');
      console.log('✅ Vite代理配置正确！');
      return true;
    } else {
      console.log('⚠️ 后端响应异常，状态码:', backendResponse.status);
      return false;
    }
  } catch (error) {
    console.error('❌ 后端连接失败:', error.message);
    console.error('请检查:');
    console.error('  1. Django服务器是否运行在 localhost:8000');
    console.error('  2. vite.config.js 代理配置是否正确');
    return false;
  }
}

// 在浏览器控制台中使用:
// import { runAllTests, quickTest } from './test-api';
// await quickTest();        // 快速测试连接
// await runAllTests();      // 运行完整测试

export default { runAllTests, quickTest };


