#!/usr/bin/env python3
"""
Generate complete PTS (Pali Text Society) reference citation index for tipitaka-md.github.io.
Maps standard PTS citation references across:
- Dīgha Nikāya (D I, II, III / DN 1..3)
- Majjhima Nikāya (M I, II, III / MN 1..3)
- Saṃyutta Nikāya (S I, II, III, IV, V / SN 1..5)
- Aṅguttara Nikāya (A I, II, III, IV, V / AN 1..5)
- Vinaya Piṭaka (Vin I, II, III, IV, V)
- Khuddaka Nikāya (Dhp, Ud, Iti, Snp, Vv, Pv, Thag, Thig, Ja 1..6, Mnd, Cnd, Ps 1..2, Ap, Bv, Cp, Khp)
- Abhidhamma Piṭaka (Dhs, Vbh, Dhk, Pug, Kvu, Yam 1..2, Patth)
- Commentaries & Paracanonical (Vism, Mil, Sp 1..7)

Allows scholars and readers to search "M I 1", "M.i.1", "D II 150", "Vin III 1", "S V 420", "Dhp 40"
and jump directly to the exact file and page anchor in the reader.
"""

import glob
import json
import os
import re

def build_pts_references():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    pts_root = os.path.expanduser('~/Repositories/Pali/pts')
    if not os.path.isdir(pts_root):
        print(f"Error: PTS repo not found at {pts_root}")
        return

    catalog_path = os.path.join(base_dir, 'public', 'catalog.json')
    pts_file_to_book = {}
    if os.path.exists(catalog_path):
        with open(catalog_path, 'r', encoding='utf-8') as f:
            cat = json.load(f)
        for pit in cat.get('structure', []):
            for b in pit.get('books', []):
                if 'pts' in b.get('editions', {}):
                    pts_file_to_book[b['editions']['pts']] = b['code']
                if 'suttas' in b:
                    for s in b['suttas']:
                        if 'pts' in s.get('editions', {}):
                            pts_file_to_book[s['editions']['pts']] = b['code']

    def get_book_code(rel):
        if rel in pts_file_to_book:
            return pts_file_to_book[rel]
        # Saṃyutta Nikāya
        m_sn = re.search(r'sutta/sn/sn(\d+)\.md', rel)
        if m_sn:
            n = int(m_sn.group(1))
            if n <= 11: return '12S1'
            if n <= 21: return '12S2'
            if n <= 34: return '13S3'
            if n <= 44: return '13S4'
            return '14S5'
        if rel.startswith('vinaya/mv'): return '3V'
        if rel.startswith('vinaya/cv'): return '4V'
        if rel.startswith('vinaya/vb-pj') or rel.startswith('vinaya/vb-ss') or rel.startswith('vinaya/vb-ay') or rel.startswith('vinaya/vb-np'): return '1V'
        if rel.startswith('vinaya/vb-pc') or rel.startswith('vinaya/vb-pd') or rel.startswith('vinaya/vb-sk') or rel.startswith('vinaya/vb-bi'): return '2V'
        if rel.startswith('vinaya/parivara'): return '5V'
        if rel.startswith('abhidhamma/vbh'): return '30Vbh'
        if rel.startswith('abhidhamma/yam'): return '33Y1'
        if rel.startswith('abhidhamma/pat'): return '36P1'
        m_jat = re.search(r'sutta/kn/jat(\d+)\.md', rel)
        if m_jat: return '22J' if int(m_jat.group(1)) <= 4 else '23J'
        if rel.startswith('sutta/kn/ps0'): return '26Ps'
        if rel.startswith('commentary/samantapasadika'): return 'Smp'
        if rel.startswith('commentary/visuddhimagga'): return 'Vm'
        if rel.startswith('paracanonical/milinda'): return '28Mi'
        if rel.startswith('chronicles/mahavamsa'): return 'Mhv'
        if rel.startswith('chronicles/dipavamsa'): return 'Dpv'
        return 'WT'

    def get_volume_key(rel):
        bname = os.path.basename(rel)
        # Dīgha
        m_dn = re.search(r'^dn(\d+)\.md$', bname)
        if m_dn:
            n = int(m_dn.group(1))
            vol = 1 if n <= 13 else (2 if n <= 23 else 3)
            return f'D {vol}'
        # Majjhima
        m_mn = re.search(r'^mn(\d+)\.md$', bname)
        if m_mn:
            n = int(m_mn.group(1))
            vol = 1 if n <= 76 else (2 if n <= 106 else 3)
            return f'M {vol}'
        # Saṃyutta
        m_sn = re.search(r'^sn(\d+)\.md$', bname)
        if m_sn:
            n = int(m_sn.group(1))
            vol = 1 if n <= 11 else (2 if n <= 21 else (3 if n <= 34 else (4 if n <= 44 else 5)))
            return f'S {vol}'
        # Aṅguttara
        m_an = re.search(r'^an(\d+)\.md$', bname)
        if m_an:
            n = int(m_an.group(1))
            vol = 1 if n <= 3 else (2 if n == 4 else (3 if n <= 6 else (4 if n <= 9 else 5)))
            return f'A {vol}'
        # Vinaya
        if rel.startswith('vinaya/mv'): return 'Vin 1'
        if rel.startswith('vinaya/cv'): return 'Vin 2'
        if rel.startswith('vinaya/vb-pj') or rel.startswith('vinaya/vb-ss') or rel.startswith('vinaya/vb-ay') or rel.startswith('vinaya/vb-np'): return 'Vin 3'
        if rel.startswith('vinaya/vb-pc') or rel.startswith('vinaya/vb-pd') or rel.startswith('vinaya/vb-sk') or rel.startswith('vinaya/vb-bi'): return 'Vin 4'
        if rel.startswith('vinaya/parivara'): return 'Vin 5'
        # Jataka
        m_jat = re.search(r'^jat0?(\d+)\.md$', bname)
        if m_jat: return f'Ja {int(m_jat.group(1))}'
        # Patisambhidamagga
        m_ps = re.search(r'^ps0?(\d+)\.md$', bname)
        if m_ps: return f'Ps {int(m_ps.group(1))}'
        # Yamaka
        m_yam = re.search(r'^yam0?(\d+)\.md$', bname)
        if m_yam: return f'Yam {int(m_yam.group(1))}'
        # Samantapasadika
        m_sp = re.search(r'^samantapasadika-0?(\d+)\.md$', bname)
        if m_sp: return f'Sp {int(m_sp.group(1))}'

        # Single volume books
        singles = {
            'khp.md': 'Khp',
            'dhp.md': 'Dhp',
            'ud.md': 'Ud',
            'iti.md': 'Iti',
            'snp.md': 'Snp',
            'vv.md': 'Vv',
            'pv.md': 'Pv',
            'thag.md': 'Thag',
            'thig.md': 'Thig',
            'mnd.md': 'Mnd',
            'cnd.md': 'Cnd',
            'ap.md': 'Ap',
            'bv.md': 'Bv',
            'cp.md': 'Cp',
            'dhs.md': 'Dhs',
            'dhk.md': 'Dhk',
            'pug.md': 'Pug',
            'kvu.md': 'Kvu',
            'pat-duka.md': 'Patth',
            'pat-tika1.md': 'Patth 1',
            'pat-tika2.md': 'Patth 2',
            'pat-tika3.md': 'Patth 3',
            'visuddhimagga.md': 'Vism',
            'milindapanha.md': 'Mil',
            'mahavamsa.md': 'Mhv',
            'dipavamsa.md': 'Dpv'
        }
        if bname in singles:
            return singles[bname]
        if rel.startswith('abhidhamma/vbh'):
            return 'Vbh'
        return None

    page_re = re.compile(r'<a id=\"page-0*(\d+)\"></a>')
    title_re = re.compile(r'^#\s*(.*)', re.M)

    volumes = {}
    total_files_indexed = 0
    total_pages_indexed = 0

    for fpath in sorted(glob.glob(f'{pts_root}/**/*.md', recursive=True)):
        if 'README' in fpath:
            continue
        with open(fpath, 'r', encoding='utf-8') as fp:
            content = fp.read()
        pages = [int(p) for p in page_re.findall(content)]
        if not pages:
            continue
        rel = os.path.relpath(fpath, pts_root)
        vkey = get_volume_key(rel)
        if not vkey:
            continue

        first_line = content.split('\n', 1)[0]
        t_m = title_re.match(first_line)
        title = t_m.group(1).strip() if t_m else rel
        # Remove markdown link formatting if title contains any
        title = re.sub(r'\[(.*?)\]\(.*?\)', r'\1', title)

        bcode = get_book_code(rel)
        start_p = min(pages)
        end_p = max(pages)

        volumes.setdefault(vkey, []).append([start_p, end_p, rel, title, bcode])
        total_files_indexed += 1
        total_pages_indexed += len(pages)

    # Sort each volume by start_page
    for vk in volumes:
        volumes[vk].sort(key=lambda x: x[0])

    aliases = {
        # Dīgha
        "D": "D", "DN": "D", "DIGHA": "D", "DĪGHA": "D",
        # Majjhima
        "M": "M", "MN": "M", "MAJJHIMA": "M",
        # Saṃyutta
        "S": "S", "SN": "S", "SAMYUTTA": "S", "SAṂYUTTA": "S",
        # Aṅguttara
        "A": "A", "AN": "A", "ANGUTTARA": "A", "AṄGUTTARA": "A",
        # Vinaya
        "VIN": "Vin", "VINAYA": "Vin", "V": "Vin",
        # Jātaka
        "JA": "Ja", "JAT": "Ja", "JATAKA": "Ja", "JĀTAKA": "Ja",
        # Paṭisambhidāmagga
        "PS": "Ps", "PATIS": "Ps", "PAṬIS": "Ps", "PATISAMBHIDAMAGGA": "Ps", "PAṬISAMBHIDĀMAGGA": "Ps",
        # Yamaka
        "YAM": "Yam", "YAMAKA": "Yam",
        # Samantapāsādikā
        "SP": "Sp", "SAMANTAPASADIKA": "Sp", "SAMANTAPĀSĀDIKĀ": "Sp",
        # Khuddaka books
        "DHP": "Dhp", "DHAMMAPADA": "Dhp",
        "UD": "Ud", "UDANA": "Ud", "UDĀNA": "Ud",
        "IT": "Iti", "ITI": "Iti", "ITIVUTTAKA": "Iti",
        "SNP": "Snp", "SNIP": "Snp", "SUTTANIPATA": "Snp", "SUTTANIPĀTA": "Snp",
        "VV": "Vv", "VIMANAVATTHU": "Vv", "VIMĀNAVATTHU": "Vv",
        "PV": "Pv", "PETAVATTHU": "Pv",
        "THAG": "Thag", "TH": "Thag", "THERAGATHA": "Thag", "THERAGĀTHĀ": "Thag",
        "THIG": "Thig", "THI": "Thig", "THERIGATHA": "Thig", "THERĪGĀTHĀ": "Thig",
        "KHP": "Khp", "KHUDDAKAPATHA": "Khp", "KHUDDAKAPĀṬHA": "Khp",
        "MND": "Mnd", "NIDD1": "Mnd", "MAHANIDDESA": "Mnd", "MAHĀNIDDESA": "Mnd",
        "CND": "Cnd", "NIDD2": "Cnd", "CULANIDDESA": "Cnd", "CŪḶANIDDESA": "Cnd",
        "AP": "Ap", "APADANA": "Ap", "APADĀNA": "Ap",
        "BV": "Bv", "BUDDHAVAMSA": "Bv", "BUDDHAVAṂSA": "Bv",
        "CP": "Cp", "CARIYAPITAKA": "Cp", "CARIYĀPIṬAKA": "Cp",
        # Abhidhamma
        "DHS": "Dhs", "DHAMMASANGANI": "Dhs", "DHAMMASAṄGAṆĪ": "Dhs",
        "VBH": "Vbh", "VIBH": "Vbh", "VIBHANGA": "Vbh", "VIBHAṄGA": "Vbh",
        "DHK": "Dhk", "DHATUK": "Dhk", "DHĀTUK": "Dhk", "DHATUKATHA": "Dhk", "DHĀTUKATHĀ": "Dhk",
        "PUG": "Pug", "PUGGALAPANNATTI": "Pug", "PUGGALAPAÑÑATTI": "Pug",
        "KVU": "Kvu", "KV": "Kvu", "KATHAVATTHU": "Kvu", "KATHĀVATTHU": "Kvu",
        "PATTH": "Patth", "PAṬṬH": "Patth", "PATTHANA": "Patth", "PAṬṬHĀNA": "Patth", "PAT": "Patth",
        # Commentaries
        "VISM": "Vism", "VISUDDHIMAGGA": "Vism", "VM": "Vism",
        "MIL": "Mil", "MILINDA": "Mil", "MILINDAPANHA": "Mil", "MILINDAPAÑHA": "Mil",
        "MHV": "Mhv", "MAHAVAMSA": "Mhv", "MAHĀVAṂSA": "Mhv",
        "DPV": "Dpv", "DIPAVAMSA": "Dpv", "DĪPAVAṂSA": "Dpv"
    }

    # Volume titles for display
    volume_titles = {
        "D 1": "Dīgha Nikāya Vol. I (Sīlakkhandhavagga)",
        "D 2": "Dīgha Nikāya Vol. II (Mahāvagga)",
        "D 3": "Dīgha Nikāya Vol. III (Pāthikavagga)",
        "M 1": "Majjhima Nikāya Vol. I (Mūlapaṇṇāsa)",
        "M 2": "Majjhima Nikāya Vol. II (Majjhimapaṇṇāsa)",
        "M 3": "Majjhima Nikāya Vol. III (Uparipaṇṇāsa)",
        "S 1": "Saṃyutta Nikāya Vol. I (Sagāthāvagga)",
        "S 2": "Saṃyutta Nikāya Vol. II (Nidānavagga)",
        "S 3": "Saṃyutta Nikāya Vol. III (Khandhavagga)",
        "S 4": "Saṃyutta Nikāya Vol. IV (Saḷāyatanavagga)",
        "S 5": "Saṃyutta Nikāya Vol. V (Mahāvagga)",
        "A 1": "Aṅguttara Nikāya Vol. I (Eka- to Tikanipāta)",
        "A 2": "Aṅguttara Nikāya Vol. II (Catukkanipāta)",
        "A 3": "Aṅguttara Nikāya Vol. III (Pañcaka- & Chakkanipāta)",
        "A 4": "Aṅguttara Nikāya Vol. IV (Sattaka- to Navakanipāta)",
        "A 5": "Aṅguttara Nikāya Vol. V (Dasaka- & Ekādasakanipāta)",
        "Vin 1": "Vinaya Piṭaka Vol. I (Mahāvagga)",
        "Vin 2": "Vinaya Piṭaka Vol. II (Cullavagga)",
        "Vin 3": "Vinaya Piṭaka Vol. III (Suttavibhaṅga 1)",
        "Vin 4": "Vinaya Piṭaka Vol. IV (Suttavibhaṅga 2)",
        "Vin 5": "Vinaya Piṭaka Vol. V (Parivāra)",
        "Ja 1": "Jātaka Vol. I",
        "Ja 2": "Jātaka Vol. II",
        "Ja 3": "Jātaka Vol. III",
        "Ja 4": "Jātaka Vol. IV",
        "Ja 5": "Jātaka Vol. V",
        "Ja 6": "Jātaka Vol. VI",
        "Ps 1": "Paṭisambhidāmagga Vol. I",
        "Ps 2": "Paṭisambhidāmagga Vol. II",
        "Yam 1": "Yamaka Vol. I",
        "Yam 2": "Yamaka Vol. II",
        "Sp 1": "Samantapāsādikā Vol. I",
        "Sp 2": "Samantapāsādikā Vol. II",
        "Sp 3": "Samantapāsādikā Vol. III",
        "Sp 4": "Samantapāsādikā Vol. IV",
        "Sp 5": "Samantapāsādikā Vol. V",
        "Sp 6": "Samantapāsādikā Vol. VI",
        "Sp 7": "Samantapāsādikā Vol. VII",
        "Dhp": "Dhammapada",
        "Ud": "Udāna",
        "Iti": "Itivuttaka",
        "Snp": "Suttanipāta",
        "Vv": "Vimānavatthu",
        "Pv": "Petavatthu",
        "Thag": "Theragāthā",
        "Thig": "Therīgāthā",
        "Khp": "Khuddakapāṭha",
        "Mnd": "Mahāniddesa",
        "Cnd": "Cūḷaniddesa",
        "Ap": "Apadāna",
        "Bv": "Buddhavaṃsa",
        "Cp": "Cariyāpiṭaka",
        "Dhs": "Dhammasaṅgaṇī",
        "Vbh": "Vibhaṅga",
        "Dhk": "Dhātukathā",
        "Pug": "Puggalapaññatti",
        "Kvu": "Kathāvatthu",
        "Patth": "Paṭṭhāna",
        "Vism": "Visuddhimagga",
        "Mil": "Milindapañha",
        "Mhv": "Mahāvaṃsa",
        "Dpv": "Dīpavaṃsa"
    }

    result = {
        "meta": {
            "title": "PTS Reference Citation Index",
            "edition": "Pali Text Society",
            "total_volumes": len(volumes),
            "total_files": total_files_indexed,
            "total_pages": total_pages_indexed
        },
        "aliases": aliases,
        "volume_titles": volume_titles,
        "volumes": volumes
    }

    out_file = os.path.join(base_dir, 'public', 'pts_references.json')
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    sz_kb = os.path.getsize(out_file) / 1024
    print(f"Generated {out_file}: {len(volumes)} volumes, {total_files_indexed} files, {total_pages_indexed} pages ({sz_kb:.1f} KB).")

if __name__ == '__main__':
    build_pts_references()
