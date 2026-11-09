import json
import re

with open('/tmp/words_app.js', 'r') as f:
    js = f.read()

m1 = re.search(r'const alphabets = (\[[\s\S]*?\]);\n', js)
m2 = re.search(r'const counts = (\{[\s\S]*?\});\n', js)
m3 = re.search(r'const books = (\[[\s\S]*?\]);\n', js)

alphabets = json.loads(m1.group(1))
counts = json.loads(m2.group(1))
books = json.loads(m3.group(1))

with open('/Users/christie/Repositories/Pali/tipitaka-md.github.io/src/pages/words.astro', 'w') as out:
    out.write('---\n')
    out.write("import Layout from '../layouts/Layout.astro';\n\n")
    out.write(f'const ALPHABETS = {json.dumps(alphabets, indent=2)};\n\n')
    out.write(f'const COUNTS: Record<string, number> = {json.dumps(counts, indent=2)};\n\n')
    out.write(f'const BOOKS = {json.dumps(books, indent=2)};\n\n')
    out.write('const totalWords = Object.values(COUNTS).reduce((sum, n) => sum + n, 0);\n\n')
    out.write("const breadcrumbs = [\n  { name: 'Home', url: '/' },\n  { name: 'Pāḷi Word Index', url: '/words.html' },\n];\n")
    out.write('---\n\n')

    out.write('''<Layout
  title="Pāḷi Word Index (Padabhājanīya)"
  description="Search and browse all 146,693 unique Pāḷi headwords across the 40-volume World Tipiṭaka Edition (WTK base reference) with Roman script, Thai script, IPA pronunciation, and frequency distributions across all 88 books."
  breadcrumbs={breadcrumbs}
>
  <main class="index-page">
    <div class="index-hero">
      <h1>Pāḷi Word Index (Padabhājanīya)</h1>
      <p class="lead-sub">
        Explore all <strong>{totalWords.toLocaleString()}</strong> unique Pāḷi headwords across the 2,708,706 words
        of the <strong>World Tipiṭaka Edition (WTK Base Reference)</strong>, with Roman Pāḷi, Thai script, IPA phonetic transcription,
        and frequency breakdowns across all 88 canonical books.
      </p>
    </div>

    <!-- Alphabet Letter Bar -->
    <nav aria-label="Pāḷi Alphabet Letters" class="pill-bar" id="words-alpha-bar">
      {
        ALPHABETS.map((a) => (
          <button
            type="button"
            class="pill-btn"
            data-alpha-code={a.code}
            aria-pressed={a.code === '10' ? 'true' : 'false'}
            title={`${a.label} — ${(COUNTS[a.code] || 0).toLocaleString()} words`}
          >
            <span class="pill-label">{a.label}</span>
            <span class="pill-count">({(COUNTS[a.code] || 0).toLocaleString()})</span>
          </button>
        ))
      }
    </nav>

    <!-- Filter & Search Controls -->
    <div class="filter-card">
      <div class="filter-row">
        <div class="form-group flex-2">
          <label for="words-search-input" class="form-label">Search Pāḷi Headwords</label>
          <input
            type="search"
            id="words-search-input"
            class="form-input"
            placeholder="Search Pāḷi words (e.g. dhamm, nibbān, bhikkhu, anicc)…"
            autocomplete="off"
            spellcheck="false"
          />
        </div>

        <div class="form-group">
          <label for="words-match-select" class="form-label">Match Mode</label>
          <select id="words-match-select" class="form-select">
            <option value="prefix">Prefix match (starts with)</option>
            <option value="exact">Exact match</option>
            <option value="contains">Contains (anywhere)</option>
          </select>
        </div>

        <div class="form-group">
          <label for="words-book-select" class="form-label">Book Filter</label>
          <select id="words-book-select" class="form-select">
            <option value="ALL">All 88 Books (WTK Base)</option>
            <optgroup label="Vinayapiṭaka (1V–5V)">
              {
                BOOKS.filter((b) => b.pitaka === 'V').map((b) => (
                  <option value={b.code}>
                    {b.code} — {b.name}
                  </option>
                ))
              }
            </optgroup>
            <optgroup label="Suttantapiṭaka (6D–28Mi)">
              {
                BOOKS.filter((b) => b.pitaka === 'S').map((b) => (
                  <option value={b.code}>
                    {b.code} — {b.name}
                  </option>
                ))
              }
            </optgroup>
            <optgroup label="Abhidhammapiṭaka (29Dhs–40P24)">
              {
                BOOKS.filter((b) => b.pitaka === 'ABH').map((b) => (
                  <option value={b.code}>
                    {b.code} — {b.name}
                  </option>
                ))
              }
            </optgroup>
          </select>
        </div>

        <div class="form-group">
          <label for="words-sort-select" class="form-label">Sort Order</label>
          <select id="words-sort-select" class="form-select">
            <option value="alpha">Alphabetical (Pāḷi order)</option>
            <option value="freq_desc">Most Frequent First</option>
            <option value="freq_asc">Least Frequent First</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Stats & Status Bar -->
    <div class="index-stats-bar">
      <div id="words-status" aria-live="polite">Loading Pāḷi Word Index…</div>
      <div id="words-letter-summary"></div>
    </div>

    <!-- Table of Results -->
    <div class="index-table-wrapper">
      <table class="index-table">
        <caption id="words-table-caption" class="visually-hidden">Pāḷi Headwords</caption>
        <thead>
          <tr>
            <th scope="col" style="width: 25%;">Roman Pāḷi Headword</th>
            <th scope="col" style="width: 20%;">Thai Script &amp; IPA</th>
            <th scope="col" style="width: 10%;">Total</th>
            <th scope="col" style="width: 45%;">Vinaya / Suttanta / Abhidhamma Distribution (WTK Base)</th>
          </tr>
        </thead>
        <tbody id="words-tbody"></tbody>
      </table>
    </div>

    <!-- Sentinel for Infinite Scrolling -->
    <div id="words-sentinel" class="load-more-sentinel">Loading words…</div>
  </main>
</Layout>

<script is:inline define:vars={{ alphabets: ALPHABETS, counts: COUNTS, books: BOOKS }}>
  (() => {
    const alphaBtns = Array.from(document.querySelectorAll('[data-alpha-code]'));
    const searchInput = document.getElementById('words-search-input');
    const matchSelect = document.getElementById('words-match-select');
    const bookSelect = document.getElementById('words-book-select');
    const sortSelect = document.getElementById('words-sort-select');
    const statusEl = document.getElementById('words-status');
    const summaryEl = document.getElementById('words-letter-summary');
    const captionEl = document.getElementById('words-table-caption');
    const tbody = document.getElementById('words-tbody');
    const sentinel = document.getElementById('words-sentinel');

    const bookNameMap = Object.fromEntries(books.map((b) => [b.code, b.name]));
    const cache = new Map();
    let activeAlpha = '10';
    let currentFiltered = [];
    let renderedCount = 0;
    const PAGE_SIZE = 100;

    function stripDiacritics(str) {
      return (str || '')
        .normalize('NFKD')
        .replace(/[\\u0300-\\u036f]/g, '')
        .toLowerCase();
    }

    function escapeHtml(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    // Map prefix of a Roman/ASCII query to candidate alphabet shard codes
    const PREFIX_SHARD_MAP = [
      ['bh', ['13']],
      ['ch', ['15']],
      ['dh', ['18', '19']],
      ['ḍh', ['19']],
      ['gh', ['22']],
      ['jh', ['27']],
      ['kh', ['29']],
      ['ph', ['40']],
      ['th', ['45', '46']],
      ['ṭh', ['46']],
      ['ā', ['11']],
      ['a', ['10', '11']],
      ['b', ['12', '13']],
      ['c', ['14', '15']],
      ['ḍ', ['17', '19']],
      ['d', ['16', '17', '18', '19']],
      ['e', ['20']],
      ['g', ['21', '22']],
      ['h', ['23']],
      ['ī', ['25']],
      ['i', ['24', '25']],
      ['j', ['26', '27']],
      ['k', ['28', '29']],
      ['ḷ', ['31']],
      ['l', ['30', '31']],
      ['ṁ', ['33']],
      ['m', ['32', '33']],
      ['ñ', ['35']],
      ['ṅ', ['36']],
      ['ṇ', ['37']],
      ['n', ['34', '35', '36', '37']],
      ['o', ['38']],
      ['p', ['39', '40']],
      ['r', ['41']],
      ['s', ['42']],
      ['ṭ', ['44', '46']],
      ['t', ['43', '44', '45', '46']],
      ['ū', ['48']],
      ['u', ['47', '48']],
      ['v', ['49']],
      ['y', ['50']],
    ];

    function detectShardsForQuery(q) {
      const clean = q.trim().toLowerCase().replace(/^\\[/, '');
      if (!clean) return [activeAlpha];
      for (const [pref, codes] of PREFIX_SHARD_MAP) {
        if (clean.startsWith(pref)) {
          return codes.filter((c) => counts[c] > 0);
        }
      }
      return [activeAlpha];
    }

    async function fetchShard(code) {
      if (cache.has(code)) return cache.get(code);
      try {
        const res = await fetch('/data/words/' + code + '.json');
        if (!res.ok) return [];
        const data = await res.json();
        cache.set(code, data);
        return data;
      } catch {
        return [];
      }
    }

    function formatBookDistribution(pitakaLabel, total, distStr) {
      if (!total || !distStr) return '';
      const badges = distStr
        .trim()
        .split(/\\s+/)
        .map((tok) => {
          const [bcode, cnt] = tok.split(':');
          if (!bcode || !cnt) return escapeHtml(tok);
          const bname = bookNameMap[bcode] || bcode;
          return `<a href="/reader.html?edition=tipitaka2500&book=${encodeURIComponent(bcode)}" class="badge-pill" title="${escapeHtml(bname)}: ${escapeHtml(cnt)} occurrences">${escapeHtml(bcode)}: ${escapeHtml(cnt)}</a>`;
        })
        .join(' ');
      return `<div class="pitaka-dist-row"><strong class="pitaka-dist-label">${pitakaLabel} (${total.toLocaleString()}):</strong> ${badges}</div>`;
    }

    function renderBatch() {
      const nextEnd = Math.min(renderedCount + PAGE_SIZE, currentFiltered.length);
      if (renderedCount >= nextEnd) {
        sentinel.textContent =
          currentFiltered.length === 0
            ? 'No matching Pāḷi words found.'
            : `Showing all ${currentFiltered.length.toLocaleString()} words.`;
        return;
      }

      const rowsHtml = [];
      for (let i = renderedCount; i < nextEnd; i++) {
        const w = currentFiltered[i];
        const vBlock = formatBookDistribution('Vinaya', w.vt, w.vb);
        const sBlock = formatBookDistribution('Suttanta', w.st, w.sb);
        const aBlock = formatBookDistribution('Abhidhamma', w.at, w.ab);

        rowsHtml.push(`
          <tr>
            <td lang="pi">
              <strong class="headword-title">${escapeHtml(w.r)}</strong>
              <div class="headword-sub">#${w.id}</div>
            </td>
            <td>
              <div lang="pi" class="thai-script">${escapeHtml(w.w)}</div>
              <div class="ipa-phonetic"><code>${escapeHtml(w.i)}</code></div>
            </td>
            <td style="white-space: nowrap">
              <span class="badge-code count-badge">${w.t.toLocaleString()}</span>
            </td>
            <td>
              ${vBlock}${sBlock}${aBlock}
            </td>
          </tr>
        `);
      }

      tbody.insertAdjacentHTML('beforeend', rowsHtml.join(''));
      renderedCount = nextEnd;
      sentinel.textContent =
        renderedCount < currentFiltered.length
          ? `Showing ${renderedCount.toLocaleString()} of ${currentFiltered.length.toLocaleString()} words — scroll for more…`
          : `Showing all ${currentFiltered.length.toLocaleString()} words.`;
    }

    function syncAlphaPills(selectedCodes) {
      alphaBtns.forEach((btn) => {
        const code = btn.getAttribute('data-alpha-code');
        const isPressed = selectedCodes.includes(code);
        btn.setAttribute('aria-pressed', isPressed ? 'true' : 'false');
      });
    }

    async function updateView(fromAlphaClick = false) {
      const q = searchInput.value.trim();
      const qLower = q.toLowerCase();
      const qNorm = stripDiacritics(q);
      const matchMode = matchSelect.value;
      const bookCode = bookSelect.value;
      const sortMode = sortSelect.value;

      let targetShards = [activeAlpha];
      if (!fromAlphaClick && q && (matchMode === 'prefix' || matchMode === 'exact')) {
        const detected = detectShardsForQuery(q);
        if (detected.length > 0) {
          targetShards = detected;
          activeAlpha = detected[0];
        }
      }
      syncAlphaPills(targetShards);

      const params = new URLSearchParams();
      if (activeAlpha !== '10' && !q) params.set('letter', activeAlpha);
      if (q) params.set('q', q);
      if (matchMode !== 'prefix') params.set('mode', matchMode);
      if (bookCode !== 'ALL') params.set('book', bookCode);
      if (sortMode !== 'alpha') params.set('sort', sortMode);
      const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
      window.history.replaceState(null, '', newUrl);

      statusEl.textContent = 'Loading word index shard…';
      const shardArrays = await Promise.all(targetShards.map((c) => fetchShard(c)));
      const rawItems = shardArrays.flat();

      const bookTokenPrefix = bookCode !== 'ALL' ? `${bookCode}:` : '';

      currentFiltered = rawItems.filter((w) => {
        if (bookTokenPrefix) {
          const allBooksStr = `${w.vb || ''} ${w.sb || ''} ${w.ab || ''}`;
          const hasBook = allBooksStr
            .split(/\\s+/)
            .some((tok) => tok.startsWith(bookTokenPrefix));
          if (!hasBook) return false;
        }
        if (!q) return true;
        if (matchMode === 'exact') {
          return (
            w.r === qLower ||
            w.a === qNorm ||
            w.w === q ||
            w.i === q
          );
        }
        if (matchMode === 'prefix') {
          return (
            w.r.startsWith(qLower) ||
            w.a.startsWith(qNorm) ||
            (w.w && w.w.startsWith(q)) ||
            (w.i && w.i.includes(q))
          );
        }
        return (
          w.r.includes(qLower) ||
          w.a.includes(qNorm) ||
          (w.w && w.w.includes(q)) ||
          (w.i && w.i.includes(q))
        );
      });

      if (sortMode === 'freq_desc') {
        currentFiltered.sort((a, b) => b.t - a.t || a.id - b.id);
      } else if (sortMode === 'freq_asc') {
        currentFiltered.sort((a, b) => a.t - b.t || a.id - b.id);
      } else {
        currentFiltered.sort((a, b) => a.id - b.id);
      }

      tbody.innerHTML = '';
      renderedCount = 0;

      const shardLabels = targetShards
        .map((c) => {
          const a = alphabets.find((al) => al.code === c);
          return a ? a.label : c;
        })
        .join(', ');

      captionEl.textContent = `Pāḷi Headwords — Letter ${shardLabels}`;
      summaryEl.textContent = `Letter shard: ${shardLabels}`;
      statusEl.textContent = `Found ${currentFiltered.length.toLocaleString()} Pāḷi word${currentFiltered.length === 1 ? '' : 's'}.`;
      renderBatch();
    }

    const initParams = new URLSearchParams(window.location.search);
    if (initParams.get('letter') && counts[initParams.get('letter')]) {
      activeAlpha = initParams.get('letter');
    }
    if (initParams.get('mode')) matchSelect.value = initParams.get('mode');
    if (initParams.get('book')) bookSelect.value = initParams.get('book');
    if (initParams.get('sort')) sortSelect.value = initParams.get('sort');
    if (initParams.get('q')) searchInput.value = initParams.get('q');

    alphaBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        activeAlpha = btn.getAttribute('data-alpha-code');
        if (searchInput.value && matchSelect.value === 'prefix') {
          searchInput.value = '';
        }
        updateView(true);
      });
    });

    let debounceTimer = null;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => updateView(false), 180);
    });
    matchSelect.addEventListener('change', () => updateView(false));
    bookSelect.addEventListener('change', () => updateView(true));
    sortSelect.addEventListener('change', () => updateView(true));

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && renderedCount < currentFiltered.length) {
          renderBatch();
        }
      },
      { rootMargin: '300px' }
    );
    observer.observe(sentinel);

    updateView(Boolean(initParams.get('letter') || initParams.get('q')));
  })();
</script>

<style>
  .index-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1.5rem 0.5rem;
    font-family: var(--font-sans);
  }

  .index-hero {
    text-align: center;
    margin-bottom: 2rem;
  }

  .index-hero h1 {
    font-size: 2.25rem;
    font-weight: 700;
    margin-bottom: 0.75rem;
    color: var(--text-emphasis);
  }

  .lead-sub {
    font-size: 1.05rem;
    line-height: 1.6;
    color: var(--text-secondary);
    max-width: 820px;
    margin: 0 auto;
  }

  .pill-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    justify-content: center;
    margin-bottom: 1.75rem;
  }

  .pill-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.65rem;
    font-size: 0.85rem;
    font-weight: 500;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 9999px;
    color: var(--text-body);
    cursor: pointer;
    transition: all 0.15s ease-in-out;
  }

  .pill-btn:hover {
    background-color: var(--bg-hover);
    border-color: var(--primary-color);
    color: var(--primary-color);
  }

  .pill-btn[aria-pressed="true"] {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
    color: #ffffff;
    font-weight: 600;
  }

  .pill-btn[aria-pressed="true"] .pill-count {
    opacity: 0.9;
    color: #ffffff;
  }

  .pill-count {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .filter-card {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1.25rem;
    margin-bottom: 1.5rem;
  }

  .filter-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
    align-items: flex-end;
  }

  .flex-2 {
    grid-column: span 2;
  }

  @media (max-width: 768px) {
    .flex-2 {
      grid-column: span 1;
    }
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .form-label {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .form-input,
  .form-select {
    width: 100%;
    padding: 0.55rem 0.75rem;
    font-size: 0.9rem;
    border-radius: 6px;
    border: 1px solid var(--border-color);
    background-color: var(--bg-body);
    color: var(--text-body);
    font-family: inherit;
    transition: border-color 0.15s ease;
  }

  .form-input:focus,
  .form-select:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(181, 101, 167, 0.15);
  }

  .index-stats-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    font-size: 0.88rem;
    color: var(--text-secondary);
    margin-bottom: 1rem;
    padding: 0 0.25rem;
  }

  .index-table-wrapper {
    overflow-x: auto;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background-color: var(--bg-body);
  }

  .index-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .index-table th {
    background-color: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    padding: 0.75rem 1rem;
    text-align: left;
    font-weight: 600;
    color: var(--text-emphasis);
  }

  .index-table td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border-color);
    vertical-align: top;
  }

  .index-table tbody tr:hover {
    background-color: var(--bg-hover);
  }

  .headword-title {
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--primary-color);
  }

  .headword-sub {
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin-top: 0.15rem;
  }

  .thai-script {
    font-size: 0.95rem;
    color: var(--text-body);
  }

  .ipa-phonetic {
    font-size: 0.78rem;
    color: var(--text-secondary);
    margin-top: 0.15rem;
  }

  .count-badge {
    font-weight: 600;
    color: var(--text-emphasis);
    background-color: var(--bg-secondary);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    border: 1px solid var(--border-color);
  }

  .pitaka-dist-row {
    margin-bottom: 0.35rem;
    line-height: 1.6;
  }

  .pitaka-dist-label {
    font-size: 0.78rem;
    color: var(--text-secondary);
    margin-right: 0.35rem;
  }

  .badge-pill {
    display: inline-block;
    padding: 0.15rem 0.45rem;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: 9999px;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    color: var(--text-body);
    text-decoration: none;
    margin-right: 0.25rem;
    margin-bottom: 0.2rem;
    transition: all 0.12s ease;
  }

  .badge-pill:hover {
    border-color: var(--primary-color);
    color: var(--primary-color);
    background-color: var(--bg-hover);
  }

  .load-more-sentinel {
    text-align: center;
    padding: 1.75rem 1rem;
    color: var(--text-secondary);
    font-size: 0.9rem;
  }
</style>
''')

print("Successfully written /Users/christie/Repositories/Pali/tipitaka-md.github.io/src/pages/words.astro")
