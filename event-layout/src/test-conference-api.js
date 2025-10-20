/**
 * Conference Planner API 测试文件
 * 
 * 使用方法：
 * 1. 在浏览器打开前端应用并登录
 * 2. 按 F12 打开开发者工具控制台
 * 3. 复制本文件内容到控制台执行
 */

import * as conferenceAPI from './server-actions/conference-planner.js';

// ==================== 测试配置 ====================
const TEST_CONFIG = {
  testEventData: {
    name: '测试会议',
    description: '这是一个API测试会议',
    event_date: '2025-12-31',
    room_width: 24,
    room_height: 16
  },
  testGuestData: {
    name: '张三',
    email: 'zhangsan@example.com',
    group: null,
    dietary_requirements: '素食'
  },
  testGroupData: {
    name: '测试分组',
    color: '#FF5733',
    isSystem: false
  }
};

// ==================== 测试函数 ====================

/**
 * 测试会议事件 API
 */
async function testConferenceEvents() {
  console.log('\n========== 测试会议事件 API ==========');
  
  // 1. 获取所有会议
  console.log('1. 获取所有会议...');
  const listResult = await conferenceAPI.getAllEvents();
  console.log('✅ getAllEvents():', listResult);

  if (!listResult.success) {
    console.error('❌ 获取会议列表失败，请检查用户是否已登录');
    return null;
  }

  // 2. 创建新会议
  console.log('\n2. 创建新会议...');
  const createResult = await conferenceAPI.createEvent(TEST_CONFIG.testEventData);
  console.log('✅ createEvent():', createResult);

  if (!createResult.success) {
    console.error('❌ 创建会议失败');
    return null;
  }

  const eventId = createResult.data.id;
  console.log(`📌 新会议ID: ${eventId}`);

  // 3. 获取单个会议详情
  console.log(`\n3. 获取会议 ${eventId} 详情...`);
  const getResult = await conferenceAPI.getEvent(eventId);
  console.log('✅ getEvent():', getResult);

  // 4. 更新会议
  console.log(`\n4. 更新会议 ${eventId}...`);
  const updateResult = await conferenceAPI.updateEvent(eventId, {
    description: '已更新的测试会议描述'
  });
  console.log('✅ updateEvent():', updateResult);

  return eventId;
}

/**
 * 测试布局元素 API
 */
async function testConferenceElements(eventId) {
  console.log('\n========== 测试布局元素 API ==========');
  
  if (!eventId) {
    console.error('❌ 缺少 eventId，跳过元素测试');
    return null;
  }

  // 1. 获取所有元素
  console.log(`1. 获取会议 ${eventId} 的所有元素...`);
  const listResult = await conferenceAPI.getAllElements(eventId);
  console.log('✅ getAllElements():', listResult);

  // 2. 创建单个元素
  console.log('\n2. 创建圆桌元素...');
  const createResult = await conferenceAPI.createElement({
    event: eventId,
    element_type: 'round_table',
    label: '测试圆桌 1',
    seats: 8,
    position_x: 5,
    position_y: 5,
    width: 1.8,
    height: 1.8,
    rotation: 0
  });
  console.log('✅ createElement():', createResult);

  if (!createResult.success) {
    console.error('❌ 创建元素失败');
    return null;
  }

  const elementId = createResult.data.id;
  console.log(`📌 新元素ID: ${elementId}`);

  // 3. 更新元素
  console.log(`\n3. 更新元素 ${elementId}...`);
  const updateResult = await conferenceAPI.updateElement(elementId, {
    label: '更新后的圆桌',
    position_x: 10
  });
  console.log('✅ updateElement():', updateResult);

  // 4. 批量创建元素
  console.log('\n4. 批量创建元素...');
  const batchResult = await conferenceAPI.batchCreateElements(eventId, [
    {
      element_type: 'square_table',
      label: '方桌 1',
      seats: 6,
      position_x: 3,
      position_y: 8,
      width: 2.4,
      height: 1.2
    },
    {
      element_type: 'chair',
      label: '单人椅',
      seats: 1,
      position_x: 15,
      position_y: 10,
      width: 0.6,
      height: 0.6
    }
  ]);
  console.log('✅ batchCreateElements():', batchResult);

  return elementId;
}

/**
 * 测试嘉宾 API
 */
