/* Case Q&A agent. RAG over the case file: the deterministic retriever in
   caseAssistant.js selects grounding passages; when a Gemini API key is
   configured (VITE_GEMINI_API_KEY - same key as the sead4_llm analyzer)
   Gemini generates the answer from those passages ONLY. Without a key, or
   if the call fails, the retrieved passages answer directly - so the
   public static deploy works with no key and nothing to leak. */
import { retrieve, askCase } from './caseAssistant.js';

export const GEMINI_MODEL = 'gemini-2.0-flash';
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/'
  + `${GEMINI_MODEL}:generateContent`;

export const configuredApiKey = () => import.meta.env?.VITE_GEMINI_API_KEY || '';

function buildPrompt(caseData, question, passages, history) {
  const context = passages
    .map((p, i) => `[${i + 1}] ${p.label}\n${p.text}`)
    .join('\n\n');
  const thread = (history || []).slice(-6)
    .map((m) => `${m.role}: ${m.text}`)
    .join('\n');
  return [
    'You are a case-file assistant inside a personnel-vetting demo. Answer the',
    'analyst\'s question using ONLY the numbered case-file passages below.',
    'Quote figures and dates exactly. If the passages do not answer the',
    'question, say so plainly. Keep the answer under 120 words. Do not invent',
    'facts, identities, or documents.',
    '',
    `Subject: ${caseData.subject.name} (${caseData.subject.id})`,
    '',
    ...(thread ? ['Conversation so far:', thread, ''] : []),
    'Case-file passages:',
    context,
    '',
    `Question: ${question}`,
  ].join('\n');
}

const SUMMARY_CACHE_KEY = 'demo.dohaSummaries';

const readSummaryCache = () => {
  if (typeof localStorage === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(SUMMARY_CACHE_KEY) || '{}');
  } catch {
    return {};
  }
};

/** The formal disposition sentence every DOHA decision ends with. */
export const rulingSentence = (record) => {
  const text = (record.fullText || '').replace(/\s+/g, ' ').trim();
  const hits = text.match(/[^.]*clearly consistent[^.]*\./gi);
  return hits ? hits[hits.length - 1].trim() : null;
};

const localExtract = (record) => {
  const outcome = record.outcome === 'GRANTED' ? 'Eligibility granted'
    : record.outcome === 'DENIED' ? 'Eligibility denied' : record.outcome;
  const ruling = rulingSentence(record);
  if (ruling) return `${outcome}. ${ruling}`;
  const text = (record.fullText || '').replace(/\s+/g, ' ').trim();
  return `${outcome}. ${text.slice(0, 340)}…`;
};

/** Summarize a published DOHA decision. Gemini output is stored in
    localStorage after the first run; the local extract is never cached so a
    later Gemini run can replace it. */
export async function summarizeDecision(record, options = {}) {
  const cached = readSummaryCache()[record.caseNumber];
  if (cached) return { ...cached, cached: true };
  const apiKey = options.apiKey ?? configuredApiKey();
  const fetchImpl = options.fetchImpl ?? fetch;
  if (!apiKey) return { summary: localExtract(record), engine: 'local' };

  try {
    const prompt = [
      'Summarize this published DOHA security-clearance decision for an',
      'adjudicator in under 110 words. Cover the outcome, the guidelines at',
      'issue, the key facts, and why the judge ruled that way. Use only the',
      'decision text. Plain sentences, no headers.',
      '',
      `Decision ${record.caseNumber} (${record.caseType}, ${record.outcome}, ${record.date}):`,
      (record.fullText || '').slice(0, 24_000),
    ].join('\n');
    const res = await fetchImpl(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Gemini HTTP ${res.status}: ${body.slice(0, 300)}`);
    }
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) throw new Error('Gemini returned no text');
    const entry = { summary: text, engine: 'gemini' };
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SUMMARY_CACHE_KEY,
        JSON.stringify({ ...readSummaryCache(), [record.caseNumber]: entry }));
    }
    return entry;
  } catch (err) {
    return {
      summary: localExtract(record), engine: 'local',
      error: String(err?.message || err),
    };
  }
}

export async function answerQuestion(caseData, question, options = {}) {
  const apiKey = options.apiKey ?? configuredApiKey();
  const fetchImpl = options.fetchImpl ?? fetch;
  const history = options.history ?? [];

  const passages = retrieve(caseData, question, { history });
  const local = askCase(caseData, question, { history });
  if (!passages.length || !apiKey) return { ...local, engine: 'local' };

  try {
    const res = await fetchImpl(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: buildPrompt(caseData, question, passages, history) }],
        }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Gemini HTTP ${res.status}: ${body.slice(0, 300)}`);
    }
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) throw new Error('Gemini returned no text');
    return { answer: text, citations: local.citations, engine: 'gemini' };
  } catch (err) {
    // fall back to the composed local answer; keep the reason for diagnostics
    return { ...local, engine: 'local', error: String(err?.message || err) };
  }
}
