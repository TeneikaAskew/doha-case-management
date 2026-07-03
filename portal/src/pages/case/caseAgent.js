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
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) throw new Error('Gemini returned no text');
    return { answer: text, citations: local.citations, engine: 'gemini' };
  } catch {
    return { ...local, engine: 'local' };
  }
}
