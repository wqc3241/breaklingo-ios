import type { ConversationMessage } from './types';

/**
 * Converts internal message format to the edge function format.
 * Internal: { role: 'assistant' | 'user', content: string }
 * Edge function: { role: 'ai' | 'user', text: string }
 */
export const convertMessagesToEdgeFormat = (messages: ConversationMessage[]) =>
  messages.map((m) => ({
    role: m.role === 'assistant' ? 'ai' : m.role,
    text: m.content,
  }));
