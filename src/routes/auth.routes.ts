import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as auth from '../controllers/auth.controller';

/** /api/auth */
export const authRouter = Router();

authRouter.post('/register', auth.register);
authRouter.post('/login', auth.login);
authRouter.get('/me', authenticate, auth.me);
