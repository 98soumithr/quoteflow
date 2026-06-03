import { Router, Response, NextFunction } from 'express';
import { AuthRequest, verifyJwt } from '../middleware/auth';
import { UpdateInvoiceStatusSchema } from '../schemas/invoice';
import { recordPaymentSchema } from '../schemas/payment';
import { AppError } from '../lib/AppError';
import { requireParam } from '../lib/params';
import prisma from '../lib/prisma';

export const invoicesRouter = Router();

// GET /api/invoices — list invoices for authenticated user
invoicesRouter.get(
  '/',
  verifyJwt,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const userId: string = req.user.id;

      const invoices = await prisma.invoice.findMany({
        where: { userId },
        include: { lineItems: true, payments: true },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ invoices, total: invoices.length });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/invoices/:id — fetch a single invoice with line items
invoicesRouter.get(
  '/:id',
  verifyJwt,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const id: string = requireParam(req.params, 'id');
      const userId: string = req.user.id;

      const invoice = await prisma.invoice.findFirst({
        where: { id, userId },
        include: { lineItems: true, payments: true },
      });

      if (!invoice) {
        throw new AppError('Invoice not found', 404);
      }

      res.json({ invoice });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/invoices/:id/status — update invoice status only
invoicesRouter.patch(
  '/:id/status',
  verifyJwt,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const parsed = UpdateInvoiceStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(
          parsed.error.issues.map((i) => i.message).join('; '),
          400
        );
      }

      const id: string = requireParam(req.params, 'id');
      const userId: string = req.user.id;

      const existing = await prisma.invoice.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        throw new AppError('Invoice not found', 404);
      }

      const invoice = await prisma.invoice.update({
        where: { id: existing.id },
        data: { status: parsed.data.status },
        include: { lineItems: true },
      });

      res.json({ invoice });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/invoices/:id/pay — record a payment for an invoice
invoicesRouter.post(
  '/:id/pay',
  verifyJwt,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const parsed = recordPaymentSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(
          parsed.error.issues.map((i) => i.message).join('; '),
          400
        );
      }

      const id: string = requireParam(req.params, 'id');
      const userId: string = req.user.id;

      const invoice = await prisma.invoice.findFirst({
        where: { id, userId },
      });

      if (!invoice) {
        throw new AppError('Invoice not found', 404);
      }

      if (invoice.status === 'PAID') {
        throw new AppError('Invoice is already paid', 409);
      }

      const payment = await prisma.payment.create({
        data: {
          invoiceId: id,
          amountPaise: parsed.data.amountPaise,
          method: parsed.data.method,
          paidAt: new Date(parsed.data.paidAt),
        },
      });

      const updatedInvoice = await prisma.invoice.update({
        where: { id },
        data: { status: 'PAID' },
        include: { lineItems: true, payments: true },
      });

      res.json({ invoice: updatedInvoice, payment });
    } catch (err) {
      next(err);
    }
  }
);
