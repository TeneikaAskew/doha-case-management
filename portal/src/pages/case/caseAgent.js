/* Case Q&A agent. The whole case file grounds Gemini: buildCorpus() flattens
   every part of the case into labeled passages and all of them are sent as
   context, so the model answers from the complete record rather than a
   keyword-matched slice (VITE_GEMINI_API_KEY - same key as the sead4_llm
   analyzer). The deterministic retriever still runs to pick the citation
   chips and to compose the local answer. Without a key, or if the call
   fails, the retrieved passages answer directly - so the public static
   deploy works with no key and nothing to leak. */
import { retrieve, askCase, buildCorpus } from './caseAssistant.js';

// gemini-2.0-flash no longer has a free tier (429, limit: 0); 2.5-flash does
export const GEMINI_MODEL = 'gemini-2.5-flash';
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';
const ENDPOINT = `${BASE}${GEMINI_MODEL}:generateContent`;
const STREAM_ENDPOINT = `${BASE}${GEMINI_MODEL}:streamGenerateContent?alt=sse`;

export const configuredApiKey = () => import.meta.env?.VITE_GEMINI_API_KEY || '';

/** Compact always-included grounding: who the subject is and where the case
    stands, so broad questions get real answers even with no keyword hits. */
export function caseDigest(caseData) {
  const s = caseData.subject;
  const flagged = (caseData.guidelines || [])
    .map((g) => `${g.code} (${g.name}, severity ${g.severity})`).join(', ');
  const rec = caseData.adjudication?.recommendation;
  return [
    `Subject: ${s.name} (${s.id}), ${s.position}, tier ${s.tier}, `
      + `stage ${s.stage}, status ${s.status}, eligibility ${s.eligibility}, `
      + `Risk score ${s.riskScore}/100.`,
    caseData.aiSummary && `Case summary: ${caseData.aiSummary}`,
    caseData.wholePersonSummary
      && `Whole-person bottom line: ${caseData.wholePersonSummary}`,
    flagged && `Flagged guidelines: ${flagged}`,
    rec && `AI recommendation: ${rec.action} - ${rec.rationale}`,
  ].filter(Boolean).join('\n');
}

function buildPrompt(caseData, question, passages, history) {
  const context = passages.length
    ? passages.map((p, i) => `[${i + 1}] ${p.label}\n${p.text}`).join('\n\n')
    : '(no passage matched the question directly - answer from the digest, '
      + 'or say what the case file does not cover)';
  const thread = (history || []).slice(-6)
    .map((m) => `${m.role}: ${m.text}`)
    .join('\n');
  return [
    'You are a case-file assistant inside a personnel-vetting demo. The digest',
    'and numbered passages below are the COMPLETE case file. Answer the',
    'analyst\'s question using ONLY that material. Quote figures and dates',
    'exactly. If the case file does not answer the question, say so plainly.',
    'Keep the answer under 120 words. Do not invent facts, identities, or',
    'documents.',
    '',
    'Case digest:',
    caseDigest(caseData),
    '',
    ...(thread ? ['Conversation so far:', thread, ''] : []),
    'Complete case file:',
    context,
    '',
    `Question: ${question}`,
  ].join('\n');
}

/** Read an SSE stream from streamGenerateContent, invoking onChunk with the
    accumulated text after every parsed event. */
async function readSseAnswer(res, onChunk) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';
  let finishReason = null;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const data = JSON.parse(payload);
        const candidate = data.candidates?.[0];
        const part = candidate?.content?.parts?.[0]?.text;
        if (part) {
          text += part;
          onChunk(text);
        }
        if (candidate?.finishReason) finishReason = candidate.finishReason;
      } catch {
        // SSE events are line-delimited; an unparseable data line is skipped
      }
    }
  }
  return { text: text.trim(), finishReason };
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
        // The prompt can carry up to ~6k tokens of decision text, so give the
        // model room to reason over it; 2.5-flash bills thinking against
        // maxOutputTokens, so cap the thinking spend and still leave ~1k for
        // the visible <110-word summary.
        generationConfig: {
          temperature: 0.2, maxOutputTokens: 3072,
          thinkingConfig: { thinkingBudget: 2048 },
        },
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
  // Ground Gemini in the entire case file, not just the top matches, so no
  // relevant detail is left out; retrieval above still selects the citations.
  const grounding = buildCorpus(caseData);
  // no key: deterministic local mode. With a key, Gemini answers everything -
  // zero-hit questions are grounded by the full case file instead of refused.
  if (!apiKey) return { ...local, engine: 'local' };

  try {
    const streaming = typeof options.onChunk === 'function';
    const res = await fetchImpl(streaming ? STREAM_ENDPOINT : ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: buildPrompt(caseData, question, grounding, history) }],
        }],
        // The whole case now grounds the answer (up to ~4k input tokens for
        // the richest case), so give the model room to reason across all of
        // it; 2.5-flash bills thinking against maxOutputTokens, so cap the
        // thinking spend and still leave ~1k for the visible <120-word answer.
        generationConfig: {
          temperature: 0.2, maxOutputTokens: 3072,
          thinkingConfig: { thinkingBudget: 2048 },
        },
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Gemini HTTP ${res.status}: ${body.slice(0, 300)}`);
    }
    let text;
    let finishReason;
    if (streaming) {
      ({ text, finishReason } = await readSseAnswer(res, options.onChunk));
    } else {
      const data = await res.json();
      const candidate = data.candidates?.[0];
      text = candidate?.content?.parts?.[0]?.text?.trim();
      finishReason = candidate?.finishReason;
    }
    if (!text) throw new Error('Gemini returned no text');
    const truncated = finishReason === 'MAX_TOKENS';
    if (truncated) text += '…';
    const citations = passages.length ? local.citations : [];
    return {
      answer: text, citations, engine: 'gemini', streamed: streaming, truncated,
    };
  } catch (err) {
    // fall back to the composed local answer; keep the reason for diagnostics
    return { ...local, engine: 'local', error: String(err?.message || err) };
  }
}
