const EVENTS = {
  CONFIG_UPDATED: 'esn-config:config:updated'
};
const SCOPE = {
  user: 'user',
  domain: 'domain',
  platform: 'platform'
};
const ROLE = {
  user: 'user',
  admin: 'admin',
  padmin: 'padmin'
};

module.exports = {
  DEFAULT_MODULE: 'core',
  DEFAULT_DOMAIN_ID: null, // use this null to be system-wide
  DEFAULT_FEEDBACK_EMAIL: 'feedback@open-paas.org',
  EVENTS,
  SCOPE,
  ROLE
};
