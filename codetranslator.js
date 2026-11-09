/*!
 * The Code Translator — binary and Morse code to text and back.
 * https://thecodetranslator.com
 * MIT License (c) 2026 Olive Heth
 *
 * Works in the browser (window.CodeTranslator) and in Node.js (require).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CodeTranslator = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---------- Binary ----------

  /**
   * Text -> 8-bit binary (UTF-8 bytes).
   * textToBinary('Hi') === '01001000 01101001'
   */
  function textToBinary(text, separator) {
    if (separator === undefined) separator = ' ';
    var bytes = new TextEncoder().encode(String(text));
    var out = [];
    for (var i = 0; i < bytes.length; i++) {
      out.push(bytes[i].toString(2).padStart(8, '0'));
    }
    return out.join(separator);
  }

  /**
   * Split a binary string into groups. Accepts groups separated by
   * spaces/commas/newlines, or one unbroken run of bits (split into 8s).
   */
  function binaryGroups(binary) {
    var s = String(binary).trim();
    if (s === '') return [];
    if (/[^01\s,]/.test(s)) {
      throw new Error('Binary may only contain 0, 1, spaces, commas and newlines.');
    }
    var groups = s.split(/[\s,]+/).filter(Boolean);
    if (groups.length === 1 && groups[0].length > 8) {
      var run = groups[0];
      var size = run.length % 8 === 0 ? 8 : run.length % 7 === 0 ? 7 : 0;
      if (!size) throw new Error('Unbroken binary must be a multiple of 8 (or 7) bits.');
      groups = run.match(new RegExp('.{' + size + '}', 'g'));
    }
    return groups;
  }

  /**
   * Work out which kind of binary this is: '8-bit', '7-bit' or 'utf-8'.
   * Returns null when it isn't valid binary.
   */
  function detectBinary(binary) {
    var groups;
    try { groups = binaryGroups(binary); } catch (e) { return null; }
    if (!groups.length) return null;
    if (groups.every(function (g) { return g.length === 7; })) return '7-bit';
    if (!groups.every(function (g) { return g.length === 8; })) return null;
    var anyHigh = groups.some(function (g) { return g[0] === '1'; });
    return anyHigh ? 'utf-8' : '8-bit';
  }

  /**
   * Binary -> text. Handles 7-bit ASCII, 8-bit ASCII and UTF-8.
   * binaryToText('01001000 01101001') === 'Hi'
   */
  function binaryToText(binary) {
    var groups = binaryGroups(binary);
    if (!groups.length) return '';
    var kind = detectBinary(binary);
    if (!kind) throw new Error('Every group must be 8 bits (or all 7 bits).');
    var bytes = new Uint8Array(groups.map(function (g) { return parseInt(g, 2); }));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  }

  // ---------- Morse (ITU) ----------

  var MORSE = {
    A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.',
    H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.',
    O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-',
    V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
    '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
    '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
    '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--',
    '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...',
    ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-',
    '"': '.-..-.', '$': '...-..-', '@': '.--.-.'
  };
  var FROM_MORSE = {};
  Object.keys(MORSE).forEach(function (k) { FROM_MORSE[MORSE[k]] = k; });

  /**
   * Text -> Morse. Letters are separated by a space, words by " / ".
   * Characters with no Morse code are skipped.
   * textToMorse('SOS') === '... --- ...'
   */
  function textToMorse(text) {
    return String(text).toUpperCase().trim().split(/\s+/).filter(Boolean)
      .map(function (word) {
        return word.split('').map(function (c) { return MORSE[c]; })
          .filter(Boolean).join(' ');
      })
      .filter(Boolean)
      .join(' / ');
  }

  /**
   * Morse -> text. Accepts "/" or "|" or 3+ spaces between words, and
   * the dot/dash look-alikes "·", "•", "–", "—", "_".
   * Unknown codes become the replacement character U+FFFD.
   * morseToText('... --- ...') === 'SOS'
   */
  function morseToText(morse) {
    var s = String(morse)
      .replace(/[·•]/g, '.')
      .replace(/[–—_−]/g, '-')
      .trim();
    if (s === '') return '';
    return s.split(/\s*[\/|]\s*|\s{3,}/).filter(Boolean)
      .map(function (word) {
        return word.trim().split(/\s+/).map(function (code) {
          return FROM_MORSE[code] || '�';
        }).join('');
      })
      .join(' ');
  }

  // ---------- Auto-detect ----------

  /** Guess what a piece of input is: 'binary', 'morse' or 'text'. */
  function detect(input) {
    var s = String(input).trim();
    if (s === '') return 'text';
    if (detectBinary(s)) return 'binary';
    if (/^[.\-·•–—_\s\/|]+$/.test(s) && /[.\-·•–—]/.test(s)) return 'morse';
    return 'text';
  }

  return {
    version: '1.0.0',
    textToBinary: textToBinary,
    binaryToText: binaryToText,
    detectBinary: detectBinary,
    textToMorse: textToMorse,
    morseToText: morseToText,
    detect: detect,
    MORSE: MORSE
  };
});
