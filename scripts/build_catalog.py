#!/usr/bin/env python3
"""
Generate complete cross-edition catalog for tipitaka-md.github.io.
Maps canonical divisions across:
- tipitaka2500 (World Tipitaka Base)
- buddha-jayanthi (BJT)
- cst (Chattha Sangayana CST4)
- siam-rath (Royal Thai Edition)
- pts (Pali Text Society)
"""

import json
import os
import re

def build_catalog():
    t2500_root = os.path.expanduser('~/Repositories/Pali/tipitaka2500/tipitaka')

    catalog = {
        "editions": {
            "tipitaka2500": {
                "name": "World Tipiṭaka 2500",
                "short_name": "T2500",
                "repo": "tipitaka-md/tipitaka2500",
                "branch": "main",
                "base_path": "tipitaka",
                "badge": "🌟 World Tipiṭaka 2500",
                "desc": "Roman Script 2005 / 2020 Edition (Mahāsaṅgīti Tipiṭaka Buddhavasse 2500)"
            },
            "pts": {
                "name": "Pali Text Society",
                "short_name": "PTS",
                "repo": "tipitaka-md/pts",
                "branch": "main",
                "base_path": "",
                "badge": "🇬🇧 Pali Text Society",
                "desc": "Pali Text Society Roman Edition (London / GRETIL)"
            },
            "bjt": {
                "name": "Buddha Jayanthi",
                "short_name": "BJT",
                "repo": "tipitaka-md/buddha-jayanthi",
                "branch": "main",
                "base_path": "",
                "badge": "🇱🇰 Buddha Jayanthi",
                "desc": "Sri Lanka Buddha Jayanthi Tripitaka Series (B.E. 2500)"
            },
            "cst": {
                "name": "Chaṭṭha Saṅgāyana",
                "short_name": "CST4",
                "repo": "tipitaka-md/cst",
                "branch": "main",
                "base_path": "",
                "badge": "🇲🇲 Chaṭṭha Saṅgāyana",
                "desc": "Sixth Buddhist Council Edition (Vipassana Research Institute)"
            },
            "siam-rath": {
                "name": "Siam Rath",
                "short_name": "Siam",
                "repo": "tipitaka-md/siam-rath",
                "branch": "main",
                "base_path": "",
                "badge": "🇹🇭 Siam Rath",
                "desc": "Royal Thai Syāmaraṭṭha Tepiṭakaṃ (King Rama VII)"
            }
        },
        "structure": []
    }

    # ==================== 1. VINAYAPIṬAKA ====================
    vinaya_group = {
        "id": "vinaya",
        "title": "Vinayapiṭaka",
        "pali_title": "Vinayapiṭaka",
        "description": "The Book of the Discipline",
        "books": []
    }

    vinaya_books_data = [
        ("1V", "Pārājikapāḷi", "1V.md", "vb-pj.md", "vp-prj.md", "mula/vinaya/vin01m.mul.md", "vinaya/vol01.md"),
        ("2V", "Pācittiyapāḷi", "2V.md", "vb-pc.md", "vp-pct.md", "mula/vinaya/vin02m.mul.md", "vinaya/vol02.md"),
        ("3V", "Mahāvaggapāḷi", "3V.md", "mv01.md", "vp-mv.md", "mula/vinaya/vin03m.mul.md", "vinaya/vol04.md"),
        ("4V", "Cūḷavaggapāḷi", "4V.md", "cv01.md", "vp-cv.md", "mula/vinaya/vin04m.mul.md", "vinaya/vol06.md"),
        ("5V", "Parivārapāḷi", "5V.md", "parivara.md", "vp-pv.md", "mula/vinaya/vin05m.mul.md", "vinaya/vol08.md"),
    ]

    for bcode, btitle, t2500_file, pts_file, bjt_file, cst_file, sr_file in vinaya_books_data:
        b_entry = {
            "code": bcode,
            "title": btitle,
            "pali_title": btitle,
            "pitaka": "Vinayapiṭaka",
            "editions": {
                "tipitaka2500": f"tipitaka/{t2500_file}",
                "pts": f"vinaya/{pts_file}",
                "bjt": f"vinaya/{bjt_file}",
                "cst": cst_file,
                "siam-rath": sr_file
            },
            "sections": []
        }
        # Scan sub-sections in tipitaka2500
        t_path = os.path.join(t2500_root, t2500_file)
        if os.path.exists(t_path):
            with open(t_path, 'r', encoding='utf-8') as f:
                links = re.findall(r'\*\s*\[(.*?)\]\((.*?)\)', f.read())
            for l_title, l_path in links:
                sec_path = os.path.normpath(os.path.join(os.path.dirname(f"tipitaka/{t2500_file}"), l_path))
                b_entry["sections"].append({
                    "title": l_title,
                    "tipitaka2500": sec_path
                })
        vinaya_group["books"].append(b_entry)

    catalog["structure"].append(vinaya_group)

    # ==================== 2. DĪGHANIKĀYA ====================
    dn_group = {
        "id": "dn",
        "title": "Dīghanikāya",
        "pali_title": "Dīghanikāya",
        "description": "Long Discourses of the Buddha (34 Suttas)",
        "books": []
    }

    dn_volumes = [
        ("6D", "Sīlakkhandhavaggapāḷi", "6D.md", "mula/sutta/dn/s0101m.mul.md", "sutta/dn/vol09.md", range(1, 14)),
        ("7D", "Mahāvaggapāḷi", "7D.md", "mula/sutta/dn/s0102m.mul.md", "sutta/dn/vol10.md", range(14, 24)),
        ("8D", "Pāthikavaggapāḷi", "8D.md", "mula/sutta/dn/s0103m.mul.md", "sutta/dn/vol11.md", range(24, 35)),
    ]

    dn_sutta_names = {
        1: "Brahmajālasutta", 2: "Sāmaññaphalasutta", 3: "Ambaṭṭhasutta",
        4: "Soṇadaṇḍasutta", 5: "Kūṭadantasutta", 6: "Mahālisutta",
        7: "Jāliyasutta", 8: "Mahāsīhanādasutta", 9: "Poṭṭhapādasutta",
        10: "Subhasutta", 11: "Kevaṭṭasutta", 12: "Lohiccasutta",
        13: "Tevijjasutta", 14: "Mahāpadānasutta", 15: "Mahānidānasutta",
        16: "Mahāparinibbānasutta", 17: "Mahāsudassanasutta", 18: "Janavasabhasutta",
        19: "Mahāgovindasutta", 20: "Mahāsamayasutta", 21: "Sakkapañhasutta",
        22: "Mahāsatipaṭṭhānasutta", 23: "Pāyāsisutta", 24: "Pāthikasutta",
        25: "Udumbarikasutta", 26: "Cakkavattisutta", 27: "Aggaññasutta",
        28: "Sampasādanīyasutta", 29: "Pāsādikasutta", 30: "Lakkhaṇasutta",
        31: "Siṅgālasutta", 32: "Āṭānāṭiyasutta", 33: "Saṅgītisutta",
        34: "Dasuttarasutta"
    }

    # BJT DN mapping
    bjt_dn_map = {
        1: "sutta/dn/dn-1.md", 2: "sutta/dn/dn-1-2.md", 3: "sutta/dn/dn-1-3.md",
        4: "sutta/dn/dn-1-4.md", 5: "sutta/dn/dn-1-5.md", 6: "sutta/dn/dn-1-6.md",
        7: "sutta/dn/dn-1-7.md", 8: "sutta/dn/dn-1-8.md", 9: "sutta/dn/dn-1-9.md",
        10: "sutta/dn/dn-1-10.md", 11: "sutta/dn/dn-1-11.md", 12: "sutta/dn/dn-1-12.md",
        13: "sutta/dn/dn-1-13.md", 14: "sutta/dn/dn-2.md", 15: "sutta/dn/dn-2-2.md",
        16: "sutta/dn/dn-2-3.md", 17: "sutta/dn/dn-2-4.md", 18: "sutta/dn/dn-2-5.md",
        19: "sutta/dn/dn-2-6.md", 20: "sutta/dn/dn-2-7.md", 21: "sutta/dn/dn-2-8.md",
        22: "sutta/dn/dn-2-9.md", 23: "sutta/dn/dn-2-10.md", 24: "sutta/dn/dn-3.md",
        25: "sutta/dn/dn-3-2.md", 26: "sutta/dn/dn-3-3.md", 27: "sutta/dn/dn-3-4.md",
        28: "sutta/dn/dn-3-5.md", 29: "sutta/dn/dn-3-6.md", 30: "sutta/dn/dn-3-7.md",
        31: "sutta/dn/dn-3-8.md", 32: "sutta/dn/dn-3-9.md", 33: "sutta/dn/dn-3-10.md",
        34: "sutta/dn/dn-3-11.md"
    }

    for bcode, btitle, t2500_file, cst_file, sr_file, s_range in dn_volumes:
        b_entry = {
            "code": bcode,
            "title": btitle,
            "pali_title": btitle,
            "nikaya": "Dīghanikāya",
            "pitaka": "Suttantapiṭaka",
            "editions": {
                "tipitaka2500": f"tipitaka/{t2500_file}",
                "cst": cst_file,
                "siam-rath": sr_file
            },
            "suttas": []
        }
        for snum in s_range:
            s_name = dn_sutta_names[snum]
            # Sub-index in tipitaka2500 (e.g. 6D/1.md)
            local_idx = snum if bcode == '6D' else (snum - 13 if bcode == '7D' else snum - 23)
            s_entry = {
                "id": f"dn{snum}",
                "citation": f"DN {snum}",
                "title": f"{snum}. {s_name}",
                "pali_title": s_name,
                "editions": {
                    "tipitaka2500": f"tipitaka/{bcode}/{local_idx}.md",
                    "pts": f"sutta/dn/dn{snum:02d}.md",
                    "bjt": bjt_dn_map.get(snum, f"sutta/dn/dn-{snum}.md"),
                    "cst": cst_file,
                    "siam-rath": sr_file
                }
            }
            b_entry["suttas"].append(s_entry)
        dn_group["books"].append(b_entry)

    catalog["structure"].append(dn_group)

    # ==================== 3. MAJJHIMANIKĀYA ====================
    mn_group = {
        "id": "mn",
        "title": "Majjhimanikāya",
        "pali_title": "Majjhimanikāya",
        "description": "Middle-length Discourses of the Buddha (152 Suttas)",
        "books": []
    }

    mn_volumes = [
        ("9M", "Mūlapaṇṇāsapāḷi", "9M.md", "mula/sutta/mn/s0201m.mul.md", "sutta/mn/vol12.md", range(1, 51)),
        ("10M", "Majjhimapaṇṇāsapāḷi", "10M.md", "mula/sutta/mn/s0202m.mul.md", "sutta/mn/vol13.md", range(51, 101)),
        ("11M", "Uparipaṇṇāsapāḷi", "11M.md", "mula/sutta/mn/s0203m.mul.md", "sutta/mn/vol14.md", range(101, 153)),
    ]

    for bcode, btitle, t2500_file, cst_file, sr_file, s_range in mn_volumes:
        b_entry = {
            "code": bcode,
            "title": btitle,
            "pali_title": btitle,
            "nikaya": "Majjhimanikāya",
            "pitaka": "Suttantapiṭaka",
            "editions": {
                "tipitaka2500": f"tipitaka/{t2500_file}",
                "cst": cst_file,
                "siam-rath": sr_file
            },
            "suttas": []
        }
        for snum in s_range:
            # Vagga index and sutta index
            v_idx = ((snum - 1) % 50) // 10 + 1
            s_idx = (snum - 1) % 10 + 1
            t2500_sub = f"tipitaka/{bcode}/{v_idx}/{v_idx}.{s_idx}.md"

            vol_idx = 1 if snum <= 50 else (2 if snum <= 100 else 3)
            bjt_sub = f"sutta/mn/mn-{vol_idx}-{v_idx}.md"

            s_entry = {
                "id": f"mn{snum}",
                "citation": f"MN {snum}",
                "title": f"MN {snum}",
                "editions": {
                    "tipitaka2500": t2500_sub,
                    "pts": f"sutta/mn/mn{snum:03d}.md",
                    "bjt": bjt_sub,
                    "cst": cst_file,
                    "siam-rath": sr_file
                }
            }
            b_entry["suttas"].append(s_entry)
        mn_group["books"].append(b_entry)

    catalog["structure"].append(mn_group)

    # ==================== 4. SAṂYUTTANIKĀYA ====================
    sn_group = {
        "id": "sn",
        "title": "Saṃyuttanikāya",
        "pali_title": "Saṃyuttanikāya",
        "description": "Connected Discourses of the Buddha (56 Saṃyuttas)",
        "books": []
    }

    sn_volumes = [
        ("12S1", "Sagāthāvaggasaṃyutta", "12S1.md", "mula/sutta/sn/s0301m.mul.md", "sutta/sn/vol15.md", range(1, 12)),
        ("12S2", "Nidānavaggasaṃyutta", "12S2.md", "mula/sutta/sn/s0302m.mul.md", "sutta/sn/vol16.md", range(12, 22)),
        ("13S3", "Khandhavaggasaṃyutta", "13S3.md", "mula/sutta/sn/s0303m.mul.md", "sutta/sn/vol17.md", range(22, 35)),
        ("13S4", "Saḷāyatanavaggasaṃyutta", "13S4.md", "mula/sutta/sn/s0304m.mul.md", "sutta/sn/vol18.md", range(35, 45)),
        ("14S5", "Mahāvaggasaṃyutta", "14S5.md", "mula/sutta/sn/s0305m.mul.md", "sutta/sn/vol19.md", range(45, 57)),
    ]

    for bcode, btitle, t2500_file, cst_file, sr_file, s_range in sn_volumes:
        b_entry = {
            "code": bcode,
            "title": btitle,
            "pali_title": btitle,
            "nikaya": "Saṃyuttanikāya",
            "pitaka": "Suttantapiṭaka",
            "editions": {
                "tipitaka2500": f"tipitaka/{t2500_file}",
                "cst": cst_file,
                "siam-rath": sr_file
            },
            "samyuttas": []
        }
        for snum in s_range:
            local_idx = snum - s_range[0] + 1
            s_entry = {
                "id": f"sn{snum}",
                "citation": f"SN {snum}",
                "title": f"SN {snum}",
                "editions": {
                    "tipitaka2500": f"tipitaka/{bcode}/{local_idx}.md",
                    "pts": f"sutta/sn/sn{snum:02d}.md",
                    "bjt": f"sutta/sn/sn-{local_idx}.md",
                    "cst": cst_file,
                    "siam-rath": sr_file
                }
            }
            b_entry["samyuttas"].append(s_entry)
        sn_group["books"].append(b_entry)

    catalog["structure"].append(sn_group)

    # ==================== 5. AṄGUTTARANIKĀYA ====================
    an_group = {
        "id": "an",
        "title": "Aṅguttaranikāya",
        "pali_title": "Aṅguttaranikāya",
        "description": "Numerical Discourses of the Buddha (11 Nipātas)",
        "books": []
    }

    an_volumes = [
        ("15A1", "Ekakanipāta", "15A1.md", 1, "sutta/an/an01.md", "sutta/an/an-1.md", "mula/sutta/an/s0401m.mul.md", "sutta/an/vol20.md"),
        ("15A2", "Dukanipāta", "15A2.md", 2, "sutta/an/an02.md", "sutta/an/an-2.md", "mula/sutta/an/s0401m.mul.md", "sutta/an/vol20.md"),
        ("15A3", "Tikanipāta", "15A3.md", 3, "sutta/an/an03.md", "sutta/an/an-3.md", "mula/sutta/an/s0401m.mul.md", "sutta/an/vol20.md"),
        ("15A4", "Catukkanipāta", "15A4.md", 4, "sutta/an/an04.md", "sutta/an/an-4.md", "mula/sutta/an/s0402m.mul.md", "sutta/an/vol21.md"),
        ("16A5", "Pañcakanipāta", "16A5.md", 5, "sutta/an/an05.md", "sutta/an/an-5.md", "mula/sutta/an/s0403m.mul.md", "sutta/an/vol22.md"),
        ("16A6", "Chakkanipāta", "16A6.md", 6, "sutta/an/an06.md", "sutta/an/an-6.md", "mula/sutta/an/s0403m.mul.md", "sutta/an/vol22.md"),
        ("16A7", "Sattakanipāta", "16A7.md", 7, "sutta/an/an07.md", "sutta/an/an-7.md", "mula/sutta/an/s0404m.mul.md", "sutta/an/vol23.md"),
        ("17A8", "Aṭṭhakanipāta", "17A8.md", 8, "sutta/an/an08.md", "sutta/an/an-8.md", "mula/sutta/an/s0404m.mul.md", "sutta/an/vol23.md"),
        ("17A9", "Navakanipāta", "17A9.md", 9, "sutta/an/an09.md", "sutta/an/an-9.md", "mula/sutta/an/s0404m.mul.md", "sutta/an/vol23.md"),
        ("17A10", "Dasakanipāta", "17A10.md", 10, "sutta/an/an10.md", "sutta/an/an-10.md", "mula/sutta/an/s0405m.mul.md", "sutta/an/vol24.md"),
        ("17A11", "Ekādasakanipāta", "17A11.md", 11, "sutta/an/an11.md", "sutta/an/an-11.md", "mula/sutta/an/s0405m.mul.md", "sutta/an/vol24.md"),
    ]

    for bcode, btitle, t2500_file, n_num, pts_file, bjt_file, cst_file, sr_file in an_volumes:
        b_entry = {
            "code": bcode,
            "title": f"AN {n_num} ({btitle})",
            "pali_title": btitle,
            "citation": f"AN {n_num}",
            "nikaya": "Aṅguttaranikāya",
            "pitaka": "Suttantapiṭaka",
            "editions": {
                "tipitaka2500": f"tipitaka/{t2500_file}",
                "pts": pts_file,
                "bjt": bjt_file,
                "cst": cst_file,
                "siam-rath": sr_file
            }
        }
        an_group["books"].append(b_entry)

    catalog["structure"].append(an_group)

    # ==================== 6. KHUDDAKANIKĀYA ====================
    kn_group = {
        "id": "kn",
        "title": "Khuddakanikāya",
        "pali_title": "Khuddakanikāya",
        "description": "Minor Collection (15+ Books)",
        "books": []
    }

    kn_data = [
        ("18Kh", "Khuddakapāṭha", "18Kh.md", "sutta/kn/khp.md", "sutta/kn/kn-khp.md", "mula/sutta/kn/s0501m.mul.md", "sutta/kn/vol25.md"),
        ("18Dh", "Dhammapada", "18Dh.md", "sutta/kn/dhp.md", "sutta/kn/kn-dhp.md", "mula/sutta/kn/s0501m.mul.md", "sutta/kn/vol25.md"),
        ("18Ud", "Udāna", "18Ud.md", "sutta/kn/ud.md", "sutta/kn/kn-ud.md", "mula/sutta/kn/s0501m.mul.md", "sutta/kn/vol25.md"),
        ("18It", "Itivuttaka", "18It.md", "sutta/kn/iti.md", "sutta/kn/kn-iti.md", "mula/sutta/kn/s0501m.mul.md", "sutta/kn/vol25.md"),
        ("18Sn", "Suttanipāta", "18Sn.md", "sutta/kn/snp.md", "sutta/kn/kn-snp.md", "mula/sutta/kn/s0501m.mul.md", "sutta/kn/vol25.md"),
        ("19Vv", "Vimānavatthu", "19Vv.md", "sutta/kn/vv.md", "sutta/kn/kn-vv.md", "mula/sutta/kn/s0502m.mul.md", "sutta/kn/vol26.md"),
        ("19Pv", "Petavatthu", "19Pv.md", "sutta/kn/pv.md", "sutta/kn/kn-pv.md", "mula/sutta/kn/s0502m.mul.md", "sutta/kn/vol26.md"),
        ("19Th1", "Theragāthā", "19Th1.md", "sutta/kn/thag.md", "sutta/kn/kn-thag.md", "mula/sutta/kn/s0502m.mul.md", "sutta/kn/vol26.md"),
        ("19Th2", "Therīgāthā", "19Th2.md", "sutta/kn/thig.md", "sutta/kn/kn-thig.md", "mula/sutta/kn/s0502m.mul.md", "sutta/kn/vol26.md"),
        ("20J", "Jātaka Vol. 1", "20J.md", "sutta/kn/jat01.md", "sutta/kn/kn-jat-1.md", "mula/sutta/kn/s0503m.mul.md", "sutta/kn/vol27.md"),
        ("21J", "Jātaka Vol. 2", "21J.md", "sutta/kn/jat02.md", "sutta/kn/kn-jat-2.md", "mula/sutta/kn/s0504m.mul.md", "sutta/kn/vol28.md"),
        ("22J", "Jātaka Vol. 3", "22J.md", "sutta/kn/jat03.md", "sutta/kn/kn-jat-3.md", "mula/sutta/kn/s0505m.mul.md", "sutta/kn/vol28.md"),
        ("23J", "Jātaka Vol. 4", "23J.md", "sutta/kn/jat04.md", "sutta/kn/kn-jat-4.md", "mula/sutta/kn/s0506m.mul.md", "sutta/kn/vol28.md"),
        ("24J", "Jātaka Vol. 5", "24J.md", "sutta/kn/jat05.md", "sutta/kn/kn-jat-5.md", "mula/sutta/kn/s0507m.mul.md", "sutta/kn/vol28.md"),
        ("25J", "Jātaka Vol. 6", "25J.md", "sutta/kn/jat06.md", "sutta/kn/kn-jat-6.md", "mula/sutta/kn/s0508m.mul.md", "sutta/kn/vol28.md"),
        ("26N1", "Mahāniddesa", "26N1.md", "sutta/kn/mnd.md", "sutta/kn/kn-mnd.md", "mula/sutta/kn/s0509m.mul.md", "sutta/kn/vol29.md"),
        ("27N2", "Cūḷaniddesa", "27N2.md", "sutta/kn/cnd.md", "sutta/kn/kn-cnd.md", "mula/sutta/kn/s0510m.mul.md", "sutta/kn/vol30.md"),
        ("28P", "Paṭisambhidāmagga 1", "28P.md", "sutta/kn/ps01.md", "sutta/kn/kn-ps-1.md", "mula/sutta/kn/s0511m.mul.md", "sutta/kn/vol31.md"),
        ("29P", "Paṭisambhidāmagga 2", "29P.md", "sutta/kn/ps02.md", "sutta/kn/kn-ps-2.md", "mula/sutta/kn/s0512m.mul.md", "sutta/kn/vol31.md"),
        ("30A", "Apadāna 1", "30A.md", "sutta/kn/ap.md", "sutta/kn/kn-ap-1.md", "mula/sutta/kn/s0513m.mul.md", "sutta/kn/vol32.md"),
        ("31A", "Apadāna 2", "31A.md", "sutta/kn/ap.md", "sutta/kn/kn-ap-2.md", "mula/sutta/kn/s0514m.mul.md", "sutta/kn/vol33.md"),
        ("32Bv", "Buddhavaṃsa", "32Bv.md", "sutta/kn/bv.md", "sutta/kn/kn-bv.md", "mula/sutta/kn/s0515m.mul.md", "sutta/kn/vol33.md"),
        ("33Cp", "Cariyāpiṭaka", "33Cp.md", "sutta/kn/cp.md", "sutta/kn/kn-cp.md", "mula/sutta/kn/s0516m.mul.md", "sutta/kn/vol33.md"),
    ]

    for bcode, btitle, t2500_file, pts_file, bjt_file, cst_file, sr_file in kn_data:
        b_entry = {
            "code": bcode,
            "title": btitle,
            "pali_title": btitle,
            "nikaya": "Khuddakanikāya",
            "pitaka": "Suttantapiṭaka",
            "editions": {
                "tipitaka2500": f"tipitaka/{t2500_file}",
                "pts": pts_file,
                "bjt": bjt_file,
                "cst": cst_file,
                "siam-rath": sr_file
            }
        }
        kn_group["books"].append(b_entry)

    catalog["structure"].append(kn_group)

    # ==================== 7. ABHIDHAMMAPIṬAKA ====================
    abh_group = {
        "id": "abhidhamma",
        "title": "Abhidhammapiṭaka",
        "pali_title": "Abhidhammapiṭaka",
        "description": "Higher Teachings (7 Treatises)",
        "books": []
    }

    abh_data = [
        ("34Dh", "Dhammasaṅgaṇī", "34Dh.md", "abhidhamma/dhs.md", "abhidhamma/ap-ds.md", "mula/abhidhamma/abh01m.mul.md", "abhidhamma/vol34.md"),
        ("35Vb", "Vibhaṅga", "35Vb.md", "abhidhamma/vbh01.md", "abhidhamma/ap-vb.md", "mula/abhidhamma/abh02m.mul.md", "abhidhamma/vol35.md"),
        ("36Dh", "Dhātukathā", "36Dh.md", "abhidhamma/dhk.md", "abhidhamma/ap-dt.md", "mula/abhidhamma/abh03m.mul.md", "abhidhamma/vol36.md"),
        ("36Pu", "Puggalapaññatti", "36Pu.md", "abhidhamma/pug.md", "abhidhamma/ap-pp.md", "mula/abhidhamma/abh03m.mul.md", "abhidhamma/vol36.md"),
        ("37K", "Kathāvatthu", "37K.md", "abhidhamma/kvu.md", "abhidhamma/ap-kv.md", "mula/abhidhamma/abh04m.mul.md", "abhidhamma/vol37.md"),
        ("38Y1", "Yamaka 1", "38Y1.md", "abhidhamma/yam01.md", "abhidhamma/ap-ym-1.md", "mula/abhidhamma/abh05m.mul.md", "abhidhamma/vol38.md"),
        ("38Y2", "Yamaka 2", "38Y2.md", "abhidhamma/yam02.md", "abhidhamma/ap-ym-2.md", "mula/abhidhamma/abh06m.mul.md", "abhidhamma/vol39.md"),
        ("39P1", "Paṭṭhāna 1 (Tikapaṭṭhāna)", "39P1.md", "abhidhamma/pat-tika1.md", "abhidhamma/ap-pt-1.md", "mula/abhidhamma/abh07m.mul.md", "abhidhamma/vol40.md"),
        ("39P2", "Paṭṭhāna 2 (Dukapaṭṭhāna)", "39P2.md", "abhidhamma/pat-duka.md", "abhidhamma/ap-pt-2.md", "mula/abhidhamma/abh08m.mul.md", "abhidhamma/vol41.md"),
        ("40P3", "Paṭṭhāna 3", "40P3.md", "abhidhamma/pat-tika2.md", "abhidhamma/ap-pt-3.md", "mula/abhidhamma/abh09m.mul.md", "abhidhamma/vol42.md"),
        ("40P4", "Paṭṭhāna 4", "40P4.md", "abhidhamma/pat-tika3.md", "abhidhamma/ap-pt-4.md", "mula/abhidhamma/abh10m.mul.md", "abhidhamma/vol43.md"),
        ("40P5", "Paṭṭhāna 5", "40P5.md", "abhidhamma/pat-tika3.md", "abhidhamma/ap-pt-5.md", "mula/abhidhamma/abh11m.mul.md", "abhidhamma/vol44.md"),
        ("40P6", "Paṭṭhāna 6", "40P6.md", "abhidhamma/pat-tika3.md", "abhidhamma/ap-pt-6.md", "mula/abhidhamma/abh12m.mul.md", "abhidhamma/vol45.md"),
    ]

    for bcode, btitle, t2500_file, pts_file, bjt_file, cst_file, sr_file in abh_data:
        b_entry = {
            "code": bcode,
            "title": btitle,
            "pali_title": btitle,
            "pitaka": "Abhidhammapiṭaka",
            "editions": {
                "tipitaka2500": f"tipitaka/{t2500_file}",
                "pts": pts_file,
                "bjt": bjt_file,
                "cst": cst_file,
                "siam-rath": sr_file
            }
        }
        abh_group["books"].append(b_entry)

    catalog["structure"].append(abh_group)

    # ==================== 8. COMMENTARIES & PARACANONICAL ====================
    extra_group = {
        "id": "commentaries",
        "title": "Aṭṭhakathā & Paracanonical",
        "pali_title": "Aṭṭhakathā",
        "description": "Post-Canonical Commentaries and Treatises",
        "books": [
            {
                "code": "Mil",
                "title": "Milindapañha",
                "pali_title": "Milindapañha",
                "editions": {
                    "pts": "paracanonical/milindapanha.md",
                    "cst": "mula/sutta/kn/s0519m.mul.md"
                }
            },
            {
                "code": "Vm",
                "title": "Visuddhimagga",
                "pali_title": "Visuddhimagga",
                "editions": {
                    "pts": "commentary/visuddhimagga.md",
                    "bjt": "anya/anya-vm.md",
                    "cst": "mula/anya/anya01m.mul.md"
                }
            },
            {
                "code": "Smp",
                "title": "Samantapāsādikā (Vinaya Commentary)",
                "pali_title": "Samantapāsādikā",
                "editions": {
                    "pts": "commentary/samantapasadika-01.md",
                    "bjt": "atthakatha/vinaya/atta-vp-prj.md",
                    "cst": "atthakatha/vinaya/vin01a.att.md"
                }
            },
            {
                "code": "Mhv",
                "title": "Mahāvaṃsa (Great Chronicle)",
                "pali_title": "Mahāvaṃsa",
                "editions": {
                    "pts": "chronicles/mahavamsa.md"
                }
            },
            {
                "code": "Kacc",
                "title": "Kaccāyanavyākaraṇa (Pāḷi Grammar)",
                "pali_title": "Kaccāyana",
                "editions": {
                    "pts": "treatises/grammar/kaccayana-01.md"
                }
            }
        ]
    }
    catalog["structure"].append(extra_group)

    out_file = os.path.expanduser('~/Repositories/Pali/tipitaka-md.github.io/catalog.json')
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, indent=2, ensure_ascii=False)

    print(f"Catalog successfully built at {out_file}.")

if __name__ == '__main__':
    build_catalog()
