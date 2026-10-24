import {
  activityInput,
  api,
  auth,
  createActivity,
  prisma,
  registerChild,
  registerParent,
  resetDatabase,
} from './helpers';

/**
 * תרחיש: שתי משפחות.
 * משפחה 1: parentA + kidA.  משפחה 2: parentB + kidB.
 */
let parentA: string;
let kidA: string;
let parentB: string;
let kidB: string;
let kidAId: number;

beforeEach(async () => {
  await resetDatabase();
  parentA = (await registerParent('parent_a')).token;
  const kid = await registerChild('kid_a', 'parent_a');
  kidA = kid.token;
  kidAId = kid.user.id;
  parentB = (await registerParent('parent_b')).token;
  kidB = (await registerChild('kid_b', 'parent_b')).token;
});

afterAll(async () => {
  await prisma.$disconnect();
});

const titles = (body: { activities: { title: string }[] }) => body.activities.map((a) => a.title).sort();

describe('CRUD', () => {
  it('הורה מוסיף פעילות – היא מאושרת מיד', async () => {
    const res = await api()
      .post('/api/activities')
      .set(auth(parentA))
      .send(activityInput({ isPublic: true }));
    expect(res.status).toBe(201);
    expect(res.body.activity).toMatchObject({ status: 'APPROVED', isPublic: true, title: 'מגדל מקרטונים' });
    expect(res.body.activity.createdBy.displayName).toBe('הורה parent_a');
  });

  it('ילד מוסיף רעיון – הוא ממתין ותמיד פרטי', async () => {
    const res = await api()
      .post('/api/activities')
      .set(auth(kidA))
      .send(activityInput({ isPublic: true }));
    expect(res.status).toBe(201);
    expect(res.body.activity).toMatchObject({ status: 'PENDING', isPublic: false });
  });

  it('קריאת פעילות אחת, עריכה ומחיקה על ידי הורה', async () => {
    const created = await createActivity(parentA);

    const get = await api().get(`/api/activities/${created.id}`).set(auth(parentA));
    expect(get.status).toBe(200);

    const put = await api()
      .put(`/api/activities/${created.id}`)
      .set(auth(parentA))
      .send(activityInput({ title: 'מגדל קרטונים ענק', durationMinutes: 50, isPublic: true }));
    expect(put.status).toBe(200);
    expect(put.body.activity).toMatchObject({ title: 'מגדל קרטונים ענק', durationMinutes: 50, isPublic: true });

    const del = await api().delete(`/api/activities/${created.id}`).set(auth(parentA));
    expect(del.status).toBe(204);
    const after = await api().get(`/api/activities/${created.id}`).set(auth(parentA));
    expect(after.status).toBe(404);
  });

  it('הנתונים נשמרים במסד הנתונים', async () => {
    const created = await createActivity(parentA, { title: 'נשמר במסד' });
    const row = await prisma.activity.findUnique({ where: { id: created.id } });
    expect(row?.title).toBe('נשמר במסד');
  });

  it('מזהה לא קיים → 404, מזהה לא מספרי → 400', async () => {
    expect((await api().get('/api/activities/99999').set(auth(parentA))).status).toBe(404);
    expect((await api().get('/api/activities/abc').set(auth(parentA))).status).toBe(400);
  });
});

describe('Validation', () => {
  it('שדות חובה חסרים → 400 עם פירוט', async () => {
    const res = await api().post('/api/activities').set(auth(parentA)).send({ title: 'x' });
    expect(res.status).toBe(400);
    const fields = res.body.error.details.map((d: { field: string }) => d.field);
    expect(fields).toEqual(
      expect.arrayContaining(['title', 'description', 'category', 'location', 'minAge', 'maxAge', 'durationMinutes', 'cost']),
    );
  });

  it('גיל מינימלי גדול מהמקסימלי → 400', async () => {
    const res = await api().post('/api/activities').set(auth(parentA)).send(activityInput({ minAge: 10, maxAge: 5 }));
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].field).toBe('maxAge');
  });

  it('ערכים לא חוקיים בקטגוריה ובמשך → 400', async () => {
    const res = await api()
      .post('/api/activities')
      .set(auth(parentA))
      .send(activityInput({ category: 'SPORT', durationMinutes: 0 }));
    expect(res.status).toBe(400);
  });

  it('פרמטר סינון לא חוקי → 400', async () => {
    const res = await api().get('/api/activities?category=SPORT').set(auth(parentA));
    expect(res.status).toBe(400);
  });
});

