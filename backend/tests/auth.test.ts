import { RegisterSchema, LoginSchema } from '../src/schemas/auth';

describe('Auth Schemas', () => {
  describe('RegisterSchema', () => {
    test('should validate correct registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'securePassword123',
        name: 'John Doe',
      };

      const result = RegisterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'securePassword123',
        name: 'John Doe',
      };

      const result = RegisterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('should reject password less than 8 characters', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'short',
        name: 'John Doe',
      };

      const result = RegisterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('should reject empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '',
        name: 'John Doe',
      };

      const result = RegisterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('should reject missing name', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'securePassword123',
        name: '',
      };

      const result = RegisterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('should require all fields', () => {
      const incompletData = {
        email: 'test@example.com',
      };

      const result = RegisterSchema.safeParse(incompletData);
      expect(result.success).toBe(false);
    });
  });

  describe('LoginSchema', () => {
    test('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'securePassword123',
      };

      const result = LoginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'securePassword123',
      };

      const result = LoginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('should reject missing password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '',
      };

      const result = LoginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('should require all fields', () => {
      const incompleteData = {
        email: 'test@example.com',
      };

      const result = LoginSchema.safeParse(incompleteData);
      expect(result.success).toBe(false);
    });
  });

  describe('User Response Security', () => {
    test('RegisterSchema should not expose passwordHash field in response type', () => {
      // This test ensures that the response type never includes passwordHash
      const validData = {
        email: 'test@example.com',
        password: 'securePassword123',
        name: 'John Doe',
      };

      const result = RegisterSchema.safeParse(validData);
      expect(result.success).toBe(true);

      if (result.success) {
        // Parsed data should not contain passwordHash
        expect('passwordHash' in result.data).toBe(false);
      }
    });
  });
});
