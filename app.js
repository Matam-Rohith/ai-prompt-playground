// ─ State
let currentMode = 'rule';
let geminiKey = localStorage.getItem('AQ.Ab8RN6I2W8CeuNqHpywYnY1EQvJFHBvfPIl60Swtitptw9XoRg') || '';

window.addEventListener('DOMContentLoaded', () => {
  if (geminiKey) document.getElementById('apiKeyInput').value = geminiKey;
  updateModeStatus();
  renderExamples();
});

// ─ Mode
function setMode(mode) {
  if (mode === 'ai' && !geminiKey) {
    showToast('Please save your Gemini API key first!', '#f59e0b');
    return;
  }
  currentMode = mode;
  document.getElementById('btnRule').classList.toggle('active', mode === 'rule');
  document.getElementById('btnAI').classList.toggle('active', mode === 'ai');
  updateModeStatus();
}

function updateModeStatus() {
  const el = document.getElementById('modeStatus');
  if (currentMode === 'ai' && geminiKey) {
    el.textContent = '🤖 AI mode (Gemini)';
    el.style.color = '#06b6d4';
  } else {
    el.textContent = '⚡ Offline mode';
    el.style.color = '';
  }
}

function saveApiKey() {
  const val = document.getElementById('apiKeyInput').value.trim();
  if (!val) { showToast('Please enter a valid API key', '#ef4444'); return; }
  geminiKey = val;
  localStorage.setItem('gemini_api_key', val);
  showToast('✅ Key saved! Switching to AI mode.');
  setMode('ai');
}

// ─ Examples
const EXAMPLES = [
  { label: 'Too Vague',        prompt: 'Write a summary of this article.' },
  { label: 'Missing Context',  prompt: 'Translate this text.' },
  { label: 'No Format',        prompt: 'Give me some marketing ideas.' },
  { label: 'No Audience',      prompt: 'Explain machine learning.' },
  { label: 'Weak Instruction', prompt: 'Make this better.' },
  { label: 'No Length/Tone',   prompt: 'Write a cover letter for a job.' },
];

// ─ Rules
const RULES = [
  { id: 'too_short',   test: p => p.trim().split(/\s+/).length < 6,                                                                                       issue: 'Prompt is too short — add more detail.',                              tip: 'Longer prompts with clear instructions produce better results.' },
  { id: 'no_audience', test: p => !/(student|beginner|expert|professional|child|audience|reader|engineer|developer|kid|adult|teacher)/i.test(p),           issue: "No target audience specified (e.g., 'for a software engineer').",     tip: 'Specifying the audience helps the AI adjust tone and complexity.' },
  { id: 'no_format',   test: p => !/(list|bullet|paragraph|table|json|csv|code|step|numbered|format|summary|outline|report|essay|email|tweet)/i.test(p),  issue: "No output format defined (e.g., 'as bullet points').",               tip: 'Defining the format (list, table, essay) prevents unexpected results.' },
  { id: 'no_length',   test: p => !/(\d+\s*word|\d+\s*sentence|\d+\s*paragraph|brief|concise|detailed|short|long|extensive)/i.test(p),                   issue: "No length specified (e.g., 'brief' or 'detailed').",                 tip: "Guide with 'brief', 'detailed', or 'in 3 paragraphs'." },
  { id: 'no_context',  test: p => !/(context|background|about|regarding|based on|given that|considering|the following)/i.test(p),                         issue: 'Missing context — what is the AI working with?',                     tip: 'Provide context: paste the article or describe the situation.' },
  { id: 'no_tone',     test: p => !/(formal|informal|friendly|professional|casual|serious|humorous|simple|technical|persuasive|neutral|tone)/i.test(p),    issue: "No tone mentioned (e.g., 'in a professional tone').",               tip: 'Tone shapes the style. Try: formal, friendly, persuasive, or simple.' },
  { id: 'vague_verb',  test: p => /^(write|make|do|give|tell|say|create|generate|produce)/i.test(p.trim()) && p.trim().split(/\s+/).length < 10,           issue: 'Vague opener — add more specifics after the action verb.',           tip: "Instead of 'Write something', say 'Write a product description for…'." },
];

