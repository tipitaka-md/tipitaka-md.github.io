/**
 * Tipitaka Multi-Edition Comparison Viewer
 * https://tipitaka-md.github.io/
 */

import { transliteratePali } from './transliterator.js';

// Application State
const state = {
  catalog: null,
  flatItems: [],
  currentItem: null,
  primaryEdition: 'tipitaka2500',
  compareEdition: 'pts',
  splitMode: false,
  targetScript: 'iast',
  theme: localStorage.getItem('tipitaka_theme') || 'light',
  fontSize: parseInt(localStorage.getItem('tipitaka_fontsize') || '18', 10),
  syncScroll: true,
  sidebarCollapsed: false,
  cache: new Map(),
  isScrolling: false,
  activeFootnote: null
};

// CDN and GitHub Fallbacks
const REPO_MAP = {
  'tipitaka2500': 'tipitaka-md/tipitaka2500',
  'pts': 'tipitaka-md/pts',
  'bjt': 'tipitaka-md/buddha-jayanthi',
  'cst': 'tipitaka-md/cst',
  'siam-rath': 'tipitaka-md/siam-rath'
};

// UI Element References
const elements = {
  themeToggle: document.getElementById('theme-toggle'),
  fontSizeDec: document.getElementById('font-size-dec'),
  fontSizeInc: document.getElementById('font-size-inc'),
  scriptSelect: document.getElementById('script-select'),
  splitToggle: document.getElementById('split-toggle'),
  sidebarToggle: document.getElementById('sidebar-toggle'),
  sidebar: document.getElementById('sidebar'),
  sidebarFilter: document.getElementById('sidebar-filter'),
  sidebarTree: document.getElementById('sidebar-tree'),
  searchTrigger: document.getElementById('search-trigger'),
  searchModal: document.getElementById('search-modal'),
  searchInput: document.getElementById('search-input'),
  searchResults: document.getElementById('search-results'),
  modalClose: document.getElementById('modal-close'),
  breadcrumbs: document.getElementById('breadcrumbs'),
  concordanceBadges: document.getElementById('concordance-badges'),
  panesWrapper: document.getElementById('panes-wrapper'),
  panePrimary: document.getElementById('pane-primary'),
  paneCompare: document.getElementById('pane-compare'),
  primaryContent: document.getElementById('primary-content'),
  compareContent: document.getElementById('compare-content'),
  primaryTabs: document.getElementById('primary-tabs'),
  compareTabs: document.getElementById('compare-tabs'),
  footnoteDrawer: document.getElementById('footnote-drawer'),
  footnoteTitle: document.getElementById('footnote-title'),
  footnoteBody: document.getElementById('footnote-body'),
  footnoteClose: document.getElementById('footnote-close'),
  prevBtn: document.getElementById('prev-btn'),
  nextBtn: document.getElementById('next-btn')
};

// ==================== Initialization ====================
async function init() {
  applyTheme(state.theme);
  applyFontSize(state.fontSize);

  // Load catalog
  try {
    const res = await fetch('catalog.json');
    state.catalog = await res.json();
    flattenCatalog();
    renderSidebarTree();
  } catch (err) {
    console.error('Failed to load catalog.json:', err);
  }

  // Parse Initial URL Hash
  handleHashRouting();
  window.addEventListener('hashchange', handleHashRouting);

  // Setup Event Listeners
  setupEventListeners();
  setupKeyboardShortcuts();
}

// Flatten catalog items for fast search and navigation
function flattenCatalog() {
  if (!state.catalog) return;
  state.flatItems = [];

  function traverse(node, groupName) {
    if (node.books) {
      node.books.forEach(book => traverse(book, node.title || groupName));
    } else if (node.suttas && node.suttas.length > 0) {
      node.suttas.forEach(sutta => {
        state.flatItems.push({
          ...sutta,
          group: groupName,
          parentBook: node.title
        });
      });
    } else if (node.editions) {
      state.flatItems.push({
        ...node,
        group: groupName
      });
    }
  }

  state.catalog.structure.forEach(group => traverse(group, group.title));
}

