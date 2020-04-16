'use strict';

module.exports = {

  ADMIN: {
    firstname: 'admin',
    lastname: 'admin',
    password: 'secret',
    accounts: [{
      type: 'email',
      emails: ['admin@open-paas.org']
    }]
  },

  USER: {
    firstname: 'John',
    lastname: 'Doe',
    password: 'secret',
    accounts: [{
      type: 'email',
      emails: ['user@open-paas.org']
    }]
  },

  DOMAIN: {
    name: 'open-paas.org',
    company_name: 'OpenPaaS',
    hostnames: ['localhost', '127.0.0.1', 'open-paas.org']
  }

};
