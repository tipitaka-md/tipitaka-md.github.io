/**
 * Pali Text Diff Engine
 * Compares comparative editions (PTS, BJ, CST, RT) against base text.
 * Highlights:
 * - <span class="diff-add">addition</span> (text added in this edition)
 * - <del class="diff-del">baseWord</del> <span class="diff-change">newWord</span> (variant/change displayed inline with strikethrough)
 * - <del class="diff-del">omittedWord</del> (text omitted in this edition)
 *
 * Ignores:
 * - Paragraph numbers (e.g. 1., 2\., (1.))
 * - Punctuation (., ,, ;, :, —, -, quotes, parentheses)
 * - Footnotes ([^...])
 * - Markdown formatting (**, *, #, etc.)
 * - Niggahīta orthography (ṁ vs ṃ)
 *
 * Avoids hover tooltips (title attributes) to prevent conflict with Pali dictionary lookup.
 */

function normalizePaliWord(w) {
  if (!w) return '';
  return w
    .toLowerCase()
    .replace(/[ṃṁ]/g, 'ṃ') // Normalize niggahīta so ṁ and ṃ are equal
    .replace(/ṃ(?=[kKgGhH])/gi, 'ṅ') // Before velars (k, kh, g, gh), niggahīta is phonetically equivalent to velar nasal ṅ (e.g. saṃgha <-> saṅgha)
    .replace(/[’\x27\"“”‘’\-]/g, ''); // Ignore internal sandhi punctuation/hyphens
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Letter runs joined by one hyphen or by one or two quote marks (CST closes speech with ’’, WT with ”)
const WORD_REGEX = /[a-zA-ZāīūṭḍṇḷñṅṃṁĀĪŪṬḌṆḶÑṄṂṀ]+(?:(?:[’\x27“”‘]{1,2}|-)[a-zA-ZāīūṭḍṇḷñṅṃṁĀĪŪṬḌṆḶÑṄṂṀ]+)*/g;
// WT context lines such as "* Ākaṅkheyyasutta" (the first letter may carry a diacritic)
const TITLE_LINE_REGEX = /^\*+\s+\p{L}/u;

export function extractPaliWords(text) {
  if (!text) return [];
  const lines = text.split('\n');
  const filtered = [];
  for (const l of lines) {
    const tr = l.trim();
    if (
      !tr ||
      tr.startsWith('#') ||
      tr.startsWith('>') ||
      tr.startsWith('---') ||
      tr.startsWith('<!--') ||
      tr.startsWith('<a id=') ||
      tr.startsWith('<div') ||
      tr.startsWith('<p align') ||
      tr.startsWith('[^') ||
      tr.startsWith('[Home](') ||
      tr.startsWith('[Go to ') ||
      /^\s*#+.*\[\^/.test(tr) ||
      /^\d*\[\^/.test(tr) ||
      TITLE_LINE_REGEX.test(tr) ||
      /^\([0-9]+\.\)$/.test(tr)
    ) {
      continue;
    }
    filtered.push(l);
  }

  const clean = filtered.join('\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\[\^[^\]]+\]/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  const words = [];
  let m;
  const re = new RegExp(WORD_REGEX.source, 'g');
  while ((m = re.exec(clean)) !== null) {
    if (m[0].length >= 1) {
      words.push(m[0]);
    }
  }
  return words;
}

/**
 * Word-level Longest Common Subsequence Diff on Pali words
 */
export function diffWords(baseWords, targetWords) {
  let start = 0;
  while (
    start < baseWords.length &&
    start < targetWords.length &&
    normalizePaliWord(baseWords[start]) === normalizePaliWord(targetWords[start])
  ) {
    start++;
  }

  let endBase = baseWords.length - 1;
  let endTarget = targetWords.length - 1;
  while (
    endBase >= start &&
    endTarget >= start &&
    normalizePaliWord(baseWords[endBase]) === normalizePaliWord(targetWords[endTarget])
  ) {
    endBase--;
    endTarget--;
  }

  const prefixOps = [];
  for (let i = 0; i < start; i++) {
    prefixOps.push({ type: 'equal', base: baseWords[i], target: targetWords[i] });
  }

  const suffixOps = [];
  for (let i = endTarget + 1, k = endBase + 1; i < targetWords.length; i++, k++) {
    suffixOps.push({ type: 'equal', base: baseWords[k], target: targetWords[i] });
  }

  const midBase = baseWords.slice(start, endBase + 1);
  const midTarget = targetWords.slice(start, endTarget + 1);

  const n = midBase.length;
  const m = midTarget.length;

  // Safeguard: Prevent browser thread lockup if matrix size exceeds safety threshold (e.g. > 2,500,000 cells)
  if (n * m > 2500000) {
    console.warn(`Text variant diff matrix too large (${n}x${m} words); skipping deep matrix calculation to avoid UI freeze.`);
    const fallbackOps = [];
    for (const w of midTarget) {
      fallbackOps.push({ type: 'equal', base: w, target: w });
    }
    return [...prefixOps, ...fallbackOps, ...suffixOps];
  }

  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  const normBase = midBase.map(normalizePaliWord);
  const normTarget = midTarget.map(normalizePaliWord);

  for (let i = 0; i < n; i++) {
    const wA = normBase[i];
    for (let j = 0; j < m; j++) {
      if (wA === normTarget[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  let i = n, j = m;
  const midOps = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && normBase[i - 1] === normTarget[j - 1]) {
      midOps.push({ type: 'equal', base: midBase[i - 1], target: midTarget[j - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      midOps.push({ type: 'add', target: midTarget[j - 1] });
      j--;
    } else {
      midOps.push({ type: 'delete', base: midBase[i - 1] });
      i--;
    }
  }
  midOps.reverse();

  return [...prefixOps, ...midOps, ...suffixOps];
}

/**
 * Highlights Pali text variants:
 * - Compares only actual Pali words.
 * - Preserves all paragraph numbers, punctuation, quotes, footnotes, and markdown formatting untouched.
 * - Uses strikethrough (<del>) for variants and omissions rather than hover tooltips.
 */
export function highlightPaliDiff(targetMarkdown, baseMarkdown) {
  if (!targetMarkdown || !baseMarkdown) return targetMarkdown;

  const baseWords = extractPaliWords(baseMarkdown);
  if (baseWords.length === 0) return targetMarkdown;

  // Ensure inline footnote lines (e.g. Siam Rath #[^2-1]...) are split into their own skip blocks
  const normalizedTarget = targetMarkdown.replace(/\n(?=\s*#+.*\[\^)/g, '\n\n');
  const blocks = normalizedTarget.split(/\n\s*\n/);
  const resultBlocks = [];

  const blockData = [];
  const allTargetWords = [];

  for (const block of blocks) {
    const trimmed = block.trim();
    const isSkip =
      !trimmed ||
      trimmed.startsWith('#') ||
      trimmed.startsWith('>') ||
      trimmed.startsWith('---') ||
      trimmed.startsWith('<div') ||
      trimmed.startsWith('<!--') ||
      trimmed.startsWith('<a id=') ||
      trimmed.startsWith('<p align') ||
      trimmed.startsWith('[^') ||
      trimmed.startsWith('[Home](') ||
      trimmed.startsWith('[Go to ') ||
      /^\s*#+.*\[\^/.test(trimmed) ||
      /^\d*\[\^/.test(trimmed) ||
      TITLE_LINE_REGEX.test(trimmed) ||
      /^\([0-9]+\.\)$/.test(trimmed);

    if (isSkip) {
      blockData.push({ isSkip: true, original: block });
    } else {
      // Page-marker chips are reader chrome, not text: keep them whole
      const tokenRegex = new RegExp('(<span id="page-[^>]*>.*?<\\/span><\\/span>|<[^>]+>|\\[\\^[^\\]]+\\]|' + WORD_REGEX.source + ')', 'g');
      const segments = [];
      let lastIndex = 0;
      let m;

      while ((m = tokenRegex.exec(block)) !== null) {
        if (m.index > lastIndex) {
          segments.push({ isWord: false, text: block.slice(lastIndex, m.index) });
        }
        const tok = m[0];
        if (tok.startsWith('<') || tok.startsWith('[^')) {
          segments.push({ isWord: false, text: tok });
        } else {
          segments.push({ isWord: true, text: tok });
          allTargetWords.push(tok);
        }
        lastIndex = m.index + tok.length;
      }
      if (lastIndex < block.length) {
        segments.push({ isWord: false, text: block.slice(lastIndex) });
      }
      blockData.push({ isSkip: false, segments });
    }
  }

  const ops = diffWords(baseWords, allTargetWords);

  const targetWordMap = new Map();
  let targetIdx = 0;
  let pendingDeletes = [];

  for (const op of ops) {
    if (op.type === 'delete') {
      pendingDeletes.push(op.base);
    } else if (op.type === 'equal') {
      targetWordMap.set(targetIdx, {
        type: 'equal',
        target: op.target,
        deletesBefore: pendingDeletes
      });
      pendingDeletes = [];
      targetIdx++;
    } else if (op.type === 'add') {
      targetWordMap.set(targetIdx, {
        type: 'add',
        target: op.target,
        deletesBefore: pendingDeletes
      });
      pendingDeletes = [];
      targetIdx++;
    }
  }

  const trailingDeletes = pendingDeletes;

  let currentTargetWordIdx = 0;

  for (const b of blockData) {
    if (b.isSkip) {
      resultBlocks.push(b.original);
      continue;
    }

    let blockHtml = '';
    for (const seg of b.segments) {
      if (!seg.isWord) {
        blockHtml += seg.text;
      } else {
        const opData = targetWordMap.get(currentTargetWordIdx);
        currentTargetWordIdx++;

        if (!opData) {
          blockHtml += seg.text;
          continue;
        }

        // Render omitted or previous variant words with strikethrough inline
        if (opData.deletesBefore && opData.deletesBefore.length > 0) {
          for (const delWord of opData.deletesBefore) {
            blockHtml += `<del class="diff-del">${escapeHtml(delWord)}</del> `;
          }
        }

        if (opData.type === 'equal') {
          blockHtml += seg.text;
        } else if (opData.type === 'add') {
          if (opData.deletesBefore && opData.deletesBefore.length > 0) {
            blockHtml += `<span class="diff-change">${escapeHtml(seg.text)}</span>`;
          } else {
            blockHtml += `<span class="diff-add">${escapeHtml(seg.text)}</span>`;
          }
        }
      }
    }
    resultBlocks.push(blockHtml);
  }

  // Trailing deletes if any: attach ONLY to the last content (non-skipped) block
  let lastContentIdx = -1;
  for (let i = blockData.length - 1; i >= 0; i--) {
    if (!blockData[i].isSkip) {
      lastContentIdx = i;
      break;
    }
  }

  if (trailingDeletes.length > 0 && lastContentIdx >= 0) {
    let trailingHtml = '';
    for (const delWord of trailingDeletes) {
      trailingHtml += ` <del class="diff-del">${escapeHtml(delWord)}</del>`;
    }
    resultBlocks[lastContentIdx] += trailingHtml;
  }

  return resultBlocks.join('\n\n');
}
