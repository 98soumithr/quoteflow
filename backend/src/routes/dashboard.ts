import { Router, Response, NextFunction } from 'express';
import { AuthRequest, verifyJwt } from '../middleware/auth';
import { DashboardResponse } from '../schemas/dashboard';
import { AppError } from '../lib/AppError';
import prisma from '../lib/prisma';

export const dashboardRouter = Router();

// GET /api/dashboard — get dashboard data for authenticated user
dashboardRouter.get(
  '/',
  verifyJwt,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const userId: string = req.user.id;

      // Get current month boundaries
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      // Run 8 queries in parallel
      const [
        monthlyRevenueResult,
        pendingQuotesCount,
        pendingInvoicesCount,
        overdueCount,
        totalQuotes,
        acceptedQuotes,
        recentQuotes,
        recentInvoices,
      ] = await Promise.all([
        // Monthly revenue (PAID invoices only, current month)
        prisma.invoice.aggregate({
          where: {
            userId,
            status: 'PAID',
            createdAt: {
              gte: monthStart,
              lt: monthEnd,
            },
          },
          _sum: {
            totalPaise: true,
          },
        }),
        // Pending quotes (DRAFT or SENT)
        prisma.quote.count({
          where: {
            userId,
            status: {
              in: ['DRAFT', 'SENT'],
            },
          },
        }),
        // Pending invoices (DRAFT or SENT)
        prisma.invoice.count({
          where: {
            userId,
            status: {
              in: ['DRAFT', 'SENT'],
            },
          },
        }),
        // Overdue invoices
        prisma.invoice.count({
          where: {
            userId,
            status: 'OVERDUE',
          },
        }),
        // Total quotes count
        prisma.quote.count({
          where: { userId },
        }),
        // Accepted quotes count
        prisma.quote.count({
          where: {
            userId,
            status: 'ACCEPTED',
          },
        }),
        // 5 most recent quotes
        prisma.quote.findMany({
          where: { userId },
          select: {
            id: true,
            status: true,
            totalPaise: true,
            createdAt: true,
            customerId: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        // 5 most recent invoices
        prisma.invoice.findMany({
          where: { userId },
          select: {
            id: true,
            status: true,
            totalPaise: true,
            dueDate: true,
            createdAt: true,
            customerId: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
      ]);

      // Calculate conversion rate
      const conversionRate =
        totalQuotes > 0 ? Math.round((acceptedQuotes / totalQuotes) * 100) : 0;

      // Assemble response
      const payload: DashboardResponse = {
        stats: {
          monthlyRevenuePaise: monthlyRevenueResult._sum.totalPaise ?? 0,
          pendingQuotesCount,
          pendingInvoicesCount,
          overdueCount,
          conversionRate,
        },
        recentQuotes: recentQuotes.map((q) => ({
          id: q.id,
          status: q.status as 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'CONVERTED',
          totalPaise: q.totalPaise,
          createdAt: q.createdAt,
          customerId: q.customerId,
        })),
        recentInvoices: recentInvoices.map((inv) => ({
          id: inv.id,
          status: inv.status as 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE',
          totalPaise: inv.totalPaise,
          dueDate: inv.dueDate,
          createdAt: inv.createdAt,
          customerId: inv.customerId,
        })),
      };

      res.json(payload);
    } catch (err) {
      next(err);
    }
  }
);
