const BCP47_MAP: Record<string, string> = {
  Japanese: 'ja-JP',
  Chinese: 'zh-CN',
  Korean: 'ko-KR',
  Spanish: 'es-ES',
  French: 'fr-FR',
  German: 'de-DE',
  Italian: 'it-IT',
  Portuguese: 'pt-BR',
  Russian: 'ru-RU',
  Arabic: 'ar-SA',
  Hindi: 'hi-IN',
  English: 'en-US',
};

export const languageToBCP47 = (language: string): string => {
  return BCP47_MAP[language] || 'en-US';
};

const STOP_PHRASES: Record<string, string[]> = {
  en: ['stop', 'end', 'quit', 'bye', 'goodbye', 'exit', "that's all", 'done', 'finish'],
  ja: ['終わり', 'おわり', 'やめ', 'ストップ', 'さようなら', 'バイバイ'],
  zh: ['结束', '停止', '再见', '拜拜', '不说了'],
  ko: ['끝', '그만', '멈춰', '안녕', '바이'],
  es: ['parar', 'detener', 'adiós', 'fin', 'terminar'],
  fr: ['arrêter', 'stop', 'au revoir', 'fin', 'terminer'],
  de: ['stop', 'ende', 'tschüss', 'aufhören', 'fertig'],
  it: ['stop', 'fine', 'ciao', 'basta', 'finire'],
  pt: ['parar', 'fim', 'tchau', 'adeus', 'terminar'],
  ru: ['стоп', 'конец', 'пока', 'до свидания', 'хватит'],
  ar: ['توقف', 'نهاية', 'مع السلامة', 'وداعا'],
  hi: ['रुको', 'बंद', 'अलविदा', 'बस', 'खत्म'],
};

export const isStopPhrase = (text: string): boolean => {
  const normalized = text.toLowerCase().trim();
  return Object.values(STOP_PHRASES).some((phrases) =>
    phrases.some((phrase) => normalized === phrase.toLowerCase())
  );
};
