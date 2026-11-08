/**
 * Pali Script Transliterator (Client-side)
 * Supports bidirectional / direct transliteration between:
 * - Roman (IAST)
 * - Sinhala (සිංහල)
 * - Thai (ไทย)
 * - Burmese / Myanmar (မြန်မာ)
 * - Devanagari (देवनागरी)
 */

const PALI_CHARS = {
  // Vowels independent
  vowels: [
    { iast: 'a',  si: 'අ', th: 'อ',  my: 'အ', de: 'अ' },
    { iast: 'ā',  si: 'ආ', th: 'อา', my: 'အာ', de: 'आ' },
    { iast: 'i',  si: 'ඉ', th: 'อิ', my: 'ဣ', de: 'इ' },
    { iast: 'ī',  si: 'ඊ', th: 'อี', my: 'ဤ', de: 'ई' },
    { iast: 'u',  si: 'උ', th: 'อุ', my: 'ဥ', de: 'उ' },
    { iast: 'ū',  si: 'ඌ', th: 'อู', my: 'ဦ', de: 'ऊ' },
    { iast: 'e',  si: 'එ', th: 'เอ', my: 'ဧ', de: 'ए' },
    { iast: 'o',  si: 'ඔ', th: 'โอ', my: 'ဩ', de: 'ओ' },
  ],
  // Vowel signs (matras)
  vowel_signs: [
    { iast: 'ā',  si: 'ා', th: 'า', my: 'ာ', de: 'ा' },
    { iast: 'i',  si: 'ි', th: 'ิ', my: 'ိ', de: 'ि' },
    { iast: 'ī',  si: 'ී', th: 'ี', my: 'ီ', de: 'ी' },
    { iast: 'u',  si: 'ු', th: 'ุ', my: 'ု', de: 'ु' },
    { iast: 'ū',  si: 'ූ', th: 'ู', my: 'ူ', de: 'ू' },
    { iast: 'e',  si: 'ෙ', th: 'เ', my: 'ေ', de: 'े', prefix_th: true },
    { iast: 'o',  si: 'ො', th: 'โ', my: 'ော', de: 'ो', prefix_th: true },
  ],
  // Consonants
  consonants: [
    { iast: 'kh', si: 'ඛ', th: 'ข', my: 'ခ', de: 'ख' },
    { iast: 'gh', si: 'ඝ', th: 'ฆ', my: 'ဃ', de: 'घ' },
    { iast: 'ch', si: 'ඡ', th: 'ฉ', my: 'ဆ', de: 'छ' },
    { iast: 'jh', si: 'ඣ', th: 'ฌ', my: 'ဈ', de: 'झ' },
    { iast: 'ṭh', si: 'ඨ', th: 'ฐ', my: 'ဌ', de: 'ठ' },
    { iast: 'ḍh', si: 'ඪ', th: 'ឍ', my: 'ဎ', de: 'ढ' },
    { iast: 'th', si: 'ථ', th: 'ถ', my: 'သ', de: 'थ' },
    { iast: 'dh', si: 'ධ', th: 'ธ', my: 'ဓ', de: 'ध' },
    { iast: 'ph', si: 'ඵ', th: 'ผ', my: 'ဖ', de: 'फ' },
    { iast: 'bh', si: 'භ', th: 'ภ', my: 'ဘ', de: 'भ' },

    { iast: 'k',  si: 'ක', th: 'ก', my: 'က', de: 'क' },
    { iast: 'g',  si: 'ග', th: 'ค', my: 'ဂ', de: 'ग' },
    { iast: 'ṅ',  si: 'ඞ', th: 'ง', my: 'င', de: 'ङ' },
    { iast: 'c',  si: 'ච', th: 'จ', my: 'စ', de: 'च' },
    { iast: 'j',  si: 'ජ', th: 'ช', my: 'ဇ', de: 'ज' },
    { iast: 'ñ',  si: 'ඤ', th: 'ญ', my: 'ဉ', de: 'ञ' },
    { iast: 'ṭ',  si: 'ට', th: 'ฏ', my: 'ဋ', de: 'ट' },
    { iast: 'ḍ',  si: 'ඩ', th: 'ฑ', my: 'ဍ', de: 'ड' },
    { iast: 'ṇ',  si: 'ණ', th: 'ณ', my: 'ဏ', de: 'ण' },
    { iast: 't',  si: 'ත', th: 'ต', my: 'တ', de: 'त' },
    { iast: 'd',  si: 'ද', th: 'ท', my: 'ဒ', de: 'द' },
    { iast: 'n',  si: 'න', th: 'น', my: 'န', de: 'न' },
    { iast: 'p',  si: 'ප', th: 'ป', my: 'ပ', de: 'प' },
    { iast: 'b',  si: 'බ', th: 'พ', my: 'ဗ', de: 'ब' },
    { iast: 'm',  si: 'ම', th: 'ม', my: 'မ', de: 'म' },
    { iast: 'y',  si: 'ය', th: 'ย', my: 'ယ', de: 'य' },
    { iast: 'r',  si: 'ර', th: 'ร', my: 'ရ', de: 'र' },
    { iast: 'l',  si: 'ල', th: 'ล', my: 'လ', de: 'ल' },
    { iast: 'v',  si: 'ව', th: 'ว', my: 'ဝ', de: 'व' },
    { iast: 's',  si: 'ස', th: 'ส', my: 'သ', de: 'स' },
    { iast: 'h',  si: 'හ', th: 'ห', my: 'ဟ', de: 'ह' },
    { iast: 'ḷ',  si: 'ළ', th: 'ฬ', my: 'ဠ', de: 'ळ' },
  ],
  // Virama / Halant
  virama: {
    si: '්',
    th: 'ฺ', // Phinthu
    my: '်', // Asat
    de: '्'
  },
  // Niggahita / Anusvara
  niggahita: {
    iast: ['ṃ', 'ṁ'],
    si: 'ං',
    th: 'ํ',
    my: 'ံ',
    de: 'ं'
  }
};