// ==================== Routing & Hash Handling ====================
function handleHashRouting() {
  const hash = window.location.hash.slice(1); // e.g. /view/dn1?edition=tipitaka2500&compare=pts&split=1
  if (!hash || !hash.startsWith('/view/')) {
    // Default to Brahmajālasutta (dn1) or first item
    navigateToItem('dn1');
    return;
  }

  const [pathPart, queryPart] = hash.slice(6).split('?');
  const itemId = pathPart;

  const urlParams = new URLSearchParams(queryPart || '');
  if (urlParams.has('edition')) state.primaryEdition = urlParams.get('edition');
  if (urlParams.has('compare')) state.compareEdition = urlParams.get('compare');
  if (urlParams.has('split')) state.splitMode = urlParams.get('split') === '1';

  const item = state.flatItems.find(it => it.id === itemId || it.code === itemId);
  if (item) {
    loadItem(item);
  } else if (state.flatItems.length > 0) {
    loadItem(state.flatItems[0]);
  }
}

function updateHash() {
  if (!state.currentItem) return;
  const id = state.currentItem.id || state.currentItem.code;
  const splitVal = state.splitMode ? '1' : '0';
  const newHash = `#/view/${id}?edition=${state.primaryEdition}&compare=${state.compareEdition}&split=${splitVal}`;
  if (window.location.hash !== newHash) {
    history.replaceState(null, '', newHash);
  }
}

function navigateToItem(itemId) {
  const item = state.flatItems.find(it => it.id === itemId || it.code === itemId);
  if (item) {
    loadItem(item);
  }
}

// ==================== Content Loading & Rendering ====================
async function loadItem(item) {
  state.currentItem = item;
  updateHash();

  // Update UI Elements
  updateBreadcrumbs(item);
  updateConcordanceBadges(item);
  highlightSidebarItem(item.id || item.code);
  updateFooterNav(item);

  // Render Panes
  updatePanesVisibility();
  renderEditionTabs();

  // Load Primary
  loadPaneContent('primary', state.primaryEdition);

  // Load Compare if split mode active
  if (state.splitMode) {
    loadPaneContent('compare', state.compareEdition);
  }
}

async function loadPaneContent(paneType, editionKey) {
  const container = paneType === 'primary' ? elements.primaryContent : elements.compareContent;
  const item = state.currentItem;
  if (!item) return;

  const editionPath = item.editions ? item.editions[editionKey] : null;

  if (!editionPath) {
    container.innerHTML = `
      <div class="empty-state">
        <p>This text is not directly mapped for <strong>${state.catalog.editions[editionKey]?.name || editionKey}</strong>.</p>
        <p style="margin-top: 8px; font-size: 13px; color: var(--text-muted);">
          Select another edition from the tabs above.
        </p>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p style="margin-top: 12px; font-size: 14px;">Loading ${state.catalog.editions[editionKey]?.short_name} text...</p>
    </div>`;

  try {
    const markdown = await fetchEditionMarkdown(editionKey, editionPath);
    const html = parseMarkdown(markdown, editionKey);
    container.innerHTML = `<article class="article-body">${html}</article>`;
    container.scrollTop = 0;
    attachFootnoteListeners(container);
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <p style="color: #ef4444;">Failed to load text: ${err.message}</p>
        <button class="nav-link-btn" style="margin-top: 12px;" onclick="window.retryLoad('${paneType}', '${editionKey}')">
          Retry
        </button>
      </div>`;
  }
}

window.retryLoad = function(paneType, editionKey) {
  loadPaneContent(paneType, editionKey);
};

// Fetch markdown with CDN + raw fallback and caching
async function fetchEditionMarkdown(editionKey, relativePath) {
  const cacheKey = `${editionKey}:${relativePath}`;
  if (state.cache.has(cacheKey)) {
    return state.cache.get(cacheKey);
  }

  const repo = REPO_MAP[editionKey] || 'tipitaka-md/tipitaka2500';
  const branch = 'main';

  // URLs in order of preference
  const urls = [
    `https://cdn.jsdelivr.net/gh/${repo}@${branch}/${relativePath}`,
    `https://raw.githubusercontent.com/${repo}/${branch}/${relativePath}`
  ];

  let lastError = null;
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const text = await res.text();
        state.cache.set(cacheKey, text);
        return text;
      }
    } catch (e) {
      lastError = e;
    }
  }

  throw new Error(lastError ? lastError.message : 'Could not fetch resource');
}

