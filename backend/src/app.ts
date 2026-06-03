import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth';
import { healthRouter } from './routes/health';
import { quotesRouter } from './routes/quotes';
import { invoicesRouter } from './routes/invoices';
import { customersRouter } from './routes/customers';
import { dashboardRouter } from './routes/dashboard';

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/health', healthRouter);
app.use('/api/quotes', quotesRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/customers', customersRouter);
app.use('/api/dashboard', dashboardRouter);

app.use(errorHandler);

export default app;
