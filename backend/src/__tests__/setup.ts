/*
 * @Author: Claude Code
 * @Date: 2025-09-28
 * @Description: 测试环境设置
 */

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DB_PATH = ':memory:';

// 全局测试超时设置
jest.setTimeout(30000);

// 模拟console.log以减少测试输出噪音
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};