// ==================== Markdown Parser ====================
function parseMarkdown(md, editionKey) {
  if (!md) return '';

  // Transliterate if needed before HTML escape / conversion
  let text = md;
  if (state.targetScript !== 'iast') {
    text = transliteratePali(text, state.targetScript);
  }

  // Pre-process Footnotes definitions: [^1]: Footnote content
  const footnotes = new Map();
  text = text.replace(/^\[\^(\d+)\]:\s*(.*)$/gm, (_, id, content) => {
    footnotes.set(id, content.trim());
    return '';
  });

  const lines = text.split('\n');
  let html = '';
  let inBlockquote = false;
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Clean blank lines
    if (!line.trim()) {
      if (inBlockquote) { html += '</blockquote>\n'; inBlockquote = false; }
      if (inList) { html += '</ul>\n'; inList = false; }
      continue;
    }

    // Blockquote
    if (line.startsWith('>')) {
      if (!inBlockquote) { html += '<blockquote>'; inBlockquote = true; }
      line = line.replace(/^>\s*/, '');
    } else if (inBlockquote) {
      html += '</blockquote>\n';
      inBlockquote = false;
    }

    // Unordered List
    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) { html += '<ul>'; inList = true; }
      const itemText = formatInline(line.replace(/^[-*]\s+/, ''));
      html += `<li>${itemText}</li>`;
      continue;
    } else if (inList) {
      html += '</ul>\n';
      inList = false;
    }

    // Headings
    if (line.startsWith('#')) {
      const match = line.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const headingText = formatInline(match[2]);
        const id = 'h_' + match[2].toLowerCase().replace(/[^a-z0-9]/g, '_');
        html += `<h${level} id="${id}">${headingText}</h${level}>\n`;
        continue;
      }
    }

    // Horizontal Rule
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(line.trim())) {
      html += '<hr/>\n';
      continue;
    }

    // Centered paragraph <p align="center">
    if (line.includes('align="center"')) {
      html += `<p align="center">${formatInline(line.replace(/<[^>]+>/g, ''))}</p>\n`;
      continue;
    }

    // Regular paragraph
    html += `<p>${formatInline(line)}</p>\n`;
  }

  if (inBlockquote) html += '</blockquote>\n';
  if (inList) html += '</ul>\n';

  // Append Footnotes Section if any
  if (footnotes.size > 0) {
    html += '<section class="footnotes-section"><h4>Notes & Variants</h4><div class="footnotes-list">';
    for (const [fnId, fnText] of footnotes.entries()) {
      html += `
        <div class="footnote-item" id="fn-${fnId}">
          <span class="fn-num">[${fnId}]</span>
          <span class="fn-content">${formatInline(fnText)}</span>
        </div>`;
    }
    html += '</div></section>';
  }

  return html;
}

// Inline formatting (bold, italic, code, page citations, footnotes)
function formatInline(str) {
  if (!str) return '';

  return str
    // Page citation anchors: <a id="p_6D_1"></a> or <a id="..."></a>
    .replace(/<a\s+id="([^"]+)">\s*<\/a>/g, (_, id) => {
      const label = id.replace(/^p_/, '').replace(/_/g, ' ');
      return `<span class="page-anchor-chip" title="Page / Section ${label}">§ ${label}</span>`;
    })
    // Footnote references [^1]
    .replace(/\[\^(\d+)\]/g, (_, id) => {
      return `<sup class="footnote-ref"><a href="#fn-${id}" data-fn="${id}">[${id}]</a></sup>`;
    })
    // Bold italic
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Code
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

