import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VocabularyItem {
  word: string;
  definition: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface GrammarItem {
  rule: string;
  example: string;
  explanation: string;
}

interface AnalysisResult {
  vocabulary: VocabularyItem[];
  grammar: GrammarItem[];
  detectedLanguage: string;
}

// Split transcript into chunks at sentence boundaries
function splitIntoChunks(text: string, maxChunkSize: number = 6000): string[] {
  if (text.length <= maxChunkSize) return [text];

  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + maxChunkSize, text.length);
    // Don't split mid-sentence — find the last sentence boundary
    if (end < text.length) {
      const searchRegion = text.slice(start, end);
      const lastJaPeriod = searchRegion.lastIndexOf('。');
      const lastDot = searchRegion.lastIndexOf('. ');
      const lastNewline = searchRegion.lastIndexOf('\n');
      const boundary = Math.max(lastJaPeriod, lastDot, lastNewline);
      if (boundary > maxChunkSize * 0.5) {
        end = start + boundary + 1;
      }
    }
    chunks.push(text.slice(start, end));
    start = end;
  }
  return chunks;
}

// Filter out junk vocabulary items (AI hallucinations, meta-explanations)
function sanitizeVocabulary(items: VocabularyItem[]): VocabularyItem[] {
  return items.filter(item => {
    if (!item.word || !item.definition) return false;
    // Word too long — likely AI reasoning leaked into the field
    if (item.word.length > 30) return false;
    // Definition too long — likely an explanation, not a definition
    if (item.definition.length > 300) return false;
    // Word contains meta-language patterns
    const junkPatterns = /顺利|结束|完毕|note:|this text|above|analysis|以上|确认|涵盖|满足/i;
    if (junkPatterns.test(item.word)) return false;
    return true;
  });
}

// Filter out junk grammar items
function sanitizeGrammar(items: GrammarItem[]): GrammarItem[] {
  return items.filter(item => {
    if (!item.rule || !item.explanation) return false;
    if (item.rule.length > 60) return false;
    if (item.explanation.length > 500) return false;
    const junkPatterns = /顺利|结束|完毕|note:|this text|above|analysis|以上|确认|涵盖|满足/i;
    if (junkPatterns.test(item.rule)) return false;
    return true;
  });
}

// Deduplicate vocabulary by word (case-insensitive)
function deduplicateVocabulary(items: VocabularyItem[]): VocabularyItem[] {
  const seen = new Map<string, VocabularyItem>();
  for (const item of items) {
    const key = item.word.toLowerCase();
    if (!seen.has(key)) seen.set(key, item);
  }
  return Array.from(seen.values());
}

// Deduplicate grammar by rule (case-insensitive)
function deduplicateGrammar(items: GrammarItem[]): GrammarItem[] {
  const seen = new Map<string, GrammarItem>();
  for (const item of items) {
    const key = item.rule.toLowerCase();
    if (!seen.has(key)) seen.set(key, item);
  }
  return Array.from(seen.values());
}

const systemPrompt = `You are a language learning assistant. Analyze the provided text and extract all vocabulary words and grammar patterns for a language learner.

INSTRUCTIONS:
1. **Comprehensive extraction**: Go through the text sentence by sentence. Extract all distinct vocabulary words and grammar patterns. A typical passage should yield 25-50 vocabulary items and 8-15 grammar rules.
2. **Vocabulary**: Include nouns, verbs (in dictionary form and conjugated forms), adjectives, adverbs, particles, counters, set phrases, and idiomatic expressions. Include words at all difficulty levels.
3. **Grammar**: Extract conjugation patterns, sentence structures, particle usage, tense forms, conditionals, honorific patterns, and connecting expressions.
4. **Reading**: For Japanese, include hiragana readings. For Chinese, include pinyin.
5. **Part of speech**: Label each vocabulary item (noun, verb, adjective, etc.).
6. **No duplicates**: Remove exact duplicate words. Keep words with different meanings.
7. **Language Detection**: Detect the language based on characters and context.
8. **Output only data**: Return ONLY vocabulary and grammar items via the function call. Do NOT include explanatory notes, commentary, or meta-text in any field.`;

const toolDefinition = {
  type: "function" as const,
  function: {
    name: "analyze_content",
    description: "Extract vocabulary, grammar, and detected language from text",
    parameters: {
      type: "object",
      properties: {
        detectedLanguage: {
          type: "string",
          description: "The detected language of the text (e.g., Japanese, Chinese, Korean)"
        },
        vocabulary: {
          type: "array",
          items: {
            type: "object",
            properties: {
              word: { type: "string", description: "The vocabulary word in the original language" },
              reading: { type: "string", description: "Pronunciation guide (hiragana for Japanese, pinyin for Chinese, romanization for Korean). Omit for languages that don't need it." },
              definition: { type: "string", description: "Clear definition in English" },
              partOfSpeech: { type: "string", description: "Part of speech (noun, verb, adjective, adverb, particle, etc.)" },
              difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"], description: "Difficulty level" }
            },
            required: ["word", "definition", "difficulty"],
            additionalProperties: false
          }
        },
        grammar: {
          type: "array",
          items: {
            type: "object",
            properties: {
              rule: { type: "string", description: "Grammar rule name in the original language" },
              example: { type: "string", description: "Example from the text in the original language" },
              explanation: { type: "string", description: "Clear explanation in English" }
            },
            required: ["rule", "example", "explanation"],
            additionalProperties: false
          }
        }
      },
      required: ["detectedLanguage", "vocabulary", "grammar"],
      additionalProperties: false
    }
  }
};

