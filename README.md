# Tipiṭaka Multi-Edition Comparison Viewer

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Viewer-7e22ce?style=flat&logo=github)](https://tipitaka-md.github.io/)
[![Editions](https://img.shields.io/badge/Pāli%20Editions-5%20Canonical%20Editions-blue)](https://tipitaka-md.github.io/)
[![License: CC0](https://img.shields.io/badge/License-CC0%201.0%20Universal-lightgrey.svg)](https://creativecommons.org/publicdomain/zero/1.0/)

An ultra-fast, zero-server static web application for side-by-side comparative reading and concordance exploration across 5 major historical and modern editions of the Pāli Tipiṭaka.

**Live Viewer:** [https://tipitaka-md.github.io/](https://tipitaka-md.github.io/)

---

## 📚 Editions Supported

| Edition | Code | Base Repository | Description |
|:---|:---:|:---|:---|
| **World Tipiṭaka Edition** | `WT` | [`tipitaka-md/tipitaka2500`](https://github.com/tipitaka-md/tipitaka2500) | Roman Script Mahāsaṅgīti Tipiṭaka Buddhavasse 2500 (2020 Edition) — **Base text** |
| **Pali Text Society** | `PTS` | [`tipitaka-md/pts`](https://github.com/tipitaka-md/pts) | Pali Text Society Roman Edition (London / GRETIL) with PTS volume/page concordances |
| **Buddha Jayanthi** | `BJ` | [`tipitaka-md/buddha-jayanthi`](https://github.com/tipitaka-md/buddha-jayanthi) | Sri Lanka Buddha Jayanthi Tripitaka Series (B.E. 2500) with footnotes and variants |
| **Chaṭṭha Saṅgāyana** | `CST` | [`tipitaka-md/cst`](https://github.com/tipitaka-md/cst) | Sixth Buddhist Council Edition (Vipassana Research Institute XML corpus) |
| **Royal Thai Edition** | `RT` | [`tipitaka-md/siam-rath`](https://github.com/tipitaka-md/siam-rath) | Royal Thai Syāmaraṭṭha Tepiṭakaṃ (King Rama VII) with 45 volumes and page markers |

---

## ✨ Key Features

1. **Dual-Pane Split Comparison**
   - Read any comparative edition side-by-side against the canonical World Tipiṭaka Edition (WT).
   - Switch editions on the fly in either pane with instant tab switching.
   - Synchronized scrolling between parallel panes.

2. **Text Variant Highlighting against Base (World Tipiṭaka Edition - WT)**
   - Automatically diffs any comparative edition (`PTS`, `BJ`, `CST`, `RT`) against the base `WT` text in real time:
     - 🟩 **Light Green**: **Addition** (words/phrases present in the edition that are not in WT).
     - 🟨 **Light Yellow**: **Change / Variant** (variant readings, sandhi, orthography, and spelling variants).
     - 🟥 **Light Pink**: **Deletion** (words in WT omitted in this edition, shown with strikethrough).
   - One-click toggle (`✨ Diff`) in the header toolbar to turn diff highlighting on/off.
   - Intelligent sliding-window sutta elision isolates matching sections when comparing against massive multi-sutta volume files (e.g. Royal Thai or CST volumes).

3. **Smart Alignment & Sidebar Navigation**
   - Clicking any book or chapter in the sidebar automatically opens the canonical **Base Edition (WT)** in clean Single View with diffing disabled. This eliminates volume/chapter desynchronization across traditions with divergent division structures (such as Royal Thai full volumes vs. WT individual suttas).
   - Once loaded, edition tabs allow instant switching or parallel comparison with guaranteed passage alignment.

4. **On-the-Fly Script Transliteration**
   - Bidirectional client-side transliteration engine (`transliterator.js`):
     - **IAST Roman**
     - **Sinhala** (සිංහල)
     - **Thai** (ไทย)
     - **Burmese / Myanmar** (မြန်မာ)
     - **Devanagari** (देवनागरी)
     - **Brahmi** (𑀩𑁆𑀭𑀸𑀳𑁆𑀫𑀻)

5. **Page Citations & Interactive Concordance**
   - Canonical page markers (`§ 6D 1`, `§ M I 1`, `§ Vin III 1`) rendered as compact interactive chips.
   - Concordance badges in the header showing edition coverage for the open text.

6. **Instant Quick-Jump & Full Canonical Search (`⌘K` / `/`)**
   - Command palette modal to instantly jump to any book or sutta by code or title (e.g., `1V`, `6D`, `18Dh`, `Brahmajāla`, `Mahāparinibbāna`).

7. **Footnote & Variant Reader**
   - Clickable footnote superscripts open notes in a bottom drawer without disturbing reading flow.

8. **Reading Experience & Themes**
   - Three carefully crafted color palettes: **Light**, **Sepia**, and **Dark**.
   - Adjustable font size scaling.
   - Elegant typography with *Noto Serif*, *Gentium Plus*, and *Noto Sans*.

9. **Zero-Backend Architecture**
   - Standalone static Astro site deployed directly to GitHub Pages.
   - Texts are fetched on demand from GitHub, with jsDelivr as a fallback. Reading requires an internet connection.
   - [`public/sw.js`](public/sw.js) retires legacy cache-first service workers and refreshes open pages.
   - Open pages check the deployed build version on return and periodically while visible, then refresh when a newer build is available.

---

## 🛠 Catalog Generation

The cross-edition concordances are built using [`scripts/build_catalog.py`](scripts/build_catalog.py), mapping books and suttas across all 5 repositories into [`catalog.json`](catalog.json) and [`public/catalog.json`](public/catalog.json).

To regenerate the catalog:
```bash
python3 scripts/build_catalog.py
```

---

## 🚀 Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build production static output
npm run build
```

---

## 📄 License

- Text editions are public domain or shared under Creative Commons Zero (CC0).
- Viewer code released under the MIT License.
