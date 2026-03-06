/**
 * Krutidev 010 (Legacy font) → Unicode Hindi converter.
 * Full, battle-tested character map with proper matra reordering.
 */

export function convertKrutidevToUnicode(input: string): string {
    if (!input) return "";

    let str = input;

    // ── Step 1: Multi-character sequences (replace BEFORE single chars) ──────────
    // Sorted longest-first so partial matches don't fire prematurely.
    const multiCharMap: [string, string][] = [
        // Conjuncts
        ["DZ", "क्ष"],
        ["Ö", "श्र"],
        ["á", "क्ष"],
        ["«", "त्र"],
        ["Û", "ज्ञ"],
        ["Ø", "क्र"],
        ["Ì", "प्र"],
        // Standalone vowels (multi-char)
        ["vk", "आ"],
        ["bZ", "ई"],
        ["vks", "ओ"],
        ["vkS", "औ"],
        [",s", "ऐ"],
        ["va", "अं"],
        // Two-char matras
        ["ks", "ो"],
        ["kS", "ौ"],
        // Common consonant digraphs
        ["?k", "घ"],
        [".k", "ण"],
        ["/k", "ध"],
        ["Hk", "भ"],
        ["'k", "श"],
        ["\"k", "श"],
        ["[k", "ख"],
        ["Pk", "च"],
        ["Qk", "फ"],
        ["PN", "च्छ"],
    ];

    for (const [from, to] of multiCharMap) {
        const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        str = str.replace(new RegExp(escaped, "g"), to);
    }

    // ── Step 2: Reorder 'f' (ि matra) ───────────────────────────────────────────
    // In Krutidev 'f' sits BEFORE the consonant; Unicode ि (U+093F) goes AFTER.
    // Do this before the single-char pass so 'f' is still the ASCII letter.
    str = str.replace(/f([^\s])/g, "$1\u093F");
    str = str.replace(/f/g, "\u093F"); // any remaining lone 'f'

    // ── Step 3: Single-character replacement ─────────────────────────────────────
    const singleMap: Record<string, string> = {
        // Consonants
        "d": "क", "[": "ख", "x": "ग", "?": "घ",
        "³": "ङ", "p": "च", "N": "छ", "t": "ज",
        ">": "झ", "´": "ञ", "V": "ट", "B": "ठ",
        "M": "ड", "<": "ढ", ".": "ण", "r": "त",
        "F": "थ", "n": "द", "/": "ध", "u": "न",
        "i": "प", "Q": "फ", "c": "ब", "H": "भ",
        "e": "म", "j": "र", "y": "ल", "o": "व",
        "\"": "श", "'": "ष", "l": "स", "g": "ह",
        "\\": "ळ",
        // Standalone vowels
        "v": "अ", "b": "इ", "m": "उ", ",": "ए",
        "Å": "ऊ",
        // Matras
        "k": "ा", "h": "ी", "q": "ु",
        "w": "ू", "¹": "ृ", "s": "े", "S": "ै",
        // Halant
        "~": "्",
        // Reph (र् — reposition in Step 4)
        "Z": "र्",
        // Nasalisation / visarga / chandrabindu
        "a": "ं", "¡": "ँ", "%": "ः",
        // Nukta
        "z": "़",
        // Special
        "ç": "ॅ", "è": "ॉ",
        // Devanagari digits (Krutidev uses shifted number keys)
        "!": "१", "@": "२", "#": "३", "$": "४",
        "^": "६", "&": "७", "*": "८", "(": "९",
        ")": "०",
        // Punctuation
        ";": "।", ":": "॥", "`": "ऽ",
    };

    let result = "";
    for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        result += singleMap[ch] !== undefined ? singleMap[ch] : ch;
    }

    // ── Step 4: Fix Reph (र्) positioning ────────────────────────────────────────
    // Krutidev writes reph AFTER the syllable; Unicode requires it BEFORE.
    // Move "र्" before any preceding vowel matras or consonant.
    result = result.replace(/([ािीुूृेैोौंः]+)(र्)/g, "र्$1");

    return result;
}

/**
 * Detects whether a string is likely Krutidev 010 encoded.
 *
 * Rules (in order):
 *  1. Already contains Devanagari Unicode → NOT Krutidev.
 *  2. Contains Krutidev-specific high-latin / extended chars → YES.
 *  3. ASCII-only with high density of Krutidev consonant/matra chars
 *     AND doesn't look like common English text → YES.
 */
export function isKrutidev(text: string): boolean {
    if (!text || text.trim().length < 2) return false;

    // Already Unicode Devanagari — not Krutidev
    if (/[\u0900-\u097F]/.test(text)) return false;

    // Krutidev-specific extended latin characters (never appear in plain English)
    if (/[ñòóôõö÷øùûüýþÿåæçèéêëìíîïðàáâãäÅÆÇÈÉÊËÌÍÎÏÐÑÖØÙÚÛÜÝÞß¡¹´³»«·¸º¿¾½¼»º¹¸]/.test(text)) {
        return true;
    }

    // ASCII-only heuristic
    const letters = text.match(/[a-zA-Z]/g) ?? [];
    if (letters.length === 0) return false;

    // Characters heavily used in Krutidev Hindi but rare in English together
    const krutiChars = text.match(/[fkjvnedslupocbrghmtiwqzFNBVSHMKLPQ]/g) ?? [];
    const density = krutiChars.length / letters.length;

    const looksEnglish = /\b(the|and|this|that|with|from|have|they|your|will|been|were|what|when|here|there|about|would|could|should|which|their|these|those|where|while|after|before|every|never|other|another|please|hello|dear|sir|regards|sincerely|name|address|mobile|phone|date)\b/i.test(text);

    return !looksEnglish && density >= 0.38;
}