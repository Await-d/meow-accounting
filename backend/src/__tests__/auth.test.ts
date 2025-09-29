/*
 * @Author: Claude Code
 * @Date: 2025-09-28
 * @Description: 认证模块测试
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware, isAdmin } from '../middleware/auth';

// Mock JWT
jest.mock('jsonwebtoken');
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

// Mock user model
jest.mock('../models/user', () => ({
    getUserById: jest.fn()
}));

describe('认证中间件测试', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: jest.MockedFunction<NextFunction>;

    beforeEach(() => {
        mockReq = {
            headers: {}
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();
        jest.clearAllMocks();
    });

    describe('authMiddleware', () => {
        it('应该在没有Authorization头时返回401', async () => {
            await authMiddleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ message: '未提供认证令牌' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('应该在Token格式错误时返回401', async () => {
            mockReq.headers!.authorization = 'InvalidToken';

            await authMiddleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ message: '认证令牌格式不正确' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('应该在有效Token时通过验证', async () => {
            const mockUser = {
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                role: 'user'
            };

            mockReq.headers!.authorization = 'Bearer validtoken';
            mockedJwt.verify.mockReturnValue({ id: 1 } as any);

            // Mock getUserById
            const { getUserById } = require('../models/user');
            getUserById.mockResolvedValue(mockUser);

            await authMiddleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockReq.user).toEqual(mockUser);
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('isAdmin', () => {
        it('应该在用户不是管理员时返回403', () => {
            mockReq.user = { role: 'user' } as any;

            isAdmin(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({ error: '需要管理员权限' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('应该在用户是管理员时通过验证', () => {
            mockReq.user = { role: 'admin' } as any;

            isAdmin(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });
    });
});