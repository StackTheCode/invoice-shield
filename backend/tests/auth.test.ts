import { AuthService } from '../src/services/auth.service';

// Mock the database module
jest.mock('../src/db', () => {
  const actualDb = {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  };
  
  return {
    db: actualDb,
    users: { email: 'email', id: 'id', password: 'password' },
    companies: { id: 'id', name: 'name', email: 'email' },
  };
});

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock_token'),
  verify: jest.fn().mockReturnValue({ userId: '123', email: 'test@example.com', companyId: '456' }),
}));

import {db} from '../src/db'
import bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Mock database responses
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]), // No existing user
        }),
      });

      (db.insert as jest.Mock)
        .mockReturnValueOnce({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([
              { id: 'company-123', name: 'Test Company', email: 'test@example.com' },
            ]),
          }),
        })
        .mockReturnValueOnce({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([
              { 
                id: 'user-123', 
                email: 'test@example.com', 
                name: 'Test User',
                companyId: 'company-123',
              },
            ]),
          }),
        });

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        companyName: 'Test Company',
      });

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.user?.email).toBe('test@example.com');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
    });

    it('should reject registration if email already exists', async () => {
      // Mock existing user
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([
            { id: 'existing-user', email: 'test@example.com' },
          ]),
        }),
      });

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already registered');
    });
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      // Mock user found in database
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([
            {
              id: 'user-123',
              email: 'test@example.com',
              password: 'hashed_password',
              name: 'Test User',
              companyId: 'company-123',
            },
          ]),
        }),
      });

      (db.update as jest.Mock).mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue({}),
        }),
      });

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.user?.email).toBe('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password');
    });

    it('should reject login with invalid email', async () => {
      // Mock no user found
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await authService.login({
        email: 'wrong@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');
    });

    it('should reject login with invalid password', async () => {
      // Mock user found but wrong password
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([
            {
              id: 'user-123',
              email: 'test@example.com',
              password: 'hashed_password',
              name: 'Test User',
              companyId: 'company-123',
            },
          ]),
        }),
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'wrong_password',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const result = authService.verifyToken('valid_token');

      expect(result).toBeDefined();
      expect(result?.userId).toBe('123');
      expect(result?.email).toBe('test@example.com');
    });

    it('should return null for invalid token', () => {
      const jwt = require('jsonwebtoken');
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = authService.verifyToken('invalid_token');

      expect(result).toBeNull();
    });
  });
});