import { NextResponse, type NextRequest } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

type ApiAuthUser = {
  id: string;
  email: string;
  name: string | null;
  username?: string | null;
};

export async function getApiAuthUser(req: NextRequest): Promise<ApiAuthUser | null> {
  const authorization = req.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return null;

  const response = await fetch(`${API_URL}/auth/me`, {
    headers: { authorization },
    cache: 'no-store',
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as { user?: ApiAuthUser };
  return payload.user || null;
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
