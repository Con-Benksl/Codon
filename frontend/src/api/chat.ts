import { apiClient } from './client';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const sendChatMessage = async (message: string, context?: string): Promise<string> => {
  const response = await apiClient.post('/chat', { message, context });
  return response.data.reply;
};
