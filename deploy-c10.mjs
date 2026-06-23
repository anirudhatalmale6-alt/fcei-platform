import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.join(__dirname, 'data', 'seed.json');
const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

const registry = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'c10_registry.json'), 'utf8'));
const lms = registry.lms_module;
const toolkit = registry.paid_addon_toolkit;

const coreResources = lms.resources.map(r => ({
  id: r.resource_id,
  title: r.title,
  description: r.purpose,
  type: 'template',
  downloadUrl: `/downloads/c10/${path.basename(r.path_pdf)}`,
  editableUrl: `/downloads/c10/${path.basename(r.path_docx)}`,
  format: 'PDF + DOCX'
}));

const toolkitResources = toolkit.templates.map(r => ({
  id: r.resource_id,
  title: r.title,
  description: r.purpose,
  type: 'toolkit',
  downloadUrl: `/downloads/c10/${path.basename(r.path_pdf)}`,
  editableUrl: `/downloads/c10/${path.basename(r.path_docx)}`,
  format: 'PDF + DOCX',
  requiresToolkit: true
}));

const quiz = lms.knowledge_check.map((q, i) => ({
  question: q.question,
  options: q.options,
  correctIndex: q.options.indexOf(q.answer)
}));

const keyTerms = lms.terminology.map(t => ({
  term: t.term,
  definition: t.definition
}));

const m01 = seed.modules.find(m => m.id === 'C10-M01');
if (m01) {
  m01.resources = [...coreResources, ...toolkitResources];
  m01.quiz = quiz;
  m01.keyTerms = keyTerms;
  m01.description = lms.sections.short_explanation;
  m01.learnerPhrasing = lms.sections.learner_phrasing;
  m01.evidenceRequirement = lms.sections.evidence_requirement;
  m01.reflectionPrompt = lms.sections.reflection_prompt;
  m01.certificateRule = lms.sections.certificate_rule;
  m01.certificateStatement = lms.sections.certificate_statement;
  console.log(`C10-M01 updated: ${m01.resources.length} resources, ${m01.quiz.length} quiz questions, ${m01.keyTerms.length} key terms`);
}

// Also update course description if needed
const c10 = seed.courses.find(c => c.id === 'C10');
if (c10) {
  c10.description = lms.sections.short_explanation;
  console.log('C10 course description updated');
}

fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2));
console.log('seed.json saved');
