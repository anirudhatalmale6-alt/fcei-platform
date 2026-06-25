const FCEI_COURSES = [
  { code: "C01", title: "Foundations of Finnish-Inspired Education", themes: ["Finnish education", "equity", "trust", "wellbeing", "learner agency"] },
  { code: "C02", title: "Equity and Inclusion in Practice", themes: ["equity", "inclusion", "structured support"] },
  { code: "C03", title: "Trust, Teacher Autonomy and Professional Responsibility", themes: ["teacher autonomy", "professional trust", "responsibility"] },
  { code: "C04", title: "Wellbeing and Joy of Learning", themes: ["wellbeing", "joy of learning", "safe classroom climate"] },
  { code: "C05", title: "Early Support and the Leave No-Child-Behind Classroom Cycle", themes: ["early support", "learner support", "no child left behind"] },
  { code: "C06", title: "Learner Voice, Choice and Agency", themes: ["learner agency", "student voice", "choice"] },
  { code: "C07", title: "Finnish Formative Assessment and Feedback Culture", themes: ["formative assessment", "feedback", "assessment for learning"] },
  { code: "C08", title: "Phenomenon-Based and Project-Based Learning", themes: ["phenomenon-based learning", "project-based learning", "creativity"] },
  { code: "C09", title: "School Leadership, Quality Culture and Enhancement-Led Development", themes: ["school leadership", "quality culture", "enhancement-led development"] },
  { code: "C10", title: "Digital Pedagogy and Responsible AI in Education", themes: ["AI in education", "digital pedagogy", "responsible AI"] },
  { code: "C11", title: "Teacher Collaboration and Professional Learning Communities", themes: ["teacher collaboration", "professional learning communities"] },
  { code: "C12", title: "Inclusive Assessment, Evidence Portfolios and Capstone Practice", themes: ["evidence portfolio", "capstone", "reflective practice"] },
  { code: "C13", title: "TVET Competence-Based Learning and Workplace Evidence", themes: ["TVET", "competence-based learning", "workplace evidence"] },
  { code: "C14", title: "Institutional Consultancy and School Development Implementation", themes: ["school improvement", "consultancy", "implementation"] }
];

const FCEI_COURSE_MAP = [
  { code: "C01", slug: "finnish-teacher-training-courses", pageType: "course_hub", title: "Finnish Teacher Training Courses Online", primaryKeyword: "Finnish teacher training courses", schemaType: "Course", internalLinks: ["/fcei-framework", "/fcei-certificate-verification", "/finnish-pedagogy-course"] },
  { code: "C01", slug: "finnish-pedagogy-course", pageType: "course_page", title: "Finnish Pedagogy Course for Teachers", primaryKeyword: "Finnish pedagogy course", schemaType: "Course", internalLinks: ["/fcei-framework", "/finnish-formative-assessment", "/student-wellbeing-teacher-training"] },
  { code: "C01", slug: "finnish-education-online-course", pageType: "course_page", title: "Finnish Education Online Course", primaryKeyword: "Finnish education online course", schemaType: "Course", internalLinks: ["/fcei-framework", "/finnish-teacher-training-courses", "/fcei-certificate-verification"] },
  { code: "FRAMEWORK", slug: "fcei-framework", pageType: "framework_page", title: "FCEI Finnish Teacher Training Development Framework", primaryKeyword: "FCEI framework", schemaType: "Organization", internalLinks: ["/finnish-teacher-training-courses", "/school-improvement-consultancy", "/fcei-certificate-verification"] },
  { code: "C07", slug: "finnish-formative-assessment", pageType: "course_page", title: "Finnish Formative Assessment for Teachers", primaryKeyword: "Finnish formative assessment", schemaType: "Course", internalLinks: ["/fcei-framework", "/finnish-pedagogy-course", "/student-wellbeing-teacher-training"] },
  { code: "C04", slug: "student-wellbeing-teacher-training", pageType: "course_page", title: "Student Wellbeing and Joy of Learning Training", primaryKeyword: "student wellbeing teacher training", schemaType: "Course", internalLinks: ["/fcei-framework", "/finnish-teacher-training-courses", "/finnish-formative-assessment"] },
  { code: "C09", slug: "school-leadership-quality-culture", pageType: "course_page", title: "School Leadership and Quality Culture", primaryKeyword: "school leadership quality culture", schemaType: "Course", internalLinks: ["/fcei-framework", "/school-improvement-consultancy", "/finnish-teacher-training-courses"] },
  { code: "C13", slug: "tvet-competence-based-learning", pageType: "course_page", title: "TVET Competence-Based Learning and Workplace Evidence", primaryKeyword: "TVET competence based learning", schemaType: "Course", internalLinks: ["/fcei-framework", "/finnish-teacher-training-courses", "/fcei-certificate-verification"] },
  { code: "C14", slug: "school-improvement-consultancy", pageType: "consultancy_page", title: "School Improvement Consultancy", primaryKeyword: "school improvement consultancy", schemaType: "ProfessionalService", internalLinks: ["/fcei-framework", "/school-leadership-quality-culture", "/finnish-teacher-training-courses"] },
  { code: "VERIFY", slug: "fcei-certificate-verification", pageType: "verification_page", title: "FCEI Capstone Certificate Verification", primaryKeyword: "FCEI certificate verification", schemaType: "WebPage", internalLinks: ["/fcei-framework", "/finnish-teacher-training-courses"] }
];