// Footnote interactions
function attachFootnoteListeners(container) {
  container.querySelectorAll('sup.footnote-ref a').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const fnId = el.getAttribute('data-fn');
      const targetFn = container.querySelector(`#fn-${fnId}`);
      if (targetFn) {
        showFootnoteDrawer(`Note [${fnId}]`, targetFn.querySelector('.fn-content')?.innerHTML || '');
      }
    });
  });
}

function showFootnoteDrawer(title, content) {
  elements.footnoteTitle.textContent = title;
  elements.footnoteBody.innerHTML = content;
  elements.footnoteDrawer.classList.add('active');
}

function closeFootnoteDrawer() {
  elements.footnoteDrawer.classList.remove('active');
}

// ==================== UI Components & Layout ====================
function updateBreadcrumbs(item) {
  const parts = [];
  if (item.pitaka || item.group) parts.push(item.pitaka || item.group);
  if (item.parentBook) parts.push(item.parentBook);
  parts.push(item.citation || item.title);

  elements.breadcrumbs.innerHTML = parts
    .map((p, idx) => `<span class="breadcrumb-item">${p}</span>`)
    .join('<span class="sep">/</span>');
}

function updateConcordanceBadges(item) {
  if (!item.editions) {
    elements.concordanceBadges.innerHTML = '';
    return;
  }

  const badgesHtml = Object.keys(item.editions).map(edKey => {
    const meta = state.catalog.editions[edKey];
    const isCurrentPrimary = state.primaryEdition === edKey;
    const isCurrentCompare = state.splitMode && state.compareEdition === edKey;
    const activeClass = (isCurrentPrimary || isCurrentCompare) ? 'active' : '';

    return `
      <span class="concordance-badge ${activeClass}" 
            title="${meta ? meta.desc : edKey}"
            data-edition="${edKey}">
        ${meta ? meta.short_name : edKey.toUpperCase()}
      </span>
    `;
  }).join('');

  elements.concordanceBadges.innerHTML = badgesHtml;
}

function updatePanesVisibility() {
  if (state.splitMode) {
    elements.panesWrapper.classList.add('split-mode');
    elements.paneCompare.style.display = 'flex';
    elements.splitToggle.classList.add('active');
    elements.splitToggle.setAttribute('title', 'Switch to Single View');
  } else {
    elements.panesWrapper.classList.remove('split-mode');
    elements.paneCompare.style.display = 'none';
    elements.splitToggle.classList.remove('active');
    elements.splitToggle.setAttribute('title', 'Switch to Split Comparison View');
  }
}

function renderEditionTabs() {
  const editions = ['tipitaka2500', 'pts', 'bjt', 'cst', 'siam-rath'];

  // Primary Tabs
  elements.primaryTabs.innerHTML = editions.map(ed => {
    const meta = state.catalog?.editions[ed];
    const active = state.primaryEdition === ed ? 'active' : '';
    return `<button class="edition-tab ${active}" data-edition="${ed}" data-pane="primary">
      ${meta ? meta.short_name : ed}
    </button>`;
  }).join('');

  // Compare Tabs
  elements.compareTabs.innerHTML = editions.map(ed => {
    const meta = state.catalog?.editions[ed];
    const active = state.compareEdition === ed ? 'active' : '';
    return `<button class="edition-tab ${active}" data-edition="${ed}" data-pane="compare">
      ${meta ? meta.short_name : ed}
    </button>`;
  }).join('');

  // Tab click listeners
  elements.primaryTabs.querySelectorAll('.edition-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const ed = btn.getAttribute('data-edition');
      if (state.primaryEdition !== ed) {
        state.primaryEdition = ed;
        renderEditionTabs();
        loadPaneContent('primary', ed);
        updateHash();
        updateConcordanceBadges(state.currentItem);
      }
    });
  });

  elements.compareTabs.querySelectorAll('.edition-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const ed = btn.getAttribute('data-edition');
      if (state.compareEdition !== ed) {
        state.compareEdition = ed;
        renderEditionTabs();
        loadPaneContent('compare', ed);
        updateHash();
        updateConcordanceBadges(state.currentItem);
      }
    });
  });
}

