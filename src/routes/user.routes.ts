import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';
import * as users from '../controllers/user.controller';

/** /api/users – להורה בלבד */
export const userRouter = Router();

userRouter.get('/children', authenticate, requireRole('PARENT'), users.children);
