import { execSync } from 'node:child_process';
import openapi from '../src/docs/openapi.json';
import { api, prisma } from './helpers';

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Swagger / OpenAPI', () => {
  it('Swagger UI נפתח ב־/api-docs', async () => {
    const res = await api().get('/api-docs/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('swagger');
  });

  it('קובץ ה־OpenAPI זמין ב־/api-docs.json', async () => {
    const res = await api().get('/api-docs.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toMatch(/^3\./);
  });

  it('מוגדר Bearer JWT (כפתור Authorize)', () => {
    expect(openapi.components.securitySchemes.bearerAuth).toMatchObject({ type: 'http', scheme: 'bearer' });
  });

  it('כל ה־Endpoints מתועדים', () => {
    const paths = openapi.paths as Record<string, Record<string, unknown>>;
    const documented = Object.entries(paths).flatMap(([path, ops]) =>
      Object.keys(ops).map((method) => `${method.toUpperCase()} ${path}`),
    );
    expect(documented.sort()).toEqual(
      [
        'GET /api/health',
        'POST /api/auth/register',
        'POST /api/auth/login',
        'GET /api/auth/me',
        'GET /api/activities',
        'POST /api/activities',
        'GET /api/activities/random',
        'GET /api/activities/{id}',
        'PUT /api/activities/{id}',
        'DELETE /api/activities/{id}',
        'PATCH /api/activities/{id}/approve',
        'GET /api/users/children',
      ].sort(),
    );
  });

  it('כל $ref מצביע על סכמה קיימת', () => {
    const refs = JSON.stringify(openapi).match(/#\/components\/schemas\/\w+/g) ?? [];
    const schemas = Object.keys(openapi.components.schemas);
    for (const ref of refs) {
      expect(schemas).toContain(ref.split('/').pop());
    }
  });
});

describe('Prisma', () => {
  it('prisma validate עובר', () => {
    expect(() => execSync('npx prisma validate', { stdio: 'pipe' })).not.toThrow();
  });

  it('ה־Migrations הוחלו והטבלאות קיימות', async () => {
    const tables = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    const names = tables.map((t) => t.table_name);
    expect(names).toEqual(expect.arrayContaining(['User', 'Activity']));
  });
});
