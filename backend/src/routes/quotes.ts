import { Router, Response, NextFunction } from 'express';
import { AuthRequest, verifyJwt } from '../middleware/auth';
import { CreateQuoteSchema, UpdateQuoteSchema } from '../schemas/quote';
import { calculateQuoteGst, calculateLineItemGst } from '../services/gst';
import { AppError } from '../lib/AppError';
import { requireParam } from '../lib/params';
import prisma from '../lib/prisma';

export const quotesRouter = Router();

// GET /api/quotes — list quotes for authenticated user
quotesRouter.get(
  '/',
  verifyJwt,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const userId: string = req.user.id;

      const quotes = await prisma.quote.findMany({
        where: { userId },
        include: { lineItems: true },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ quotes, total: quotes.length });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/quotes — create a new quote
quotesRouter.post(
  '/',
  verifyJwt,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const parsed = CreateQuoteSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(
          parsed.error.issues.map((i) => i.message).join('; '),
          400
        );
      }

      const { customerId, sellerState, customerState, notes, lineItems } =
        parsed.data;

      const gstSummary = calculateQuoteGst(lineItems, sellerState, customerState);
      const isSameState =
        sellerState.trim().toLowerCase() === customerState.trim().toLowerCase();
      const userId: string = req.user.id;

      const quote = await prisma.$transaction(async (tx) => {
        return tx.quote.create({
          data: {
            userId,
            customerId,
            sellerState,
            customerState,
            notes: notes ?? null,
            status: 'DRAFT',
            subTotalPaise: gstSummary.subTotalPaise,
            gstAmountPaise: gstSummary.gstAmountPaise,
            totalPaise: gstSummary.totalPaise,
            gstType: gstSummary.gstType,
            lineItems: {
              create: lineItems.map((item) => {
                const result = calculateLineItemGst(item, isSameState);
                return {
                  description: item.description,
                  quantity: item.quantity,
                  unitPricePaise: item.unitPricePaise,
                  hsnCode: item.hsnCode,
                  gstRate: item.gstRate,
                  gstAmountPaise: result.gstAmountPaise,
                  totalPaise: result.totalPaise,
                };
              }),
            },
          },
          include: { lineItems: true },
        });
      });

      res.status(201).json({ quote });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/quotes/:id — fetch a single quote with line items
quotesRouter.get(
  '/:id',
  verifyJwt,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const id: string = requireParam(req.params, 'id');
      const userId: string = req.user.id;

      const quote = await prisma.quote.findFirst({
        where: { id, userId },
        include: { lineItems: true },
      });

      if (!quote) {
        throw new AppError('Quote not found', 404);
      }

      res.json({ quote });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/quotes/:id — update a quote
quotesRouter.patch(
  '/:id',
  verifyJwt,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const parsed = UpdateQuoteSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(
          parsed.error.issues.map((i) => i.message).join('; '),
          400
        );
      }

      const id: string = requireParam(req.params, 'id');
      const userId: string = req.user.id;

      const existing = await prisma.quote.findFirst({
        where: { id, userId },
        include: { lineItems: true },
      });

      if (!existing) {
        throw new AppError('Quote not found', 404);
      }

      const {
        customerId,
        sellerState,
        customerState,
        notes,
        lineItems,
        status,
      } = parsed.data;

      const updatedSellerState = sellerState ?? existing.sellerState;
      const updatedCustomerState = customerState ?? existing.customerState;

      const quote = await prisma.$transaction(async (tx) => {
        if (lineItems !== undefined) {
          const gstUpdate = calculateQuoteGst(
            lineItems,
            updatedSellerState,
            updatedCustomerState
          );
          const isSameState =
            updatedSellerState.trim().toLowerCase() ===
            updatedCustomerState.trim().toLowerCase();

          await tx.lineItem.deleteMany({ where: { quoteId: existing.id } });

          return tx.quote.update({
            where: { id: existing.id },
            data: {
              ...(customerId !== undefined ? { customerId } : {}),
              sellerState: updatedSellerState,
              customerState: updatedCustomerState,
              ...(notes !== undefined ? { notes } : {}),
              ...(status !== undefined ? { status: status } : {}),
              subTotalPaise: gstUpdate.subTotalPaise,
              gstAmountPaise: gstUpdate.gstAmountPaise,
              totalPaise: gstUpdate.totalPaise,
              gstType: gstUpdate.gstType,
              lineItems: {
                create: lineItems.map((item) => {
                  const result = calculateLineItemGst(item, isSameState);
                  return {
                    description: item.description,
                    quantity: item.quantity,
                    unitPricePaise: item.unitPricePaise,
                    hsnCode: item.hsnCode,
                    gstRate: item.gstRate,
                    gstAmountPaise: result.gstAmountPaise,
                    totalPaise: result.totalPaise,
                  };
                }),
              },
            },
            include: { lineItems: true },
          });
        }

        return tx.quote.update({
          where: { id: existing.id },
          data: {
            ...(customerId !== undefined ? { customerId } : {}),
            ...(sellerState !== undefined ? { sellerState } : {}),
            ...(customerState !== undefined ? { customerState } : {}),
            ...(notes !== undefined ? { notes } : {}),
            ...(status !== undefined ? { status: status } : {}),
          },
          include: { lineItems: true },
        });
      });

      res.json({ quote });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/quotes/:id — delete a DRAFT quote
quotesRouter.delete(
  '/:id',
  verifyJwt,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const id: string = requireParam(req.params, 'id');
      const userId: string = req.user.id;

      const quote = await prisma.quote.findFirst({
        where: { id, userId },
      });

      if (!quote) {
        throw new AppError('Quote not found', 404);
      }

      if (quote.status !== 'DRAFT') {
        throw new AppError('Only DRAFT quotes can be deleted', 400);
      }

      await prisma.quote.delete({ where: { id: quote.id } });

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/quotes/:id/convert — convert quote to invoice
quotesRouter.post(
  '/:id/convert',
  verifyJwt,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const id: string = requireParam(req.params, 'id');
      const userId: string = req.user.id;

      const quote = await prisma.quote.findFirst({
        where: { id, userId },
        include: { lineItems: true },
      });

      if (!quote) {
        throw new AppError('Quote not found', 404);
      }

      if (quote.status === 'CONVERTED') {
        throw new AppError('Quote has already been converted to an invoice', 400);
      }

      const dueDateRaw: unknown = req.body.dueDate;
      if (!dueDateRaw || typeof dueDateRaw !== 'string') {
        throw new AppError('dueDate is required for invoice conversion', 400);
      }

      const dueDate = new Date(dueDateRaw);
      if (isNaN(dueDate.getTime())) {
        throw new AppError('dueDate must be a valid date string', 400);
      }

      const invoiceUserId: string = req.user.id;

      const invoice = await prisma.$transaction(async (tx) => {
        const newInvoice = await tx.invoice.create({
          data: {
            userId: invoiceUserId,
            customerId: quote.customerId,
            quoteId: quote.id,
            dueDate,
            status: 'DRAFT',
            subTotalPaise: quote.subTotalPaise,
            gstAmountPaise: quote.gstAmountPaise,
            totalPaise: quote.totalPaise,
            gstType: quote.gstType,
            notes: quote.notes ?? null,
            lineItems: {
              create: quote.lineItems.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unitPricePaise: item.unitPricePaise,
                hsnCode: item.hsnCode,
                gstRate: item.gstRate,
                gstAmountPaise: item.gstAmountPaise,
                totalPaise: item.totalPaise,
              })),
            },
          },
          include: { lineItems: true },
        });

        await tx.quote.update({
          where: { id: quote.id },
          data: { status: 'CONVERTED' },
        });

        return newInvoice;
      });

      res.status(201).json({ invoice });
    } catch (err) {
      next(err);
    }
  }
);