// ==================== Sidebar Navigation Tree ====================
function renderSidebarTree(filterText = '') {
  if (!state.catalog) return;

  const filter = filterText.toLowerCase().trim();
  let html = '';

  state.catalog.structure.forEach((group, gIdx) => {
    let groupHtml = '';

    if (group.books) {
      group.books.forEach((book, bIdx) => {
        let bookItemsHtml = '';

        if (book.suttas && book.suttas.length > 0) {
          book.suttas.forEach(sutta => {
            const match = !filter || 
              (sutta.title && sutta.title.toLowerCase().includes(filter)) ||
              (sutta.citation && sutta.citation.toLowerCase().includes(filter)) ||
              (sutta.pali_title && sutta.pali_title.toLowerCase().includes(filter));

            if (match) {
              const active = state.currentItem?.id === sutta.id ? 'active' : '';
              bookItemsHtml += `
                <a class="tree-item ${active}" data-id="${sutta.id}" title="${sutta.citation || ''} ${sutta.title}">
                  ${sutta.citation ? `<strong>${sutta.citation}</strong> ` : ''}${sutta.title}
                </a>`;
            }
          });
        } else if (book.editions) {
          const match = !filter || 
            (book.title && book.title.toLowerCase().includes(filter)) ||
            (book.code && book.code.toLowerCase().includes(filter));

          if (match) {
            const active = state.currentItem?.code === book.code ? 'active' : '';
            bookItemsHtml += `
              <a class="tree-item ${active}" data-id="${book.code}" title="${book.title}">
                <strong>${book.code}</strong> ${book.title}
              </a>`;
          }
        }

        if (bookItemsHtml) {
          groupHtml += `
            <div class="tree-group expanded">
              <div class="tree-group-header">
                <span>${book.title}</span>
                <span class="chevron">▶</span>
              </div>
              <div class="tree-group-children">
                ${bookItemsHtml}
              </div>
            </div>`;
        }
      });
    }

    if (groupHtml) {
      html += `
        <div class="tree-group expanded">
          <div class="tree-group-header" style="font-weight: 800; color: var(--accent-color);">
            <span>${group.title}</span>
            <span class="chevron">▶</span>
          </div>
          <div class="tree-group-children">
            ${groupHtml}
          </div>
        </div>`;
    }
  });

  elements.sidebarTree.innerHTML = html;

  // Tree click listeners
  elements.sidebarTree.querySelectorAll('.tree-group-header').forEach(hdr => {
    hdr.addEventListener('click', () => {
      const parent = hdr.parentElement;
      parent.classList.toggle('expanded');
    });
  });

  elements.sidebarTree.querySelectorAll('.tree-item').forEach(itemEl => {
    itemEl.addEventListener('click', () => {
      const id = itemEl.getAttribute('data-id');
      navigateToItem(id);
      // Close mobile sidebar if open
      if (window.innerWidth <= 768) {
        elements.sidebar.classList.remove('mobile-open');
      }
    });
  });
}

function highlightSidebarItem(id) {
  elements.sidebarTree.querySelectorAll('.tree-item').forEach(el => {
    if (el.getAttribute('data-id') === id) {
      el.classList.add('active');
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } else {
      el.classList.remove('active');
    }
  });
}