// ─ Rule-based rewriter (fallback)
function detectIntent(p) {
  if (/summar|tldr/i.test(p))              return 'summarize';
  if (/translat/i.test(p))                 return 'translate';
  if (/cover letter/i.test(p))             return 'cover_letter';
  if (/resume|cv|tailor/i.test(p))         return 'resume';
  if (/explain|what is|how does/i.test(p)) return 'explain';
  if (/marketing|campaign/i.test(p))       return 'marketing';
  if (/\bemail\b/i.test(p))               return 'email';
  if (/code|function|script/i.test(p))     return 'code';
  if (/review|feedback|critique/i.test(p)) return 'review';
  if (/plan|roadmap|strategy/i.test(p))    return 'plan';
  return 'generic';
}

const T = {
  summarize:    ()  => 'Summarize the following content clearly and concisely. Highlight the key points, main argument, and any important conclusions. Keep the tone neutral and easy to understand.',
  translate:    p   => { const l = p.match(/to\s+([a-z]+)/i)?.[1]||'the target language'; return `Translate the following text into ${l}. Preserve the original meaning, tone, and formatting.`; },
  cover_letter: p   => { const j = p.match(/for\s+(?:a\s+)?(.+)/i)?.[1]?.trim()||'the role'; return `Write a professional cover letter for ${j}. Highlight relevant skills, explain why the candidate is a strong fit, and close with a confident call to action.`; },
  resume:       p   => { const r = p.match(/(?:for|to)\s+(.+?)(?:\s+job|\s+role|\s+jd|$)/i)?.[1]?.trim()||'the target job'; return `Tailor this resume for ${r}. Emphasize relevant skills, align experience with JD requirements, use strong action verbs, and ensure ATS compatibility.`; },
  explain:      p   => { const t = p.replace(/explain|what is|how does|tell me about/gi,'').trim()||'this topic'; return `Explain ${t} in simple, beginner-friendly language. Start with a one-sentence definition, then break it down step by step with a real-world analogy.`; },
  marketing:    p   => { const pr = p.replace(/give me|marketing|ideas?|for|some/gi,'').trim()||'the product'; return `Generate creative, actionable marketing ideas for ${pr}. Focus on social media, content marketing, and community engagement.`; },
  email:        p   => { const pu = p.replace(/write|an?|email/gi,'').trim()||'this purpose'; return `Write a professional email for ${pu}. Keep it concise with a subject line, opening, main message, and a clear call to action.`; },
  code:         p   => { const ta = p.replace(/write|create|generate|code|script|function|program/gi,'').trim()||'this task'; return `Write clean, well-commented code for ${ta}. Include error handling, follow best practices, and add a brief explanation.`; },
  review:       p   => { const s = p.replace(/review|give feedback|critique/gi,'').trim()||'this content'; return `Review ${s} and provide structured feedback. Identify strengths, areas for improvement, and specific actionable suggestions.`; },
  plan:         p   => { const g = p.replace(/create|make|write|plan|roadmap|strategy|for/gi,'').trim()||'the goal'; return `Create a step-by-step plan for ${g}. Break it into phases with specific actions and success metrics.`; },
  generic:      p   => `${p.trim().replace(/\.$/, '')}. Be specific, clear, and structured. Include relevant context and examples, and focus on practical, actionable output.`,
};

function ruleRewrite(original, issues) {
  if (issues.length === 0) return original;
  return T[detectIntent(original)](original);
}

// ─ Gemini AI rewriter
async function geminiRewrite(original, issues) {
  const issueList = issues.map(i => `- ${i.issue}`).join('\n') || 'General improvement needed.';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
  const body = {
    system_instruction: { parts: [{ text: `You are an expert prompt engineer. Rewrite the user's weak AI prompt into a professional, precise, effective one.\nRules:\n- Do NOT add word counts or format constraints unless the user asked.\n- Rewrite naturally as a human expert would.\n- Keep the user's original intent.\n- Output ONLY the rewritten prompt. No labels, no explanation.` }] },
    contents: [{ parts: [{ text: `Original prompt: "${original}"\n\nIssues:\n${issueList}\n\nRewrite:` }] }]
  };
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) { const e = await res.json(); throw new Error(e?.error?.message || 'Gemini API error'); }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'No response from Gemini.';
}

