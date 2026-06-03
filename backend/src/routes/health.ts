import { Router, Request, Response } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (req: Request, res: Response): void => {
  res.json({ status: 'ok', ts: Date.now() });
});
