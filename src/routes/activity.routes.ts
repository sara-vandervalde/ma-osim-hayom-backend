import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';
import * as activities from '../controllers/activity.controller';

/** /api/activities – כל הנתיבים מחייבים התחברות */
export const activityRouter = Router();

activityRouter.use(authenticate);
activityRouter.get('/', activities.list);
activityRouter.get('/random', activities.random); // חייב להופיע לפני '/:id'
activityRouter.get('/:id', activities.getOne);
activityRouter.post('/', activities.create);
activityRouter.put('/:id', activities.update);
activityRouter.delete('/:id', activities.remove);
activityRouter.patch('/:id/approve', requireRole('PARENT'), activities.approve);
