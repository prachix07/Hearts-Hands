import fs from 'fs';
import path from 'path';
import { Request } from 'express';

const DATA_DIR = path.join(process.cwd(), 'data');
const OAUTH_FILE = path.join(DATA_DIR, 'oauth_config.json');

export const PROD_APP_URL = 'https://heart-hands.ai.studio';
export const DEV_APP_URL = 'https://ais-dev-zvmbdbekh3hlrbshon7wu5-781627567432.asia-southeast1.run.app';
export const SHARED_APP_URL = 'https://ais-pre-zvmbdbekh3hlrbshon7wu5-781627567432.asia-southeast1.run.app';

export const ALLOWED_ORIGINS = [
  'https://heart-hands.ai.studio',
  'https://ais-pre-zvmbdbekh3hlrbshon7wu5-781627567432.asia-southeast1.run.app',
  'https://ais-dev-zvmbdbekh3hlrbshon7wu5-781627567432.asia-southeast1.run.app',
  'http://localhost:3000',
];

export const ALLOWED_CALLBACK_URLS = [
  'https://heart-hands.ai.studio/auth/callback',
  'https://heart-hands.ai.studio/auth/callback/',
  'https://ais-pre-zvmbdbekh3hlrbshon7wu5-781627567432.asia-southeast1.run.app/auth/callback',
  'https://ais-pre-zvmbdbekh3hlrbshon7wu5-781627567432.asia-southeast1.run.app/auth/callback/',
  'https://ais-dev-zvmbdbekh3hlrbshon7wu5-781627567432.asia-southeast1.run.app/auth/callback',
  'https://ais-dev-zvmbdbekh3hlrbshon7wu5-781627567432.asia-southeast1.run.app/auth/callback/',
  'http://localhost:3000/auth/callback',
  'http://localhost:3000/auth/callback/',
];

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
}

export function loadOAuthConfig(): OAuthConfig {
  let clientId = process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID || '';
  let clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.CLIENT_SECRET || '';

  if ((!clientId || !clientSecret) && fs.existsSync(OAUTH_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(OAUTH_FILE, 'utf-8'));
      if (!clientId && data.clientId) clientId = data.clientId;
      if (!clientSecret && data.clientSecret) clientSecret = data.clientSecret;
    } catch (e) {
      console.error('Error reading oauth_config.json:', e);
    }
  }

  return { clientId, clientSecret };
}

export function saveOAuthConfig(config: Partial<OAuthConfig>) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const current = loadOAuthConfig();
    const updated = {
      clientId: config.clientId !== undefined ? config.clientId.trim() : current.clientId,
      clientSecret: config.clientSecret !== undefined ? config.clientSecret.trim() : current.clientSecret,
    };
    fs.writeFileSync(OAUTH_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    return updated;
  } catch (e) {
    console.error('Error saving oauth_config.json:', e);
    throw e;
  }
}

export function getRedirectUri(req?: Request, explicitUri?: string): string {
  // 1. If an explicit redirect URI is provided from the client or state
  if (explicitUri && typeof explicitUri === 'string') {
    const trimmed = explicitUri.trim();
    // Validate that it's an allowed callback path or recognized origin
    if (ALLOWED_CALLBACK_URLS.some(url => trimmed.startsWith(url.replace(/\/$/, '')))) {
      return trimmed.replace(/\/$/, '');
    }
    try {
      const u = new URL(trimmed);
      if (
        u.hostname.endsWith('ai.studio') ||
        u.hostname.endsWith('run.app') ||
        u.hostname === 'localhost'
      ) {
        return `${u.origin}/auth/callback`;
      }
    } catch {}
  }

  // 2. Check incoming request headers for production or preview origin
  if (req) {
    const origin = req.get('origin');
    if (origin && origin.startsWith('http')) {
      return `${origin.replace(/\/$/, '')}/auth/callback`;
    }

    const referer = req.get('referer');
    if (referer && referer.startsWith('http')) {
      try {
        const u = new URL(referer);
        return `${u.origin}/auth/callback`;
      } catch {}
    }

    const host = req.get('x-forwarded-host') || req.get('host');
    const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
    if (host && !host.includes('localhost')) {
      return `${proto}://${host}/auth/callback`;
    }
  }

  // 3. Fallback to configured APP_URL or default production URL
  const envUrl = process.env.APP_URL;
  if (envUrl && envUrl.startsWith('http')) {
    return `${envUrl.replace(/\/$/, '')}/auth/callback`;
  }

  return `${PROD_APP_URL}/auth/callback`;
}
