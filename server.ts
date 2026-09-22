import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { db, hashPassword, verifyPassword, UserRecord } from './server/db';
import {
  loadOAuthConfig,
  saveOAuthConfig,
  getRedirectUri,
  PROD_APP_URL,
  DEV_APP_URL,
  SHARED_APP_URL,
  ALLOWED_ORIGINS,
  ALLOWED_CALLBACK_URLS,
} from './server/oauth';

const app = express();
const PORT = 3000;

// High limits to comfortably support high-resolution handcrafted product photography
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Persistent directories for product and upload assets
const publicDir = path.join(process.cwd(), 'public');
const uploadsDir = path.join(publicDir, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const productsDir = path.join(publicDir, 'products');
if (!fs.existsSync(productsDir)) {
  fs.mkdirSync(productsDir, { recursive: true });
}

// Ensure dist/uploads exists if dist is already built
const distUploadsDir = path.join(process.cwd(), 'dist', 'uploads');
if (fs.existsSync(path.join(process.cwd(), 'dist')) && !fs.existsSync(distUploadsDir)) {
  fs.mkdirSync(distUploadsDir, { recursive: true });
}

// Serve public static assets with persistent URLs
app.use(express.static(publicDir));
app.use('/uploads', express.static(uploadsDir));
app.use('/products', express.static(productsDir));

// Fallback & alias for any legacy /src/assets/images paths (works in dev & prod)
app.use('/src/assets/images', express.static(productsDir));
app.use('/src/assets/images', express.static(publicDir));
if (fs.existsSync(path.join(process.cwd(), 'src', 'assets', 'images'))) {
  app.use('/src/assets/images', express.static(path.join(process.cwd(), 'src', 'assets', 'images')));
}

// Dedicated robust route handlers for /products/:filename and /uploads/:filename
app.get('/products/:filename', (req: Request, res: Response) => {
  const filename = path.basename(req.params.filename);
  const candidates = [
    path.join(productsDir, filename),
    path.join(process.cwd(), 'dist', 'products', filename),
    path.join(process.cwd(), 'src', 'assets', 'images', filename),
    path.join(publicDir, filename),
    path.join(process.cwd(), 'dist', filename),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) {
      return res.sendFile(c);
    }
  }
  return res.status(404).json({ error: 'Product image not found' });
});

app.get('/uploads/:filename', (req: Request, res: Response) => {
  const filename = path.basename(req.params.filename);
  const candidates = [
    path.join(uploadsDir, filename),
    path.join(process.cwd(), 'dist', 'uploads', filename),
    path.join(publicDir, 'uploads', filename),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) {
      return res.sendFile(c);
    }
  }
  return res.status(404).json({ error: 'Upload image not found' });
});

// Extend express Request to attach authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: UserRecord;
      sessionToken?: string;
    }
  }
}

// Authentication middleware
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authentication required. Please log in.' });
  }

  const token = authHeader.substring(7).trim();
  const session = db.getSession(token);
  if (!session) {
    return res.status(401).json({ success: false, error: 'Session expired or invalid. Please log in again.' });
  }

  const user = db.findUserById(session.userId);
  if (!user) {
    return res.status(401).json({ success: false, error: 'User account not found.' });
  }

  req.user = user;
  req.sessionToken = token;
  next();
}

function sanitizeUser(u: UserRecord) {
  return {
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    phoneNumber: u.phoneNumber,
    role: u.role,
    shopName: u.shopName,
    bio: u.bio,
    specialty: u.specialty,
    categories: u.categories || [],
    instagramId: u.instagramId,
    joinedDate: u.joinedDate,
    location: u.location,
    avatar: u.avatar,
    authProvider: u.authProvider || 'local',
    createdAt: u.createdAt,
  };
}

// ==========================================
// 1. AUTHENTICATION API ROUTES
// ==========================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Current User session lookup
app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({
    success: true,
    user: sanitizeUser(req.user!),
  });
});

