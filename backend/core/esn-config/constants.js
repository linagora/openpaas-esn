'use strict';

module.exports = {
  DEFAULT_MODULE: 'core',
  DEFAULT_DOMAIN_ID: null, // use this null to be system-wide
  DEFAULT_FEEDBACK_EMAIL: 'feedback@open-paas.org',
  CONFIG_METADATA: {
    core: {
      homePage: {
        public: true
      },
      ldap: {
        public: false
      },
      mail: {
        public: false
      },
      davserver: {
        public: false
      },
      redis: {
        public: false
      },
      oauth: {
        public: false
      },
      session: {
        public: false
      },
      jwt: {
        public: false
      },
      jmap: {
        public: false
      },
      web: {
        public: false
      },
      webserver: {
        public: false
      },
      user: {
        public: false
      },
      constants: {
        public: false
      },
      'application-menu.profile': {
        public: true
      },
      'application-menu.calendar': {
        public: true
      },
      'application-menu.contact': {
        public: true
      },
      'application-menu.controlCenter': {
        public: true
      },
      'application-menu.inbox': {
        public: true
      },
      'application-menu.communities': {
        public: true
      },
      'application-menu.search': {
        public: true
      },
      'application-menu.appstoreAppMenu': {
        public: true
      }
    },
    'linagora.esn.unifiedinbox': {
      view: {
        public: true
      },
      api: {
        public: true
      },
      uploadUrl: {
        public: true
      },
      downloadUrl: {
        public: true
      },
      isJmapSendingEnabled: {
        public: true
      },
      isSaveDraftBeforeSendingEnabled: {
        public: true
      },
      'composer.attachments': {
        public: true
      },
      maxSizeUpload: {
        public: true
      },
      'twitter.tweets': {
        public: true
      },
      drafts: {
        public: true
      },
      swipeRightAction: {
        public: true
      }
    },
    'linagora.esn.contact': {},
    'linagora.esn.calendar': {}
  }
};
