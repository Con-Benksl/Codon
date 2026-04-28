import { apiClient } from './client';

export const sendChatMessage = async (
  message: string,
  context?: string,
): Promise<string> => {
  const response = await apiClient.post('/chat/', {
    message,
    context: context ?? null,
  });
  return String(response.data?.reply ?? '');
};