// Signup
app.post('/api/auth/signup', (req, res) => {
  try {
    const { fullName, email, phoneNumber, password, role, shopName } = req.body;

    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      return res.status(400).json({ success: false, error: 'Full name is required.' });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
    }
    if (!phoneNumber || typeof phoneNumber !== 'string' || !phoneNumber.trim()) {
      return res.status(400).json({ success: false, error: 'Phone number is required.' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.findUserByIdentifier(cleanEmail);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists. Please log in.',
      });
    }

    const { hash, salt } = hashPassword(password);
    const userRole: 'customer' | 'artisan' = role === 'artisan' ? 'artisan' : 'customer';

    const newUser = db.createUser({
      fullName: fullName.trim(),
      email: cleanEmail,
      phoneNumber: phoneNumber.trim(),
      passwordHash: hash,
      salt,
      role: userRole,
      shopName: userRole === 'artisan' ? (shopName?.trim() || `${fullName.trim()}'s Atelier`) : undefined,
      bio: userRole === 'artisan' ? 'Handcrafting bespoke heirlooms with care.' : undefined,
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      location: 'India',
      avatar: userRole === 'artisan'
        ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    });

    const session = db.createSession(newUser.id);

    return res.status(201).json({
      success: true,
      user: sanitizeUser(newUser),
      token: session.token,
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create account. Please try again.' });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return res.status(400).json({ success: false, error: 'Please enter your registered email or phone number.' });
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ success: false, error: 'Please enter your password.' });
    }

    const user = db.findUserByIdentifier(identifier);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'No account found with this email or phone number. Please check your spelling or sign up.',
      });
    }

    const isMatch = verifyPassword(password, user.passwordHash, user.salt);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Incorrect password. Please try again or use Forgot Password.',
      });
    }

    const session = db.createSession(user.id);

    return res.json({
      success: true,
      user: sanitizeUser(user),
      token: session.token,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error during login.' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    db.deleteSession(token);
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

// Forgot Password Request
app.post('/api/auth/forgot-password', (req, res) => {
  const { identifier } = req.body;
  if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
    return res.status(400).json({ success: false, message: 'Please enter your email or phone number.' });
  }

  const user = db.findUserByIdentifier(identifier);
  // Generate code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  db.setResetCode(identifier, code);

  return res.json({
    success: true,
    message: `A verification code has been generated. Use code ${code} to reset your password.`,
    tempCode: code,
    userExists: Boolean(user),
  });
});

// Reset Password
app.post('/api/auth/reset-password', (req, res) => {
  const { identifier, newPassword, code } = req.body;

  if (!identifier || !newPassword || newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Valid identifier and new password of at least 6 characters required.',
    });
  }

  // Validate code if provided
  if (code && !db.verifyResetCode(identifier, code)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired verification code.',
    });
  }

  const user = db.findUserByIdentifier(identifier);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Account not found with this identifier.',
    });
  }

  const { hash, salt } = hashPassword(newPassword);
  db.updateUser(user.id, { passwordHash: hash, salt });
  db.clearResetCode(identifier);

  return res.json({
    success: true,
    message: 'Password updated successfully. You may now log in with your new password.',
  });
});

// Update Profile
app.put('/api/auth/profile', authMiddleware, (req, res) => {
  const { fullName, phoneNumber, bio, shopName, location, avatar, specialty, categories, instagramId } = req.body;
  const updates: Partial<UserRecord> = {};

  if (fullName && typeof fullName === 'string') updates.fullName = fullName.trim();
  if (phoneNumber && typeof phoneNumber === 'string') updates.phoneNumber = phoneNumber.trim();
  if (bio !== undefined) updates.bio = bio;
  if (shopName !== undefined) updates.shopName = shopName;
  if (location !== undefined) updates.location = location;
  if (avatar !== undefined) updates.avatar = avatar;
  if (specialty !== undefined) updates.specialty = specialty;
  if (categories !== undefined && Array.isArray(categories)) updates.categories = categories;
  if (instagramId !== undefined) updates.instagramId = instagramId;

  const updated = db.updateUser(req.user!.id, updates);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  res.json({ success: true, user: sanitizeUser(updated) });
});

// Update Artisan Profile (Dedicated endpoint)
app.put('/api/artisan/profile', authMiddleware, (req, res) => {
  if (req.user!.role !== 'artisan') {
    return res.status(403).json({ success: false, error: 'Artisan profile can only be edited by artisans.' });
  }

  const { fullName, phoneNumber, bio, shopName, location, avatar, specialty, categories, instagramId } = req.body;
  const updates: Partial<UserRecord> = {};

  if (fullName && typeof fullName === 'string') updates.fullName = fullName.trim();
  if (phoneNumber && typeof phoneNumber === 'string') updates.phoneNumber = phoneNumber.trim();
  if (bio !== undefined) updates.bio = bio;
  if (shopName !== undefined) updates.shopName = shopName;
  if (location !== undefined) updates.location = location;
  if (avatar !== undefined) updates.avatar = avatar;
  if (specialty !== undefined) updates.specialty = specialty;
  if (categories !== undefined && Array.isArray(categories)) updates.categories = categories;
  if (instagramId !== undefined) updates.instagramId = instagramId;

  const updated = db.updateUser(req.user!.id, updates);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Artisan account not found.' });
  }

  res.json({ success: true, user: sanitizeUser(updated) });
});

// ==========================================
// GOOGLE OAUTH 2.0 API ROUTES
// ==========================================

