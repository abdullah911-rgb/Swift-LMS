const https = require('https');
const prisma = require('../config/db');
const config = require('../config/env');

/**
 * Make an HTTP request using Node's native https module.
 */
function httpsRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: res.statusCode, body: parsed });
          } else {
            const err = new Error(parsed.message || `Request failed with code ${res.statusCode}`);
            err.statusCode = res.statusCode;
            err.body = parsed;
            reject(err);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

/**
 * Exchanges OAuth authorization code for zoom tokens.
 */
async function exchangeCodeForTokens(code) {
  const credentials = Buffer.from(
    `${config.zoom.oauthClientId}:${config.zoom.oauthClientSecret}`
  ).toString('base64');

  const bodyParams = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.zoom.oauthRedirectUri,
  }).toString();

  const options = {
    hostname: 'zoom.us',
    path: '/oauth/token',
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(bodyParams),
    },
  };

  const response = await httpsRequest(options, bodyParams);
  return response.body;
}

/**
 * Refreshes an expired access token using the stored refresh token.
 */
async function refreshInstructorToken(instructorId, refreshToken) {
  const credentials = Buffer.from(
    `${config.zoom.oauthClientId}:${config.zoom.oauthClientSecret}`
  ).toString('base64');

  const bodyParams = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  }).toString();

  const options = {
    hostname: 'zoom.us',
    path: '/oauth/token',
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(bodyParams),
    },
  };

  try {
    const response = await httpsRequest(options, bodyParams);
    const tokens = response.body;

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Save back to DB
    await prisma.user.update({
      where: { id: instructorId },
      data: {
        zoomAccessToken: tokens.access_token,
        zoomRefreshToken: tokens.refresh_token,
        zoomTokenExpiresAt: expiresAt,
      },
    });

    return tokens.access_token;
  } catch (err) {
    // If the refresh token is revoked/invalid, disconnect zoom
    if (err.statusCode === 400 || err.statusCode === 401) {
      console.warn(`[Zoom OAuth] Refresh token invalid for instructor ${instructorId}. Disconnecting account.`);
      await prisma.user.update({
        where: { id: instructorId },
        data: {
          zoomAccessToken: null,
          zoomRefreshToken: null,
          zoomTokenExpiresAt: null,
          zoomUserId: null,
          zoomEmail: null,
          zoomConnected: false,
        },
      });
    }
    throw err;
  }
}

/**
 * Gets a valid access token for a given instructor, refreshing it if expired.
 */
async function getInstructorAccessToken(instructorId) {
  const user = await prisma.user.findUnique({
    where: { id: instructorId },
    select: {
      zoomAccessToken: true,
      zoomRefreshToken: true,
      zoomTokenExpiresAt: true,
      zoomConnected: true,
    },
  });

  if (!user || !user.zoomConnected || !user.zoomRefreshToken) {
    throw new Error('Zoom account not connected for this instructor.');
  }

  // If expired or expiring within 1 minute, refresh it
  const isExpired = !user.zoomTokenExpiresAt || new Date(Date.now() + 60 * 1000) > new Date(user.zoomTokenExpiresAt);
  if (isExpired) {
    return refreshInstructorToken(instructorId, user.zoomRefreshToken);
  }

  return user.zoomAccessToken;
}

/**
 * Fetch Zoom details about the currently authenticated user (me).
 */
async function getZoomUserMe(accessToken) {
  const options = {
    hostname: 'api.zoom.us',
    path: '/v2/users/me',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  const response = await httpsRequest(options);
  return response.body;
}

/**
 * Make an authenticated Zoom API request as an instructor.
 */
async function zoomRequestAsInstructor(instructorId, method, path, body = null) {
  const token = await getInstructorAccessToken(instructorId);
  const payload = body ? JSON.stringify(body) : null;

  const options = {
    hostname: 'api.zoom.us',
    path,
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(payload && { 'Content-Length': Buffer.byteLength(payload) }),
    },
  };

  const response = await httpsRequest(options, payload);
  return response.body;
}

const zoomOAuthService = {
  exchangeCodeForTokens,
  getZoomUserMe,
  getInstructorAccessToken,
  zoomRequestAsInstructor,

  /**
   * Connect Zoom account using callback code.
   */
  async connectZoomAccount(instructorId, code) {
    const tokens = await exchangeCodeForTokens(code);
    const zoomUser = await getZoomUserMe(tokens.access_token);

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    return prisma.user.update({
      where: { id: instructorId },
      data: {
        zoomAccessToken: tokens.access_token,
        zoomRefreshToken: tokens.refresh_token,
        zoomTokenExpiresAt: expiresAt,
        zoomUserId: zoomUser.id,
        zoomEmail: zoomUser.email,
        zoomConnected: true,
      },
    });
  },

  /**
   * Disconnect Zoom account.
   */
  async disconnectZoomAccount(instructorId) {
    return prisma.user.update({
      where: { id: instructorId },
      data: {
        zoomAccessToken: null,
        zoomRefreshToken: null,
        zoomTokenExpiresAt: null,
        zoomUserId: null,
        zoomEmail: null,
        zoomConnected: false,
      },
    });
  },

  /**
   * Create a Zoom meeting on behalf of the instructor.
   */
  async createMeetingAsInstructor(instructorId, { topic, agenda, duration = 60, startTime }) {
    return zoomRequestAsInstructor(instructorId, 'POST', '/v2/users/me/meetings', {
      topic,
      agenda,
      type: startTime && new Date(startTime) > new Date() ? 2 : 1, // 2 = scheduled, 1 = instant
      duration,
      ...(startTime && { start_time: startTime }),
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: false,
        waiting_room: false,
        auto_recording: 'none',
      },
    });
  },

  /**
   * End a meeting on behalf of the instructor.
   */
  async endMeetingAsInstructor(instructorId, meetingId) {
    await zoomRequestAsInstructor(instructorId, 'PUT', `/v2/meetings/${meetingId}/status`, {
      action: 'end',
    });
  },

  /**
   * Get meeting details on behalf of the instructor.
   */
  async getMeetingAsInstructor(instructorId, meetingId) {
    return zoomRequestAsInstructor(instructorId, 'GET', `/v2/meetings/${meetingId}`);
  },

  /**
   * Fetch a ZAK (Zoom Access Key) token for the instructor to host.
   */
  async getInstructorZAK(instructorId) {
    const data = await zoomRequestAsInstructor(instructorId, 'GET', '/v2/users/me/token?type=zak');
    return data.token;
  },
};

module.exports = zoomOAuthService;
