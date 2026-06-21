import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = "/Users/firstlink/Documents/owasp";
const dataPath = path.join(root, "agentic-security/assets/walkthrough-data.js");
const outputSvgPath = path.join(root, "tmp/asi05-shared-defense-preview.svg");

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(dataPath, "utf8"), context);

const config = context.window.ASI_WALKTHROUGHS["asi05-shared-defense"]?.defense;
if (!config) {
  throw new Error("ASI05 shared defense config not found.");
}

config.d1.sub2 = "Shell, SQL, and subprocess markers are quarantined early.";
config.d4.sub1 = "Preview state changes before destructive execution.";
config.d5.sub1 = "Deletes, production writes, and sends require approval.";

const fontStack = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function estimateTextWidth(text, fontSize) {
  return Array.from(String(text || "")).reduce((width, char) => {
    if (char === " ") return width + fontSize * 0.33;
    if ("ilI1.,:'".includes(char)) return width + fontSize * 0.28;
    if ("mwMW@#".includes(char)) return width + fontSize * 0.9;
    return width + fontSize * 0.56;
  }, 0);
}

function splitLongToken(token, width, fontSize) {
  const value = String(token || "");
  if (!value) return [];
  if (estimateTextWidth(value, fontSize) <= width) return [value];

  const preferredBreak = value.includes("-") ? value.split(/(?<=-)/).filter(Boolean) : null;
  if (preferredBreak?.length && preferredBreak.every((segment) => estimateTextWidth(segment, fontSize) <= width)) {
    return preferredBreak;
  }

  const segments = [];
  let current = "";
  Array.from(value).forEach((char) => {
    const candidate = `${current}${char}`;
    if (!current || estimateTextWidth(candidate, fontSize) <= width) {
      current = candidate;
      return;
    }
    segments.push(current);
    current = char;
  });
  if (current) segments.push(current);
  return segments;
}

function wrapText(text, width, fontSize, maxLines, forceEllipsis = false) {
  const words = String(text || "")
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((word) => splitLongToken(word, width, fontSize));
  if (!words.length) return Object.assign([""], { truncated: false });

  const lines = [];
  let current = words.shift();
  words.forEach((word) => {
    const candidate = `${current} ${word}`;
    if (estimateTextWidth(candidate, fontSize) <= width) {
      current = candidate;
      return;
    }
    lines.push(current);
    current = word;
  });
  lines.push(current);

  if (lines.length <= maxLines && !forceEllipsis) {
    return Object.assign(lines, { truncated: false });
  }

  const trimmed = lines.slice(0, maxLines);
  const lastIndex = trimmed.length - 1;
  let lastLine = trimmed[lastIndex] || "";
  while (lastLine.length > 1 && estimateTextWidth(`${lastLine}…`, fontSize) > width) {
    lastLine = lastLine.slice(0, -1).trimEnd();
  }
  trimmed[lastIndex] = `${lastLine}…`;
  return Object.assign(trimmed, { truncated: true });
}

function fitWrappedText(text, width, startFontSize, minFontSize, maxLines) {
  for (let size = startFontSize; size >= minFontSize; size -= 1) {
    const lines = wrapText(text, width, size, maxLines);
    if (!lines.truncated) return { lines, fontSize: size };
  }
  return { lines: wrapText(text, width, minFontSize, maxLines, true), fontSize: minFontSize };
}

function fitSingleLine(text, width, startFontSize, minFontSize) {
  const value = String(text || "");
  for (let size = startFontSize; size >= minFontSize; size -= 1) {
    if (estimateTextWidth(value, size) <= width) {
      return { text: value, fontSize: size };
    }
  }
  let trimmed = value;
  while (trimmed.length > 1 && estimateTextWidth(`${trimmed}…`, minFontSize) > width) {
    trimmed = trimmed.slice(0, -1).trimEnd();
  }
  return { text: `${trimmed}…`, fontSize: minFontSize };
}

