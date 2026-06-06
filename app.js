// ─── Example Prompts ────────────────────────────────────────────────────────
const EXAMPLES = [
  { label: "Too Vague",         prompt: "Write a summary of this article." },
  { label: "Missing Context",   prompt: "Translate this text." },
  { label: "No Format",         prompt: "Give me some marketing ideas." },
  { label: "No Audience",       prompt: "Explain machine learning." },
  { label: "Weak Instruction",  prompt: "Make this better." },
  { label: "No Length/Tone",    prompt: "Write a cover letter for a job." },
];

// ─── Issue Detectors ────────────────────────────────────────────────────────
const RULES = [
  {
    id: "too_short",
    test: p => p.trim().split(/\s+/).length < 6,
    issue: "Prompt is too short — add more detail.",
    tip: "Longer prompts with clear instructions produce better results."
  },
  {
    id: "no_audience",
    test: p => !/(student|beginner|expert|professional|child|audience|reader|engineer|developer|kid|adult|teacher)/i.test(p),
    issue: "No target audience specified (e.g., 'for a software engineer').",
    tip: "Specifying who the output is for helps the AI adjust tone and complexity."
  },
  {
    id: "no_format",
    test: p => !/(list|bullet|paragraph|table|json|csv|code|step|numbered|format|summary|outline|report|essay|email|tweet)/i.test(p),
    issue: "No output format defined (e.g., 'as bullet points' or 'as a table').",
    tip: "Defining the output format (list, table, essay, JSON) prevents unexpected results."
  },
  {
    id: "no_length",
    test: p => !/(\d+\s*word|\d+\s*sentence|\d+\s*paragraph|brief|concise|detailed|short|long|extensive|in depth)/i.test(p),
    issue: "No length or detail level specified (e.g., 'brief' or 'detailed').",
    tip: "Guide the AI with terms like 'brief', 'detailed', or 'in 3 paragraphs'."
  },
  {
    id: "no_context",
    test: p => !/(context|background|about|regarding|based on|given that|considering|the following)/i.test(p),
    issue: "Missing context — what is the AI working with?",
    tip: "Always provide context: paste the article, describe the situation, or add background."
  },
  {
    id: "no_tone",
    test: p => !/(formal|informal|friendly|professional|casual|serious|humorous|simple|technical|persuasive|neutral|tone)/i.test(p),
    issue: "No tone or style mentioned (e.g., 'in a professional tone').",
    tip: "Tone shapes the writing style. Try: formal, friendly, persuasive, or simple."
  },
  {
    id: "vague_verb",
    test: p => /^(write|make|do|give|tell|say|create|generate|produce)/i.test(p.trim()) && p.trim().split(/\s+/).length < 10,
    issue: "Starts with a vague action verb without enough specifics.",
    tip: "Be specific from the start: instead of 'Write something', say 'Write a product description for a fitness app targeting beginners'."
  },
];

// ─── Intent Detection ────────────────────────────────────────────────────────
function detectIntent(p) {
  const lower = p.toLowerCase();
  if (/summar|summarize|tldr/i.test(lower))       return "summarize";
  if (/translat/i.test(lower))                     return "translate";
  if (/cover letter/i.test(lower))                 return "cover_letter";
  if (/resume|cv|tailor/i.test(lower))             return "resume";
  if (/explain|what is|how does/i.test(lower))     return "explain";
  if (/marketing|idea|campaign/i.test(lower))      return "marketing";
  if (/email|write.*email/i.test(lower))           return "email";
  if (/code|function|script|program/i.test(lower)) return "code";
  if (/review|feedback|critique/i.test(lower))     return "review";
  if (/plan|roadmap|strategy/i.test(lower))        return "plan";
  return "generic";
}