function updateFooterNav(item) {
  const currentIndex = state.flatItems.findIndex(it => (it.id || it.code) === (item.id || item.code));

  if (currentIndex > 0) {
    const prev = state.flatItems[currentIndex - 1];
    elements.prevBtn.style.visibility = 'visible';
    elements.prevBtn.innerHTML = `← ${prev.citation || prev.title}`;
    elements.prevBtn.onclick = () => navigateToItem(prev.id || prev.code);
  } else {
    elements.prevBtn.style.visibility = 'hidden';
  }

  if (currentIndex >= 0 && currentIndex < state.flatItems.length - 1) {
    const next = state.flatItems[currentIndex + 1];
    elements.nextBtn.style.visibility = 'visible';
    elements.nextBtn.innerHTML = `${next.citation || next.title} →`;
    elements.nextBtn.onclick = () => navigateToItem(next.id || next.code);
  } else {
    elements.nextBtn.style.visibility = 'hidden';
  }
}

// ==================== Synchronized Scrolling ====================
function setupSyncScroll() {
  const p1 = elements.primaryContent;
  const p2 = elements.compareContent;

  p1.addEventListener('scroll', () => {
    if (!state.splitMode || !state.syncScroll || state.isScrolling) return;
    state.isScrolling = true;
    const ratio = p1.scrollTop / (p1.scrollHeight - p1.clientHeight || 1);
    p2.scrollTop = ratio * (p2.scrollHeight - p2.clientHeight);
    requestAnimationFrame(() => { state.isScrolling = false; });
  });

  p2.addEventListener('scroll', () => {
    if (!state.splitMode || !state.syncScroll || state.isScrolling) return;
    state.isScrolling = true;
    const ratio = p2.scrollTop / (p2.scrollHeight - p2.clientHeight || 1);
    p1.scrollTop = ratio * (p1.scrollHeight - p1.clientHeight);
    requestAnimationFrame(() => { state.isScrolling = false; });
  });
}

// ==================== Search Modal ====================
function openSearchModal() {
  elements.searchModal.classList.add('active');
  elements.searchInput.value = '';
  elements.searchInput.focus();
  renderSearchResults('');
}

function closeSearchModal() {
  elements.searchModal.classList.remove('active');
}

function renderSearchResults(query) {
  const q = query.toLowerCase().trim();
  if (!q) {
    // Show some popular / top suttas
    const sample = state.flatItems.slice(0, 8);
    elements.searchResults.innerHTML = sample.map((item, idx) => `
      <div class="search-result-item ${idx === 0 ? 'selected' : ''}" data-id="${item.id || item.code}">
        <div>
          <div class="search-result-title">${item.citation ? `<strong>${item.citation}</strong> ` : ''}${item.title}</div>
          <div class="search-result-meta">${item.group || ''} · ${item.parentBook || ''}</div>
        </div>
        <span class="search-result-badge">${item.editions ? Object.keys(item.editions).length + ' editions' : ''}</span>
      </div>
    `).join('');
    attachSearchResultListeners();
    return;
  }

  // Filter items
  const matches = state.flatItems.filter(item => {
    return (item.citation && item.citation.toLowerCase().includes(q)) ||
           (item.title && item.title.toLowerCase().includes(q)) ||
           (item.pali_title && item.pali_title.toLowerCase().includes(q)) ||
           (item.id && item.id.toLowerCase().includes(q));
  }).slice(0, 20);

  if (matches.length === 0) {
    elements.searchResults.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-muted);">No texts found matching "${query}"</div>`;
    return;
  }

  elements.searchResults.innerHTML = matches.map((item, idx) => `
    <div class="search-result-item ${idx === 0 ? 'selected' : ''}" data-id="${item.id || item.code}">
      <div>
        <div class="search-result-title">${item.citation ? `<strong>${item.citation}</strong> ` : ''}${item.title}</div>
        <div class="search-result-meta">${item.group || ''} · ${item.parentBook || ''}</div>
      </div>
      <span class="search-result-badge">${item.editions ? Object.keys(item.editions).length + ' editions' : ''}</span>
    </div>
  `).join('');

  attachSearchResultListeners();
}

function attachSearchResultListeners() {
  elements.searchResults.querySelectorAll('.search-result-item').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.getAttribute('data-id');
      closeSearchModal();
      navigateToItem(id);
    });
  });
}

