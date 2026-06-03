import { recordPaymentSchema } from '../src/schemas/payment';

describe('Payment Schemas', () => {
  describe('recordPaymentSchema', () => {
    test('should validate correct payment data', () => {
      const validData = {
        amountPaise: 11800,
        method: 'bank_transfer',
        paidAt: new Date().toISOString(),
      };

      const result = recordPaymentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('should accept all valid payment methods', () => {
      const methods = ['cash', 'bank_transfer', 'cheque', 'upi', 'card', 'other'];

      methods.forEach((method) => {
        const result = recordPaymentSchema.safeParse({
          amountPaise: 5000,
          method,
          paidAt: new Date().toISOString(),
        });

        expect(result.success).toBe(true);
      });
    });

    test('should reject negative amount', () => {
      const result = recordPaymentSchema.safeParse({
        amountPaise: -1000,
        method: 'cash',
        paidAt: new Date().toISOString(),
      });

      expect(result.success).toBe(false);
    });

    test('should reject zero amount', () => {
      const result = recordPaymentSchema.safeParse({
        amountPaise: 0,
        method: 'upi',
        paidAt: new Date().toISOString(),
      });

      expect(result.success).toBe(false);
    });

    test('should reject future payment date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const result = recordPaymentSchema.safeParse({
        amountPaise: 5000,
        method: 'card',
        paidAt: futureDate.toISOString(),
      });

      expect(result.success).toBe(false);
    });

    test('should reject invalid payment method', () => {
      const result = recordPaymentSchema.safeParse({
        amountPaise: 5000,
        method: 'invalid_method',
        paidAt: new Date().toISOString(),
      });

      expect(result.success).toBe(false);
    });

    test('should reject invalid date format', () => {
      const result = recordPaymentSchema.safeParse({
        amountPaise: 5000,
        method: 'cash',
        paidAt: 'invalid-date',
      });

      expect(result.success).toBe(false);
    });

    test('should reject missing amount', () => {
      const result = recordPaymentSchema.safeParse({
        method: 'bank_transfer',
        paidAt: new Date().toISOString(),
      });

      expect(result.success).toBe(false);
    });
  });
});
