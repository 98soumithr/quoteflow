import { Router, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { AppError } from '../lib/AppError';
import { RegisterSchema, LoginSchema } from '../schemas/auth';
import { AuthRequest, verifyJwt } from '../middleware/auth';

export const authRouter = Router();

const signJwt = (id: string, email: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError('JWT_SECRET is not defined', 500);
  }
  // JWT_EXPIRY defaults to 7d (7 days)
  const expiresIn: SignOptions['expiresIn'] = process.env.JWT_EXPIRY ?
    (parseInt(process.env.JWT_EXPIRY as string, 10) || '7d') :
    '7d';

  return jwt.sign({ id, email }, secret, { expiresIn });
};

const setCookieWithJwt = (res: Response, token: string): void => {
  const secure = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

authRouter.post('/register', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { email, password, name } = parsed.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
      },
    });

    // Sign JWT
    const token = signJwt(user.id, user.email);

    // Set cookie
    setCookieWithJwt(res, token);

    // Return user without passwordHash
    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.status).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
});

authRouter.post('/login', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { email, password } = parsed.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Generic error message to prevent user enumeration
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    // Compare password with hash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    // Sign JWT
    const token = signJwt(user.id, user.email);

    // Set cookie
    setCookieWithJwt(res, token);

    // Return user without passwordHash
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.status).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
});

authRouter.post('/logout', (req: AuthRequest, res: Response): void => {
  res.clearCookie('token');
  res.status(200).json({ success: true });
});

authRouter.get('/me', verifyJwt, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.status).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
});