// Check Google OAuth Status & Configuration
app.get('/api/auth/google/status', (req, res) => {
  const config = loadOAuthConfig();
  const configured = Boolean(config.clientId && config.clientId.trim().length > 0);
  const clientRedirectUri = req.query.redirectUri as string;
  const currentRedirect = getRedirectUri(req, clientRedirectUri);

  res.json({
    configured,
    hasClientId: configured,
    hasClientSecret: Boolean(config.clientSecret && config.clientSecret.trim().length > 0),
    clientId: configured ? `${config.clientId.substring(0, 16)}...` : null,
    prodCallbackUrl: `${PROD_APP_URL}/auth/callback`,
    devCallbackUrl: `${DEV_APP_URL}/auth/callback`,
    sharedCallbackUrl: `${SHARED_APP_URL}/auth/callback`,
    currentCallbackUrl: currentRedirect,
    origins: ALLOWED_ORIGINS,
    allowedCallbackUrls: ALLOWED_CALLBACK_URLS,
  });
});

// Configure Google OAuth runtime credentials
app.post('/api/auth/google/configure', (req, res) => {
  const { clientId, clientSecret } = req.body;
  if (!clientId || typeof clientId !== 'string' || !clientId.trim()) {
    return res.status(400).json({ success: false, error: 'Valid Google Client ID is required.' });
  }

  try {
    saveOAuthConfig({ clientId, clientSecret });
    res.json({
      success: true,
      message: 'Google OAuth credentials updated successfully.',
      configured: true,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to save configuration.' });
  }
});

// Generate Google Authorization URL
app.get('/api/auth/google/url', (req, res) => {
  const config = loadOAuthConfig();
  const configured = Boolean(config.clientId && config.clientId.trim().length > 0);
  const clientRedirectUri = req.query.redirectUri as string;
  const redirectUri = getRedirectUri(req, clientRedirectUri);
  const role = (req.query.role as string) === 'artisan' ? 'artisan' : 'customer';

  if (!configured) {
    return res.json({
      configured: false,
      error: 'Google OAuth is not configured yet. Client ID is required to enable authentic Google sign-in.',
      prodCallbackUrl: `${PROD_APP_URL}/auth/callback`,
      sharedCallbackUrl: `${SHARED_APP_URL}/auth/callback`,
      devCallbackUrl: `${DEV_APP_URL}/auth/callback`,
      redirectUri,
      origins: ALLOWED_ORIGINS,
      allowedCallbackUrls: ALLOWED_CALLBACK_URLS,
    });
  }

  const statePayload = {
    role,
    redirectUri,
    nonce: Math.random().toString(36).substring(2, 10),
  };
  const state = Buffer.from(JSON.stringify(statePayload)).toString('base64');

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
    access_type: 'offline',
    state,
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  res.json({
    configured: true,
    url,
    redirectUri,
  });
});

// Verify Google Token (Implicit flow or Google Identity Services credential)
app.post('/api/auth/google/verify-token', async (req, res) => {
  try {
    const { accessToken, idToken, role } = req.body;
    if (!accessToken && !idToken) {
      return res.status(400).json({ success: false, error: 'Access token or ID token required.' });
    }

    let profile: { sub: string; email: string; name?: string; picture?: string } | null = null;

    if (accessToken) {
      const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!profileRes.ok) {
        return res.status(401).json({ success: false, error: 'Invalid Google access token.' });
      }
      profile = await profileRes.json();
    } else if (idToken) {
      const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
      if (!verifyRes.ok) {
        return res.status(401).json({ success: false, error: 'Invalid Google ID token.' });
      }
      profile = await verifyRes.json();
    }

    if (!profile || !profile.email) {
      return res.status(400).json({ success: false, error: 'Could not obtain email from Google user profile.' });
    }

    const email = profile.email.toLowerCase();
    const desiredRole: 'customer' | 'artisan' = role === 'artisan' ? 'artisan' : 'customer';

    let isNewUser = false;
    let user = db.findUserByGoogleId(profile.sub) || db.findUserByIdentifier(email);

    if (user) {
      db.updateUser(user.id, {
        googleId: profile.sub,
        authProvider: 'google',
        avatar: user.avatar || profile.picture,
      });
      user = db.findUserById(user.id)!;
    } else {
      isNewUser = true;
      user = db.createUser({
        fullName: profile.name || 'Google Patron',
        email,
        phoneNumber: '',
        passwordHash: '',
        salt: '',
        role: desiredRole,
        shopName: desiredRole === 'artisan' ? `${profile.name || 'Artisan'}'s Atelier` : undefined,
        bio: desiredRole === 'artisan' ? 'Handcrafting bespoke heirlooms with care.' : undefined,
        joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        location: 'India',
        avatar: profile.picture || (desiredRole === 'artisan'
          ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80'
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'),
        googleId: profile.sub,
        authProvider: 'google',
      });
    }

    const session = db.createSession(user.id);
    return res.json({
      success: true,
      user: sanitizeUser(user),
      token: session.token,
      isNewUser,
    });
  } catch (err: any) {
    console.error('Verify Google token error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Token verification failed.' });
  }
});

// OAuth Callback Route (Handles popup redirect from Google)
app.get(['/auth/callback', '/auth/callback/'], async (req, res) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    let errorMsg = String(error_description || error);
    if (error === 'access_denied') {
      errorMsg = 'Google sign-in was canceled by the user.';
    } else if (error === 'redirect_uri_mismatch') {
      errorMsg = `Google Redirect URI Mismatch: The OAuth callback URL registered in Google Cloud Console must include ${getRedirectUri(req)}.`;
    }

    return res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Authentication Canceled</title></head>
      <body style="font-family:sans-serif;text-align:center;padding:40px;background:#FFF9F5;color:#4A2C2C;">
        <h3>Google Authentication</h3>
        <p style="color:#8C6D6D;">${errorMsg}</p>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: ${JSON.stringify(errorMsg)}, errorCode: ${JSON.stringify(error)} }, '*');
            setTimeout(function() { window.close(); }, 800);
          } else {
            window.location.href = '/';
          }
        </script>
      </body>
      </html>
    `);
  }

  if (code) {
    try {
      const config = loadOAuthConfig();
      let originalRedirectUri = getRedirectUri(req);
      let desiredRole: 'customer' | 'artisan' = 'customer';

      if (state && typeof state === 'string') {
        try {
          const parsed = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
          if (parsed.role === 'artisan') desiredRole = 'artisan';
          if (parsed.redirectUri) originalRedirectUri = parsed.redirectUri;
        } catch {
          // ignore parsing error
        }
      }

      if (!config.clientSecret) {
        throw new Error('GOOGLE_CLIENT_SECRET is missing. Please set GOOGLE_CLIENT_SECRET in Settings to complete OAuth code exchange.');
      }

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: String(code),
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: originalRedirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok || !tokenData.access_token) {
        const detail = tokenData.error_description || tokenData.error || 'Failed to exchange authorization code with Google.';
        if (tokenData.error === 'redirect_uri_mismatch') {
          throw new Error(`Google Redirect URI Mismatch: Token exchange redirect_uri (${originalRedirectUri}) does not match Google Cloud Console registration.`);
        }
        throw new Error(detail);
      }

      const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      const profile = await profileResponse.json();
      if (!profile || !profile.email) {
        throw new Error('Could not retrieve email from Google user profile.');
      }

      const email = profile.email.toLowerCase();
      let isNewUser = false;
      let user = db.findUserByGoogleId(profile.sub) || db.findUserByIdentifier(email);

      if (user) {
        db.updateUser(user.id, {
          googleId: profile.sub,
          authProvider: 'google',
          avatar: user.avatar || profile.picture,
        });
        user = db.findUserById(user.id)!;
      } else {
        isNewUser = true;
        user = db.createUser({
          fullName: profile.name || 'Google Patron',
          email,
          phoneNumber: '',
          passwordHash: '',
          salt: '',
          role: desiredRole,
          shopName: desiredRole === 'artisan' ? `${profile.name || 'Artisan'}'s Atelier` : undefined,
          bio: desiredRole === 'artisan' ? 'Handcrafting bespoke heirlooms with care.' : undefined,
          joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          location: 'India',
          avatar: profile.picture || (desiredRole === 'artisan'
            ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80'
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'),
          googleId: profile.sub,
          authProvider: 'google',
        });
      }

      const session = db.createSession(user.id);
      const sanitized = sanitizeUser(user);

      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Heart &amp; Hands - Google Login</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #FFF9F5; color: #4A2C2C; }
            .box { background: white; padding: 32px 40px; border-radius: 16px; border: 1px solid #F2D7D9; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
          </style>
        </head>
        <body>
          <div class="box">
            <div style="font-size: 28px; margin-bottom: 8px;">✨</div>
            <h3 style="margin: 0 0 6px;">Welcome, ${user.fullName}</h3>
            <p style="color: #8C6D6D; margin: 0; font-size: 13px;">Securely connecting your Heart &amp; Hands account...</p>
          </div>
          <script>
            try {
              localStorage.setItem('hh_auth_token', ${JSON.stringify(session.token)});
              localStorage.setItem('hh_user_cache', ${JSON.stringify(JSON.stringify(sanitized))});
            } catch (e) {}

            if (window.opener) {
              window.opener.postMessage({
                type: 'GOOGLE_AUTH_SUCCESS',
                token: ${JSON.stringify(session.token)},
                user: ${JSON.stringify(sanitized)},
                isNewUser: ${isNewUser}
              }, '*');
              setTimeout(function() { window.close(); }, 350);
            } else {
              window.location.href = '${user.role === 'artisan' ? '/#artisan-dashboard' : '/#home'}';
            }
          </script>
        </body>
        </html>
      `);
    } catch (err: any) {
      console.error('Google callback error:', err);
      const msg = err.message || 'Failed to complete Google authentication.';
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Google Authentication Error</title></head>
        <body style="font-family:sans-serif;text-align:center;padding:40px;background:#FFF9F5;color:#4A2C2C;">
          <h3 style="color:#B91C1C;">Authentication Error</h3>
          <p style="color:#8C6D6D;">${msg}</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: ${JSON.stringify(msg)} }, '*');
              setTimeout(function() { window.close(); }, 1200);
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
        </html>
      `);
    }
  }

  // If no code, check hash in browser (implicit token popup)
  return res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>Heart & Hands - Authenticating</title></head>
    <body style="font-family:sans-serif;text-align:center;padding:40px;background:#FFF9F5;color:#4A2C2C;">
      <p>Completing authentication...</p>
      <script>
        try {
          var hash = window.location.hash.substring(1);
          var params = new URLSearchParams(hash);
          var accessToken = params.get('access_token');
          var idToken = params.get('id_token');
          var state = params.get('state');
          if ((accessToken || idToken) && window.opener) {
            window.opener.postMessage({
              type: 'GOOGLE_AUTH_TOKEN',
              accessToken: accessToken,
              idToken: idToken,
              state: state
            }, '*');
            setTimeout(function() { window.close(); }, 300);
          } else if (window.opener) {
            window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: 'No authorization code or token received.' }, '*');
            setTimeout(function() { window.close(); }, 800);
          } else {
            window.location.href = '/';
          }
        } catch(e) {
          console.error(e);
        }
      </script>
    </body>
    </html>
  `);
});

// ==========================================
// 2. CART API ROUTES (User-Specific & Persistent)
// ==========================================

// Get user's cart
app.get('/api/cart', authMiddleware, (req, res) => {
  const items = db.getCart(req.user!.id);
  res.json({ success: true, items });
});

// Add item to cart
app.post('/api/cart', authMiddleware, (req, res) => {
  const { product, customSelections, quantity } = req.body;
  if (!product || !product.id) {
    return res.status(400).json({ success: false, error: 'Product details required' });
  }

  const qty = Number(quantity) > 0 ? Number(quantity) : 1;
  const selections = customSelections || {};

  const items = db.addToCart(req.user!.id, product, selections, qty);
  res.json({ success: true, items });
});

// Update quantity
app.put('/api/cart/:cartItemId', authMiddleware, (req, res) => {
  const { cartItemId } = req.params;
  const { quantity } = req.body;
  const qty = Number(quantity);

  const items = db.updateCartItemQuantity(req.user!.id, cartItemId, qty);
  res.json({ success: true, items });
});

// Remove item
app.delete('/api/cart/:cartItemId', authMiddleware, (req, res) => {
  const { cartItemId } = req.params;
  const items = db.removeCartItem(req.user!.id, cartItemId);
  res.json({ success: true, items });
});

// Clear cart
app.delete('/api/cart', authMiddleware, (req, res) => {
  const items = db.clearCart(req.user!.id);
  res.json({ success: true, items });
});

// ==========================================
// 3. WISHLIST API ROUTES (User-Specific & Persistent)
// ==========================================

// Get user's wishlist
app.get('/api/wishlist', authMiddleware, (req, res) => {
  const wishlist = db.getWishlist(req.user!.id);
  res.json({ success: true, wishlist });
});

// Toggle wishlist item
app.post('/api/wishlist/toggle', authMiddleware, (req, res) => {
  const { productId } = req.body;
  if (!productId || typeof productId !== 'string') {
    return res.status(400).json({ success: false, error: 'Product ID required' });
  }

  const result = db.toggleWishlist(req.user!.id, productId);
  res.json({ success: true, wishlist: result.wishlist, isWishlisted: result.isWishlisted });
});

// Clear wishlist
app.delete('/api/wishlist', authMiddleware, (req, res) => {
  const wishlist = db.clearWishlist(req.user!.id);
  res.json({ success: true, wishlist });
});

// ==========================================
// 4. ORDERS API ROUTES
// ==========================================

// Get orders
app.get('/api/orders', authMiddleware, (req, res) => {
  const orders = db.getOrders(req.user!.id, req.user!.role);
  res.json({ success: true, orders });
});

// Create order
app.post('/api/orders', authMiddleware, (req, res) => {
  const { shippingAddress, contact, discount, items, subtotal, shippingFee, tax, total } = req.body;

  if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.street) {
    return res.status(400).json({ success: false, error: 'Complete shipping address is required.' });
  }

  const userCart = items && items.length > 0 ? items : db.getCart(req.user!.id);
  if (userCart.length === 0) {
    return res.status(400).json({ success: false, error: 'Cannot place order with empty cart.' });
  }

  const orderNumber = `HH-${Math.floor(1000 + Math.random() * 9000)}`;
  const newOrder = db.createOrder({
    id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    orderNumber,
    customerId: req.user!.id,
    customerName: contact?.name || shippingAddress.fullName || req.user!.fullName,
    customerEmail: contact?.email || req.user!.email,
    customerPhone: contact?.phone || req.user!.phoneNumber,
    shippingAddress,
    items: userCart,
    subtotal: Number(subtotal) || 0,
    discount: Number(discount) || 0,
    shippingFee: Number(shippingFee) || 0,
    tax: Number(tax) || 0,
    total: Number(total) || 0,
    status: 'Order Placed',
    createdAt: new Date().toISOString(),
    estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    timeline: [
      {
        status: 'Order Placed',
        date: new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
        note: 'Order placed by customer and routed to master artisans for crafting.',
      },
    ],
  });

  res.status(201).json({ success: true, order: newOrder });
});

// Update order status (Artisan only)
app.put('/api/orders/:orderId/status', authMiddleware, (req, res) => {
  if (req.user!.role !== 'artisan') {
    return res.status(403).json({ success: false, error: 'Only artisans can update order fulfillment status.' });
  }

  const { orderId } = req.params;
  const { status, note, tracking } = req.body;

  const updated = db.updateOrderStatus(orderId, status, note, tracking);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  res.json({ success: true, order: updated });
});

// ==========================================
// 5. PRODUCTS & ARTISAN API ROUTES
// ==========================================

// Public Products Catalog
app.get('/api/products', (req, res) => {
  const products = db.getProducts();
  res.json({ success: true, products });
});

// Artisan: Get My Products (Real DB)
app.get('/api/artisan/products', authMiddleware, (req, res) => {
  if (req.user!.role !== 'artisan') {
    return res.status(403).json({ success: false, error: 'Access restricted to registered artisans.' });
  }

  const products = db.getProductsByArtisan(req.user!.id);
  res.json({ success: true, products });
});

// Artisan: Add New Product
app.post('/api/artisan/products', authMiddleware, (req, res) => {
  if (req.user!.role !== 'artisan') {
    return res.status(403).json({ success: false, error: 'Access restricted to registered artisans.' });
  }

  const {
    title,
    description,
    category,
    subcategory,
    price,
    stockCount,
    image,
    images,
    material,
    sizeDimensions,
    shippingInfo,
    customOptions,
    craftTimeDays,
    badge,
    status,
  } = req.body;

  if (!title || !description || !price || !category) {
    return res.status(400).json({
      success: false,
      error: 'Product title, description, category, and price are required.',
    });
  }

  const stock = Number(stockCount) >= 0 ? Number(stockCount) : 10;
  const parsedPrice = Number(price) > 0 ? Number(price) : 500;
  const rawImageList = Array.isArray(images) && images.length > 0
    ? images
    : image ? [image] : ['/products/handmade_necklace_1788674101596.jpg'];

  // Process any inline base64 images to persistent disk files in /uploads/
  const imageList = rawImageList.map((img: string, idx: number) => {
    if (typeof img === 'string' && img.startsWith('data:image/')) {
      try {
        const match = img.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (match) {
          const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
          const filename = `craft_artisan_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}.${ext}`;
          const buffer = Buffer.from(match[2], 'base64');
          fs.writeFileSync(path.join(uploadsDir, filename), buffer);
          if (fs.existsSync(distUploadsDir)) {
            try {
              fs.writeFileSync(path.join(distUploadsDir, filename), buffer);
            } catch {}
          }
          return `/uploads/${filename}`;
        }
      } catch (e) {
        console.error('Failed to save inline base64 product image:', e);
      }
    }
    return img;
  });

  const productStatus = status || (stock === 0 ? 'Out of Stock' : 'Active');

  const newProduct = db.createProduct({
    id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: title.trim(),
    description: description.trim(),
    category: category.trim(),
    mainCategory: category.trim(),
    subcategory: subcategory ? subcategory.trim() : undefined,
    price: parsedPrice,
    artisanId: req.user!.id,
    artisanName: req.user!.fullName,
    artisanShop: req.user!.shopName || `${req.user!.fullName}'s Atelier`,
    artisanBio: req.user!.bio || `${req.user!.fullName} is a dedicated handcrafted maker with Heart & Hands.`,
    artisanLocation: req.user!.location || 'Jaipur, Rajasthan, India',
    artisanAvatar: req.user!.avatar,
    artisanSpecialty: req.user!.specialty || category.trim(),
    image: imageList[0],
    images: imageList,
    inStock: stock > 0 && productStatus === 'Active',
    stockCount: stock,
    status: productStatus,
    rating: 5.0,
    reviewCount: 0,
    badge: badge || 'New Craft',
    craftTimeDays: Number(craftTimeDays) > 0 ? Number(craftTimeDays) : 3,
    material: material || 'Handmade Artisan Materials',
    sizeDimensions: sizeDimensions || 'Standard Handcrafted Dimensions',
    shippingInfo: shippingInfo || 'Packed in signature eco-friendly gift box. Ships within 3-5 days.',
    customOptions: {
      allowEngraving: customOptions?.allowEngraving ?? true,
      engravingPlaceholder: customOptions?.engravingPlaceholder || 'Personalized text/initials',
      engravingMaxChars: customOptions?.engravingMaxChars || 20,
      materials: customOptions?.materials && customOptions.materials.length > 0
        ? customOptions.materials
        : ['Natural Heirloom Material', 'Fine Polished Metal', 'Classic Vintage'],
      fonts: customOptions?.fonts && customOptions.fonts.length > 0
        ? customOptions.fonts
        : ['Calligraphy Script', 'Vintage Serif', 'Modern Sans'],
      giftWrapAvailable: customOptions?.giftWrapAvailable ?? true,
    },
    createdAt: new Date().toISOString(),
  });

  res.status(201).json({ success: true, product: newProduct });
});

