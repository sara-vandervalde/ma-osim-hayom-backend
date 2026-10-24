import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { apiRouter } from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import openapiDocument from './docs/openapi.json';

/** בונה את אפליקציית Express (בנפרד מ־server.ts כדי שהבדיקות יוכלו להשתמש בה). */
export function createApp() {
  const app = express();

  // CORS: כתובות מותרות מתוך CORS_ORIGIN (רשימה מופרדת בפסיקים, או * לכולם)
  const allowAll = env.corsOrigins.includes('*');
  app.use(cors({ origin: allowAll ? true : [...env.corsOrigins] }));

  app.use(express.json({ limit: '100kb' }));

  // תיעוד Swagger
  app.get('/api-docs.json', (_req, res) => {
    res.json(openapiDocument);
  });
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(openapiDocument, {
      customSiteTitle: 'מה עושים היום? – API',
      swaggerOptions: { persistAuthorization: true },
    }),
  );
  app.get('/', (_req, res) => {
    res.redirect('/api-docs');
  });

  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
