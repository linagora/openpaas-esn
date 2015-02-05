'use strict';

module.exports.linagora_PROJECTS = function() {

  return {
    domain: {
      name: 'IT',
      company_name: 'lng.net'
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
    },
    {
      password: 'secret',
      firstname: 'Indi',
      lastname: 'Rect',
      emails: ['indirect@lng.net']
    }
    ],
    communities: [
      {
        title: 'Open Community',
        type: 'open',
        creator: 'jdoe@lng.net',
        members: []
      },
      {
        title: 'find Community 1 member of project A',
        type: 'open',
        creator: 'jdoe@lng.net',
        members: []
      },
      {
        title: 'find Community 2 member of project A',
        type: 'open',
        creator: 'jdoe@lng.net',
        members: []
      },
      {
        title: 'find Community 3 not member of project A',
        type: 'open',
        creator: 'jdoe@lng.net',
        members: []
      },
      {
        title: 'Community SearchMe FindMe',
        type: 'open',
        creator: 'jdoe@lng.net',
        members: []
      },
      {
        title: 'Community SearchMe Too',
        type: 'open',
        creator: 'jdoe@lng.net',
        members: []
      },
      {
        title: 'Community SearchAndDoNotFindMe',
        type: 'open',
        creator: 'jdoe@lng.net',
        members: []
      },
      {
        title: 'Community with indirect member',
        type: 'open',
        creator: 'jdoe@lng.net',
        members: [{objectType: 'user', id: 'indirect@lng.net'}]
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
      },
      {
        title: 'OpenPaaS with communities members',
        type: 'restricted',
        creator: 'itadmin@lng.net',
        members: [
          {objectType: 'community', id: 'find Community 1 member of project A'},
          {objectType: 'community', id: 'find Community 2 member of project A'}
        ]
      },
      {
        title: 'OpenPaaS with indirect members',
        type: 'open',
        creator: 'itadmin@lng.net',
        members: [
          {objectType: 'community', id: 'Community with indirect member'}
        ]
      }
    ]
  };
};

module.exports.orphans = function() {
  return {
    domain: {
      name: 'ORPHAN',
      company_name: 'MyOnlyCompany'
    },
    users: [],
    projects: []
  };
};

