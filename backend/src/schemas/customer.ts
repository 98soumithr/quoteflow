import { z } from 'zod';

export const CreateContactSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  company_id: z.string().min(1, 'Company ID is required'),
  status: z.string().min(1, 'Status is required'),
  phone: z.string().min(1, 'Phone is required'),
  state: z.string().min(2, 'State is required'),
  gstin: z.string().optional().default(''),
});

export type CreateContactInput = z.infer<typeof CreateContactSchema>;