/**
 * Transliterates IAST Pali text into target script.
 * @param {string} text - Input text in IAST
 * @param {string} targetScript - 'iast' | 'sinhala' | 'thai' | 'myanmar' | 'devanagari'
 * @returns {string} Transliterated text
 */
export function transliteratePali(text, targetScript) {
  if (!text || targetScript === 'iast') return text;

  const scriptKey = {
    sinhala: 'si',
    thai: 'th',
    myanmar: 'my',
    devanagari: 'de'
  }[targetScript];

  if (!scriptKey) return text;

  const virama = PALI_CHARS.virama[scriptKey];
  const niggahita = PALI_CHARS.niggahita[scriptKey];

  // Protect markdown link URLs: keep the (url) target intact while allowing [text] to be transliterated
  const savedUrls = [];
  let protectedText = text.replace(/\]\(([^)]+)\)/g, (_, url) => {
    savedUrls.push(url);
    return `](__URL_${savedUrls.length - 1}__)`;
  });

  // Regex for Pali syllables: (Consonant)?(Vowel|Niggahita)?
  // Tokenize preserving case and markdown/HTML structures
  let result = protectedText.replace(/(<[^>]+>|\[\^[^\]]+\]|__URL_\d+__|\*\*.*?\*\*|`.*?`|[a-zA-ZāīūṭḍṇḷñṅṃṁĀĪŪṬḌṆḶÑṄṂṀ]+)/g, (match) => {
    // If HTML tag, footnote reference, protected URL, or code, skip
    if (match.startsWith('<') || match.startsWith('[^') || match.startsWith('__URL_') || match.startsWith('`')) {
      return match;
    }

    let word = match.toLowerCase();
    let res = '';
    let i = 0;

    while (i < word.length) {
        // 1. Check niggahita
        if (word[i] === 'ṃ' || word[i] === 'ṁ') {
            res += niggahita;
            i++;
            continue;
        }

        // 2. Check multi-char consonants (kh, gh, ch, jh, ṭh, ḍh, th, dh, ph, bh)
        let foundCons = null;
        let cLen = 0;
        if (i + 1 < word.length) {
            const two = word.slice(i, i + 2);
            foundCons = PALI_CHARS.consonants.find(c => c.iast === two);
            if (foundCons) cLen = 2;
        }
        if (!foundCons) {
            const one = word[i];
            foundCons = PALI_CHARS.consonants.find(c => c.iast === one);
            if (foundCons) cLen = 1;
        }

        if (foundCons) {
            i += cLen;
            const consChar = foundCons[scriptKey];

            // Lookahead for vowel
            let foundVowel = null;
            let vLen = 0;
            if (i < word.length) {
                const vChar = word[i];
                foundVowel = PALI_CHARS.vowel_signs.find(v => v.iast === vChar);
                if (foundVowel) vLen = 1;
                else if (vChar === 'a') {
                    // inherent 'a'
                    foundVowel = { inherent: true };
                    vLen = 1;
                }
            }

            if (!foundVowel) {
                // Consonant followed by consonant or end of word -> apply virama
                res += consChar + virama;
            } else if (foundVowel.inherent) {
                // Inherent 'a' -> consonant alone
                res += consChar;
                i += vLen;
            } else {
                // Vowel sign
                i += vLen;
                if (scriptKey === 'th' && foundVowel.prefix_th) {
                    res += foundVowel[scriptKey] + consChar;
                } else {
                    res += consChar + foundVowel[scriptKey];
                }
            }
            continue;
        }

        // 3. Independent vowel (beginning of word or after vowel)
        const vChar = word[i];
        const foundIndeVowel = PALI_CHARS.vowels.find(v => v.iast === vChar);
        if (foundIndeVowel) {
            res += foundIndeVowel[scriptKey];
            i++;
            continue;
        }

        // 4. Any other non-Pali character (e.g. hyphen, digits, punctuation)
        res += word[i];
        i++;
    }

    return res;
  });

  // Restore protected URLs
  if (savedUrls.length > 0) {
    result = result.replace(/__URL_(\d+)__/g, (_, idx) => savedUrls[parseInt(idx, 10)]);
  }

  return result;
}

if (typeof window !== 'undefined') {
  window.transliteratePali = transliteratePali;
}

