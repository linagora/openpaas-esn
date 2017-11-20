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
  },

  COMMUNITY: {
    title: 'OpenPaaS Community',
    description: 'The Open PaaS project aims at developing a PaaS (Platform as a Service) technology ' +
    'dedicated to enterprise collaborative applications deployed on hybrid clouds (private / public). ' +
    'Open PaaS is a platform that allow to design and deploy applications based on proven technologies ' +
    'provided by partners such as collaborative messaging system, integration and workflow technologies ' +
    'that is extended in order to address Cloud Computing requirements.'
  }

};
