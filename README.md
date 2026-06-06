# ⚡ AI Prompt Playground

> Learn to write better prompts with instant, rule-based feedback — **no backend required**.

🔗 **Live Demo:** [View on GitHub Pages](https://matam-rohith.github.io/ai-prompt-playground/)

---

## 🎯 What It Does

You type a prompt like:
> `Write a summary of this article.`

The app analyzes it and tells you:
- ❌ Too vague
- ❌ No target audience specified
- ❌ No output format defined
- ❌ Missing context

Then it generates an improved version:
> `Write a summary of this article in 150 words for a general audience using a clear and simple tone. Format the output as a numbered list. Provide necessary background context before the main content.`

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔍 Prompt Analyzer | 7-rule engine that detects common prompt weaknesses |
| 📊 Prompt Score | Score out of 10 with color-coded quality rating |
| ✅ Auto-Improvement | Generates a better version of your prompt |
| 💡 Tips Panel | Context-aware prompt engineering tips |
| 🎓 Example Prompts | 6 clickable bad-prompt examples to learn from |
| 📋 Copy Button | One-click copy of the improved prompt |
| ⌨️ Keyboard Shortcut | `Ctrl+Enter` to analyze |

---

## 🛠️ Tech Stack

- **HTML5** — Semantic structure
- **CSS3** — Dark theme, CSS Grid, animations
- **Vanilla JavaScript** — Rule engine, DOM manipulation
- **Zero dependencies** — No npm, no backend, no API keys

---

## 🚀 Deployment

This project is deployed via **GitHub Pages** (static hosting — no server needed).

To run locally, just open `index.html` in any browser.

---

## 📐 How the Rule Engine Works

The analyzer runs 7 rules against your prompt:

1. **Too short** — fewer than 6 words
2. **No audience** — no mention of who the output is for
3. **No format** — no output format (list, JSON, essay, etc.)
4. **No length** — no word count or brevity guidance
5. **No context** — no background or reference material
6. **No tone** — no style/tone direction
7. **Vague verb** — starts with a weak action without specifics

Each rule that triggers reduces the score. The improvement engine injects fixes for each triggered rule.

---

## 👤 Author

**Matam Rohith** — [Portfolio](https://rohith-portfolio-six.vercel.app/) | [GitHub](https://github.com/Matam-Rohith)
