import { z } from 'zod';

export const LineItemInputSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  unitPricePaise: z
    .number()
    .int()
    .positive('Unit price must be a positive integer in paise'),
  hsnCode: z
    .string()
    .regex(
      /^\d{4}(\d{2}(\d{2})?)?$/,
      'HSN code must be 4, 6, or 8 digits'
    ),
  gstRate: z
    .number()
    .min(0, 'GST rate cannot be negative')
    .max(28, 'GST rate cannot exceed 28%'),
});

export const CreateQuoteSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  sellerState: z.string().min(2, 'Seller state is required'),
  customerState: z.string().min(2, 'Customer state is required'),
  notes: z.string().optional(),
  lineItems: z
    .array(LineItemInputSchema)
    .min(1, 'At least one line item is required'),
});

export const UpdateQuoteSchema = z.object({
  customerId: z.string().min(1).optional(),
  sellerState: z.string().min(2).optional(),
  customerState: z.string().min(2).optional(),
  notes: z.string().optional(),
  lineItems: z.array(LineItemInputSchema).min(1).optional(),
  status: z
    .enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'CONVERTED'])
    .optional(),
});

export type LineItemInput = z.infer<typeof LineItemInputSchema>;
export type CreateQuoteInput = z.infer<typeof CreateQuoteSchema>;
export type UpdateQuoteInput = z.infer<typeof UpdateQuoteSchema>;