async function testConferenceGuests(eventId) {
  console.log('\n========== 测试嘉宾 API ==========');
  
  if (!eventId) {
    console.error('❌ 缺少 eventId，跳过嘉宾测试');
    return null;
  }

  // 1. 获取所有嘉宾
  console.log(`1. 获取会议 ${eventId} 的所有嘉宾...`);
  const listResult = await conferenceAPI.getAllGuests(eventId);
  console.log('✅ getAllGuests():', listResult);

  // 2. 创建单个嘉宾
  console.log('\n2. 创建嘉宾...');
  const createResult = await conferenceAPI.createGuest({
    ...TEST_CONFIG.testGuestData,
    event: eventId
  });
  console.log('✅ createGuest():', createResult);

  if (!createResult.success) {
    console.error('❌ 创建嘉宾失败');
    return null;
  }

  const guestId = createResult.data.id;
  console.log(`📌 新嘉宾ID: ${guestId}`);

  // 3. 更新嘉宾
  console.log(`\n3. 更新嘉宾 ${guestId}...`);
  const updateResult = await conferenceAPI.updateGuest(guestId, {
    dietary_requirements: '无特殊要求'
  });
  console.log('✅ updateGuest():', updateResult);

  // 4. 批量导入嘉宾
  console.log('\n4. 批量导入嘉宾...');
  const batchResult = await conferenceAPI.batchImportGuests(eventId, [
    { name: '李四', email: 'lisi@example.com' },
    { name: '王五', email: 'wangwu@example.com' }
  ]);
  console.log('✅ batchImportGuests():', batchResult);

  return guestId;
}

/**
 * 测试分组 API
 */
async function testConferenceGroups(eventId) {
  console.log('\n========== 测试分组 API ==========');
  
  if (!eventId) {
    console.error('❌ 缺少 eventId，跳过分组测试');
    return null;
  }

  // 1. 获取所有分组
  console.log(`1. 获取会议 ${eventId} 的所有分组...`);
  const listResult = await conferenceAPI.getAllGroups(eventId);
  console.log('✅ getAllGroups():', listResult);

  // 2. 创建分组
  console.log('\n2. 创建分组...');
  const createResult = await conferenceAPI.createGroup(eventId, TEST_CONFIG.testGroupData);
  console.log('✅ createGroup():', createResult);

  if (!createResult.success) {
    console.error('❌ 创建分组失败');
    return null;
  }

  const groupId = createResult.data.id;
  console.log(`📌 新分组ID: ${groupId}`);

  // 3. 更新分组
  console.log(`\n3. 更新分组 ${groupId}...`);
  const updateResult = await conferenceAPI.updateGroup(groupId, {
    color: '#3498db'
  });
  console.log('✅ updateGroup():', updateResult);

  return groupId;
}

/**
 * 测试座位分配 API
 */
async function testSeatAssignments(eventId, elementId, guestId) {
  console.log('\n========== 测试座位分配 API ==========');
  
  if (!eventId || !elementId || !guestId) {
    console.error('❌ 缺少必要参数，跳过座位分配测试');
    return;
  }

  // 1. 获取所有分配
  console.log(`1. 获取会议 ${eventId} 的所有座位分配...`);
  const listResult = await conferenceAPI.getAllAssignments(eventId);
  console.log('✅ getAllAssignments():', listResult);

  // 2. 创建座位分配
  console.log('\n2. 创建座位分配...');
  const createResult = await conferenceAPI.createAssignment({
    event: eventId,
    element: elementId,
    guest: guestId,
    seat_number: 1
  });
  console.log('✅ createAssignment():', createResult);

  if (createResult.success) {
    const assignmentId = createResult.data.id;
    console.log(`📌 新分配ID: ${assignmentId}`);
    return assignmentId;
  }

  return null;
}

/**
 * 测试分享功能
 */
async function testSharing(eventId) {
  console.log('\n========== 测试分享功能 ==========');
  
  if (!eventId) {
    console.error('❌ 缺少 eventId，跳过分享测试');
    return;
  }

  // 生成分享 Token
  console.log(`1. 为会议 ${eventId} 生成分享链接...`);
  const shareResult = await conferenceAPI.generateShareToken(eventId);
  console.log('✅ generateShareToken():', shareResult);

  if (shareResult.success && shareResult.data.share_token) {
    const shareToken = shareResult.data.share_token;
    console.log(`📌 分享Token: ${shareToken}`);
    
    // 测试通过 Token 获取会议
    console.log(`\n2. 通过 Token 获取会议...`);
    const getSharedResult = await conferenceAPI.getEventByShareToken(shareToken);
    console.log('✅ getEventByShareToken():', getSharedResult);
  }
}

