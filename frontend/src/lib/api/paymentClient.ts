import { ApiClientError, authenticatedFetch } from './authClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
type ApiErrorPayload = { message?: string | string[]; error?: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await authenticatedFetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const payload = (await response.json().catch(() => ({}))) as T & ApiErrorPayload;
  if (!response.ok) {
    const message = Array.isArray(payload.message) ? payload.message[0] : payload.message || payload.error || 'Payments are unavailable right now.';
    throw new ApiClientError(message, response.status);
  }
  return payload;
}

export const paymentClient = {
  createCheckout(plan: 'monthly' | 'yearly' | 'lifetime') {
    return request<{ url: string }>('/payments/checkout', { method: 'POST', body: JSON.stringify({ plan }) });
  },
  billingPortal() { return request<{ url: string }>('/payments/billing-portal'); },
  membership() {
    return request<{ membership: { isPro: boolean; plan: string; planStatus: string; planEndsAt: string | null; subscriptionId: string | null } }>('/payments/membership');
  },
};
