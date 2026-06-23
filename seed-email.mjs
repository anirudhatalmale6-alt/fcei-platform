import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

const identities = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'fcei_sender_identities_v1.json'), 'utf8'));
const triggers = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'fcei_email_trigger_templates_v1.json'), 'utf8'));

async function main() {
  for (const id of identities.identities) {
    await prisma.emailSenderIdentity.upsert({
      where: { senderKey: id.key },
      create: {
        senderKey: id.key,
        displayName: id.display_name,
        email: id.email,
        replyTo: id.email,
        purpose: id.purpose,
        isActive: true
      },
      update: {
        displayName: id.display_name,
        email: id.email,
        replyTo: id.email,
        purpose: id.purpose
      }
    });
    console.log('Sender:', id.key, '->', id.email);
  }

  for (const t of triggers.templates) {
    let bodyHtml = null, bodyText = null;
    const htmlPath = path.join(__dirname, 'templates', 'html', t.template_id + '.html');
    const txtPath = path.join(__dirname, 'templates', 'txt', t.template_id + '.txt');
    if (fs.existsSync(htmlPath)) bodyHtml = fs.readFileSync(htmlPath, 'utf8');
    if (fs.existsSync(txtPath)) bodyText = fs.readFileSync(txtPath, 'utf8');

    await prisma.emailTemplate.upsert({
      where: { templateId: t.template_id },
      create: {
        templateId: t.template_id,
        triggerName: t.trigger,
        senderKey: t.sender_key,
        subject: t.subject,
        preheader: t.preheader || null,
        bodyHtml,
        bodyText,
        isActive: true
      },
      update: {
        triggerName: t.trigger,
        senderKey: t.sender_key,
        subject: t.subject,
        preheader: t.preheader || null,
        bodyHtml,
        bodyText
      }
    });
    console.log('Template:', t.template_id, '->', t.trigger);
  }

  const sCount = await prisma.emailSenderIdentity.count();
  const tCount = await prisma.emailTemplate.count();
  console.log(`\nSeeded ${sCount} sender identities, ${tCount} email templates`);
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); process.exit(1); });
