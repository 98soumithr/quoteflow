import { Router, Response, NextFunction } from 'express';
import { AuthRequest, verifyJwt } from '../middleware/auth';
import { CreateContactSchema } from '../schemas/customer';
import { listContacts, getContactById, createContact } from '../services/atomic';
import { AppError } from '../lib/AppError';
import { requireParam } from '../lib/params';

export const customersRouter = Router();

// GET /api/customers — list all contacts from Atomic CRM
customersRouter.get(
  '/',
  verifyJwt,
  async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const raw = await listContacts().catch(() => []);
      const customers = raw.map((c) => ({
        ...c,
        name: `${String(c.first_name ?? '')} ${String(c.last_name ?? '')}`.trim() || c.email,
      }));
      res.json({ customers, total: customers.length });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/customers/:id — get a single contact from Atomic CRM
customersRouter.get(
  '/:id',
  verifyJwt,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id: string = requireParam(req.params, 'id');

      const customer = await getContactById(id);
      res.json(customer);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/customers — create a contact in Atomic CRM
customersRouter.post(
  '/',
  verifyJwt,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = CreateContactSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(
          parsed.error.issues.map((i) => i.message).join('; '),
          400
        );
      }

      const customer = await createContact(parsed.data);
      res.status(201).json(customer);
    } catch (err) {
      next(err);
    }
  }
);
