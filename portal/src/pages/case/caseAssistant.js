/* Case Q&A engine. Retrieval is deterministic and local: the case file is
   tokenized into cited passages and scored against the question. Generation
   is optional - when a Gemini key is configured the top passages ground an
   LLM answer; otherwise the top passages compose the answer directly. */

const STOP = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'do', 'does',
  'did', 'his', 'her', 'their', 'has', 'have', 'had', 'what', 'when', 'who',
  'why', 'how', 'much', 'many', 'me', 'show', 'tell', 'about', 'of', 'in',
  'on', 'to', 'for', 'from', 'with', 'and', 'or', 'any', 'this', 'that',
  'there', 'subject', 'case']);

// question-vocabulary -> case-vocabulary bridges
const SYNONYMS = {
  debt: ['delinquent', 'delinquency', 'financial', 'accounts', 'credit'],
  money: ['financial', 'delinquent', 'remittance'],
  travel: ['travel', 'i-94', 'nigeria', 'foreign', 'trip'],
  traveled: ['travel', 'i-94', 'foreign'],
  abroad: ['travel', 'foreign'],
  interview: ['interview', 'interviewed', 'esi'],
  said: ['interview', 'summary', 'described'],
  arrest: ['arrest', 'police', 'dui', 'criminal'],
  drink: ['alcohol', 'dui', 'bac'],
  alcohol: ['alcohol', 'dui', 'bac'],
  family: ['family', 'siblings', 'mother', 'foreign', 'contacts'],
  recommendation: ['recommendation', 'recommend', 'sor', 'loi', 'adjudication'],
  // broad overview asks route to the case-level summaries
  know: ['summary', 'concerns', 'recommendation'],
  overview: ['summary', 'concerns', 'recommendation'],
  summarize: ['summary', 'concerns', 'recommendation'],
  happening: ['summary', 'concerns', 'alert'],
  situation: ['summary', 'concerns'],
  decision: ['recommendation', 'adjudication', 'decisions'],
  risk: ['risk', 'concern', 'guideline'],
  alert: ['alert', 'alerts', 'cv'],
  document: ['document', 'extract', 'report', 'record'],
  documents: ['document', 'extract', 'report', 'record'],
  job: ['employment', 'employer', 'layoff'],
  work: ['employment', 'employer'],
};

// generic follow-up words: alone they carry no topic of their own
const GENERIC = new Set(['else', 'more', 'other', 'others', 'anything', 'next',
  'additional', 'also']);

const tokenize = (text) => (text || '')
  .toLowerCase()
  .replace(/[^a-z0-9$,.-]+/g, ' ')
  .split(/\s+/)
  .map((t) => t.replace(/^[,.]+|[,.]+$/g, ''))
  .filter((t) => t.length > 1 && !STOP.has(t));

// true when a and b are within one edit (typo tolerance)
function withinOneEdit(a, b) {
  if (a === b) return true;
  const la = a.length; const lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  let i = 0; let j = 0; let edits = 0;
  while (i < la && j < lb) {
    if (a[i] === b[j]) { i += 1; j += 1; continue; }
    edits += 1;
    if (edits > 1) return false;
    if (la > lb) i += 1;
    else if (lb > la) j += 1;
    else { i += 1; j += 1; }
  }
  return edits + (la - i) + (lb - j) <= 1;
}

function expandQuery(question, vocabulary) {
  const terms = new Set();
  for (const raw of tokenize(question)) {
    terms.add(raw);
    // correct typos against the case vocabulary and synonym keys
    if (raw.length >= 4 && !vocabulary.has(raw)) {
      for (const known of vocabulary) {
        if (withinOneEdit(raw, known)) terms.add(known);
      }
    }
  }
  for (const t of [...terms]) {
    (SYNONYMS[t] || []).forEach((s) => terms.add(s));
  }
  return terms;
}

