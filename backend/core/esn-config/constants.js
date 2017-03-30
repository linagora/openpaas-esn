'use strict';

module.exports = {
  DEFAULT_MODULE: 'core',
  DEFAULT_DOMAIN_ID: null, // use this null to be system-wide
  DEFAULT_FEEDBACK_EMAIL: 'feedback@open-paas.org',
  CONFIG_METADATA: {
    core: {
      rights: {
        admin: 'rw'
      },
      configurations: {
        homePage: {
          rights: {
            admin: 'rw',
            user: 'rw'
          }
        },
        ldap: {},
        mail: {},
        davserver: {},
        amqp: {},
        redis: {},
        oauth: {},
        session: {},
        jwt: {},
        jmap: {},
        web: {},
        webserver: {},
        user: {},
        constants: {},
        'application-menu.profile': {
          rights: {
            admin: 'rw',
            user: 'r'
          }
        },
        'application-menu.calendar': {
          rights: {
            admin: 'rw',
            user: 'r'
          }
        },
        'application-menu.contact': {
          rights: {
            admin: 'rw',
            user: 'r'
          }
        },
        'application-menu.controlCenter': {
          rights: {
            admin: 'rw',
            user: 'r'
          }
        },
        'application-menu.inbox': {
          rights: {
            admin: 'rw',
            user: 'r'
          }
        },
        'application-menu.communities': {
          rights: {
            admin: 'rw',
            user: 'r'
          }
        },
        'application-menu.search': {
          rights: {
            admin: 'rw',
            user: 'r'
          }
        },
        'application-menu.appstoreAppMenu': {
          rights: {
            admin: 'rw',
            user: 'r'
          }
        }
      }
    }
  }
};
