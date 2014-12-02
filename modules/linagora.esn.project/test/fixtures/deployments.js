'use strict';

module.exports.linagora_PROJECTS = function() {

  return {
    domain: {
      name: 'IT',
      company_name: 'Linagora'
    },
    users: [
    {
      password: 'secret',
      firstname: 'Domain ',
      lastname: 'Administrator',
      emails: ['itadmin@lng.net']
    },
    {
      password: 'secret',
      firstname: 'John',
      lastname: 'Doe',
      emails: ['jdoe@lng.net']
    },
    {
      password: 'secret',
      firstname: 'Jane',
      lastname: 'Dee',
      emails: ['jdee@lng.net']
    },
    {
      password: 'secret',
      firstname: 'Kurt',
      lastname: 'Cobain',
      emails: ['kcobain@lng.net']
    },
    {
      password: 'secret',
      firstname: 'Jimmy',
      lastname: 'Hendrix',
      emails: ['jhendrix@lng.net']
    }
    ],
    communities: [
      {
        title: 'Open Community',
        type: 'open',
        creator: 'jdoe@lng.net',
        members: []
      }
    ],
    projects: [
    {
      title: 'OpenPaaS open',
      type: 'open',
      creator: 'itadmin@lng.net',
      members: [{objectType: 'user', id: 'jdoe@lng.net'}]
    },
    {
      title: 'OpenPaaS Add members',
      type: 'open',
      creator: 'itadmin@lng.net',
      members: []
    },
    {
      title: 'OpenPaaS private',
      type: 'private',
      creator: 'itadmin@lng.net',
      members: [{objectType: 'user', id: 'jdoe@lng.net'}]
    },
    {
      title: 'OpenPaaS restricted',
      type: 'restricted',
      creator: 'itadmin@lng.net',
      members: [{objectType: 'user', id: 'jdoe@lng.net'}]
    }
    ]
  };
};
