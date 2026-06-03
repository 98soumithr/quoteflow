import { z } from 'zod';

export const recordPaymentSchema = z.object({
  amountPaise: z.number().int().positive('Amount must be greater than zero'),
  method: z.enum(['cash', 'bank_transfer', 'cheque', 'upi', 'card', 'other']),
  paidAt: z.string().datetime().refine(
    (date) => new Date(date) <= new Date(),
    'Payment date cannot be in the future'
  ),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