// Artisan: Edit Product
app.put('/api/artisan/products/:id', authMiddleware, (req, res) => {
  if (req.user!.role !== 'artisan') {
    return res.status(403).json({ success: false, error: 'Access restricted to registered artisans.' });
  }

  const { id } = req.params;
  const updates = req.body;

  const updated = db.updateProduct(id, updates, req.user!.id);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Product not found or permission denied.' });
  }

  res.json({ success: true, product: updated });
});

// Artisan: Delete Product
app.delete('/api/artisan/products/:id', authMiddleware, (req, res) => {
  if (req.user!.role !== 'artisan') {
    return res.status(403).json({ success: false, error: 'Access restricted to registered artisans.' });
  }

  const { id } = req.params;
  const deleted = db.deleteProduct(id, req.user!.id);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Product not found or unauthorized.' });
  }

  res.json({ success: true, message: 'Product deleted successfully.' });
});

// Artisan: Orders
app.get('/api/artisan/orders', authMiddleware, (req, res) => {
  if (req.user!.role !== 'artisan') {
    return res.status(403).json({ success: false, error: 'Access restricted to registered artisans.' });
  }

  const orders = db.getArtisanOrders(req.user!.id);
  res.json({ success: true, orders });
});

// Artisan: Real Earnings
app.get('/api/artisan/earnings', authMiddleware, (req, res) => {
  if (req.user!.role !== 'artisan') {
    return res.status(403).json({ success: false, error: 'Access restricted to registered artisans.' });
  }

  const earnings = db.getArtisanEarnings(req.user!.id);
  res.json({ success: true, earnings });
});

