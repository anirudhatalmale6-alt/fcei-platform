import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.join(__dirname, 'data', 'seed.json');
const v3Path = path.join(__dirname, 'data', 'fcei-downloadables-v3.json');

const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
const v3 = JSON.parse(fs.readFileSync(v3Path, 'utf8'));

const mdDir = path.join(__dirname, 'public', 'downloads', 'v3', 'editables', 'markdown_by_module');
const jsonDir = path.join(__dirname, 'public', 'downloads', 'v3', 'editables', 'json_by_module');

const mdFiles = fs.readdirSync(mdDir);
const jsonFiles = fs.readdirSync(jsonDir);

function findFile(files, moduleId) {
  const prefix = moduleId.toLowerCase();
  return files.find(f => f.toLowerCase().startsWith(prefix.toLowerCase() + '_'));
}

let updated = 0;

for (const course of v3.courses) {
  const cid = course.course_id;
  const coursePdfPath = `/downloads/v3/pdf/by_course/${path.basename(course.course_pdf)}`;
  const courseDocxPath = `/downloads/v3/docs/by_course/${path.basename(course.course_docx)}`;

  for (const mod of course.modules) {
    const mid = mod.module_id;
    const seedModule = seed.modules.find(m => m.id === mid);
    if (!seedModule) {
      console.log(`WARN: module ${mid} not found in seed.json`);
      continue;
    }

    const mdFile = findFile(mdFiles, mid);
    const jFile = findFile(jsonFiles, mid);

    const resources = [
      {
        id: `${mid}-PACK-PDF`,
        title: `${course.title} - Resource Pack (PDF)`,
        description: `Complete downloadable resource pack for ${course.title}. Covers all 6 modules.`,
        type: 'course_pack',
        downloadUrl: coursePdfPath,
        format: 'PDF'
      },
      {
        id: `${mid}-PACK-DOCX`,
        title: `${course.title} - Resource Pack (Editable DOCX)`,
        description: `Editable version of the full resource pack for ${course.title}. Covers all 6 modules.`,
        type: 'course_pack',
        downloadUrl: courseDocxPath,
        format: 'DOCX'
      }
    ];

    if (mdFile) {
      resources.push({
        id: `${mid}-TPL-MD`,
        title: `${mod.title} - Editable Template (Markdown)`,
        description: `Editable professional template for ${mod.title}.`,
        type: 'editable_template',
        downloadUrl: `/downloads/v3/editables/markdown_by_module/${mdFile}`,
        format: 'Markdown'
      });
    }

    if (jFile) {
      resources.push({
        id: `${mid}-TPL-JSON`,
        title: `${mod.title} - Editable Template (JSON)`,
        description: `Structured data template for ${mod.title}.`,
        type: 'editable_template',
        downloadUrl: `/downloads/v3/editables/json_by_module/${jFile}`,
        format: 'JSON'
      });
    }

    seedModule.resources = resources;
    updated++;
    console.log(`${mid}: ${resources.length} resources (pack PDF+DOCX${mdFile ? ' + MD' : ''}${jFile ? ' + JSON' : ''})`);
  }
}

fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2));
console.log(`\nDone. ${updated}/84 modules updated with V3 downloadables.`);