const FCEI_CONTENT_GAPS = [
  { topic: "Finnish education examples for non-Finnish classrooms", recommendedAction: "create", targetSlug: "finnish-education-examples-for-teachers", priority: "high", reason: "The current map is course-heavy; an example-led support page can capture informational searches and feed course pages." },
  { topic: "EDUFI-aligned teacher training wording", recommendedAction: "add_faq", targetSlug: "fcei-framework", priority: "high", reason: "Users may search for official alignment language; the page should explain the wording without implying government accreditation." },
  { topic: "Evidence portfolio and capstone requirements", recommendedAction: "expand", targetSlug: "fcei-certificate-verification", priority: "medium", reason: "Certificate searches need visible detail about evidence, verification codes and completion records." },
  { topic: "School improvement implementation cycle", recommendedAction: "expand", targetSlug: "school-improvement-consultancy", priority: "medium", reason: "Institution buyers need process, timeline and outcomes before contacting FCEI." },
  { topic: "Responsible AI in Finnish-inspired education", recommendedAction: "create", targetSlug: "responsible-ai-in-education-course", priority: "low", reason: "Included in the course model but not yet represented in the priority URL map." }
];

const questionTemplates = [
  "what is {seed}",
  "how does {seed} work",
  "why is {seed} important",
  "how to apply {seed} in the classroom",
  "what are examples of {seed}",
  "who is {seed} for",
  "how can schools implement {seed}",
  "how long does a {seed} course take"
];

const suggestionTemplates = [
  "{seed} for teachers",
  "{seed} for school leaders",
  "{seed} online course",
  "{seed} certificate",
  "{seed} implementation guide",
  "{seed} examples",
  "{seed} classroom strategies",
  "{seed} toolkit",
  "Finnish-inspired {seed}",
  "EDUFI-aligned {seed}",
  "FINEEC-benchmarked {seed}"
];

const commercialTerms = ["course", "training", "certificate", "online", "enrol", "programme", "program", "consultancy", "toolkit", "framework"];
const fceiTerms = ["finnish", "teacher", "education", "school", "learner", "assessment", "wellbeing", "tvet", "competence", "ai", "quality", "evidence", "pedagogy", "equity", "trust"];

function slugify(value) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);
}

function titleCase(value) {
  return value.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
}

function inferIntent(keyword, fallback) {
  const k = keyword.toLowerCase();
  if (["buy", "price", "cost", "enrol", "enroll", "checkout"].some(t => k.includes(t))) return "transactional";
  if (commercialTerms.some(t => k.includes(t))) return "commercial";
  if (k.startsWith("what ") || k.startsWith("how ") || k.startsWith("why ") || k.includes("examples")) return "informational";
  return fallback || "informational";
}

function inferContentType(keyword, intent) {
  const k = keyword.toLowerCase();
  if (k.includes("consultancy") || k.includes("school improvement")) return "consultancy_page";
  if (k.includes("framework") || k.includes("edufi") || k.includes("fineec")) return "framework_page";
  if (intent === "commercial" || intent === "transactional") return "course_page";
  if (k.startsWith("what ") || k.startsWith("how ") || k.startsWith("why ")) return "faq";
  return "blog";
}

function chooseCluster(keyword) {
  const k = keyword.toLowerCase();
  if (k.includes("tvet") || k.includes("competence") || k.includes("workplace")) return "TVET and Workplace Evidence";
  if (k.includes("assessment") || k.includes("feedback")) return "Assessment and Evidence";
  if (k.includes("wellbeing") || k.includes("joy")) return "Wellbeing and Joy of Learning";
  if (k.includes("leadership") || k.includes("quality") || k.includes("enhancement")) return "School Leadership and Quality Culture";
  if (k.includes("agency") || k.includes("voice") || k.includes("choice")) return "Learner Voice, Choice and Agency";
  if (k.includes("ai") || k.includes("digital")) return "Responsible AI and Digital Pedagogy";
  if (k.includes("support") || k.includes("inclusion") || k.includes("equity")) return "Equity and Structured Support";
  return "Finnish Teacher Training";
}

function scoreKeyword(keyword, intent, courseCode, country) {
  const k = keyword.toLowerCase();
  const searchIntentMatch = (intent === "commercial" || intent === "transactional") ? 30 : 22;
  const commercialValue = commercialTerms.some(t => k.includes(t)) ? 20 : 11;
  const fceiRelevance = Math.min(20, 6 + fceiTerms.filter(t => k.includes(t)).length * 2);
  const wordCount = k.split(/\s+/).filter(Boolean).length;
  const lowCompetitionOpportunity = wordCount >= 5 ? 15 : wordCount >= 3 ? 11 : 7;
  const courseMappingStrength = courseCode ? 10 : 6;
  const countryPriority = ["United Kingdom", "UAE", "Saudi Arabia", "Qatar", "Nigeria", "Kenya", "South Africa", "India", "Pakistan"].includes(country || '') ? 5 : 4;
  return Math.min(100, searchIntentMatch + commercialValue + fceiRelevance + lowCompetitionOpportunity + courseMappingStrength + countryPriority);
}

