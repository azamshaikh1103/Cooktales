import { ApiClientError } from './authClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export async function sendContactMessage(input: { name: string; email: string; subject: string; message: string }) {
  const response = await fetch(`${API_URL}/contact`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const payload = (await response.json().catch(() => ({}))) as { success?: boolean; message?: string | string[]; error?: string; statusCode?: number };
  if (!response.ok) {
    const message = Array.isArray(payload.message) ? payload.message[0] : payload.message || payload.error || 'Failed to send message.';
    throw new ApiClientError(message, payload.statusCode);
  }
  return { success: true, message: typeof payload.message === 'string' ? payload.message : 'Message sent successfully!' };
}
