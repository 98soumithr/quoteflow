import { z } from 'zod';
import { LineItemInputSchema } from './quote';

export const CreateInvoiceSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  dueDate: z
    .string()
    .datetime({ message: 'dueDate must be a valid ISO 8601 datetime string' }),
  sellerState: z.string().min(2, 'Seller state is required'),
  customerState: z.string().min(2, 'Customer state is required'),
  notes: z.string().optional(),
  lineItems: z
    .array(LineItemInputSchema)
    .min(1, 'At least one line item is required'),
});

export const UpdateInvoiceStatusSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE'], {
    error: 'status must be one of: DRAFT, SENT, PAID, OVERDUE',
  }),
});

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;
export type UpdateInvoiceStatusInput = z.infer<typeof UpdateInvoiceStatusSchema>;
