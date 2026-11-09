// Run with: node --test
const test = require('node:test');
const assert = require('node:assert/strict');
const ct = require('./codetranslator.js');

test('text to binary', () => {
  assert.equal(ct.textToBinary('Hi'), '01001000 01101001');
  assert.equal(ct.textToBinary('A', ''), '01000001');
  assert.equal(ct.textToBinary(''), '');
});

test('binary to text (8-bit)', () => {
  assert.equal(ct.binaryToText('01001000 01101001'), 'Hi');
  assert.equal(ct.binaryToText('0100100001101001'), 'Hi');
  assert.equal(ct.binaryToText('01001000,01101001\n'), 'Hi');
});

test('binary to text (7-bit)', () => {
  assert.equal(ct.binaryToText('1001000 1101001'), 'Hi');
  assert.equal(ct.detectBinary('1001000 1101001'), '7-bit');
});

test('UTF-8 round trip', () => {
  for (const s of ['café', 'ñ', '€5', 'こんにちは', '👋 hello']) {
    assert.equal(ct.binaryToText(ct.textToBinary(s)), s);
  }
  assert.equal(ct.detectBinary(ct.textToBinary('é')), 'utf-8');
  assert.equal(ct.detectBinary(ct.textToBinary('e')), '8-bit');
});

test('invalid binary throws', () => {
  assert.throws(() => ct.binaryToText('0100 2'));
  assert.throws(() => ct.binaryToText('0100100 01101001'));
  assert.throws(() => ct.binaryToText('11111111'));
});

test('text to Morse', () => {
  assert.equal(ct.textToMorse('SOS'), '... --- ...');
  assert.equal(ct.textToMorse('hello world'), '.... . .-.. .-.. --- / .-- --- .-. .-.. -..');
  assert.equal(ct.textToMorse('A#B'), '.- -...');
});

test('Morse to text', () => {
  assert.equal(ct.morseToText('... --- ...'), 'SOS');
  assert.equal(ct.morseToText('.... .. / - .... . .-. .'), 'HI THERE');
  assert.equal(ct.morseToText('....  ..   -.-.--'), 'HI !');
  assert.equal(ct.morseToText('··· ––– ···'), 'SOS');
  assert.equal(ct.morseToText('......'), '�');
});

test('Morse round trip', () => {
  const s = 'THE QUICK BROWN FOX 123?';
  assert.equal(ct.morseToText(ct.textToMorse(s)), s);
});

test('detect', () => {
  assert.equal(ct.detect('01001000 01101001'), 'binary');
  assert.equal(ct.detect('... --- ...'), 'morse');
  assert.equal(ct.detect('hello'), 'text');
});