// Artisan: Notifications
app.get('/api/artisan/notifications', authMiddleware, (req, res) => {
  if (req.user!.role !== 'artisan') {
    return res.status(403).json({ success: false, error: 'Access restricted to registered artisans.' });
  }

  const notifications = db.getNotifications(req.user!.id);
  res.json({ success: true, notifications });
});

// Mark single notification read
app.put('/api/artisan/notifications/:id/read', authMiddleware, (req, res) => {
  if (req.user!.role !== 'artisan') {
    return res.status(403).json({ success: false, error: 'Access restricted.' });
  }

  const success = db.markNotificationRead(req.user!.id, req.params.id);
  res.json({ success });
});

// Mark all notifications read
app.put('/api/artisan/notifications/read-all', authMiddleware, (req, res) => {
  if (req.user!.role !== 'artisan') {
    return res.status(403).json({ success: false, error: 'Access restricted.' });
  }

  const success = db.markAllNotificationsRead(req.user!.id);
  res.json({ success });
});

// Public Artisan Profile
app.get('/api/artisan/:artisanId/public', (req, res) => {
  const { artisanId } = req.params;
  const user = db.findUserById(artisanId);
  if (!user || user.role !== 'artisan') {
    return res.status(404).json({ success: false, error: 'Artisan not found.' });
  }

  const products = db.getProductsByArtisan(artisanId).filter(p => p.status !== 'Draft');

  res.json({
    success: true,
    artisan: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      shopName: user.shopName || `${user.fullName}'s Studio`,
      bio: user.bio || 'Passionate handmade creator crafting unique heirloom pieces with heart.',
      specialty: user.specialty || 'Handmade Jewelry & Keepsakes',
      categories: user.categories || ['Jewelry', 'Custom Creations'],
      location: user.location || 'India',
      instagramId: user.instagramId || '@heartandhands_official',
      avatar: user.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      joinedDate: user.joinedDate || '2024',
      rating: 4.96,
      reviewCount: products.reduce((acc, p) => acc + (p.reviewCount || 0), 0) || 58,
    },
    products,
  });
});

