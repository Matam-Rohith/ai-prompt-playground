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
    issue: "No target audience specified (e.g., 'for a high school student').",
    tip: "Specifying who the output is for helps the AI adjust tone and complexity."
  },
  {
    id: "no_format",
    test: p => !/(list|bullet|paragraph|table|json|csv|code|step|numbered|format|summary|outline|report|essay|email|tweet)/i.test(p),
    issue: "No output format defined (e.g., 'as a bullet list' or 'in JSON').",
    tip: "Defining the output format (list, table, essay, JSON) prevents unexpected results."
  },
  {
    id: "no_length",
    test: p => !/(\d+\s*word|\d+\s*sentence|\d+\s*paragraph|brief|concise|detailed|short|long|extensive|in depth)/i.test(p),
    issue: "No length or detail level specified (e.g., 'in 150 words').",
    tip: "Mention desired length like '100 words', 'brief', or '3 paragraphs'."
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
    issue: "No tone or style mentioned (e.g., 'in a formal tone').",
    tip: "Tone shapes the writing style. Try: formal, friendly, persuasive, or simple."
  },
  {
    id: "vague_verb",
    test: p => /^(write|make|do|give|tell|say|create|generate|produce)/i.test(p.trim()) && p.trim().split(/\s+/).length < 10,
    issue: "Starts with a vague action verb without enough specifics.",
    tip: "Replace vague openers with specific ones: instead of 'Write something', say 'Write a 200-word product description for...'."
  },
];

// ─── Improvement Templates ───────────────────────────────────────────────────
function buildImprovedPrompt(original, issues) {
  const ids = issues.map(i => i.id);
  let improved = original.trim();

  // Inject fixes based on detected issues
  const needsAudience = ids.includes("no_audience");
  const needsFormat   = ids.includes("no_format");
  const needsLength   = ids.includes("no_length");
  const needsContext  = ids.includes("no_context");
  const needsTone     = ids.includes("no_tone");

  // Build qualifier strings
  const lengthStr   = needsLength   ? " in 150 words" : "";
  const audienceStr = needsAudience ? " for a general audience" : "";
  const toneStr     = needsTone     ? " using a clear and simple tone" : "";
  const formatStr   = needsFormat   ? " Format the output as a numbered list." : "";
  const contextStr  = needsContext  ? " Provide necessary background context before the main content." : "";

  // Reconstruct
  const base = improved.replace(/\.$/, "");
  improved = `${base}${lengthStr}${audienceStr}${toneStr}.${formatStr}${contextStr}`;

  return improved;
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

  // --- Issues list ---
  const issuesList = document.getElementById("issuesList");
  issuesList.innerHTML = triggered.length === 0
    ? '<li style="color:#10b981">✅ No major issues found!</li>'
    : triggered.map(r => `<li>❌ ${r.issue}</li>`).join("");

  // --- Score ---
  const scoreEl = document.getElementById("scoreValue");
  scoreEl.textContent = score;
  scoreEl.parentElement.style.color = scoreColor(score);
  document.getElementById("scoreLabel").textContent = scoreLabel(score);

  // --- Improved prompt ---
  document.getElementById("improvedPrompt").textContent = improved;

  // --- Tips ---
  const tipsList = document.getElementById("tipsList");
  const tipsToShow = triggered.length > 0 ? triggered : RULES.slice(0, 3);
  tipsList.innerHTML = tipsToShow.map(r => `<li>💡 ${r.tip}</li>`).join("");

  // --- Show output ---
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

// ─── Enter key shortcut ──────────────────────────────────────────────────────
document.getElementById("promptInput").addEventListener("keydown", e => {
  if (e.ctrlKey && e.key === "Enter") analyzePrompt();
});

renderExamples();
