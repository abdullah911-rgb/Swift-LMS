/**
 * Zoom SDK Config (Placeholder)
 * Full Zoom Meeting SDK integration will be implemented in Phase 5.
 * Replace placeholders with actual credentials when ready.
 */
const config = require('./env');

const zoomConfig = {
  accountId: config.zoom.accountId,
  clientId: config.zoom.clientId,
  clientSecret: config.zoom.clientSecret,
  sdkKey: config.zoom.sdkKey,
  sdkSecret: config.zoom.sdkSecret,
  baseUrl: 'https://api.zoom.us/v2',
};

module.exports = zoomConfig;
