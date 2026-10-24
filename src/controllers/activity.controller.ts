import type { RequestHandler } from 'express';
import * as activityService from '../services/activity.service';
import {
  activityBodySchema,
  activityQuerySchema,
  approveBodySchema,
  idParamSchema,
} from '../validation/activity.schemas';
import { getAuthUser } from '../middleware/authenticate';

/** GET /api/activities – רשימה עם חיפוש, סינון ומיון */
export const list: RequestHandler = async (req, res) => {
  const query = activityQuerySchema.parse(req.query);
  const activities = await activityService.listActivities(getAuthUser(res), query);
  res.json({ activities, count: activities.length });
};

/** GET /api/activities/random – פעילות אקראית לפי אותם סינונים */
export const random: RequestHandler = async (req, res) => {
  const query = activityQuerySchema.parse(req.query);
  const activity = await activityService.randomActivity(getAuthUser(res), query);
  res.json({ activity });
};

/** GET /api/activities/:id */
export const getOne: RequestHandler = async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const activity = await activityService.getActivity(getAuthUser(res), id);
  res.json({ activity });
};

/** POST /api/activities */
export const create: RequestHandler = async (req, res) => {
  const body = activityBodySchema.parse(req.body);
  const activity = await activityService.createActivity(getAuthUser(res), body);
  res.status(201).json({ activity });
};

/** PUT /api/activities/:id */
export const update: RequestHandler = async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const body = activityBodySchema.parse(req.body);
  const activity = await activityService.updateActivity(getAuthUser(res), id, body);
  res.json({ activity });
};

/** DELETE /api/activities/:id */
export const remove: RequestHandler = async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  await activityService.deleteActivity(getAuthUser(res), id);
  res.status(204).send();
};

/** PATCH /api/activities/:id/approve – הורה מאשר רעיון של ילד */
export const approve: RequestHandler = async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const body = approveBodySchema.parse(req.body ?? {});
  const activity = await activityService.approveActivity(getAuthUser(res), id, body);
  res.json({ activity });
};
