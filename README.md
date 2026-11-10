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
| **World Tipiṭaka Edition** | `WTK` | [`tipitaka-md/tipitaka2500`](https://github.com/tipitaka-md/tipitaka2500) | Roman Script Mahāsaṅgīti Tipiṭaka Buddhavasse 2500 (2020 Edition) — **Base text** |
| **Pali Text Society** | `PTS` | [`tipitaka-md/pts`](https://github.com/tipitaka-md/pts) | Pali Text Society Roman Edition (London / GRETIL) with PTS volume/page concordances |
| **Buddha Jayanthi** | `BJT` | [`tipitaka-md/buddha-jayanthi`](https://github.com/tipitaka-md/buddha-jayanthi) | Sri Lanka Buddha Jayanthi Tripitaka Series (B.E. 2500) with footnotes and variants |
| **Chaṭṭha Saṅgāyana** | `CST` | [`tipitaka-md/cst`](https://github.com/tipitaka-md/cst) | Sixth Buddhist Council Edition (Vipassana Research Institute XML corpus) |
| **Royal Thai Edition** | `RTE` | [`tipitaka-md/siam-rath`](https://github.com/tipitaka-md/siam-rath) | Royal Thai Syāmaraṭṭha Tepiṭakaṃ (King Rama VII) with 45 volumes and page markers |

---

## ✨ Key Features

1. **Dual-Pane Split Comparison**
   - Read any two editions side-by-side (e.g. World Tipiṭaka Edition vs. Pali Text Society, or Buddha Jayanthi vs. CST).
   - Switch editions on the fly in either pane with instant tab switching.
   - Synchronized scrolling between parallel panes.

2. **Text Variant Highlighting against Base (World Tipiṭaka Edition)**
   - Automatically diffs any comparative edition (`PTS`, `BJT`, `CST`, `RTE`) against the base `WTK` text in real time:
     - 🟩 **Light Green**: **Addition** (words/phrases present in the edition that are not in WTK).
     - 🟨 **Light Yellow**: **Change / Variant** (variant readings, sandhi, orthography, and spelling variants).
     - 🟥 **Light Pink**: **Deletion** (words in WTK omitted in this edition, shown with strikethrough).
   - One-click toggle (`✨ Diff`) in the header toolbar to turn diff highlighting on/off.

3. **On-the-Fly Script Transliteration**
   - Bidirectional client-side transliteration engine (`transliterator.js`):
     - **IAST Roman**
     - **Sinhala** (සිංහල)
     - **Thai** (ไทย)
     - **Burmese / Myanmar** (မြန်မာ)
     - **Devanagari** (देवनागरी)
     - **Brahmi** (𑀩𑁆𑀭𑀸𑀳𑁆𑀫𑀻)

3. **Page Citations & Interactive Concordance**
   - Canonical page markers (`§ 6D 1`, `§ M I 1`, `§ Vin III 1`) rendered as compact interactive chips.
   - Concordance badges in the header showing edition coverage for the open text.

4. **Instant Quick-Jump & Full Canonical Search (`⌘K` / `/`)**
   - Command palette modal to instantly jump to any book or sutta by code or title (e.g., `1V`, `6D`, `18Dh`, `Brahmajāla`, `Mahāparinibbāna`).

5. **Footnote & Variant Reader**
   - Clickable footnote superscripts open notes in a bottom drawer without disturbing reading flow.

6. **Reading Experience & Themes**
   - Three carefully crafted color palettes: **Light**, **Sepia**, and **Dark**.
   - Adjustable font size scaling.
   - Elegant typography with *Noto Serif*, *Gentium Plus*, and *Noto Sans*.

7. **Zero-Backend Reader**
   - Standalone static HTML5/CSS3/ES6 site deployed directly on GitHub Pages.
   - Texts are fetched on demand from GitHub, with jsDelivr as a fallback. Reading requires an internet connection.
   - [`public/sw.js`](public/sw.js) retires the legacy cache-first service worker and its `tipitaka-v1` cache, then refreshes open pages. It must remain available at `/sw.js` for returning visitors.
   - Open pages check the deployed build version on return and periodically while visible, then refresh when a newer build is available. GitHub Pages controls HTTP cache headers; offline browsers and older pages without this check cannot be forced to update.

---

## 🛠 Catalog Generation

The cross-edition concordances are built using [`scripts/build_catalog.py`](scripts/build_catalog.py), mapping books and suttas across all 5 repositories into [`catalog.json`](catalog.json).

To regenerate the catalog:
```bash
python3 scripts/build_catalog.py
```

---

## 🚀 Local Development

To run locally without build dependencies:

```bash
# Using Python 3 built-in HTTP server
python3 -m http.server 8080

# Open in browser
open http://localhost:8080
```

---

## 📄 License

- Text editions are public domain or shared under Creative Commons Zero (CC0).
- Viewer code released under the MIT License.
