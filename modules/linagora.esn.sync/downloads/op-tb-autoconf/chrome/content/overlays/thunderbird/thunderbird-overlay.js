'use strict';

const Cu = Components.utils;

Cu.import('resource://op-tb-autoconf/modules/Log.jsm');
Cu.import('resource://op-tb-autoconf/modules/Accounts.jsm');
Cu.import('resource://op-tb-autoconf/modules/Addons.jsm');
Cu.import('resource://op-tb-autoconf/modules/Prefs.jsm');
Cu.import('resource://op-tb-autoconf/modules/Directories.jsm');
Cu.import('resource://op-tb-autoconf/modules/Calendars.jsm');
Cu.import('resource://op-tb-autoconf/modules/Contacts.jsm');
Cu.import('resource://op-tb-autoconf/modules/Passwords.jsm');
Cu.import('resource://gre/modules/Http.jsm');
Cu.import('resource://gre/modules/Services.jsm');

let logger = getLogger('Overlay'),
    interval = Prefs.get('extensions.op.autoconf.interval'),
    rootUrl = Prefs.get('extensions.op.autoconf.rootUrl');

logger.info('Running under Thunderbird v${version}', { version: Services.appinfo.version });
logger.info('Scheduling autoconfiguration every ${interval}ms using ${rootUrl}', { interval, rootUrl });

// Scheduling
setInterval(() => updateAutoconfiguration(), Prefs.get('extensions.op.autoconf.interval'));

// Initial autoconf at startup
updateAutoconfiguration();

/////

function updateAutoconfiguration() {
  let url = rootUrl + '/api/user/autoconf',
      credentials = Passwords.getCredentialsForUsername(Prefs.get('extensions.op.autoconf.username'));

  logger.info('About to request autoconfiguration file at ${}', url);

  httpRequest(url, {
    onError: function(statusText) {
      logger.error('Could not get autoconfiguration file from ${url}. ${statusText}', { url, statusText });
    },
    onLoad: function(data) {
      autoconfigure(JSON.parse(data));
    },
    headers: [['Authorization', 'Basic ' + window.btoa(credentials.username + ':' + credentials.password)]]
  });
}

function autoconfigure(config) {
  logger.debug('Starting autoconfiguration with ${}', config);

  Accounts.setupAccounts(config.accounts);
  Addons.setupAddons(config.addons);
  Prefs.setupPreferences(config.preferences);
  Directories.setupDirectories(config.directories);

  if (Calendars.isLightningInstalled()) {
    Calendars.setupCalendars(config.calendars);
  }

  if (Contacts.isCardBookInstalled()) {
    Contacts.setupAddressBooks(config.addressbooks);
  }
}