// ─── Natural Rewrite Templates ──────────────────────────────────────────────────
const REWRITE_TEMPLATES = {
  summarize: () =>
    `Summarize the following content clearly and concisely. Highlight the key points, main argument, and any important conclusions. Keep the tone neutral and the language easy to understand.`,

  translate: (p) => {
    const lang = p.match(/to\s+([a-z]+)/i)?.[1] || "the target language";
    return `Translate the following text into ${lang}. Preserve the original meaning, tone, and formatting. If there are any ambiguous phrases, choose the most contextually accurate translation.`;
  },

  cover_letter: (p) => {
    const job = p.match(/for\s+(?:a\s+)?(.+)/i)?.[1]?.trim() || "the specified role";
    return `Write a professional cover letter for ${job}. Highlight relevant skills and experience, explain why the candidate is a strong fit, and close with a confident call to action. Keep the tone enthusiastic yet professional.`;
  },

  resume: (p) => {
    const role = p.match(/(?:for|to)\s+(.+?)(?:\s+job|\s+role|\s+position|\s+jd|$)/i)?.[1]?.trim() || "the target job";
    return `Tailor this resume to match the job description for ${role}. Emphasize relevant skills, reframe experience to align with the JD requirements, and use strong action verbs. Ensure it passes ATS screening.`;
  },

  explain: (p) => {
    const topic = p.replace(/explain|what is|how does|tell me about/gi, "").trim() || "this topic";
    return `Explain ${topic} in simple, beginner-friendly language. Start with a one-sentence definition, then break it down step by step using a real-world analogy where helpful.`;
  },

  marketing: (p) => {
    const product = p.replace(/give me|marketing|ideas?|for|some/gi, "").trim() || "the product";
    return `Generate creative, actionable marketing ideas for ${product}. Focus on strategies across social media, content marketing, and community engagement. Prioritize low-cost, high-impact approaches.`;
  },

  email: (p) => {
    const purpose = p.replace(/write|an?|email/gi, "").trim() || "this purpose";
    return `Write a professional email for ${purpose}. Keep it concise, polite, and clearly structured with a subject line, opening, main message, and a clear call to action.`;
  },

  code: (p) => {
    const task = p.replace(/write|create|generate|a?|code|script|function|program/gi, "").trim() || "this functionality";
    return `Write clean, well-commented code for ${task}. Include error handling, follow best practices for the relevant language, and add a brief explanation of how the code works.`;
  },

  review: (p) => {
    const subject = p.replace(/review|give feedback|critique/gi, "").trim() || "this content";
    return `Review ${subject} and provide structured feedback. Identify strengths, areas for improvement, and specific actionable suggestions. Be constructive and specific.`;
  },

  plan: (p) => {
    const goal = p.replace(/create|make|write|a?|plan|roadmap|strategy|for/gi, "").trim() || "the goal";
    return `Create a clear, step-by-step plan for ${goal}. Break it into phases with specific actions, timelines, and success metrics. Prioritize tasks by impact and feasibility.`;
  },

  generic: (p) => {
    const cleaned = p.trim().replace(/\.$/, "");
    return `${cleaned}. Be specific, clear, and structured in your response. Include relevant context, examples where appropriate, and focus on practical, actionable output.`;
  },
};

// ─── Smart Prompt Rewriter ───────────────────────────────────────────────────
function buildImprovedPrompt(original, issues) {
  if (issues.length === 0) return original;
  const intent = detectIntent(original);
  return REWRITE_TEMPLATES[intent](original);
}

// ─── Scoring ─────────────────────────────────────────────────────────────────
function scorePrompt(issueCount, totalRules) {
  const raw = ((totalRules - issueCount) / totalRules) * 10;
  return Math.max(1, Math.round(raw * 10) / 10);
}

function scoreColor(score) {
  if (score >= 8)  return "#10b981";
  if (score >= 5)  return "#f59e0b";
  return "#ef4444";
}

function scoreLabel(score) {
  if (score >= 8)  return "Great prompt! 🎉";
  if (score >= 5)  return "Needs some improvement";
  return "Needs significant work";
}

// ─── Main Analyzer ───────────────────────────────────────────────────────────
function analyzePrompt() {
  const input = document.getElementById("promptInput").value;
  if (!input.trim()) { showToast("Please enter a prompt first!", "#ef4444"); return; }

  const triggered = RULES.filter(rule => rule.test(input));
  const score = scorePrompt(triggered.length, RULES.length);
  const improved = buildImprovedPrompt(input, triggered);

  const issuesList = document.getElementById("issuesList");
  issuesList.innerHTML = triggered.length === 0
    ? '<li style="color:#10b981">✅ No major issues found!</li>'
    : triggered.map(r => `<li>❌ ${r.issue}</li>`).join("");

  const scoreEl = document.getElementById("scoreValue");
  scoreEl.textContent = score;
  scoreEl.parentElement.style.color = scoreColor(score);
  document.getElementById("scoreLabel").textContent = scoreLabel(score);

  document.getElementById("improvedPrompt").textContent = improved;

  const tipsList = document.getElementById("tipsList");
  const tipsToShow = triggered.length > 0 ? triggered : RULES.slice(0, 3);
  tipsList.innerHTML = tipsToShow.map(r => `<li>💡 ${r.tip}</li>`).join("");

  const out = document.getElementById("outputSection");
  out.style.display = "grid";
  out.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ─── Copy to Clipboard ───────────────────────────────────────────────────────
function copyImproved() {
  const text = document.getElementById("improvedPrompt").textContent;
  navigator.clipboard.writeText(text).then(() => showToast("Copied to clipboard! ✅"));
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function showToast(msg, color = "#10b981") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.style.background = color;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}

// ─── Render Examples ─────────────────────────────────────────────────────────
function renderExamples() {
  const grid = document.getElementById("examplesGrid");
  grid.innerHTML = EXAMPLES.map(ex => `
    <div class="example-chip" onclick="loadExample(${JSON.stringify(ex.prompt)})">
      <strong>${ex.label}</strong>
      ${ex.prompt}
    </div>
  `).join("");
}

function loadExample(prompt) {
  document.getElementById("promptInput").value = prompt;
  analyzePrompt();
}

// ─── Ctrl+Enter shortcut ──────────────────────────────────────────────────────
document.getElementById("promptInput").addEventListener("keydown", e => {
  if (e.ctrlKey && e.key === "Enter") analyzePrompt();
});

renderExamples();
