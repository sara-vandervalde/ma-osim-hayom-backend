import { Router } from 'express';
import * as health from '../controllers/health.controller';
import { authRouter } from './auth.routes';
import { activityRouter } from './activity.routes';
import { userRouter } from './user.routes';

/** כל הנתיבים של ה־API, תחת /api */
export const apiRouter = Router();

apiRouter.get('/health', health.health);
apiRouter.use('/auth', authRouter);
apiRouter.use('/activities', activityRouter);
apiRouter.use('/users', userRouter);
