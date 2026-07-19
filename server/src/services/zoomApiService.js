const https = require('https');
const config = require('../config/env');

let _cachedToken = null;
let _tokenExpiresAt = 0;

/**
 * Fetch a Server-to-Server OAuth access token from Zoom.
 * Tokens are cached until they expire (typically 1 hour).
 */
async function getAccessToken() {
  if (_cachedToken && Date.now() < _tokenExpiresAt - 30_000) {
    return _cachedToken;
  }

  const credentials = Buffer.from(
    `${config.zoom.clientId}:${config.zoom.clientSecret}`
  ).toString('base64');

  const body = `grant_type=account_credentials&account_id=${encodeURIComponent(config.zoom.accountId)}`;

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'zoom.us',
        path: '/oauth/token',
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.access_token) {
              _cachedToken = parsed.access_token;
              // expires_in is in seconds
              _tokenExpiresAt = Date.now() + parsed.expires_in * 1000;
              resolve(parsed.access_token);
            } else {
              reject(new Error(`Zoom token error: ${JSON.stringify(parsed)}`));
            }
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Make an authenticated request to the Zoom REST API.
 * @param {string} method  HTTP method
 * @param {string} path    API path (e.g. '/v2/users/me/meetings')
 * @param {object} [body]  Request body (will be JSON-stringified)
 */
async function zoomRequest(method, path, body) {
  const token = await getAccessToken();
  const payload = body ? JSON.stringify(body) : null;

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.zoom.us',
        path,
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(payload && { 'Content-Length': Buffer.byteLength(payload) }),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = data ? JSON.parse(data) : {};
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else {
              const err = new Error(
                parsed.message || `Zoom API error ${res.statusCode}`
              );
              err.statusCode = res.statusCode;
              err.zoomCode = parsed.code;
              reject(err);
            }
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

const zoomApiService = {
  /**
   * Create a Zoom meeting via the REST API.
   * @param {object} opts
   * @param {string} opts.topic
   * @param {string} [opts.agenda]
   * @param {number} [opts.duration]  Duration in minutes (default 60)
   * @param {string} [opts.startTime] ISO 8601 string
   * @returns {Promise<object>} Zoom meeting object
   */
  async createMeeting({ topic, agenda, duration = 60, startTime }) {
    const meeting = await zoomRequest('POST', '/v2/users/me/meetings', {
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
    return meeting;
  },

  /**
   * End an active Zoom meeting.
   * @param {string} meetingId  Zoom's numeric meeting ID
   */
  async endMeeting(meetingId) {
    // PUT /v2/meetings/:meetingId/status  { action: 'end' }
    await zoomRequest('PUT', `/v2/meetings/${meetingId}/status`, {
      action: 'end',
    });
  },

  /**
   * Fetch Zoom meeting details.
   * @param {string} meetingId
   */
  async getMeeting(meetingId) {
    return zoomRequest('GET', `/v2/meetings/${meetingId}`);
  },

  /**
   * Fetch a ZAK (Zoom Access Key) token for a user.
   * Required for a host to start a meeting via the Meeting SDK.
   * @param {string} userId - User ID or 'me'
   */
  async getUserZAK(userId = 'me') {
    const data = await zoomRequest('GET', `/v2/users/${userId}/token?type=zak`);
    return data.token;
  },
};

module.exports = zoomApiService;
