import { z } from 'zod';

export const DashboardStatsSchema = z.object({
  monthlyRevenuePaise: z.number().int().nonnegative(),
  pendingQuotesCount: z.number().int().nonnegative(),
  pendingInvoicesCount: z.number().int().nonnegative(),
  overdueCount: z.number().int().nonnegative(),
  conversionRate: z.number().int().min(0).max(100),
});

export const RecentQuoteSchema = z.object({
  id: z.string(),
  status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'CONVERTED']),
  totalPaise: z.number().int(),
  createdAt: z.date(),
  customerId: z.string(),
});

export const RecentInvoiceSchema = z.object({
  id: z.string(),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE']),
  totalPaise: z.number().int(),
  dueDate: z.date(),
  createdAt: z.date(),
  customerId: z.string(),
});

export const DashboardResponseSchema = z.object({
  stats: DashboardStatsSchema,
  recentQuotes: z.array(RecentQuoteSchema),
  recentInvoices: z.array(RecentInvoiceSchema),
});

export type DashboardResponse = z.infer<typeof DashboardResponseSchema>;