describe('הרשאות וגישה לרשומות פרטיות', () => {
  it('כל ה־Endpoints של פעילויות דורשים Token', async () => {
    expect((await api().get('/api/activities')).status).toBe(401);
    expect((await api().get('/api/activities/random')).status).toBe(401);
    expect((await api().post('/api/activities').send(activityInput())).status).toBe(401);
    expect((await api().put('/api/activities/1').send(activityInput())).status).toBe(401);
    expect((await api().delete('/api/activities/1')).status).toBe(401);
    expect((await api().patch('/api/activities/1/approve')).status).toBe(401);
    expect((await api().get('/api/users/children')).status).toBe(401);
  });

  it('ילד רואה פעילויות של המשפחה וציבוריות, ולא פרטיות של משפחה אחרת', async () => {
    await createActivity(parentA, { title: 'A פרטי' });
    await createActivity(parentA, { title: 'A ציבורי', isPublic: true });
    await createActivity(parentB, { title: 'B פרטי' });
    await createActivity(parentB, { title: 'B ציבורי', isPublic: true });

    const res = await api().get('/api/activities').set(auth(kidA));
    expect(res.status).toBe(200);
    expect(titles(res.body)).toEqual(['A ציבורי', 'A פרטי', 'B ציבורי'].sort());
  });

  it('גישה ישירה לפעילות פרטית של משפחה אחרת → 403', async () => {
    const privateB = await createActivity(parentB, { title: 'B פרטי' });
    expect((await api().get(`/api/activities/${privateB.id}`).set(auth(kidA))).status).toBe(403);
    expect((await api().get(`/api/activities/${privateB.id}`).set(auth(parentA))).status).toBe(403);
  });

  it('רעיון ממתין גלוי רק לילד שהציע ולהורה שלו', async () => {
    const idea = await createActivity(kidA, { title: 'רעיון של kidA' });

    const parentList = await api().get('/api/activities?status=PENDING').set(auth(parentA));
    expect(titles(parentList.body)).toEqual(['רעיון של kidA']);
    expect(parentList.body.activities[0].createdBy.id).toBe(kidAId);

    expect(titles((await api().get('/api/activities').set(auth(kidA))).body)).toContain('רעיון של kidA');
    expect(titles((await api().get('/api/activities').set(auth(parentB))).body)).not.toContain('רעיון של kidA');
    expect(titles((await api().get('/api/activities').set(auth(kidB))).body)).not.toContain('רעיון של kidA');
    expect((await api().get(`/api/activities/${idea.id}`).set(auth(parentB))).status).toBe(403);
  });

  it('אח שני במשפחה לא רואה רעיון ממתין של אחיו', async () => {
    await createActivity(kidA, { title: 'רעיון של kidA' });
    const sibling = (await registerChild('kid_a2', 'parent_a')).token;
    const res = await api().get('/api/activities').set(auth(sibling));
    expect(titles(res.body)).not.toContain('רעיון של kidA');
  });

  it('ילד לא יכול לערוך או למחוק פעילות של ההורה → 403', async () => {
    const parentActivity = await createActivity(parentA);
    expect((await api().put(`/api/activities/${parentActivity.id}`).set(auth(kidA)).send(activityInput())).status).toBe(403);
    expect((await api().delete(`/api/activities/${parentActivity.id}`).set(auth(kidA))).status).toBe(403);
  });

  it('ילד עורך רעיון שלו כל עוד הוא ממתין, ואחרי האישור כבר לא', async () => {
    const idea = await createActivity(kidA);
    const edit = await api()
      .put(`/api/activities/${idea.id}`)
      .set(auth(kidA))
      .send(activityInput({ title: 'רעיון משופר', isPublic: true }));
    expect(edit.status).toBe(200);
    expect(edit.body.activity).toMatchObject({ title: 'רעיון משופר', isPublic: false, status: 'PENDING' });

    await api().patch(`/api/activities/${idea.id}/approve`).set(auth(parentA)).send({});
    const editAfter = await api().put(`/api/activities/${idea.id}`).set(auth(kidA)).send(activityInput());
    expect(editAfter.status).toBe(403);
  });

  it('הורה לא יכול לערוך או למחוק פעילות של משפחה אחרת, גם אם היא ציבורית → 403', async () => {
    const publicB = await createActivity(parentB, { isPublic: true });
    expect((await api().put(`/api/activities/${publicB.id}`).set(auth(parentA)).send(activityInput())).status).toBe(403);
    expect((await api().delete(`/api/activities/${publicB.id}`).set(auth(parentA))).status).toBe(403);
  });

  it('הורה מאשר רעיון של הילד שלו ומסמן אותו כציבורי', async () => {
    const idea = await createActivity(kidA, { title: 'רעיון לאישור' });
    const res = await api().patch(`/api/activities/${idea.id}/approve`).set(auth(parentA)).send({ isPublic: true });
    expect(res.status).toBe(200);
    expect(res.body.activity).toMatchObject({ status: 'APPROVED', isPublic: true });

    // עכשיו גם משפחה אחרת רואה אותו
    expect(titles((await api().get('/api/activities').set(auth(kidB))).body)).toContain('רעיון לאישור');

    const again = await api().patch(`/api/activities/${idea.id}/approve`).set(auth(parentA)).send({});
    expect(again.status).toBe(409);
  });

  it('אישור בלי גוף בקשה – הפעילות נשארת פרטית', async () => {
    const idea = await createActivity(kidA);
    const res = await api().patch(`/api/activities/${idea.id}/approve`).set(auth(parentA));
    expect(res.status).toBe(200);
    expect(res.body.activity).toMatchObject({ status: 'APPROVED', isPublic: false });
  });

  it('ילד לא יכול לאשר, והורה לא יכול לאשר רעיון של ילד ממשפחה אחרת → 403', async () => {
    const idea = await createActivity(kidA);
    expect((await api().patch(`/api/activities/${idea.id}/approve`).set(auth(kidA))).status).toBe(403);
    expect((await api().patch(`/api/activities/${idea.id}/approve`).set(auth(parentB))).status).toBe(403);
  });

  it('הילדים שלי: הורה רואה את ילדיו, ילד מקבל 403', async () => {
    const res = await api().get('/api/users/children').set(auth(parentA));
    expect(res.status).toBe(200);
    expect(res.body.children.map((c: { username: string }) => c.username)).toEqual(['kid_a']);
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');

    expect((await api().get('/api/users/children').set(auth(kidA))).status).toBe(403);
  });

  it('המשתמש נקבע לפי ה־Token ולא לפי שדות שנשלחו', async () => {
    const res = await api()
      .post('/api/activities')
      .set(auth(kidA))
      .send({ ...activityInput(), createdById: 999, familyId: 999, status: 'APPROVED' });
    expect(res.status).toBe(201);
    expect(res.body.activity).toMatchObject({ status: 'PENDING', createdBy: { id: kidAId } });
  });
});

