import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

const db = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/db.json'), 'utf8'));

const userIds = new Set((db.users || []).map(u => u.id));
const orderIds = new Set((db.orders || []).map(o => o.id));

function validUser(rec) { return rec.userId && userIds.has(rec.userId); }
function validActor(rec) { return !rec.actorId || userIds.has(rec.actorId); }
function safeDate(v, required=true) { if (!v) return required ? new Date() : null; const d = new Date(v); return isNaN(d.getTime()) ? new Date() : d; }
function validOrder(rec) { return rec.orderId && orderIds.has(rec.orderId); }

async function migrate() {
  console.log('Starting migration from db.json to PostgreSQL...\n');
  let skipped = 0;

  // 1. Users
  if (db.users?.length) {
    const count = await prisma.user.createMany({
      data: db.users.map(u => ({
        id: u.id, name: u.name || '', email: u.email,
        passwordHash: u.passwordHash, role: u.role || 'LEARNER',
        createdAt: safeDate(u.createdAt),
      })),
      skipDuplicates: true,
    });
    console.log(`Users: ${count.count}`);
  }

  // 2. Sessions
  if (db.sessions?.length) {
    const valid = db.sessions.filter(validUser);
    skipped += db.sessions.length - valid.length;
    const count = await prisma.session.createMany({
      data: valid.map(s => ({
        id: s.id, userId: s.userId, token: s.token,
        createdAt: safeDate(s.createdAt),
      })),
      skipDuplicates: true,
    });
    console.log(`Sessions: ${count.count}`);
  }

  // 3. Orders
  if (db.orders?.length) {
    const valid = db.orders.filter(validUser);
    skipped += db.orders.length - valid.length;
    const count = await prisma.order.createMany({
      data: valid.map(o => ({
        id: o.id, userId: o.userId, productId: o.productId,
        status: o.status || 'PENDING', amount: o.amount,
        currency: o.currency || 'GBP', createdAt: safeDate(o.createdAt),
        paidAt: safeDate(o.paidAt, false),
      })),
      skipDuplicates: true,
    });
    console.log(`Orders: ${count.count}`);
  }

  // 4. Payments
  if (db.payments?.length) {
    const valid = db.payments.filter(p => validUser(p) && validOrder(p));
    skipped += db.payments.length - valid.length;
    const count = await prisma.payment.createMany({
      data: valid.map(p => ({
        id: p.id, orderId: p.orderId, userId: p.userId,
        status: p.status, amount: p.amount, currency: p.currency || 'GBP',
        provider: p.provider, createdAt: safeDate(p.createdAt),
      })),
      skipDuplicates: true,
    });
    console.log(`Payments: ${count.count}`);
  }

  // 5. Entitlements
  if (db.entitlements?.length) {
    const valid = db.entitlements.filter(validUser);
    skipped += db.entitlements.length - valid.length;
    const count = await prisma.entitlement.createMany({
      data: valid.map(e => ({
        id: e.id, userId: e.userId, productId: e.productId,
        status: e.status || 'ACTIVE', courseIds: e.courseIds || [],
        toolkitIds: e.toolkitIds || [], access: e.access || 'all_courses',
        createdAt: safeDate(e.createdAt),
      })),
      skipDuplicates: true,
    });
    console.log(`Entitlements: ${count.count}`);
  }

  // 6. Enrolments
  if (db.enrolments?.length) {
    const valid = db.enrolments.filter(validUser);
    skipped += db.enrolments.length - valid.length;
    const count = await prisma.enrolment.createMany({
      data: valid.map(e => ({
        id: e.id, userId: e.userId, courseId: e.courseId,
        status: e.status || 'ACTIVE', createdAt: safeDate(e.createdAt),
      })),
      skipDuplicates: true,
    });
    console.log(`Enrolments: ${count.count}`);
  }

  // 7. Progress
  if (db.progress?.length) {
    const valid = db.progress.filter(validUser);
    skipped += db.progress.length - valid.length;
    const count = await prisma.progress.createMany({
      data: valid.map(p => ({
        id: p.id, userId: p.userId, courseId: p.courseId, moduleId: p.moduleId,
        status: p.status || 'NOT_STARTED', percent: p.percent || 0,
        updatedAt: safeDate(p.updatedAt),
        contentOpened: p.contentOpened || false, resourcesAccessed: p.resourcesAccessed || false,
        quizPassed: p.quizPassed || false, actionTaskSubmitted: p.actionTaskSubmitted || false,
        evidenceSubmitted: p.evidenceSubmitted || false, reflectionSubmitted: p.reflectionSubmitted || false,
        transferabilitySubmitted: p.transferabilitySubmitted || false,
        checklistCompleted: p.checklistCompleted || false,
        completedAt: safeDate(p.completedAt, false),
      })),
      skipDuplicates: true,
    });
    console.log(`Progress: ${count.count}`);
  }

  // 8. ResourceAccess
  if (db.resourceAccess?.length) {
    const valid = db.resourceAccess.filter(validUser);
    skipped += db.resourceAccess.length - valid.length;
    const count = await prisma.resourceAccess.createMany({
      data: valid.map(r => ({
        id: r.id, userId: r.userId, moduleId: r.moduleId,
        resourceId: r.resourceId, at: safeDate(r.at),
      })),
      skipDuplicates: true,
    });
    console.log(`ResourceAccess: ${count.count}`);
  }

  // 9. QuizAttempts
  if (db.quizAttempts?.length) {
    const valid = db.quizAttempts.filter(validUser);
    skipped += db.quizAttempts.length - valid.length;
    const count = await prisma.quizAttempt.createMany({
      data: valid.map(q => ({
        id: q.id, userId: q.userId, moduleId: q.moduleId,
        answers: q.answers || [], passed: q.passed || false, at: safeDate(q.at),
      })),
      skipDuplicates: true,
    });
    console.log(`QuizAttempts: ${count.count}`);
  }

  // 10. ActionTasks
  if (db.actionTasks?.length) {
    const valid = db.actionTasks.filter(validUser);
    skipped += db.actionTasks.length - valid.length;
    const count = await prisma.actionTask.createMany({
      data: valid.map(t => ({
        id: t.id, userId: t.userId, moduleId: t.moduleId,
        text: t.text, submittedAt: safeDate(t.submittedAt),
      })),
      skipDuplicates: true,
    });
    console.log(`ActionTasks: ${count.count}`);
  }

  // 11. EvidenceSubmissions
  if (db.evidenceSubmissions?.length) {
    const valid = db.evidenceSubmissions.filter(validUser);
    skipped += db.evidenceSubmissions.length - valid.length;
    const count = await prisma.evidenceSubmission.createMany({
      data: valid.map(e => ({
        id: e.id, userId: e.userId, moduleId: e.moduleId,
        title: e.title || '', text: e.text || '', files: e.files || [],
        status: e.status || 'SUBMITTED', submittedAt: safeDate(e.submittedAt),
      })),
      skipDuplicates: true,
    });
    console.log(`EvidenceSubmissions: ${count.count}`);
  }

  // 12. Reflections
  if (db.reflections?.length) {
    const valid = db.reflections.filter(validUser);
    skipped += db.reflections.length - valid.length;
    const count = await prisma.reflection.createMany({
      data: valid.map(r => ({
        id: r.id, userId: r.userId, moduleId: r.moduleId,
        text: r.text, submittedAt: safeDate(r.submittedAt),
      })),
      skipDuplicates: true,
    });
    console.log(`Reflections: ${count.count}`);
  }

  // 13. TransferabilityResponses
  if (db.transferabilityResponses?.length) {
    const valid = db.transferabilityResponses.filter(validUser);
    skipped += db.transferabilityResponses.length - valid.length;
    const count = await prisma.transferabilityResponse.createMany({
      data: valid.map(t => ({
        id: t.id, userId: t.userId, moduleId: t.moduleId,
        responses: t.responses || {}, complete: t.complete || false,
        submittedAt: safeDate(t.submittedAt),
      })),
      skipDuplicates: true,
    });
    console.log(`TransferabilityResponses: ${count.count}`);
  }

  // 14. ToolkitDownloads
  if (db.toolkitDownloads?.length) {
    const valid = db.toolkitDownloads.filter(validUser);
    skipped += db.toolkitDownloads.length - valid.length;
    const count = await prisma.toolkitDownload.createMany({
      data: valid.map(t => ({
        id: t.id, userId: t.userId, toolkitId: t.toolkitId, at: safeDate(t.at),
      })),
      skipDuplicates: true,
    });
    console.log(`ToolkitDownloads: ${count.count}`);
  }

  // 15. Bookings
  if (db.bookings?.length) {
    const count = await prisma.booking.createMany({
      data: db.bookings.map(b => ({
        id: b.id, name: b.name || '', email: b.email || '', service: b.service || '',
        notes: b.notes || null, createdAt: safeDate(b.createdAt),
        status: b.status || 'NEW', userId: null,
      })),
      skipDuplicates: true,
    });
    console.log(`Bookings: ${count.count}`);
  }

  // 16. CmsPages
  if (db.cmsPages && typeof db.cmsPages === 'object') {
    let cmsCount = 0;
    for (const [slug, content] of Object.entries(db.cmsPages)) {
      await prisma.cmsPage.upsert({
        where: { slug },
        create: { id: `CMS-${slug}`, slug, content },
        update: { content },
      });
      cmsCount++;
    }
    console.log(`CmsPages: ${cmsCount}`);
  }

  // 17. CookieConsent
  if (db.cookieConsent?.length) {
    const count = await prisma.cookieConsent.createMany({
      data: db.cookieConsent.map(c => ({
        id: c.id, choice: c.choice || 'unknown', ip: c.ip || '',
        at: safeDate(c.at), userId: null,
      })),
      skipDuplicates: true,
    });
    console.log(`CookieConsent: ${count.count}`);
  }

  // 18. AuditLogs
  if (db.auditLogs?.length) {
    const valid = db.auditLogs.filter(validActor);
    skipped += db.auditLogs.length - valid.length;
    const count = await prisma.auditLog.createMany({
      data: valid.map(a => ({
        id: a.id, action: a.action || 'unknown', actorId: a.actorId || null,
        meta: a.meta || {}, at: safeDate(a.at),
      })),
      skipDuplicates: true,
    });
    console.log(`AuditLogs: ${count.count}`);
  }

  console.log(`\nSkipped ${skipped} orphaned records (missing user references)`);
  console.log('Migration complete!\n');

  // Verify
  const counts = {
    users: await prisma.user.count(),
    sessions: await prisma.session.count(),
    orders: await prisma.order.count(),
    payments: await prisma.payment.count(),
    entitlements: await prisma.entitlement.count(),
    enrolments: await prisma.enrolment.count(),
    progress: await prisma.progress.count(),
    resourceAccess: await prisma.resourceAccess.count(),
    quizAttempts: await prisma.quizAttempt.count(),
    actionTasks: await prisma.actionTask.count(),
    evidenceSubmissions: await prisma.evidenceSubmission.count(),
    reflections: await prisma.reflection.count(),
    transferabilityResponses: await prisma.transferabilityResponse.count(),
    toolkitDownloads: await prisma.toolkitDownload.count(),
    bookings: await prisma.booking.count(),
    cmsPages: await prisma.cmsPage.count(),
    cookieConsent: await prisma.cookieConsent.count(),
    auditLogs: await prisma.auditLog.count(),
  };
  console.log('Database row counts:');
  for (const [table, count] of Object.entries(counts)) {
    console.log(`  ${table}: ${count}`);
  }
}

migrate()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