// ─ Score
function scorePrompt(n, total) { return Math.max(1, Math.round(((total - n) / total) * 100) / 10); }
function scoreColor(s) { return s >= 8 ? '#10b981' : s >= 5 ? '#f59e0b' : '#ef4444'; }
function scoreLabel(s) { return s >= 8 ? 'Great prompt! 🎉' : s >= 5 ? 'Needs some improvement' : 'Needs significant work'; }

// ─ Main
async function analyzePrompt() {
  const input = document.getElementById('promptInput').value;
  if (!input.trim()) { showToast('Please enter a prompt first!', '#ef4444'); return; }

  const triggered = RULES.filter(r => r.test(input));
  const score = scorePrompt(triggered.length, RULES.length);

  document.getElementById('issuesList').innerHTML = triggered.length === 0
    ? '<li style="color:#10b981">✅ No major issues found!</li>'
    : triggered.map(r => `<li>❌ ${r.issue}</li>`).join('');

  const scoreEl = document.getElementById('scoreValue');
  scoreEl.textContent = score;
  scoreEl.parentElement.style.color = scoreColor(score);
  document.getElementById('scoreLabel').textContent = scoreLabel(score);
  document.getElementById('tipsList').innerHTML = (triggered.length > 0 ? triggered : RULES.slice(0,3)).map(r => `<li>💡 ${r.tip}</li>`).join('');

  const out = document.getElementById('outputSection');
  out.style.display = 'grid';
  out.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const improvedEl = document.getElementById('improvedPrompt');
  const loaderEl   = document.getElementById('loader');
  const aiBadge    = document.getElementById('aiBadge');
  const btn        = document.getElementById('analyzeBtn');
  const copyBtn    = document.querySelector('.copy-btn');

  if (currentMode === 'ai' && geminiKey) {
    improvedEl.textContent = '';
    loaderEl.style.display = 'flex';
    copyBtn.style.display  = 'none';
    aiBadge.style.display  = 'inline';
    btn.disabled = true;
    btn.textContent = '⏳ Analyzing…';
    try {
      improvedEl.textContent = await geminiRewrite(input, triggered);
      improvedEl.style.borderColor = '';
    } catch (err) {
      improvedEl.textContent = ruleRewrite(input, triggered);
      improvedEl.style.borderColor = '#f59e0b';
      showToast('AI failed — used rule-based fallback', '#f59e0b');
    } finally {
      loaderEl.style.display = 'none';
      copyBtn.style.display  = 'inline-block';
      btn.disabled = false;
      btn.textContent = '🔍 Analyze Prompt';
    }
  } else {
    aiBadge.style.display  = 'none';
    loaderEl.style.display = 'none';
    copyBtn.style.display  = 'inline-block';
    improvedEl.textContent = ruleRewrite(input, triggered);
    improvedEl.style.borderColor = '';
  }
}

// ─ Copy
function copyImproved() {
  navigator.clipboard.writeText(document.getElementById('improvedPrompt').textContent)
    .then(() => showToast('Copied! ✅'));
}

// ─ Toast
function showToast(msg, color = '#10b981') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.style.background = color;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ─ Examples
function renderExamples() {
  document.getElementById('examplesGrid').innerHTML = EXAMPLES.map(ex =>
    `<div class="example-chip" onclick="loadExample(${JSON.stringify(ex.prompt)})">
      <strong>${ex.label}</strong>${ex.prompt}
    </div>`).join('');
}

function loadExample(p) {
  document.getElementById('promptInput').value = p;
  analyzePrompt();
}

document.getElementById('promptInput').addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 'Enter') analyzePrompt();
});
