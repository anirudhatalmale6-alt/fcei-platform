import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.join(__dirname, 'data', 'seed.json');
const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

const coursePrices = {
  C01: 1900, C02: 1900, C03: 4900, C04: 4900, C05: 4900,
  C06: 3900, C07: 3900, C08: 3900, C09: 4900, C10: 5900,
  C11: 4900, C12: 5900, C13: 5900, C14: 7900
};

const modulePrice = 1100;

const toolkitPrices = {
  'TK-C01': 700, 'TK-C02': 700, 'TK-C03': 700,
  'TK-C04': 1900, 'TK-C05': 1900, 'TK-C06': 700,
  'TK-C07': 700, 'TK-C08': 1900, 'TK-C09': 1900,
  'TK-C10': 1900, 'TK-C11': 1900, 'TK-C12': 1900,
  'TK-C13': 1900, 'TK-C14': 1900,
  'TK-LIBRARY': 14900, 'TOOLKIT-FULL': 14900,
  'TK-MODULE': 700
};

const bundlePrices = {
  'PROD-B01-BUNDLE': 12900,
  'PROD-B02-BUNDLE': 19900,
  'PROD-B03-BUNDLE': 24900,
  'PROD-B04-BUNDLE': 12900,
  'PROD-B05-BUNDLE': 19900,
  'PROD-B06-BUNDLE': 39900,
  'FCEI-FULL-LIBRARY': 39900
};

let changes = 0;

for (const p of seed.products) {
  const oldPrice = p.price;

  if (p.type === 'COURSE' && p.id.match(/^PROD-C\d+-COURSE$|^P-C\d+$/)) {
    const cid = p.courseIds?.[0];
    if (cid && coursePrices[cid] !== undefined) {
      p.price = coursePrices[cid];
      if (oldPrice !== p.price) { console.log(`COURSE ${p.id}: ${oldPrice} -> ${p.price} (${cid})`); changes++; }
    }
  }

  if (p.type === 'MODULE' && p.id.match(/^PROD-C\d+-M\d+-MODULE$/)) {
    p.price = modulePrice;
    if (oldPrice !== p.price) { console.log(`MODULE ${p.id}: ${oldPrice} -> ${p.price}`); changes++; }
  }

  if (toolkitPrices[p.id] !== undefined) {
    p.price = toolkitPrices[p.id];
    if (oldPrice !== p.price) { console.log(`TOOLKIT ${p.id}: ${oldPrice} -> ${p.price}`); changes++; }
  }

  if (bundlePrices[p.id] !== undefined) {
    p.price = bundlePrices[p.id];
    if (oldPrice !== p.price) { console.log(`BUNDLE ${p.id}: ${oldPrice} -> ${p.price}`); changes++; }
  }
}

fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2));
console.log(`\nDone. ${changes} price changes applied.`);
