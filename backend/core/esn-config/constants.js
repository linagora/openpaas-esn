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
  ROLE,
  CONFIG_METADATA: {
    core: {
      rights: {
        padmin: 'rw',
        admin: 'rw'
      },
      configurations: {
        platformadmin: {
          rights: {} // domain admin and user cannot read/write this field
        },
        homePage: {
          rights: {
            padmin: 'rw',
            admin: 'rw',
            user: 'rw'
          }
        },
        businessHours: {
          rights: {
            padmin: 'rw',
            admin: 'rw',
            user: 'rw'
          }
        },
        datetime: {
          rights: {
            padmin: 'rw',
            admin: 'rw',
            user: 'rw'
          }
        },
        autoconf: {
          rights: {
            admin: 'rw'
          }
        },
        ldap: {},
        mail: {},
        davserver: {},
        amqp: {},
        redis: {},
        oauth: {
          pubsub: true
        },
        session: {},
        james: {
          rights: {
            padmin: 'rw'
          }
        },
        jwt: {
          rights: {
            padmin: 'rw'
          }
        },
        jmap: {},
        web: {},
        webserver: {},
        user: {},
        constants: {},
        login: {
          rights: {
            padmin: 'rw'
          }
        },
        features: {
          rights: {
            admin: 'rw',
            user: 'r'
          }
        },
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
