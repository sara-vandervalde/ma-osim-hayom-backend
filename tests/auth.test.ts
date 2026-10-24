import jwt from 'jsonwebtoken';
import { api, auth, PASSWORD, registerChild, registerParent, resetDatabase, prisma } from './helpers';

describe('Auth', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('GET /api/health מחזיר ok', async () => {
    const res = await api().get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', database: 'ok' });
  });

  it('הרשמת הורה מחזירה Token ולא מחזירה סיסמה או Hash', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ username: 'Dana_P', password: PASSWORD, displayName: 'דנה', role: 'PARENT' });
    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ username: 'dana_p', role: 'PARENT', parentId: null });
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    expect(JSON.stringify(res.body)).not.toContain(PASSWORD);

    const stored = await prisma.user.findUniqueOrThrow({ where: { username: 'dana_p' } });
    expect(stored.passwordHash).not.toBe(PASSWORD);
  });

  it('הרשמת ילד מקשרת אותו להורה', async () => {
    const parent = await registerParent('parent1');
    const child = await registerChild('kid1', 'parent1');
    const me = await api().get('/api/auth/me').set(auth(child.token));
    expect(me.status).toBe(200);
    expect(me.body.user.parentId).toBe(parent.user.id);
    expect(me.body.user.parent.username).toBe('parent1');
  });

  it('ילד בלי שם משתמש של הורה → 400', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ username: 'kid', password: PASSWORD, displayName: 'נעם', role: 'CHILD' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('ילד עם הורה שלא קיים, או עם "הורה" שהוא ילד → 400', async () => {
    await registerParent('parent1');
    await registerChild('kid1', 'parent1');
    for (const parentUsername of ['nobody', 'kid1']) {
      const res = await api()
        .post('/api/auth/register')
        .send({ username: 'kid2', password: PASSWORD, displayName: 'נעם', role: 'CHILD', parentUsername });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('PARENT_NOT_FOUND');
    }
  });

  it('שם משתמש תפוס → 409', async () => {
    await registerParent('parent1');
    const res = await api()
      .post('/api/auth/register')
      .send({ username: 'PARENT1', password: PASSWORD, displayName: 'אחר', role: 'PARENT' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('USERNAME_TAKEN');
  });

  it('ולידציה בהרשמה: סיסמה קצרה ושם משתמש לא חוקי', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ username: 'א', password: '1', displayName: 'x', role: 'ADMIN' });
    expect(res.status).toBe(400);
    const fields = res.body.error.details.map((d: { field: string }) => d.field);
    expect(fields).toEqual(expect.arrayContaining(['username', 'password', 'displayName', 'role']));
  });

  it('Login תקין מחזיר Token שעובד ב־/me', async () => {
    await registerParent('parent1');
    const res = await api().post('/api/auth/login').send({ username: 'parent1', password: PASSWORD });
    expect(res.status).toBe(200);
    const me = await api().get('/api/auth/me').set(auth(res.body.token));
    expect(me.status).toBe(200);
    expect(me.body.user.username).toBe('parent1');
    expect(me.body.user.passwordHash).toBeUndefined();
  });

  it('Login עם סיסמה שגויה או משתמש שלא קיים → 401', async () => {
    await registerParent('parent1');
    const wrongPassword = await api().post('/api/auth/login').send({ username: 'parent1', password: 'wrong-pass' });
    const noUser = await api().post('/api/auth/login').send({ username: 'ghost', password: PASSWORD });
    expect(wrongPassword.status).toBe(401);
    expect(noUser.status).toBe(401);
    expect(wrongPassword.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('Login בלי שדות → 400', async () => {
    const res = await api().post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  it('JSON לא תקין → 400', async () => {
    const res = await api().post('/api/auth/login').set('Content-Type', 'application/json').send('{bad json');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it('Token חסר → 401', async () => {
    const res = await api().get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('Token לא תקין → 401', async () => {
    const res = await api().get('/api/auth/me').set(auth('not-a-real-token'));
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('Token שנחתם עם סוד אחר → 401', async () => {
    const parent = await registerParent('parent1');
    const forged = jwt.sign({ role: 'PARENT' }, 'some-other-secret-1234567890', { subject: String(parent.user.id) });
    const res = await api().get('/api/auth/me').set(auth(forged));
    expect(res.status).toBe(401);
  });

  it('Token שפג תוקפו → 401', async () => {
    const parent = await registerParent('parent1');
    const expired = jwt.sign({ role: 'PARENT' }, process.env.JWT_SECRET!, {
      subject: String(parent.user.id),
      expiresIn: -10,
    });
    const res = await api().get('/api/auth/me').set(auth(expired));
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('כתובת שלא קיימת → 404', async () => {
    const res = await api().get('/api/nothing-here');
    expect(res.status).toBe(404);
  });
});
