import { languageToBCP47, isStopPhrase } from '../../src/lib/languageUtils';

describe('languageToBCP47', () => {
  it('maps Japanese correctly', () => {
    expect(languageToBCP47('Japanese')).toBe('ja-JP');
  });

  it('maps Chinese correctly', () => {
    expect(languageToBCP47('Chinese')).toBe('zh-CN');
  });

  it('maps Korean correctly', () => {
    expect(languageToBCP47('Korean')).toBe('ko-KR');
  });

  it('maps Spanish correctly', () => {
    expect(languageToBCP47('Spanish')).toBe('es-ES');
  });

  it('maps French correctly', () => {
    expect(languageToBCP47('French')).toBe('fr-FR');
  });

  it('maps German correctly', () => {
    expect(languageToBCP47('German')).toBe('de-DE');
  });

  it('maps Italian correctly', () => {
    expect(languageToBCP47('Italian')).toBe('it-IT');
  });

  it('maps Portuguese correctly', () => {
    expect(languageToBCP47('Portuguese')).toBe('pt-BR');
  });

  it('maps Russian correctly', () => {
    expect(languageToBCP47('Russian')).toBe('ru-RU');
  });

  it('maps Arabic correctly', () => {
    expect(languageToBCP47('Arabic')).toBe('ar-SA');
  });

  it('maps Hindi correctly', () => {
    expect(languageToBCP47('Hindi')).toBe('hi-IN');
  });

  it('maps English correctly', () => {
    expect(languageToBCP47('English')).toBe('en-US');
  });

  it('defaults to en-US for unknown languages', () => {
    expect(languageToBCP47('Klingon')).toBe('en-US');
    expect(languageToBCP47('')).toBe('en-US');
  });
});

describe('isStopPhrase', () => {
  it('detects English stop phrases', () => {
    expect(isStopPhrase('stop')).toBe(true);
    expect(isStopPhrase('bye')).toBe(true);
    expect(isStopPhrase('goodbye')).toBe(true);
    expect(isStopPhrase('quit')).toBe(true);
    expect(isStopPhrase('exit')).toBe(true);
    expect(isStopPhrase('done')).toBe(true);
    expect(isStopPhrase('finish')).toBe(true);
  });

  it('is case insensitive', () => {
    expect(isStopPhrase('STOP')).toBe(true);
    expect(isStopPhrase('Stop')).toBe(true);
    expect(isStopPhrase('BYE')).toBe(true);
  });

  it('trims whitespace', () => {
    expect(isStopPhrase('  stop  ')).toBe(true);
    expect(isStopPhrase('\tbye\n')).toBe(true);
  });

  it('detects Japanese stop phrases', () => {
    expect(isStopPhrase('終わり')).toBe(true);
    expect(isStopPhrase('さようなら')).toBe(true);
  });

  it('detects Chinese stop phrases', () => {
    expect(isStopPhrase('结束')).toBe(true);
    expect(isStopPhrase('再见')).toBe(true);
  });

  it('detects Korean stop phrases', () => {
    expect(isStopPhrase('끝')).toBe(true);
    expect(isStopPhrase('안녕')).toBe(true);
  });

  it('detects Spanish stop phrases', () => {
    expect(isStopPhrase('adiós')).toBe(true);
    expect(isStopPhrase('parar')).toBe(true);
  });

  it('returns false for non-stop phrases', () => {
    expect(isStopPhrase('hello')).toBe(false);
    expect(isStopPhrase('how are you')).toBe(false);
    expect(isStopPhrase('')).toBe(false);
    expect(isStopPhrase('konnichiwa')).toBe(false);
  });
});
