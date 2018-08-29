'use strict';

const RESTRICTED = {
  rights: {} // empty rights for restricting any access via configuration API
};

module.exports = {
  rights: {
    padmin: 'rw',
    admin: 'rw'
  },
  configurations: {
    businessHours: require('./businessHours'),
    datetime: require('./datetime'),
    homePage: require('./homepage'),
    autoconf: require('./autoconf'),
    ldap: require('./ldap'),
    mail: require('./mail'),
    davserver: require('./davserver'),
    oauth: require('./oauth'),
    jwt: require('./jwt'),
    web: require('./web'),
    login: require('./login'),
    features: require('./features'),
    modules: require('./modules'),
    user: RESTRICTED,
    amqp: RESTRICTED,
    redis: RESTRICTED,
    session: RESTRICTED,
    constants: RESTRICTED,
    webserver: RESTRICTED,
    platformadmin: RESTRICTED
  }
};