describe('חיפוש, סינון, מיון והגרלה', () => {
  beforeEach(async () => {
    await createActivity(parentA, {
      title: 'אפיית עוגיות', description: 'במטבח עם אמא', category: 'KITCHEN',
      location: 'HOME', minAge: 6, maxAge: 14, durationMinutes: 60, cost: 'PAID',
    });
    await createActivity(parentA, {
      title: 'מחבואים', description: 'בפארק הקרוב', category: 'GAME',
      location: 'OUTDOOR', minAge: 3, maxAge: 12, durationMinutes: 45, cost: 'FREE',
    });
    await createActivity(parentA, {
      title: 'ציור', description: 'יצירה עם צבעי מים', category: 'CRAFT',
      location: 'HOME', minAge: 2, maxAge: 5, durationMinutes: 20, cost: 'FREE',
    });
  });

  it('חיפוש לפי מילה בשם או בתיאור', async () => {
    expect(titles((await api().get(`/api/activities?search=${encodeURIComponent('עוגיות')}`).set(auth(parentA))).body)).toEqual(['אפיית עוגיות']);
    expect(titles((await api().get(`/api/activities?search=${encodeURIComponent('פארק')}`).set(auth(parentA))).body)).toEqual(['מחבואים']);
  });

  it('סינון לפי קטגוריה, מקום ועלות', async () => {
    expect(titles((await api().get('/api/activities?category=GAME').set(auth(kidA))).body)).toEqual(['מחבואים']);
    expect(titles((await api().get('/api/activities?location=HOME&cost=FREE').set(auth(kidA))).body)).toEqual(['ציור']);
  });

  it('סינון לפי גיל', async () => {
    const res = await api().get('/api/activities?age=4').set(auth(kidA));
    expect(titles(res.body)).toEqual(['מחבואים', 'ציור'].sort());
  });

  it('מיון לפי משך, עולה ויורד', async () => {
    const asc = await api().get('/api/activities?sort=duration&order=asc').set(auth(parentA));
    expect(asc.body.activities.map((a: { durationMinutes: number }) => a.durationMinutes)).toEqual([20, 45, 60]);
    const desc = await api().get('/api/activities?sort=duration&order=desc').set(auth(parentA));
    expect(desc.body.activities.map((a: { durationMinutes: number }) => a.durationMinutes)).toEqual([60, 45, 20]);
  });

  it('הגרלה מחזירה פעילות מתוך התוצאות המסוננות', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await api().get('/api/activities/random?location=HOME').set(auth(kidA));
      expect(res.status).toBe(200);
      expect(res.body.activity.location).toBe('HOME');
    }
  });

  it('הגרלה בלי תוצאות → 404', async () => {
    const res = await api().get('/api/activities/random?category=MOVEMENT').set(auth(kidA));
    expect(res.status).toBe(404);
  });

  it('הגרלה לא מחזירה פעילות פרטית של משפחה אחרת', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await api().get('/api/activities/random').set(auth(kidB));
      expect(res.status).toBe(404); // כל הפעילויות של משפחה A פרטיות
    }
  });
});