function renderTspans(x, lines, lineHeight) {
  return lines
    .map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeHtml(line)}</tspan>`)
    .join("");
}

function getNodeTextWidth(nodeWidth, role, preset = "compact") {
  const safeArea = preset === "wide"
    ? { titleInsetX: 42, bodyInsetX: 41 }
    : { titleInsetX: 18, bodyInsetX: 16 };
  const inset = role === "title" ? safeArea.titleInsetX : safeArea.bodyInsetX;
  return Math.max(40, nodeWidth - inset * 2);
}

function fitNodeTitleText(text, nodeWidth, startFontSize, minFontSize, preset = "compact") {
  return fitWrappedText(text, getNodeTextWidth(nodeWidth, "title", preset), startFontSize, minFontSize, 2);
}

function fitNodeBodyText(text, nodeWidth, startFontSize, minFontSize, preset = "compact") {
  return fitWrappedText(text, getNodeTextWidth(nodeWidth, "body", preset), startFontSize, minFontSize, 2);
}

function flowLabelMarkup(x, lineY, text, color, fontSize, maxWidth, orientation = "horizontal") {
  const layout = fitWrappedText(text, maxWidth, fontSize, 10.5, 2);
  const lineHeight = layout.fontSize * 1.18;
  const multiLineLift = layout.lines.length > 1 ? ((layout.lines.length - 1) * lineHeight) / 2 : 0;
  const textY = lineY - multiLineLift - 12;
  return `<text x="${x}" y="${textY}" text-anchor="middle" font-family="${fontStack}" font-size="${layout.fontSize}" font-weight="700" fill="${color}">${renderTspans(x, layout.lines, lineHeight)}</text>`;
}

function stageCard(x, y, id, card, tone = "safe", width = 240, height = 186) {
  const title = fitNodeTitleText(card.title, width, 17, 13, "wide");
  const sub1 = fitNodeBodyText(card.sub1, width, 12.5, 10, "wide");
  const sub2 = fitNodeBodyText(card.sub2, width, 11.5, 9.5, "wide");
  const fill = tone === "primary" ? "#eef1ff" : "#edf7f0";
  const stroke = tone === "primary" ? "#4452b8" : "#2d6a4f";
  const idFill = tone === "primary" ? "#4452b8" : "#2d6a4f";
  const titleFill = tone === "primary" ? "#33429f" : "#24553f";
  const sub1Fill = tone === "primary" ? "#5360be" : "#3d735a";
  const sub2Fill = tone === "primary" ? "#6b77cb" : "#56826c";
  const titleLineHeight = title.fontSize * 1.14;
  const sub1LineHeight = sub1.fontSize * 1.15;
  const sub2LineHeight = sub2.fontSize * 1.15;
  const titleBlockHeight = Math.max(titleLineHeight, title.lines.length * titleLineHeight);
  const sub1BlockHeight = Math.max(sub1LineHeight, sub1.lines.length * sub1LineHeight);
  const titleY = y + 36;
  const sub1Y = titleY + titleBlockHeight + 22;
  const sub2Y = sub1Y + sub1BlockHeight + 18;

  return `
    <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="20" fill="${fill}" stroke="${stroke}" stroke-width="2.8"/>
    <text x="${x + 30}" y="${y + 30}" font-family="${fontStack}" font-size="12" font-weight="800" fill="${idFill}">${id}</text>
    <text x="${x + width / 2}" y="${titleY}" text-anchor="middle" font-family="${fontStack}" font-size="${title.fontSize}" font-weight="700" fill="${titleFill}">${renderTspans(x + width / 2, title.lines, titleLineHeight)}</text>
    <text x="${x + width / 2}" y="${sub1Y}" text-anchor="middle" font-family="${fontStack}" font-size="${sub1.fontSize}" fill="${sub1Fill}">${renderTspans(x + width / 2, sub1.lines, sub1LineHeight)}</text>
    <text x="${x + width / 2}" y="${sub2Y}" text-anchor="middle" font-family="${fontStack}" font-size="${sub2.fontSize}" fill="${sub2Fill}">${renderTspans(x + width / 2, sub2.lines, sub2LineHeight)}</text>
  `;
}

const agentGoalLayout = fitSingleLine(config.agent.goal, 176, 12, 10);
const patternTitleLayout = fitSingleLine(config.patterns.title, 188, 17, 13);
const patternSub1Layout = fitWrappedText(config.patterns.sub1, 190, 11.5, 9.5, 2);
const patternSub2Layout = fitWrappedText(config.patterns.sub2, 190, 11.5, 9.5, 2);
const patternSub3Layout = fitWrappedText(config.patterns.sub3, 190, 11.5, 9.5, 2);
const auditTitle = fitSingleLine(config.audit.title, 350, 12, 10);
const auditSub1 = fitWrappedText(config.audit.sub1, 900, 10.5, 9, 2);
const outcomeTitle = fitSingleLine(config.outcome.title, 280, 18, 14);
const outcomeSub1 = fitWrappedText(config.outcome.sub1, 260, 12.5, 10, 2);
const outcomeSub2 = fitWrappedText(config.outcome.sub2, 260, 11.5, 9.5, 2);

const row3Y = 662;
const row3CenterY = row3Y + 93;
const outcomeY = 960;
const outcomeCenterX = 1120;
const outcomeBottomY = outcomeY + 92;

const svg = `
<svg viewBox="0 0 1400 1180" width="1400" height="1180" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    </marker>
  </defs>
  <rect width="1400" height="1180" fill="#fff"/>
  <line x1="240" y1="230" x2="350" y2="230" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>
  <line x1="570" y1="230" x2="680" y2="230" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>
  <line x1="900" y1="225" x2="1010" y2="225" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>
  <line x1="1120" y1="290" x2="1120" y2="336" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>
  <line x1="1010" y1="458" x2="900" y2="458" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>
  <line x1="680" y1="436" x2="570" y2="436" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>
  <line x1="460" y1="514" x2="460" y2="620" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>
  <line x1="590" y1="${row3CenterY}" x2="680" y2="${row3CenterY}" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>
  <line x1="900" y1="${row3CenterY}" x2="1010" y2="${row3CenterY}" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>
  <line x1="1120" y1="778" x2="1120" y2="${outcomeY}" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>
  <line x1="${outcomeCenterX}" y1="${outcomeBottomY}" x2="${outcomeCenterX}" y2="1100" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

  <rect x="70" y="170" width="170" height="120" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
  <text x="155" y="220" text-anchor="middle" font-family="${fontStack}" font-size="18" font-weight="700" fill="#38342f">${escapeHtml(config.user.title)}</text>
  <text x="155" y="252" text-anchor="middle" font-family="${fontStack}" font-size="14" fill="#6b655c">${escapeHtml(config.user.sub1)}</text>
  <text x="155" y="276" text-anchor="middle" font-family="${fontStack}" font-size="11" fill="#8a847b">${escapeHtml(config.user.sub2)}</text>

  <rect x="350" y="160" width="220" height="146" rx="20" fill="#f7f8ff" stroke="#4452b8" stroke-width="2.8"/>
  <text x="460" y="220" text-anchor="middle" font-family="${fontStack}" font-size="18" font-weight="700" fill="#33429f">${escapeHtml(config.agent.title)}</text>
  <text x="460" y="252" text-anchor="middle" font-family="${fontStack}" font-size="14" fill="#5360be">${escapeHtml(config.agent.sub1)}</text>
  <rect x="372" y="270" width="176" height="32" rx="10" fill="#edf7f0" stroke="#bdddc8" stroke-width="1.2"/>
  <text x="460" y="292" text-anchor="middle" font-family="${fontStack}" font-size="${agentGoalLayout.fontSize}" font-weight="700" fill="#2d6a4f">${escapeHtml(agentGoalLayout.text)}</text>

  <rect x="680" y="160" width="220" height="130" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
  <text x="790" y="222" text-anchor="middle" font-family="${fontStack}" font-size="18" font-weight="700" fill="#38342f">${escapeHtml(config.toolTop.title)}</text>
  <text x="790" y="252" text-anchor="middle" font-family="${fontStack}" font-size="14" fill="#6b655c">${escapeHtml(config.toolTop.sub1)}</text>
  <text x="790" y="282" text-anchor="middle" font-family="${fontStack}" font-size="12" fill="#8a847b">${escapeHtml(config.toolTop.sub2)}</text>

  <rect x="1010" y="160" width="220" height="130" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
  <text x="1120" y="214" text-anchor="middle" font-family="${fontStack}" font-size="18" font-weight="700" fill="#38342f">${escapeHtml(config.store.title)}</text>
  <text x="1120" y="246" text-anchor="middle" font-family="${fontStack}" font-size="14" fill="#6b655c">${escapeHtml(config.store.sub1)}</text>
  <text x="1120" y="274" text-anchor="middle" font-family="${fontStack}" font-size="12" fill="#8a847b">${escapeHtml(config.store.sub2)}</text>

  <rect x="1010" y="336" width="220" height="250" rx="20" fill="#fdf0f0" stroke="#b87a45" stroke-width="2.3"/>
  <text x="1120" y="378" text-anchor="middle" font-family="${fontStack}" font-size="${patternTitleLayout.fontSize}" font-weight="700" fill="#8d3f2f">${escapeHtml(patternTitleLayout.text)}</text>
  <text x="1120" y="434" text-anchor="middle" font-family="${fontStack}" font-size="${patternSub1Layout.fontSize}" fill="#a04d3a">${renderTspans(1120, patternSub1Layout.lines, patternSub1Layout.fontSize * 1.18)}</text>
  <text x="1120" y="494" text-anchor="middle" font-family="${fontStack}" font-size="${patternSub2Layout.fontSize}" fill="#a04d3a">${renderTspans(1120, patternSub2Layout.lines, patternSub2Layout.fontSize * 1.18)}</text>
  <text x="1120" y="554" text-anchor="middle" font-family="${fontStack}" font-size="${patternSub3Layout.fontSize}" fill="#a04d3a">${renderTspans(1120, patternSub3Layout.lines, patternSub3Layout.fontSize * 1.18)}</text>

  ${stageCard(680, 356, "D1", config.d1)}
  ${stageCard(350, 356, "D2", config.d2, "primary")}
  ${stageCard(350, row3Y, "D3", config.d3)}
  ${stageCard(680, row3Y, "D4", config.d4)}
  ${stageCard(1010, row3Y, "D5", config.d5)}

  <rect x="980" y="${outcomeY}" width="280" height="92" rx="18" fill="#edf7f0" stroke="#2d6a4f" stroke-width="2.8"/>
  <text x="${outcomeCenterX}" y="${outcomeY + 32}" text-anchor="middle" font-family="${fontStack}" font-size="${outcomeTitle.fontSize}" font-weight="700" fill="#24553f">${escapeHtml(outcomeTitle.text)}</text>
  <text x="${outcomeCenterX}" y="${outcomeY + 60}" text-anchor="middle" font-family="${fontStack}" font-size="${outcomeSub1.fontSize}" fill="#3d735a">${renderTspans(outcomeCenterX, outcomeSub1.lines, outcomeSub1.fontSize * 1.16)}</text>
  <text x="${outcomeCenterX}" y="${outcomeY + 84}" text-anchor="middle" font-family="${fontStack}" font-size="${outcomeSub2.fontSize}" fill="#56826c">${renderTspans(outcomeCenterX, outcomeSub2.lines, outcomeSub2.fontSize * 1.14)}</text>

  <rect x="60" y="1100" width="1280" height="28" rx="14" fill="#edf7f0" stroke="#9ec1ae" stroke-width="1.8"/>
  <text x="86" y="1117" font-family="${fontStack}" font-size="${auditTitle.fontSize}" font-weight="800" fill="#2d6a4f">${escapeHtml(auditTitle.text)}</text>
  <text x="374" y="1117" font-family="${fontStack}" font-size="${auditSub1.fontSize}" fill="#56826c">${renderTspans(374, auditSub1.lines, auditSub1.fontSize * 1.12)}</text>

  ${flowLabelMarkup(295, 206, config.labels.l0, "#4452b8", 11, 150)}
  ${flowLabelMarkup(625, 206, config.labels.l1, "#4452b8", 11, 165)}
  ${flowLabelMarkup(955, 198, config.labels.l2, "#4452b8", 11, 160)}
  ${flowLabelMarkup(1120, 313, config.labels.l3, "#4452b8", 10.5, 170, "vertical")}
  ${flowLabelMarkup(955, 438, config.labels.l4, "#2d6a4f", 10.5, 170)}
  ${flowLabelMarkup(625, 418, config.labels.l5, "#2d6a4f", 10.5, 150)}
  ${flowLabelMarkup(460, 584, config.labels.l6, "#2d6a4f", 10.5, 160, "vertical")}
  ${flowLabelMarkup(635, row3CenterY - 18, config.labels.l7, "#2d6a4f", 10.5, 165)}
  ${flowLabelMarkup(965, row3CenterY - 18, config.labels.l8, "#2d6a4f", 10.5, 160)}
  ${flowLabelMarkup(1120, ((778 + outcomeY) / 2) + 8, config.labels.l9, "#2d6a4f", 10.5, 160, "vertical")}
</svg>
`.trim();

fs.mkdirSync(path.dirname(outputSvgPath), { recursive: true });
fs.writeFileSync(outputSvgPath, svg);
console.log(outputSvgPath);