// ==================== Theme & Customization ====================
function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('tipitaka_theme', theme);
  if (elements.themeToggle) {
    const icon = theme === 'dark' ? '☀️' : (theme === 'sepia' ? '🌙' : '📜');
    elements.themeToggle.textContent = icon;
  }
}

function toggleTheme() {
  const nextTheme = state.theme === 'light' ? 'sepia' : (state.theme === 'sepia' ? 'dark' : 'light');
  applyTheme(nextTheme);
}

function applyFontSize(size) {
  state.fontSize = Math.min(Math.max(size, 14), 28);
  document.documentElement.style.setProperty('--reader-font-size', `${state.fontSize}px`);
  localStorage.setItem('tipitaka_fontsize', state.fontSize);
}

// ==================== Event Listeners ====================
function setupEventListeners() {
  // Theme toggle
  elements.themeToggle.addEventListener('click', toggleTheme);

  // Font size buttons
  elements.fontSizeDec.addEventListener('click', () => applyFontSize(state.fontSize - 1));
  elements.fontSizeInc.addEventListener('click', () => applyFontSize(state.fontSize + 1));

  // Script transliteration selector
  elements.scriptSelect.addEventListener('change', (e) => {
    state.targetScript = e.target.value;
    if (state.currentItem) {
      loadPaneContent('primary', state.primaryEdition);
      if (state.splitMode) loadPaneContent('compare', state.compareEdition);
    }
  });

  // Split view toggle
  elements.splitToggle.addEventListener('click', () => {
    state.splitMode = !state.splitMode;
    updatePanesVisibility();
    updateHash();
    if (state.splitMode && state.currentItem) {
      loadPaneContent('compare', state.compareEdition);
    }
  });

  // Sidebar toggle
  elements.sidebarToggle.addEventListener('click', () => {
    if (window.innerWidth <= 768) {
      elements.sidebar.classList.toggle('mobile-open');
    } else {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      elements.sidebar.classList.toggle('collapsed', state.sidebarCollapsed);
    }
  });

  // Sidebar filter
  elements.sidebarFilter.addEventListener('input', (e) => {
    renderSidebarTree(e.target.value);
  });

  // Search modal open/close
  elements.searchTrigger.addEventListener('click', openSearchModal);
  elements.modalClose.addEventListener('click', closeSearchModal);
  elements.searchModal.addEventListener('click', (e) => {
    if (e.target === elements.searchModal) closeSearchModal();
  });
  elements.searchInput.addEventListener('input', (e) => {
    renderSearchResults(e.target.value);
  });

  // Footnote drawer close
  elements.footnoteClose.addEventListener('click', closeFootnoteDrawer);

  // Setup dual pane synchronized scrolling
  setupSyncScroll();
}

// Keyboard shortcuts (⌘K or / for search, Esc to close)
function setupKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    // ⌘K or Ctrl+K or / (when not in input)
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openSearchModal();
    } else if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
      e.preventDefault();
      openSearchModal();
    } else if (e.key === 'Escape') {
      closeSearchModal();
      closeFootnoteDrawer();
    }
  });

  // Arrow key navigation inside search results
  elements.searchInput.addEventListener('keydown', (e) => {
    const items = elements.searchResults.querySelectorAll('.search-result-item');
    if (!items.length) return;

    let selectedIdx = Array.from(items).findIndex(it => it.classList.contains('selected'));

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (selectedIdx < items.length - 1) {
        if (selectedIdx >= 0) items[selectedIdx].classList.remove('selected');
        items[selectedIdx + 1].classList.add('selected');
        items[selectedIdx + 1].scrollIntoView({ block: 'nearest' });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (selectedIdx > 0) {
        items[selectedIdx].classList.remove('selected');
        items[selectedIdx - 1].classList.add('selected');
        items[selectedIdx - 1].scrollIntoView({ block: 'nearest' });
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIdx >= 0) {
        items[selectedIdx].click();
      }
    }
  });
}

// Start application
document.addEventListener('DOMContentLoaded', init);