/**
 * 清理测试数据
 */
async function cleanupTestData(eventId, elementId, guestId, groupId, assignmentId) {
  console.log('\n========== 清理测试数据 ==========');
  
  // 删除座位分配
  if (assignmentId) {
    console.log(`1. 删除座位分配 ${assignmentId}...`);
    const result = await conferenceAPI.deleteAssignment(assignmentId);
    console.log('✅ deleteAssignment():', result);
  }

  // 删除嘉宾
  if (guestId) {
    console.log(`2. 删除嘉宾 ${guestId}...`);
    const result = await conferenceAPI.deleteGuest(guestId);
    console.log('✅ deleteGuest():', result);
  }

  // 删除元素
  if (elementId) {
    console.log(`3. 删除元素 ${elementId}...`);
    const result = await conferenceAPI.deleteElement(elementId);
    console.log('✅ deleteElement():', result);
  }

  // 删除分组
  if (groupId) {
    console.log(`4. 删除分组 ${groupId}...`);
    const result = await conferenceAPI.deleteGroup(groupId);
    console.log('✅ deleteGroup():', result);
  }

  // 删除会议（最后删除）
  if (eventId) {
    console.log(`5. 删除会议 ${eventId}...`);
    const result = await conferenceAPI.deleteEvent(eventId);
    console.log('✅ deleteEvent():', result);
  }

  console.log('\n🎉 测试数据清理完成！');
}

// ==================== 主测试流程 ====================

/**
 * 运行完整测试流程
 */
export async function runConferenceAPITests() {
  console.log('🚀 开始测试 Conference Planner API...\n');
  console.log('⚠️  请确保：');
  console.log('1. 后端服务器已启动 (python manage.py runserver)');
  console.log('2. 已在浏览器中登录');
  console.log('3. localStorage 中有有效的 token\n');

  try {
    // 测试会议事件
    const eventId = await testConferenceEvents();
    if (!eventId) {
      console.error('❌ 会议测试失败，终止后续测试');
      return;
    }

    // 测试布局元素
    const elementId = await testConferenceElements(eventId);

    // 测试嘉宾
    const guestId = await testConferenceGuests(eventId);

    // 测试分组
    const groupId = await testConferenceGroups(eventId);

    // 测试座位分配
    const assignmentId = await testSeatAssignments(eventId, elementId, guestId);

    // 测试分享
    await testSharing(eventId);

    // 询问是否清理
    console.log('\n\n⚠️  测试完成！要清理测试数据吗？');
    console.log('执行清理：window.cleanupConferenceTestData()');
    console.log('不清理：直接关闭即可');

    // 将清理函数挂载到 window
    window.cleanupConferenceTestData = () => {
      cleanupTestData(eventId, elementId, guestId, groupId, assignmentId);
    };

    console.log('\n✅ 所有测试执行完成！');
    console.log(`📊 测试结果摘要：`);
    console.log(`   - 会议ID: ${eventId}`);
    console.log(`   - 元素ID: ${elementId || '未创建'}`);
    console.log(`   - 嘉宾ID: ${guestId || '未创建'}`);
    console.log(`   - 分组ID: ${groupId || '未创建'}`);
    console.log(`   - 分配ID: ${assignmentId || '未创建'}`);

  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error);
  }
}

// ==================== 快速测试（单个API） ====================

/**
 * 快速测试：只测试登录状态
 */
export async function quickTestAuth() {
  console.log('🔐 测试用户认证状态...');
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.error('❌ 未找到 token，请先登录！');
    return false;
  }

  console.log('✅ Token 存在:', token.substring(0, 20) + '...');
  
  const result = await conferenceAPI.getAllEvents();
  if (result.success) {
    console.log('✅ 认证成功！当前有', result.data.length, '个会议');
    return true;
  } else {
    console.error('❌ 认证失败:', result.error);
    return false;
  }
}

// 自动执行（可选）
// runConferenceAPITests();

