/**
 * Pali Script Transliterator (Client-side)
 * Supports bidirectional / direct transliteration between:
 * - Roman (IAST)
 * - Sinhala (සිංහල)
 * - Thai (ไทย)
 * - Burmese / Myanmar (မြန်မာ)
 * - Devanagari (देवनागरी)
 * - Brahmi (𑀩𑁆𑀭𑀸𑀳𑁆𑀫𑀻)
 */

const PALI_CHARS = {
  // Vowels independent
  vowels: [
    { iast: 'a',  si: 'අ', th: 'อ',  my: 'အ', de: 'अ', br: '𑀅' },
    { iast: 'ā',  si: 'ආ', th: 'อา', my: 'အာ', de: 'आ', br: '𑀆' },
    { iast: 'i',  si: 'ඉ', th: 'อิ', my: 'ဣ', de: 'इ', br: '𑀇' },
    { iast: 'ī',  si: 'ඊ', th: 'อี', my: 'ဤ', de: 'ई', br: '𑀈' },
    { iast: 'u',  si: 'උ', th: 'อุ', my: 'ဥ', de: 'उ', br: '𑀉' },
    { iast: 'ū',  si: 'ඌ', th: 'อู', my: 'ဦ', de: 'ऊ', br: '𑀊' },
    { iast: 'e',  si: 'එ', th: 'เอ', my: 'ဧ', de: 'ए', br: '𑀏' },
    { iast: 'o',  si: 'ඔ', th: 'โอ', my: 'ဩ', de: 'ओ', br: '𑀑' },
  ],
  // Vowel signs (matras)
  vowel_signs: [
    { iast: 'ā',  si: 'ා', th: 'า', my: 'ာ', de: 'ा', br: '𑀸' },
    { iast: 'i',  si: 'ි', th: 'ิ', my: 'ိ', de: 'ि', br: '𑀺' },
    { iast: 'ī',  si: 'ී', th: 'ี', my: 'ီ', de: 'ी', br: '𑀻' },
    { iast: 'u',  si: 'ු', th: 'ุ', my: 'ု', de: 'ु', br: '𑀼' },
    { iast: 'ū',  si: 'ූ', th: 'ู', my: 'ူ', de: 'ू', br: '𑀽' },
    { iast: 'e',  si: 'ෙ', th: 'เ', my: 'ေ', de: 'े', br: '𑁂', prefix_th: true },
    { iast: 'o',  si: 'ො', th: 'โ', my: 'ော', de: 'ो', br: '𑁄', prefix_th: true },
  ],
  // Consonants
  consonants: [
    { iast: 'kh', si: 'ඛ', th: 'ข', my: 'ခ', de: 'ख', br: '𑀔' },
    { iast: 'gh', si: 'ඝ', th: 'ฆ', my: 'ဃ', de: 'घ', br: '𑀖' },
    { iast: 'ch', si: 'ඡ', th: 'ฉ', my: 'ဆ', de: 'छ', br: '𑀙' },
    { iast: 'jh', si: 'ඣ', th: 'ฌ', my: 'ဈ', de: 'झ', br: '𑀛' },
    { iast: 'ṭh', si: 'ඨ', th: 'ฐ', my: 'ဌ', de: 'ठ', br: '𑀞' },
    { iast: 'ḍh', si: 'ඪ', th: 'ฒ', my: 'ဎ', de: 'ढ', br: '𑀠' },
    { iast: 'th', si: 'ථ', th: 'ถ', my: 'ထ', de: 'थ', br: '𑀣' },
    { iast: 'dh', si: 'ධ', th: 'ธ', my: 'ဓ', de: 'ध', br: '𑀥' },
    { iast: 'ph', si: 'ඵ', th: 'ผ', my: 'ဖ', de: 'फ', br: '𑀨' },
    { iast: 'bh', si: 'භ', th: 'ภ', my: 'ဘ', de: 'भ', br: '𑀪' },

    { iast: 'k',  si: 'ක', th: 'ก', my: 'က', de: 'क', br: '𑀓' },
    { iast: 'g',  si: 'ග', th: 'ค', my: 'ဂ', de: 'ग', br: '𑀕' },
    { iast: 'ṅ',  si: 'ඞ', th: 'ง', my: 'င', de: 'ङ', br: '𑀗' },
    { iast: 'c',  si: 'ච', th: 'จ', my: 'စ', de: 'च', br: '𑀘' },
    { iast: 'j',  si: 'ජ', th: 'ช', my: 'ဇ', de: 'ज', br: '𑀚' },
    { iast: 'ñ',  si: 'ඤ', th: 'ญ', my: 'ဉ', de: 'ञ', br: '𑀜' },
    { iast: 'ṭ',  si: 'ට', th: 'ฏ', my: 'ဋ', de: 'ट', br: '𑀝' },
    { iast: 'ḍ',  si: 'ඩ', th: 'ฑ', my: 'ဍ', de: 'ड', br: '𑀟' },
    { iast: 'ṇ',  si: 'ණ', th: 'ณ', my: 'ဏ', de: 'ण', br: '𑀡' },
    { iast: 't',  si: 'ත', th: 'ต', my: 'တ', de: 'त', br: '𑀢' },
    { iast: 'd',  si: 'ද', th: 'ท', my: 'ဒ', de: 'द', br: '𑀤' },
    { iast: 'n',  si: 'න', th: 'น', my: 'န', de: 'न', br: '𑀦' },
    { iast: 'p',  si: 'ප', th: 'ป', my: 'ပ', de: 'प', br: '𑀧' },
    { iast: 'b',  si: 'බ', th: 'พ', my: 'ဗ', de: 'ब', br: '𑀩' },
    { iast: 'm',  si: 'ම', th: 'ม', my: 'မ', de: 'म', br: '𑀫' },
    { iast: 'y',  si: 'ය', th: 'ย', my: 'ယ', de: 'य', br: '𑀬' },
    { iast: 'r',  si: 'ර', th: 'ร', my: 'ရ', de: 'र', br: '𑀭' },
    { iast: 'l',  si: 'ල', th: 'ล', my: 'လ', de: 'ल', br: '𑀮' },
    { iast: 'v',  si: 'ව', th: 'ว', my: 'ဝ', de: 'व', br: '𑀯' },
    { iast: 's',  si: 'ස', th: 'ส', my: 'သ', de: 'स', br: '𑀲' },
    { iast: 'h',  si: 'හ', th: 'ห', my: 'ဟ', de: 'ह', br: '𑀳' },
    { iast: 'ḷ',  si: 'ළ', th: 'ฬ', my: 'ဠ', de: 'ळ', br: '𑀴' },
  ],
  // Virama / Halant
  virama: {
    si: '්',
    th: 'ฺ', // Phinthu
    my: '်', // Asat
    de: '्',
    br: '𑁆'
  },
  // Niggahita / Anusvara
  niggahita: {
    iast: ['ṃ', 'ṁ'],
    si: 'ං',
    th: 'ํ',
    my: 'ံ',
    de: 'ं',
    br: '𑀁'
  }
};

/**
 * Transliterates IAST Pali text into target script.
 * @param {string} text - Input text in IAST
 * @param {string} targetScript - 'iast' | 'sinhala' | 'thai' | 'myanmar' | 'burmese' | 'devanagari' | 'brahmi'
 * @returns {string} Transliterated text
 */
export function transliteratePali(text, targetScript) {
  if (!text || targetScript === 'iast' || targetScript === 'roman') return text;

  const scriptKey = {
    sinhala: 'si',
    thai: 'th',
    myanmar: 'my',
    burmese: 'my',
    devanagari: 'de',
    brahmi: 'br'
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
  let result = protectedText.replace(/(<[^>]+>|&(?:#\d+|#x[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);|\[\^[^\]]+\]|__URL_\d+__|\*\*.*?\*\*|`.*?`|[a-zA-ZāīūṭḍṇḷñṅṃṁĀĪŪṬḌṆḶÑṄṂṀ]+)/g, (match) => {
    // If HTML tag, footnote reference, protected URL, or code, skip
    if (match.startsWith('<') || match.startsWith('&') || match.startsWith('[^') || match.startsWith('__URL_') || match.startsWith('`')) {
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