function generateKeywords(input) {
  const seed = (input.seedKeyword || '').trim();
  if (!seed) return [];

  const country = input.country || "Global";
  const audience = input.audience || "Teachers; School Leaders; Institutions";
  const courseCode = input.courseCode;
  const seedWords = seed.split(/\s+/).filter(Boolean);
  const sameTerms = seedWords.length > 1 ? [...seedWords].reverse().join(" ") : seed;

  const rawIdeas = [
    { keyword: seed, type: "seed" },
    { keyword: seed + " course", type: "phrase_match" },
    { keyword: seed + " online", type: "phrase_match" },
    { keyword: seed + " training", type: "phrase_match" },
    { keyword: sameTerms, type: "same_terms" },
    ...suggestionTemplates.map(t => ({ keyword: t.replace("{seed}", seed), type: "suggestion" })),
    ...questionTemplates.map(t => ({ keyword: t.replace("{seed}", seed), type: "question" })),
    { keyword: seed + " for international schools", type: "long_tail" },
    { keyword: seed + " for non-Finnish teachers", type: "long_tail" },
    { keyword: seed + " practical classroom examples", type: "long_tail" }
  ];

  const seen = new Set();
  return rawIdeas
    .map(item => ({ ...item, keyword: item.keyword.replace(/\s+/g, " ").trim() }))
    .filter(item => {
      const key = item.keyword.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(item => {
      const intent = inferIntent(item.keyword, input.intent);
      const contentType = input.contentType || inferContentType(item.keyword, intent);
      const slug = slugify(item.keyword);
      const priorityScore = scoreKeyword(item.keyword, intent, courseCode, country);
      return {
        keyword: item.keyword,
        seedKeyword: seed,
        keywordType: item.type,
        searchIntent: intent,
        audience,
        country,
        courseCode: courseCode || null,
        priorityScore,
        suggestedSlug: slug,
        suggestedTitle: titleCase(item.keyword) + " | FCEI",
        suggestedMetaDescription: "Explore " + item.keyword + " through the FCEI Finnish Teacher Training Development Framework: Finnish-inspired, EDUFI-aligned, FINEEC-benchmarked and evidence-informed.",
        suggestedH1: titleCase(item.keyword),
        contentType,
        cluster: chooseCluster(item.keyword)
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

function createContentBrief(keyword) {
  const h2s = [
    "What " + keyword.keyword + " means in practice",
    "Who this FCEI pathway is for",
    "How the FCEI Finnish Teacher Training Development Framework applies",
    "Classroom or institutional implementation task",
    "Evidence portfolio requirement",
    "Reflection and transferability questions",
    "Related FCEI courses and next steps"
  ];
  const faqs = [
    "What is " + keyword.keyword + "?",
    "Who should study " + keyword.keyword + "?",
    "How does FCEI connect this topic to Finnish-inspired practice?",
    "Does this include implementation tasks and evidence upload?",
    "Can schools use this for institutional improvement?"
  ];
  return {
    pageSlug: keyword.suggestedSlug,
    primaryKeyword: keyword.keyword,
    seoTitle: keyword.suggestedTitle,
    metaDescription: keyword.suggestedMetaDescription,
    h1: keyword.suggestedH1,
    h2s,
    faqs,
    internalLinks: ["/fcei-framework", "/finnish-teacher-training-courses", "/fcei-certificate-verification", "/school-improvement-consultancy"],
    schemaType: keyword.contentType === "course_page" ? "Course" : keyword.contentType === "faq" ? "FAQPage" : "WebPage",
    draftIntro: "This page explains " + keyword.keyword + " through the FCEI Finnish Teacher Training Development Framework. It is designed for educators, school leaders and institutions seeking Finnish-inspired, EDUFI-aligned and FINEEC-benchmarked professional learning that can be applied in real classrooms and school systems."
  };
}

function toCsv(rows) {
  const header = ["keyword","seedKeyword","keywordType","searchIntent","audience","country","courseCode","priorityScore","contentType","suggestedSlug","suggestedTitle","suggestedMetaDescription","suggestedH1","cluster"];
  const escapeCell = value => {
    const text = value == null ? "" : String(value);
    return '"' + text.replace(/"/g, '""') + '"';
  };
  return [header.join(","), ...rows.map(row => header.map(key => escapeCell(row[key])).join(","))].join("\n");
}

export { FCEI_COURSES, FCEI_COURSE_MAP, FCEI_CONTENT_GAPS, generateKeywords, createContentBrief, toCsv, slugify, titleCase };
