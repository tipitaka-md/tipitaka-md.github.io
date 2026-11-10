/**
 * Pali Text Diff Engine
 * Compares comparative editions (PTS, BJ, CST, RT) against World Tipitaka Edition (WT) base text.
 * Highlights:
 * - Light Green: Addition (text added in this edition)
 * - Light Yellow: Change / Variant (text differing from T2500)
 * - Light Pink: Deletion (text in T2500 omitted in this edition)
 */

function tokenize(text) {
  const tokens = [];
  // Tokenize preserving HTML tags, markdown links, footnote citations, words, punctuation, whitespace
  const regex = /(<[^>]+>|\[\^[^\]]+\]|\[[^\]]+\]\([^)]+\)|[a-zA-ZāīūṭḍṇḷñṅṃṁĀĪŪṬḌṆḶÑṄṂṀ]+|[^a-zA-ZāīūṭḍṇḷñṅṃṁĀĪŪṬḌṆḶÑṄṂṀ\s<\[]+|\s+)/g;
  let m;
  while ((m = regex.exec(text)) !== null) {
    tokens.push(m[1]);
  }
  return tokens;
}

function normalizePali(w) {
  if (!w) return '';
  return w
    .toLowerCase()
    .replace(/[ṃṁ]/g, 'm')
    .replace(/[ḷl]/g, 'l')
    .replace(/[-_—–\.’'"]/g, '');
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Token-level Longest Common Subsequence Diff
 */
export function diffPali(textBase, textTarget) {
  const tokA = tokenize(textBase);
  const tokB = tokenize(textTarget);

  const n = tokA.length;
  const m = tokB.length;
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (normalizePali(tokA[i]) === normalizePali(tokB[j])) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  let i = n, j = m;
  const ops = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && normalizePali(tokA[i - 1]) === normalizePali(tokB[j - 1])) {
      // Check if exact same word (ignoring case only)
      if (tokA[i - 1].toLowerCase() === tokB[j - 1].toLowerCase()) {
        ops.push({ type: 'equal', text: tokB[j - 1] });
      } else {
        ops.push({ type: 'change', oldText: tokA[i - 1], text: tokB[j - 1] });
      }
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.push({ type: 'insert', text: tokB[j - 1] });
      j--;
    } else {
      ops.push({ type: 'delete', oldText: tokA[i - 1] });
      i--;
    }
  }
  ops.reverse();

  // Consolidate adjacent delete + insert into change
  const consolidated = [];
  let k = 0;
  while (k < ops.length) {
    if (ops[k].type === 'delete') {
      const dels = [ops[k].oldText];
      let l = k + 1;
      while (l < ops.length && ops[l].type === 'delete') {
        dels.push(ops[l].oldText);
        l++;
      }
      const inss = [];
      while (l < ops.length && ops[l].type === 'insert') {
        inss.push(ops[l].text);
        l++;
      }
      if (inss.length > 0) {
        consolidated.push({
          type: 'change',
          oldText: dels.join(''),
          text: inss.join('')
        });
        k = l;
      } else {
        consolidated.push({
          type: 'delete',
          oldText: dels.join('')
        });
        k = l;
      }
    } else if (ops[k].type === 'insert') {
      const inss = [ops[k].text];
      let l = k + 1;
      while (l < ops.length && ops[l].type === 'insert') {
        inss.push(ops[l].text);
        l++;
      }
      consolidated.push({
        type: 'add',
        text: inss.join('')
      });
      k = l;
    } else {
      consolidated.push(ops[k]);
      k++;
    }
  }

  return consolidated;
}

function getWords(str) {
  return (str.toLowerCase().match(/[a-zA-ZāīūṭḍṇḷñṅṃṁĀĪŪṬḌṆḶÑṄṂṀ]+/g) || [])
    .map(w => w.replace(/[ṃṁ]/g, 'm').replace(/[ḷl]/g, 'l'));
}

function findBestMatchingBaseParagraph(targetPara, baseParas) {
  const targetWords = new Set(getWords(targetPara).slice(0, 15));
  if (targetWords.size < 3) return null;

  let bestMatch = null;
  let bestScore = 0;

  for (const base of baseParas) {
    const baseWords = getWords(base);
    if (baseWords.length < 3) continue;
    let common = 0;
    for (const w of baseWords.slice(0, 25)) {
      if (targetWords.has(w)) common++;
    }
    const score = common / targetWords.size;
    if (score > bestScore && score > 0.25) {
      bestScore = score;
      bestMatch = base;
    }
  }
  return bestMatch;
}

/**
 * Highlights differences in targetMarkdown against baseMarkdown.
 * Produces diff HTML spans:
 * - <span class="diff-add">addition (light green)</span>
 * - <span class="diff-change" title="...">change (light yellow)</span>
 * - <del class="diff-del" title="...">deletion (light pink)</del>
 */
export function highlightPaliDiff(targetMarkdown, baseMarkdown) {
  if (!targetMarkdown || !baseMarkdown) return targetMarkdown;

  // Extract base paragraphs
  const baseParas = baseMarkdown
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 20 && !p.startsWith('#') && !p.startsWith('[Home](') && !p.startsWith('>'));

  if (baseParas.length === 0) return targetMarkdown;

  const targetBlocks = targetMarkdown.split(/\n\s*\n/);
  const resultBlocks = [];

  for (const block of targetBlocks) {
    const trimmed = block.trim();

    // Skip headers, metadata blockquotes, breadcrumb/nav lines, page markers
    if (!trimmed ||
        trimmed.startsWith('#') ||
        trimmed.startsWith('>') ||
        trimmed.startsWith('<!--') ||
        trimmed.startsWith('<a id=') ||
        trimmed.startsWith('[Home](') ||
        trimmed.startsWith('[Go to previous page') ||
        trimmed.startsWith('[Go to parent page') ||
        trimmed.startsWith('[Go to next page') ||
        trimmed.length < 25) {
      resultBlocks.push(block);
      continue;
    }

    const matchedBase = findBestMatchingBaseParagraph(trimmed, baseParas);
    if (!matchedBase) {
      resultBlocks.push(block);
      continue;
    }

    // Diff matched paragraphs
    const diffOps = diffPali(matchedBase, trimmed);

    let paraHtml = '';
    for (const op of diffOps) {
      if (op.type === 'equal') {
        paraHtml += op.text;
      } else if (op.type === 'change') {
        // If it's pure whitespace change, don't color
        if (!op.text.trim() && !op.oldText.trim()) {
          paraHtml += op.text;
        } else {
          paraHtml += `<span class="diff-change" title="T2500: ${escapeHtml(op.oldText)}">${op.text}</span>`;
        }
      } else if (op.type === 'add') {
        if (!op.text.trim()) {
          paraHtml += op.text;
        } else {
          paraHtml += `<span class="diff-add" title="Added in this edition">${op.text}</span>`;
        }
      } else if (op.type === 'delete') {
        if (op.oldText && op.oldText.trim()) {
          paraHtml += `<del class="diff-del" title="Omitted in this edition (T2500: ${escapeHtml(op.oldText)})">${escapeHtml(op.oldText)}</del>`;
        }
      }
    }

    resultBlocks.push(paraHtml);
  }

  return resultBlocks.join('\n\n');
}
