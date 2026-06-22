
import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

try{const ef=fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)),".env"),"utf8");ef.split(String.fromCharCode(10)).forEach(l=>{const[k,...v]=l.split("=");if(k&&k.trim()&&!k.startsWith("#"))process.env[k.trim()]=v.join("=").trim();})}catch(e){}
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8787);
const DB_PATH = path.join(__dirname, 'data', 'db.json');
const INITIAL_DB_PATH = path.join(__dirname, 'data', 'db.initial.json');
const SEED_PATH = path.join(__dirname, 'data', 'seed.json');
const PUBLIC_DIR = path.join(__dirname, 'public');
const UPLOAD_DIR = path.join(__dirname, 'storage', 'uploads');
const CERT_DIR = path.join(__dirname, 'storage', 'certificates');
const SCORM_DIR = path.join(__dirname, 'scorm');
for (const d of [UPLOAD_DIR,CERT_DIR]) fs.mkdirSync(d,{recursive:true});
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_RESTRICTED_KEY || '';
const SITE_URL = process.env.SITE_URL || 'https://fcei.eu/platform';
const SEO_DATA = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)),'data','seo.json'),'utf8'));
const ORG_JSONLD = JSON.stringify({"@context":"https://schema.org","@type":"Organization","name":"Finland Creative Education Institute","url":"https://fcei.eu","logo":"https://fcei.eu/platform/fcei-logo.png","description":"Finnish-inspired teacher training and school improvement platform. EDUFI-aligned, FINEEC-benchmarked.","sameAs":["https://fcei.eu"]});
function injectSEO(html, opts) {
  var title = opts.title || 'FCEI | Finnish Creative Education Institute';
  var desc = opts.desc || 'Finnish-inspired teacher training and school improvement. EDUFI-aligned, FINEEC-benchmarked professional development courses.';
  var ogTitle = opts.ogTitle || title;
  var ogDesc = opts.ogDesc || desc;
  var canonical = opts.canonical || 'https://fcei.eu';
  var jsonld = opts.jsonld || ORG_JSONLD;
  var noindex = opts.noindex || false;
  function rep(h,regex,tag){ return regex.test(h) ? h.replace(regex,tag) : h.replace('</head>',tag+'\n</head>'); }
  html = html.replace(/<title>[^<]*<\/title>/, '<title>' + title + '</title>');
  html = rep(html, /<meta name="description"[^>]*>/, '<meta name="description" content="' + desc.replace(/"/g,'&quot;') + '">');
  html = rep(html, /<link rel="canonical"[^>]*>/, '<link rel="canonical" href="' + canonical + '">');
  html = rep(html, /<meta property="og:title"[^>]*>/, '<meta property="og:title" content="' + ogTitle.replace(/"/g,'&quot;') + '">');
  html = rep(html, /<meta property="og:description"[^>]*>/, '<meta property="og:description" content="' + ogDesc.replace(/"/g,'&quot;') + '">');
  html = rep(html, /<meta property="og:url"[^>]*>/, '<meta property="og:url" content="' + canonical + '">');
  var extra = '<link rel="icon" type="image/png" href="/fcei-logo.png">\n' + (noindex ? '<meta name="robots" content="noindex,nofollow">\n' : '<meta name="robots" content="index,follow">\n') +
    '<meta name="twitter:card" content="summary_large_image">\n' + '<meta name="twitter:title" content="' + ogTitle.replace(/"/g,'&quot;') + '">\n' + '<meta name="twitter:description" content="' + ogDesc.replace(/"/g,'&quot;') + '">\n' +
    '<script type="application/ld+json">' + jsonld + '</script>\n';
  html = html.replace('</head>', extra + '</head>');
  return html;
}

function stripeRequest(endpoint, params, method) {
  return new Promise((resolve, reject) => {
    const m = method || 'POST';
    const data = m === 'GET' ? '' : new URLSearchParams(params).toString();
    const p = m === 'GET' && Object.keys(params).length ? endpoint + '?' + new URLSearchParams(params).toString() : endpoint;
    const headers = { 'Authorization': 'Bearer ' + STRIPE_KEY };
    if (m === 'POST') { headers['Content-Type'] = 'application/x-www-form-urlencoded'; headers['Content-Length'] = Buffer.byteLength(data); }
    const options = { hostname: 'api.stripe.com', port: 443, path: p, method: m, headers };
    const r = https.request(options, (res) => {
      let body = ''; res.on('data', c => body += c); res.on('end', () => { try { resolve(JSON.parse(body)); } catch(e) { reject(e); } });
    });
    r.on('error', reject);
    if (m === 'POST') r.write(data);
    r.end();
  });
}
const PREMIUM_COUNTRIES = new Set([
  'GB','IE','FR','DE','IT','ES','PT','NL','BE','LU','AT','CH','SE','NO','DK','FI','IS',
  'PL','CZ','SK','HU','RO','BG','HR','SI','EE','LV','LT','GR','CY','MT',
  'US','CA','MX','AU','NZ','SG','SA','AE','OM','QA','BH','KW','CN','HK','MO','TW','JP','KR'
]);
const PREMIUM_SURCHARGE = 2000;
function getClientIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || '';
}
function geoLookup(ip) {
  return new Promise((resolve) => {
    if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) { resolve(''); return; }
    const clean = ip.replace(/^::ffff:/, '');
    const options = { hostname: 'ip-api.com', path: '/json/' + clean + '?fields=countryCode', timeout: 3000 };
    const r = http.get(options, (res) => {
      let body = ''; res.on('data', c => body += c);
      res.on('end', () => { try { resolve(JSON.parse(body).countryCode || ''); } catch(e) { resolve(''); } });
    });
    r.on('error', () => resolve(''));
    r.on('timeout', () => { r.destroy(); resolve(''); });
    setTimeout(() => { try { r.destroy(); } catch(e) {} resolve(''); }, 4000);
  });
}


const seed = JSON.parse(fs.readFileSync(SEED_PATH,'utf8'));
const flags = ['contentOpened','resourcesAccessed','quizPassed','actionTaskSubmitted','evidenceSubmitted','reflectionSubmitted','transferabilitySubmitted','checklistCompleted'];

function ensureDb(){ if(!fs.existsSync(DB_PATH)) fs.copyFileSync(INITIAL_DB_PATH,DB_PATH); }
function readDb(){ ensureDb(); return JSON.parse(fs.readFileSync(DB_PATH,'utf8')); }
function writeDb(db){ fs.writeFileSync(DB_PATH,JSON.stringify(db,null,2)); }
function id(p){ return `${p}-${crypto.randomBytes(6).toString('hex')}`; }
function now(){ return new Date().toISOString(); }
const SEC_HDRS={'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','X-XSS-Protection':'1; mode=block','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=()'};
const ALLOWED_ORIGINS=new Set(['https://fcei.eu','https://www.fcei.eu','http://localhost:8787']);
function corsOrigin(req){ const o=(req&&req.headers&&req.headers.origin)||''; return ALLOWED_ORIGINS.has(o)?o:'https://fcei.eu'; }
function sendJson(res,status,body,req){ res.writeHead(status, {...SEC_HDRS,'Content-Type':'application/json','Access-Control-Allow-Origin':corsOrigin(req),'Access-Control-Allow-Headers':'Content-Type, Authorization, X-Session-Token','Access-Control-Allow-Methods':'GET,POST,PUT,DELETE,OPTIONS'}); res.end(JSON.stringify(body,null,2)); }
function sendText(res,status,body,type='text/plain'){ res.writeHead(status, {...SEC_HDRS,'Content-Type':type,'Access-Control-Allow-Origin':'https://fcei.eu'}); res.end(body); }
function bad(res,msg,status=400,req=null){ sendJson(res,status,{error:msg},req); }
function parseUrl(req){ const u=new URL(req.url,'http://localhost'); return {path:u.pathname, query:Object.fromEntries(u.searchParams.entries())}; }
function body(req){ return new Promise((resolve,reject)=>{ const chunks=[]; req.on('data',c=>chunks.push(c)); req.on('end',()=>resolve(Buffer.concat(chunks))); req.on('error',reject); }); }
function jsonParse(buf){ try{return JSON.parse(buf.toString()||'{}')}catch{return {}} }
function audit(db,action,actorId='system',meta={}){ db.auditLogs.push({id:id('AUD'),action,actorId,meta,at:now()}); }
function userFromReq(req,db){ const h=req.headers.authorization||''; const t=h.startsWith('Bearer ')?h.slice(7):(req.headers['x-session-token']||''); const s=db.sessions.find(x=>x.token===t && !x.revokedAt && (!x.expiresAt || new Date(x.expiresAt)>new Date())); return s ? db.users.find(u=>u.id===s.userId) : null; }
function requireUser(req,res,db){ const u=userFromReq(req,db); if(!u){bad(res,'Authentication required',401); return null;} return u; }
function requireAdmin(req,res,db){ const u=requireUser(req,res,db); if(!u)return null; if(u.role!=='ADMIN'){bad(res,'Admin only',403); return null;} return u; }
function course(id){ return seed.courses.find(c=>c.id===id); }
function mod(id){ return seed.modules.find(m=>m.id===id); }
function mods(courseId){ return seed.modules.filter(m=>m.courseId===courseId).sort((a,b)=>a.order-b.order); }
function product(id){ return seed.products.find(p=>p.id===id); }
function publicUser(u){ return {id:u.id,name:u.name,email:u.email,role:u.role}; }
function hash(p){ if(!p||!String(p).trim()) return '!EMPTY!'; return crypto.createHash('sha256').update(String(p)).digest('hex'); }
function sanitize(s){ return String(s||'').replace(/[<>"]/g, c=>({'<':'&lt;','>':'&gt;','"':'&quot;'}[c]||c)); }
function sessionExpiry(){ return new Date(Date.now()+24*60*60*1000).toISOString(); }
const _rateLimits=new Map();
function rateLimit(key,max,windowMs){ const now=Date.now(); let rec=_rateLimits.get(key); if(!rec||now-rec.start>windowMs){rec={start:now,count:0};_rateLimits.set(key,rec);} rec.count++; return rec.count>max; }
function hasCourse(db,userId,courseId){ return db.entitlements.some(e=>e.userId===userId && e.status==='ACTIVE' && (e.courseIds||[]).includes(courseId)); }
function hasToolkit(db,userId,toolkitId){ return db.entitlements.some(e=>e.userId===userId && e.status==='ACTIVE' && ((e.toolkitIds||[]).includes(toolkitId)|| (e.toolkitIds||[]).includes('TOOLKIT-FULL'))); }
function ensureProgress(db,userId,courseId,moduleId){ let p=db.progress.find(x=>x.userId===userId && x.moduleId===moduleId); if(!p){ p={id:id('PROG'),userId,courseId,moduleId,status:'NOT_STARTED',percent:0,updatedAt:now()}; for(const f of flags) p[f]=false; db.progress.push(p);} return p; }
function recalc(p){ const done=flags.filter(f=>p[f]).length; p.percent=Math.round(done/flags.length*100); p.status=done===flags.length?'COMPLETE':done>0?'IN_PROGRESS':'NOT_STARTED'; p.updatedAt=now(); if(p.status==='COMPLETE'&&!p.completedAt)p.completedAt=now(); return p; }
function ensureEnrollments(db,userId,courseIds){ for(const courseId of courseIds){ if(!db.enrolments.find(e=>e.userId===userId&&e.courseId===courseId)) db.enrolments.push({id:id('ENR'),userId,courseId,status:'ACTIVE',createdAt:now()}); for(const m of mods(courseId)) ensureProgress(db,userId,courseId,m.id); } }
function grant(db,user,p){ const courseIds=p.courseIds||[]; const toolkitIds=(p.type||'').includes('TOOLKIT')?[p.id]:[]; const e={id:id('ENT'),userId:user.id,productId:p.id,status:'ACTIVE',courseIds,toolkitIds,access:p.access,createdAt:now()}; db.entitlements.push(e); ensureEnrollments(db,user.id,courseIds); return e; }
function certificateIfComplete(db,user,courseId){ const all=mods(courseId); const complete=all.length && all.every(m=>db.progress.find(p=>p.userId===user.id&&p.moduleId===m.id&&p.status==='COMPLETE')); if(!complete) return null; let cert=db.certificates.find(c=>c.userId===user.id&&c.courseId===courseId); if(!cert){ const code=`FCEI-${courseId}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`; cert={id:id('CERT'),userId:user.id,learnerName:user.name,courseId,courseTitle:course(courseId)?.title,status:'ISSUED',verificationCode:code,verificationUrl:`/verify/${code}`,issuedAt:now()}; db.certificates.push(cert); fs.writeFileSync(path.join(CERT_DIR,`${code}.txt`),`FCEI Completion Record\n${user.name}\n${course(courseId)?.title}\n${code}\n${cert.issuedAt}\n`); } return cert; }
function dashboard(db,user){ const enrols=db.enrolments.filter(e=>e.userId===user.id&&e.status==='ACTIVE'); const courses=enrols.map(e=>{ const ms=mods(e.courseId); const ps=ms.map(m=>ensureProgress(db,user.id,e.courseId,m.id)); const c=course(e.courseId); const complete=ps.filter(p=>p.status==='COMPLETE').length; const next=ms.find(m=>!db.progress.find(p=>p.userId===user.id&&p.moduleId===m.id&&p.status==='COMPLETE')); return {course:c,totalModules:ms.length,completedModules:complete,progressPercent:ms.length?Math.round(complete/ms.length*100):0,nextModuleId:next?.id||null,certificateStatus:db.certificates.find(x=>x.userId===user.id&&x.courseId===e.courseId)?.status||'NOT_ELIGIBLE'}; }); return {user:publicUser(user),courses,entitlements:db.entitlements.filter(e=>e.userId===user.id),certificates:db.certificates.filter(c=>c.userId===user.id),toolkitDownloads:db.toolkitDownloads.filter(d=>d.userId===user.id)}; }
function sendFile(res,file){ if(!fs.existsSync(file))return bad(res,'File not found',404); const ext=path.extname(file); const types={'.html':'text/html','.css':'text/css','.js':'application/javascript','.json':'application/json','.txt':'text/plain','.md':'text/markdown','.pdf':'application/pdf','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.gif':'image/gif','.svg':'image/svg+xml','.woff2':'font/woff2','.woff':'font/woff','.ico':'image/x-icon'}; const cacheTime=['.jpg','.jpeg','.png','.webp','.gif','.svg','.woff2','.woff','.ico'].includes(ext)?86400:['.css','.js'].includes(ext)?3600:0; res.writeHead(200, {...SEC_HDRS,'Content-Type':types[ext]||'application/octet-stream','Cache-Control':cacheTime?'public, max-age='+cacheTime:'no-cache'}); fs.createReadStream(file).pipe(res); }
async function multipart(req,boundary){ const buf=await body(req); const raw=buf.toString('binary'); const parts=raw.split(`--${boundary}`).filter(p=>p.includes('Content-Disposition')); const fields={}; const files=[]; for(const p of parts){ const [head,b='']=p.split('\r\n\r\n'); const nm=/name="([^"]+)"/.exec(head); if(!nm)continue; const fm=/filename="([^"]*)"/.exec(head); const content=b.replace(/\r\n--$/,'').replace(/\r\n$/,''); if(fm && fm[1]){ const safe=path.basename(fm[1]).replace(/[^a-zA-Z0-9._-]/g,'_'); const stored=`${Date.now()}-${crypto.randomBytes(3).toString('hex')}-${safe}`; fs.writeFileSync(path.join(UPLOAD_DIR,stored),Buffer.from(content,'binary')); files.push({field:nm[1],originalName:safe,url:`/uploads/${stored}`}); } else fields[nm[1]]=content; } return {fields,files}; }

async function api(req,res,pathname,query){ const db=readDb(); if(req.method==='OPTIONS') return sendJson(res,200,{});
  try{
    if(req.method==='GET' && pathname==='/api/site') return sendJson(res,200,{brand:seed.brand,copy:seed.siteCopy,content:seed.content,courses:seed.courses,products:seed.products,services:seed.services});
    if(req.method==='GET' && pathname==='/api/catalogue') return sendJson(res,200,{courses:seed.courses,products:seed.products,tags:[...new Set(seed.courses.flatMap(c=>c.tags||[]))],copy:seed.siteCopy});
    if(req.method==='GET' && pathname.startsWith('/api/courses/')){ const id=pathname.split('/')[3]; const c=course(id); if(!c) return bad(res,'Course not found',404); return sendJson(res,200,{course:c,modules:mods(id),product:seed.products.find(p=>(p.courseIds||[]).includes(id)&&p.type==='COURSE')}); }
    if(req.method==='GET' && pathname==='/api/user/entitlements'){ const u=userFromReq(req,db); if(!u) return sendJson(res,200,{courseIds:[]}); const cids=[]; db.entitlements.filter(e=>e.userId===u.id&&e.status==='ACTIVE').forEach(e=>(e.courseIds||[]).forEach(c=>{if(!cids.includes(c))cids.push(c);})); return sendJson(res,200,{courseIds:cids}); }
    if(req.method==='POST' && pathname==='/api/auth/register'){ const clientIp=getClientIp(req); if(rateLimit('reg:'+clientIp,5,300000)) return bad(res,'Too many attempts, try again later',429); const b=jsonParse(await body(req)); if(!b.email||!String(b.email).includes('@'))return bad(res,'Valid email required'); if(!b.password||String(b.password).length<6)return bad(res,'Password must be at least 6 characters'); let u=db.users.find(x=>x.email.toLowerCase()===b.email.toLowerCase()); if(u) return bad(res,'Email already registered',409); u={id:id('USER'),name:sanitize(b.name||b.email.split('@')[0]),email:b.email.toLowerCase().trim(),passwordHash:hash(b.password),role:'LEARNER',createdAt:now()}; db.users.push(u); const token=id('SESS'); db.sessions.push({id:id('SESSION'),userId:u.id,token,createdAt:now(),expiresAt:sessionExpiry()}); audit(db,'auth.register',u.id); writeDb(db); return sendJson(res,201,{user:publicUser(u),token}); }
    if(req.method==='POST' && pathname==='/api/auth/login'){ const clientIp=getClientIp(req); if(rateLimit('login:'+clientIp,10,300000)) return bad(res,'Too many attempts, try again later',429); const b=jsonParse(await body(req)); const u=db.users.find(x=>x.email.toLowerCase()===String(b.email||'').toLowerCase() && x.passwordHash===hash(b.password)); if(!u)return bad(res,'Invalid login',401); const token=id('SESS'); db.sessions.push({id:id('SESSION'),userId:u.id,token,createdAt:now(),expiresAt:sessionExpiry()}); writeDb(db); return sendJson(res,200,{user:publicUser(u),token}); }
    if(req.method==='POST' && pathname==='/api/auth/logout'){ const h=req.headers.authorization||''; const t=h.startsWith('Bearer ')?h.slice(7):(req.headers['x-session-token']||''); const s=db.sessions.find(x=>x.token===t && !x.revokedAt); if(s){s.revokedAt=now(); writeDb(db);} return sendJson(res,200,{loggedOut:true}); }
    if(req.method==='POST' && pathname==='/api/checkout/create'){ const u=requireUser(req,res,db); if(!u)return; const b=jsonParse(await body(req)); const p=product(b.productId); if(!p)return bad(res,'Product not found'); const order={id:id('ORDER'),userId:u.id,productId:p.id,status:'PENDING',amount:p.price,currency:p.currency||'USD',createdAt:now()}; db.orders.push(order); audit(db,'checkout.create',u.id,{orderId:order.id,productId:p.id}); writeDb(db); try { const clientIp = getClientIp(req); const country = await geoLookup(clientIp); const isPremium = PREMIUM_COUNTRIES.has(country); const finalPrice = isPremium ? p.price + PREMIUM_SURCHARGE : p.price; order.country = country; order.isPremium = isPremium; order.finalAmount = finalPrice; writeDb(db); const session = await stripeRequest('/v1/checkout/sessions', { 'payment_method_types[0]': 'card', 'line_items[0][price_data][currency]': (p.currency||'usd').toLowerCase(), 'line_items[0][price_data][unit_amount]': String(finalPrice), 'line_items[0][price_data][product_data][name]': (p.title || course((p.courseIds||[])[0])?.title || 'FCEI Course'), 'line_items[0][quantity]': '1', 'mode': 'payment', 'success_url': SITE_URL.replace(/#.*$/,'') + '/stripe-success?session_id={CHECKOUT_SESSION_ID}&order_id=' + order.id, 'cancel_url': SITE_URL + '#/catalogue', 'client_reference_id': order.id, 'customer_email': u.email, 'metadata[orderId]': order.id, 'metadata[userId]': u.id, 'metadata[productId]': p.id }); if(session.error) return bad(res, session.error.message || 'Stripe error'); order.stripeSessionId = session.id; writeDb(db); return sendJson(res,200,{order, checkoutUrl: session.url}); } catch(e) { console.error('Stripe error:', e); return bad(res, 'Payment service error'); } }
    if(req.method==='POST' && pathname==='/api/payments/stripe-confirm'){ const u=requireUser(req,res,db); if(!u)return; const b=jsonParse(await body(req)); const o=db.orders.find(x=>x.id===b.orderId&&x.userId===u.id); if(!o)return bad(res,'Order not found'); if(o.status==='PAID') return sendJson(res,200,{order:o,already:true,dashboard:dashboard(db,u)}); try { const session = await stripeRequest('/v1/checkout/sessions/' + (b.sessionId || o.stripeSessionId), {}, 'GET'); if(!session || session.payment_status !== 'paid') return bad(res,'Payment not yet confirmed'); o.status='PAID'; o.paidAt=now(); o.stripePaymentId=session.payment_intent; const p=product(o.productId); const pay={id:id('PAY'),orderId:o.id,userId:u.id,status:'PAID',amount:o.amount,currency:o.currency,provider:'stripe',stripeSessionId:b.sessionId||o.stripeSessionId,createdAt:now()}; db.payments.push(pay); const ent=grant(db,u,p); audit(db,'payment.confirmed',u.id,{orderId:o.id,entitlementId:ent.id,provider:'stripe'}); writeDb(db); return sendJson(res,200,{order:o,payment:pay,entitlement:ent,dashboard:dashboard(db,u)}); } catch(e) { console.error('Stripe verify error:', e); return bad(res,'Could not verify payment'); } }
    if(req.method==='GET' && pathname==='/api/dashboard'){ const u=requireUser(req,res,db); if(!u)return; const d=dashboard(db,u); writeDb(db); return sendJson(res,200,d); }
    const modMatch=pathname.match(/^\/api\/lms\/courses\/([^/]+)\/modules\/([^/]+)$/); if(req.method==='GET'&&modMatch){ const u=requireUser(req,res,db); if(!u)return; const [_,courseId,moduleId]=modMatch; if(!hasCourse(db,u.id,courseId))return bad(res,'Course access required',403); const m=mod(moduleId); if(!m||m.courseId!==courseId)return bad(res,'Module not found',404); const p=ensureProgress(db,u.id,courseId,moduleId); const courseMods=mods(courseId); const idx=courseMods.findIndex(x=>x.id===moduleId); const next=courseMods[idx+1]?.id||null; writeDb(db); return sendJson(res,200,{module:m,course:course(courseId),progress:p,nextModuleId:next,scormLesson:seed.scormLessons.find(x=>x.moduleId===moduleId)}); }
    const stepMatch=pathname.match(/^\/api\/lms\/modules\/([^/]+)\/([^/]+)$/); if(req.method==='POST'&&stepMatch){ const u=requireUser(req,res,db); if(!u)return; const moduleId=stepMatch[1], step=stepMatch[2]; const m=mod(moduleId); if(!m)return bad(res,'Module not found',404); if(!hasCourse(db,u.id,m.courseId))return bad(res,'Course access required',403); let payload={}; let files=[]; if(step==='evidence' && (req.headers['content-type']||'').includes('multipart/form-data')){ const boundary=(req.headers['content-type'].match(/boundary=(.+)$/)||[])[1]; ({fields:payload,files}=await multipart(req,boundary)); } else payload=jsonParse(await body(req)); const p=ensureProgress(db,u.id,m.courseId,moduleId); if(step==='content-opened')p.contentOpened=true; else if(step==='resource-accessed'){ p.resourcesAccessed=true; db.resourceAccess.push({id:id('RA'),userId:u.id,moduleId,resourceId:payload.resourceId||'any',at:now()}); } else if(step==='quiz-attempt'){ const correct=(m.quiz||[]).every((q,i)=>Number(payload.answers?.[i])===Number(q.correctIndex||q.answerIndex||0)); db.quizAttempts.push({id:id('QUIZ'),userId:u.id,moduleId,answers:payload.answers||[],passed:correct,at:now()}); p.quizPassed=correct; } else if(step==='action-task'){ db.actionTasks.push({id:id('TASK'),userId:u.id,moduleId,text:sanitize(payload.text||payload.action||''),submittedAt:now()}); p.actionTaskSubmitted=true; } else if(step==='evidence'){ db.evidenceSubmissions.push({id:id('EVID'),userId:u.id,moduleId,title:sanitize(payload.title||'Evidence'),text:sanitize(payload.text||''),files,status:'SUBMITTED',submittedAt:now()}); p.evidenceSubmitted=true; } else if(step==='reflection'){ db.reflections.push({id:id('REFL'),userId:u.id,moduleId,text:sanitize(payload.text||''),submittedAt:now()}); p.reflectionSubmitted=true; } else if(step==='transferability'){ const keys=['principle','localCondition','classroomAction','evidence','process','structure','syllabi']; const complete=keys.every(k=>String(payload[k]||'').trim().length>0); db.transferabilityResponses.push({id:id('TF'),userId:u.id,moduleId,responses:payload,complete,submittedAt:now()}); p.transferabilitySubmitted=complete; } else if(step==='checklist'){ p.checklistCompleted=!!payload.confirmed; } else return bad(res,'Unknown module step'); recalc(p); const cert=certificateIfComplete(db,u,m.courseId); audit(db,`lms.${step}`,u.id,{moduleId,status:p.status}); writeDb(db); return sendJson(res,200,{progress:p,certificate:cert}); }
    if(req.method==='GET' && pathname==='/api/toolkits') return sendJson(res,200,{toolkits:seed.products.filter(p=>(p.type||'').includes('TOOLKIT'))});
    if(req.method==='POST' && pathname.match(/^\/api\/toolkits\/([^/]+)\/purchase$/)){ const u=requireUser(req,res,db); if(!u)return; const tid=pathname.split('/')[3]; const p=product(tid); if(!p)return bad(res,'Toolkit not found'); if(!p.price || p.price <= 0) return bad(res,'Toolkit price not set'); const order={id:id('ORDER'),userId:u.id,productId:p.id,status:'PENDING',amount:p.price,currency:p.currency||'USD',createdAt:now()}; db.orders.push(order); writeDb(db); try { const session = await stripeRequest('/v1/checkout/sessions', { 'payment_method_types[0]': 'card', 'line_items[0][price_data][currency]': (p.currency||'usd').toLowerCase(), 'line_items[0][price_data][unit_amount]': String(p.price), 'line_items[0][price_data][product_data][name]': p.title || 'FCEI Toolkit', 'line_items[0][quantity]': '1', 'mode': 'payment', 'success_url': SITE_URL.replace(/#.*$/,'') + '/stripe-success?session_id={CHECKOUT_SESSION_ID}&order_id=' + order.id, 'cancel_url': SITE_URL + '#/catalogue', 'client_reference_id': order.id, 'customer_email': u.email, 'metadata[orderId]': order.id, 'metadata[userId]': u.id, 'metadata[productId]': p.id }); if(session.error) return bad(res, session.error.message); order.stripeSessionId = session.id; writeDb(db); return sendJson(res,200,{order, checkoutUrl: session.url}); } catch(e) { return bad(res,'Payment service error'); } }
    if(req.method==='GET' && pathname.match(/^\/api\/toolkits\/([^/]+)\/download$/)){ const u=requireUser(req,res,db); if(!u)return; const tid=pathname.split('/')[3]; if(!hasToolkit(db,u.id,tid))return bad(res,'Toolkit purchase required',403); db.toolkitDownloads.push({id:id('TD'),userId:u.id,toolkitId:tid,at:now()}); writeDb(db); return sendText(res,200,`FCEI Protected Toolkit Download\nToolkit: ${tid}\nUser: ${u.email}\nGenerated: ${now()}\n`,'text/plain'); }
    if(req.method==='GET' && pathname==='/api/scorm/lessons') return sendJson(res,200,{lessons:seed.scormLessons,flow:seed.scormTemplateFlow});
    if(req.method==='GET' && pathname.match(/^\/api\/scorm\/lessons\/([^/]+)$/)){ const moduleId=pathname.split('/').pop().toUpperCase(); const lesson=seed.scormLessons.find(x=>x.moduleId===moduleId); if(!lesson)return bad(res,'SCORM lesson not found',404); const obj=JSON.parse(fs.readFileSync(path.join(SCORM_DIR,'lessons',`${moduleId.toLowerCase()}-scorm-lesson.json`),'utf8')); return sendJson(res,200,obj); }
    if(req.method==='POST' && pathname==='/api/scorm/register'){ const admin=requireAdmin(req,res,db); if(!admin)return; const b=jsonParse(await body(req)); const reg={id:id('SCORM'),...b,registeredAt:now()}; db.scormRegistrations.push(reg); writeDb(db); return sendJson(res,200,{registration:reg}); }
    if(req.method==='POST' && pathname.match(/^\/api\/scorm\/runtime\/([^/]+)$/)){ const u=requireUser(req,res,db); if(!u)return; const moduleId=pathname.split('/').pop(); const b=jsonParse(await body(req)); const rec={id:id('SCORMRT'),userId:u.id,moduleId,lessonStatus:b.lessonStatus,score:b.score||null,suspendData:b.suspendData||null,updatedAt:now()}; db.scormRuntime.push(rec); const m=mod(moduleId); if(m && hasCourse(db,u.id,m.courseId) && ['completed','passed'].includes(String(b.lessonStatus).toLowerCase())){ const p=ensureProgress(db,u.id,m.courseId,moduleId); p.contentOpened=true; recalc(p); } writeDb(db); return sendJson(res,200,{runtime:rec}); }
    if(req.method==='POST' && pathname==='/api/bookings'){ const b=jsonParse(await body(req)); if(!b.name||!b.email) return bad(res,'Name and email are required'); const rec={id:id('BOOK'),name:sanitize(b.name),email:b.email,organisation:sanitize(b.organisation||''),message:sanitize(b.message||''),phone:sanitize(b.phone||''),tier:sanitize(b.tier||''),createdAt:now(),status:'NEW'}; db.bookings.push(rec); writeDb(db); return sendJson(res,200,{booking:rec}); }
    if(req.method==='POST' && pathname==='/api/cookie-consent'){ const b=jsonParse(await body(req)); const rec={id:id('COOKIE'),...b,ip:req.socket.remoteAddress,at:now()}; db.cookieConsent.push(rec); writeDb(db); return sendJson(res,200,{saved:true,consent:rec}); }
    if(req.method==='GET' && pathname==='/api/admin/overview'){ const admin=requireAdmin(req,res,db); if(!admin)return; return sendJson(res,200,{counts:Object.fromEntries(Object.entries(db).map(([k,v])=>[k,Array.isArray(v)?v.length:'n/a'])),products:seed.products.length,courses:seed.courses.length,modules:seed.modules.length,scormLessons:seed.scormLessons.length,recentAudit:db.auditLogs.slice(-20).reverse()}); }
    if(req.method==='POST' && pathname==='/api/admin/cms'){ const admin=requireAdmin(req,res,db); if(!admin)return; const b=jsonParse(await body(req)); db.cmsPages.push({id:id('CMS'),...b,updatedBy:admin.id,updatedAt:now()}); writeDb(db); return sendJson(res,200,{saved:true}); }
    if(req.method==='GET' && pathname.match(/^\/api\/certificates\/verify\/([^/]+)$/)){ const code=decodeURIComponent(pathname.split('/').pop()); const cert=db.certificates.find(c=>c.verificationCode===code); if(!cert)return bad(res,'Certificate not found',404); return sendJson(res,200,{certificate:cert}); }
    return bad(res,'API route not found',404);
  } catch(e){ console.error(e); return bad(res,e.message||'Server error',500); }
}
const server=http.createServer(async(req,res)=>{ const {path:pathname,query}=parseUrl(req); if(pathname.startsWith('/api/')) return api(req,res,pathname,query); if(pathname.startsWith('/uploads/')) return sendFile(res,path.join(UPLOAD_DIR,path.basename(pathname))); if(pathname.startsWith('/scorm/lessons/')) return sendFile(res,path.join(SCORM_DIR,'lessons',path.basename(pathname))); if(pathname.startsWith('/scorm/template/')) return sendFile(res,path.join(SCORM_DIR,'template',path.basename(pathname))); if(pathname==='/stripe-success'){ const q=parseUrl(req).query; res.writeHead(302,{'Location':'/#/stripe-success?session_id='+(q.session_id||'')+'&order_id='+(q.order_id||'')}); res.end(); return; }
    if(pathname.startsWith('/courses/')){
      const slug=pathname.replace('/courses/','').replace(/\/$/,'');
      const cid=SEO_DATA[slug];
      if(cid && SEO_DATA[cid]){
        const seo=SEO_DATA[cid];
        const raw=fs.readFileSync(path.join(PUBLIC_DIR,'index.html'),'utf8');
        const out=injectSEO(raw,{title:seo.title_tag,desc:seo.meta_description,ogTitle:seo.og_title,ogDesc:seo.og_description,canonical:seo.canonical_url,jsonld:JSON.stringify(seo.jsonld)}).replace('</body>','<script>if(!location.hash)location.hash="#/course/'+cid+'";</script></body>');
        res.writeHead(200,{'Content-Type':'text/html;charset=utf-8','Cache-Control':'public,max-age=3600'}); res.end(out); return;
      }
    }
    if(pathname==='/'){
      const ua=(req.headers['user-agent']||'').toLowerCase();
      if(/bot|crawl|spider|slurp|facebook|twitter|whatsapp|telegram|preview|wget/i.test(ua)){
        const raw=fs.readFileSync(path.join(PUBLIC_DIR,'index.html'),'utf8');
        const out=injectSEO(raw,{});
        res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'}); res.end(out); return;
      }
    } let file=pathname==='/'?'index.html':pathname.replace(/^\//,''); const target=path.join(PUBLIC_DIR,file); if(fs.existsSync(target)&&target.startsWith(PUBLIC_DIR)) return sendFile(res,target); return sendFile(res,path.join(PUBLIC_DIR,'index.html')); });
server.listen(PORT,()=>console.log(`FCEI live-ready integration engine running on http://localhost:${PORT}`));