// Analyze a single chunk of text with the AI
async function analyzeChunk(
  chunkText: string,
  apiKey: string,
  chunkIndex: number,
  totalChunks: number
): Promise<AnalysisResult> {
  const chunkLabel = totalChunks > 1 ? ` (chunk ${chunkIndex + 1}/${totalChunks})` : '';
  console.log(`Analyzing content${chunkLabel}, text length: ${chunkText.length}`);

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze this text:\n${chunkText}` }
      ],
      tools: [toolDefinition],
      tool_choice: { type: "function", function: { name: "analyze_content" } }
    }),
  });

  // Handle rate limiting
  if (response.status === 429) {
    throw new Error('RATE_LIMIT');
  }

  if (response.status === 402) {
    throw new Error('CREDITS_EXHAUSTED');
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`AI Gateway error${chunkLabel}:`, response.status, errorText);
    throw new Error(`AI Gateway error: ${response.status}`);
  }

  const data = await response.json();

  // Parse tool call response
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall || toolCall.function.name !== 'analyze_content') {
    throw new Error('No valid tool call response from AI');
  }

  let result: AnalysisResult;
  try {
    result = JSON.parse(toolCall.function.arguments);
  } catch (parseError) {
    console.error(`Failed to parse AI response${chunkLabel}:`, toolCall.function.arguments);
    throw new Error('Failed to parse AI response');
  }

  // Validate and sanitize
  if (!result.vocabulary || !Array.isArray(result.vocabulary)) {
    result.vocabulary = [];
  }
  if (!result.grammar || !Array.isArray(result.grammar)) {
    result.grammar = [];
  }
  if (!result.detectedLanguage) {
    result.detectedLanguage = 'Unknown';
  }

  console.log(`Chunk${chunkLabel} result:`, {
    language: result.detectedLanguage,
    vocabCount: result.vocabulary.length,
    grammarCount: result.grammar.length
  });

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate input — increased max to 200,000 to support full transcripts
    const requestSchema = z.object({
      transcript: z.string().min(50, 'Transcript too short').max(200000, 'Transcript too long (max 200,000 characters)')
    });

    const { transcript } = requestSchema.parse(await req.json());

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Analyzing content, total transcript length:', transcript.length);

    // Split transcript into chunks for processing
    const SINGLE_CHUNK_THRESHOLD = 10000;
    let result: AnalysisResult;

    if (transcript.length <= SINGLE_CHUNK_THRESHOLD) {
      // Short transcript — process as single chunk (original behavior)
      result = await analyzeChunk(transcript, LOVABLE_API_KEY, 0, 1);
      // Sanitize even single-chunk results
      result.vocabulary = sanitizeVocabulary(result.vocabulary);
      result.grammar = sanitizeGrammar(result.grammar);
    } else {
      // Long transcript — split into chunks, analyze each, merge results
      const chunks = splitIntoChunks(transcript);
      console.log(`Transcript split into ${chunks.length} chunks`);

      const allVocabulary: VocabularyItem[] = [];
      const allGrammar: GrammarItem[] = [];
      let detectedLanguage = 'Unknown';

      // Process chunks sequentially to respect rate limits
      for (let i = 0; i < chunks.length; i++) {
        try {
          const chunkResult = await analyzeChunk(chunks[i], LOVABLE_API_KEY, i, chunks.length);

          allVocabulary.push(...chunkResult.vocabulary);
          allGrammar.push(...chunkResult.grammar);

          // Use language from the first chunk (most reliable)
          if (i === 0) {
            detectedLanguage = chunkResult.detectedLanguage;
          }
        } catch (chunkError) {
          // Re-throw rate limit and credit errors immediately
          if (chunkError instanceof Error && (chunkError.message === 'RATE_LIMIT' || chunkError.message === 'CREDITS_EXHAUSTED')) {
            throw chunkError;
          }
          // For other errors, log and continue with remaining chunks
          console.error(`Failed to analyze chunk ${i + 1}/${chunks.length}:`, chunkError);
        }
      }

      // Sanitize then deduplicate merged results
      result = {
        vocabulary: deduplicateVocabulary(sanitizeVocabulary(allVocabulary)),
        grammar: deduplicateGrammar(sanitizeGrammar(allGrammar)),
        detectedLanguage,
      };
    }

    console.log('Analysis complete:', {
      language: result.detectedLanguage,
      vocabCount: result.vocabulary.length,
      grammarCount: result.grammar.length
    });

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    // Handle specific error types with appropriate status codes
    if (error instanceof Error) {
      if (error.message === 'RATE_LIMIT') {
        console.error('AI Gateway rate limit exceeded');
        return new Response(
          JSON.stringify({
            error: 'Rate limits exceeded, please try again later.',
            vocabulary: [],
            grammar: [],
            detectedLanguage: 'Unknown'
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (error.message === 'CREDITS_EXHAUSTED') {
        console.error('AI credits exhausted');
        return new Response(
          JSON.stringify({
            error: 'AI credits exhausted. Please add credits to your workspace.',
            vocabulary: [],
            grammar: [],
            detectedLanguage: 'Unknown'
          }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.error('Error in analyze-content function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        detectedLanguage: 'Unknown',
        vocabulary: [],
        grammar: []
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
