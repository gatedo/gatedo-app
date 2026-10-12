import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as crypto from 'crypto';
import { MercadoLivreService, ML_REDIRECT_URI } from './mercadolivre.service';

function fakePrisma() {
  const store = new Map<string, string>();
  return {
    store,
    appSettings: {
      findUnique: vi.fn(async ({ where }: any) => (store.has(where.key) ? { key: where.key, value: store.get(where.key) } : null)),
      upsert: vi.fn(async ({ where, update }: any) => store.set(where.key, update.value)),
      delete: vi.fn(async ({ where }: any) => store.delete(where.key)),
    },
  } as any;
}

describe('MercadoLivreService OAuth', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    process.env.ML_CLIENT_ID = 'cid';
    process.env.ML_CLIENT_SECRET = 'csecret';
    delete process.env.ML_REFRESH_TOKEN;
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('URL de autorização com redirect, state e PKCE S256', async () => {
    const prisma = fakePrisma();
    const url = new URL(await new MercadoLivreService(prisma).authorizationUrl());
    expect(url.origin + url.pathname).toBe('https://auth.mercadolivre.com.br/authorization');
    expect(url.searchParams.get('redirect_uri')).toBe(ML_REDIRECT_URI);
    expect(url.searchParams.get('client_id')).toBe('cid');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    const saved = JSON.parse(prisma.store.get('ml_oauth_pending_state'));
    expect(saved.state).toBe(url.searchParams.get('state'));
    const challenge = crypto.createHash('sha256').update(saved.verifier).digest('base64url');
    expect(url.searchParams.get('code_challenge')).toBe(challenge);
  });

  it('callback troca o code e salva o refresh token; state vale uma vez', async () => {
    const prisma = fakePrisma();
    const svc = new MercadoLivreService(prisma);
    const state = new URL(await svc.authorizationUrl()).searchParams.get('state')!;
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'at', refresh_token: 'rt1', expires_in: 21600 }) });

    await svc.handleCallback('CODE', state);
    const body = new URLSearchParams(fetchMock.mock.calls[0][1].body);
    expect(body.get('grant_type')).toBe('authorization_code');
    expect(body.get('code')).toBe('CODE');
    expect(body.get('code_verifier')).toBeTruthy();
    expect(prisma.store.get('ml_oauth_refresh_token')).toBe('rt1');
    expect(await svc.isConnected()).toBe(true);

    await expect(svc.handleCallback('CODE', state)).rejects.toThrow(/expirada ou inválida/);
  });

  it('recusa state errado sem chamar o ML', async () => {
    const prisma = fakePrisma();
    const svc = new MercadoLivreService(prisma);
    await svc.authorizationUrl();
    await expect(svc.handleCallback('CODE', 'outro')).rejects.toThrow(/expirada ou inválida/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sem conta conectada, MLB só devolve o código', async () => {
    const svc = new MercadoLivreService(fakePrisma());
    expect(await svc.lookup('MLB123456789')).toEqual({ configured: false, id: 'MLB123456789', externalId: 'ml:MLB123456789' });
  });
});