/** Flatten the case file into scored, citable passages. */
export function buildCorpus(caseData) {
  const passages = [];
  const add = (label, tab, text, docUrl = null) => {
    if (text) passages.push({ label, tab, text, docUrl, tokens: tokenize(text) });
  };
  const s = caseData.subject;

  add('AI case summary', 'overview', caseData.aiSummary);
  add('Whole-person bottom line', 'overview', caseData.wholePersonSummary);
  (caseData.wholePerson || []).forEach((f) => (
    add(`Whole-person: ${f.factor}`, 'overview', `${f.factor}. ${f.assessment}`)
  ));
  add('Subject profile', 'overview',
    `${s.name}, ${s.position}, tier ${s.tier}, eligibility ${s.eligibility}. `
    + `Born ${s.dob} in ${s.placeOfBirth || ''}. Lives at ${s.address || ''}. `
    + `Risk score ${s.riskScore}.`);
  (s.employmentHistory || []).forEach((e) => (
    add('Employment history', 'overview',
      `Employment: ${e.title} at ${e.employer} from ${e.fromDate} to ${e.toDate || 'present'}.`)
  ));

  (caseData.guidelines || []).forEach((g) => {
    add(`Guideline ${g.code} - ${g.name}`, 'guidelines',
      `Guideline ${g.code} ${g.name}, severity ${g.severity}. ${g.aiReasoning}`);
    (g.disqualifiers || []).forEach((d) => (
      add(`Guideline ${g.code} disqualifier ${d.code}`, 'guidelines',
        `${d.code} ${d.description}: ${d.evidence}`)
    ));
  });

  const inv = caseData.investigation || {};
  (inv.interviews || []).forEach((iv) => (
    add(`${iv.type} (${iv.date})`, 'investigation',
      `${iv.type} by ${iv.interviewer} on ${iv.date}: ${iv.summary}`)
  ));
  (inv.roiEntries || []).forEach((r) => (
    add(`ROI - ${r.item} (${r.date})`, 'investigation', r.text)
  ));
  (inv.recordChecks || []).forEach((c) => (
    add(`Record check - ${c.item}`, 'investigation',
      `${c.item} via ${c.provider} (${c.status}): ${c.scope}. ${c.resultSummary}`,
      c.documentUrl)
  ));
  (inv.sf86Sections || []).forEach((sec) => (
    add(`SF-86 ${sec.section} review`, 'investigation',
      `${sec.section} ${sec.title}. Self-report: ${sec.subjectReport}. `
      + `Matched result: ${sec.matchedResult}.`
      + (sec.discrepancy ? ' Discrepancy flagged.' : ''))
  ));

  (caseData.alerts || []).forEach((a) => (
    add(`Alert ${a.id} (${a.category})`, 'continuous-vetting',
      `${a.category} alert from ${a.provider}, severity ${a.severity}, `
      + `state ${a.state}, received ${a.receivedDate}: ${a.description}`,
      a.documents?.[0]?.url)
  ));

  const adj = caseData.adjudication || {};
  if (adj.recommendation) {
    add('AI recommendation', 'adjudication',
      `Recommended action: ${adj.recommendation.action}. ${adj.recommendation.rationale}`);
  }
  add('Statement of Reasons draft', 'adjudication', adj.sorDraft);

  (caseData.documents || []).forEach((d) => (
    add(d.title, 'documents', `${d.title}. ${d.type}. ${d.description}`, d.url)
  ));

  return passages;
}

export function retrieve(caseData, question, options = {}) {
  const { limit = 3, history = [] } = options;
  const corpus = buildCorpus(caseData);
  const vocabulary = new Set(Object.keys(SYNONYMS));
  corpus.forEach((p) => p.tokens.forEach((t) => vocabulary.add(t)));

  // "what else?"-style follow-ups: inherit the last real question's topic
  // and skip passages the thread already cited
  const own = tokenize(question);
  const isFollowUp = own.length === 0 || own.every((t) => GENERIC.has(t));
  const excluded = new Set();
  let query = question;
  if (isFollowUp && history.length) {
    const lastReal = [...history].reverse().find((m) => {
      if (m.role !== 'user') return false;
      const toks = tokenize(m.text);
      return toks.length > 0 && !toks.every((t) => GENERIC.has(t));
    });
    if (lastReal) query = `${lastReal.text} ${question}`;
    history.forEach((m) => (m.citations || []).forEach((c) => excluded.add(c.label)));
  }

  const terms = expandQuery(query, vocabulary);
  return corpus
    .filter((p) => !excluded.has(p.label))
    .map((p) => {
      let score = 0;
      for (const tok of p.tokens) if (terms.has(tok)) score += 1;
      // small boost when the passage label itself matches
      for (const tok of tokenize(p.label)) if (terms.has(tok)) score += 2;
      return { ...p, score };
    })
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

const FALLBACK = "I couldn't find anything in this case file about that. "
  + 'Try asking about the flagged guidelines, interviews, alerts, finances, '
  + 'travel, or documents on file.';

/** Deterministic local answer: top passages, cited. */
export function askCase(caseData, question, options = {}) {
  const hits = retrieve(caseData, question, options);
  if (!hits.length) return { answer: FALLBACK, citations: [] };
  const answer = hits.map((h) => h.text).join('\n\n');
  return {
    answer,
    citations: hits.map((h) => ({ label: h.label, tab: h.tab, docUrl: h.docUrl })),
  };
}

export function exampleQuestions(caseData) {
  const qs = [];
  const g = caseData.guidelines?.[0];
  if (g) qs.push(`Why is this case flagged under Guideline ${g.code} (${g.name})?`);
  if (caseData.investigation?.interviews?.length) {
    qs.push('What did the interviews establish?');
  }
  if (caseData.alerts?.length) qs.push('What alerts are open and where did they come from?');
  if (caseData.adjudication?.recommendation) {
    qs.push('What action does the AI recommend and why?');
  }
  // clean cases have no guideline/interview/alert hooks - ask about the
  // evidence that cleared them instead
  if (caseData.investigation?.recordChecks?.length) {
    qs.push('What record checks were run and what did they find?');
  }
  if (caseData.wholePersonSummary) {
    qs.push('What is the whole-person bottom line?');
  }
  qs.push('What documents are on file for this case?');
  return qs.slice(0, 5);
}