// ==========================================
// 5. PERSISTENT IMAGE UPLOADS
// ==========================================

// Upload endpoint for artisan product photos
app.post('/api/artisan/upload-image', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (req.user!.role !== 'artisan') {
      return res.status(403).json({ success: false, error: 'Only registered artisans can upload product photos.' });
    }

    const { imageBase64, filename, mimeType } = req.body;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ success: false, error: 'No image data provided.' });
    }

    let base64Data = imageBase64;
    let extension = 'jpg';

    const match = imageBase64.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (match) {
      extension = match[1] === 'jpeg' ? 'jpg' : match[1];
      base64Data = match[2];
    } else if (mimeType) {
      extension = mimeType.replace('image/', '') === 'jpeg' ? 'jpg' : mimeType.replace('image/', '');
    } else if (filename && filename.includes('.')) {
      extension = filename.split('.').pop() || 'jpg';
    }

    extension = extension.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension)) {
      extension = 'jpg';
    }

    const uniqueId = `craft_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const targetFilename = `${uniqueId}.${extension}`;
    const buffer = Buffer.from(base64Data, 'base64');

    // 1. Write to public/uploads
    const targetPath = path.join(uploadsDir, targetFilename);
    fs.writeFileSync(targetPath, buffer);

    // 2. Also mirror to dist/uploads if dist exists (so it's available immediately in production)
    const distUploadsDir = path.join(process.cwd(), 'dist', 'uploads');
    if (fs.existsSync(path.join(process.cwd(), 'dist'))) {
      if (!fs.existsSync(distUploadsDir)) {
        fs.mkdirSync(distUploadsDir, { recursive: true });
      }
      try {
        fs.writeFileSync(path.join(distUploadsDir, targetFilename), buffer);
      } catch (e) {
        console.warn('Could not mirror to dist/uploads:', e);
      }
    }

    const permanentUrl = `/uploads/${targetFilename}`;

    return res.status(201).json({
      success: true,
      url: permanentUrl,
      filename: targetFilename,
      size: buffer.length,
      message: 'Product image uploaded to persistent storage successfully.',
    });
  } catch (err: any) {
    console.error('Error uploading product image:', err);
    return res.status(500).json({ success: false, error: err.message || 'Image upload failed.' });
  }
});

// General upload endpoint alias (supports auth if present)
app.post('/api/upload', async (req: Request, res: Response) => {
  try {
    const { imageBase64, filename, mimeType } = req.body;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ success: false, error: 'No image data provided.' });
    }

    let base64Data = imageBase64;
    let extension = 'jpg';

    const match = imageBase64.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (match) {
      extension = match[1] === 'jpeg' ? 'jpg' : match[1];
      base64Data = match[2];
    } else if (mimeType) {
      extension = mimeType.replace('image/', '') === 'jpeg' ? 'jpg' : mimeType.replace('image/', '');
    } else if (filename && filename.includes('.')) {
      extension = filename.split('.').pop() || 'jpg';
    }

    extension = extension.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension)) {
      extension = 'jpg';
    }

    const uniqueId = `craft_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const targetFilename = `${uniqueId}.${extension}`;
    const buffer = Buffer.from(base64Data, 'base64');

    const targetPath = path.join(uploadsDir, targetFilename);
    fs.writeFileSync(targetPath, buffer);

    const distUploadsDir = path.join(process.cwd(), 'dist', 'uploads');
    if (fs.existsSync(path.join(process.cwd(), 'dist'))) {
      if (!fs.existsSync(distUploadsDir)) {
        fs.mkdirSync(distUploadsDir, { recursive: true });
      }
      try {
        fs.writeFileSync(path.join(distUploadsDir, targetFilename), buffer);
      } catch (e) {
        console.warn('Could not mirror to dist/uploads:', e);
      }
    }

    const permanentUrl = `/uploads/${targetFilename}`;

    return res.status(201).json({
      success: true,
      url: permanentUrl,
      filename: targetFilename,
      size: buffer.length,
    });
  } catch (err: any) {
    console.error('Upload failed:', err);
    return res.status(500).json({ success: false, error: err.message || 'Upload failed.' });
  }
});

// ==========================================
// 6. VITE / STATIC SERVING
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Ensure all static directories are mapped prior to wildcard SPA fallback
    app.use('/uploads', express.static(uploadsDir));
    app.use('/products', express.static(productsDir));
    app.use('/src/assets/images', express.static(productsDir));
    app.use('/src/assets/images', express.static(publicDir));
    app.use(express.static(distPath));
    app.use(express.static(publicDir));
    app.get('*', (req, res) => {
      if (
        req.path.startsWith('/products/') ||
        req.path.startsWith('/uploads/') ||
        req.path.startsWith('/assets/') ||
        req.path.startsWith('/api/') ||
        req.path.startsWith('/src/assets/images/')
      ) {
        return res.status(404).json({ error: 'Asset not found' });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Heart & Hands full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
