'use strict';

module.exports.linagora_IT = function() {

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
        emails: ['kcobain@linagora.com']
      },
      {
        password: 'secret',
        firstname: 'Jimmy',
        lastname: 'Hendrix',
        emails: ['jhendrix@linagora.com']
      },
      {
        password: 'secret',
        firstname: 'External',
        lastname: 'User1',
        emails: ['user@externalcompany1.com']
      },
      {
        password: 'secret',
        firstname: 'External',
        lastname: 'User2',
        emails: ['user@externalcompany2.com']
      }
    ],
    communities: [
      {
        title: 'OpenPaaS open',
        type: 'open',
        creator: 'itadmin@lng.net',
        members: [{objectType: 'user', id: 'jdoe@lng.net'}]
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

module.exports.linagora_test_domain = function() {

  return {
    domain: {
      name: 'TestDomain',
      company_name: 'Linagora'
    },
    users: [
      {
        password: 'secret',
        firstname: 'a ',
        lastname: 'user1',
        emails: ['user1@lng.net']
      },
      {
        password: 'secret',
        firstname: 'b',
        lastname: 'user2',
        emails: ['user2@lng.net']
      },
      {
        password: 'secret',
        firstname: 'c',
        lastname: 'user3',
        emails: ['user3@lng.net']
      },
      {
        password: 'secret',
        firstname: 'd',
        lastname: 'user4',
        emails: ['user4@linagora.com']
      }
    ]
  };

};

module.exports.linagora_test_domain2 = function() {

  return {
    domain: {
      name: 'TestDomain2',
      company_name: 'Linagora2'
    },
    users: [
      {
        password: 'secret',
        firstname: 'a2 ',
        lastname: 'user12',
        emails: ['user12@lng.net']
      },
      {
        password: 'secret',
        firstname: 'b2',
        lastname: 'user22',
        emails: ['user22@lng.net']
      },
      {
        password: 'secret',
        firstname: 'c2',
        lastname: 'user32',
        emails: ['user32@lng.net']
      },
      {
        password: 'secret',
        firstname: 'd2',
        lastname: 'user42',
        emails: ['user42@linagora.com']
      }
    ]
  };

};

module.exports.collaborationMembers = function() {

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
        firstname: 'Yo',
        lastname: 'Lo',
        emails: ['yolo@lng.net']
      },
      {
        password: 'secret',
        firstname: 'Jimmy',
        lastname: 'Hendrix',
        emails: ['jhendrix@lng.net']
      },
      {
        password: 'secret',
        firstname: 'Not',
        lastname: 'Member',
        emails: ['notmember@lng.net']
      }
    ],
    communities: [
      {
        title: 'OpenPaaS open',
        type: 'open',
        creator: 'itadmin@lng.net',
        members: [{objectType: 'user', id: 'yolo@lng.net'}]
      },
      {
        title: 'OpenPaaS private',
        type: 'private',
        creator: 'itadmin@lng.net',
        members: [{objectType: 'user', id: 'yolo@lng.net'}]
      },
      {
        title: 'OpenPaaS restricted',
        type: 'restricted',
        creator: 'itadmin@lng.net',
        members: [{objectType: 'user', id: 'yolo@lng.net'}, {objectType: 'user', id: 'jhendrix@lng.net'}]
      },
      {
        title: 'No members',
        type: 'open',
        creator: 'itadmin@lng.net',
        members: []
      }
    ],
    projects: [
    ]
  };

};


module.exports.extrernalUsersCollaborations = function() {

  return {
    domain: {
      name: 'linalina',
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
        firstname: 'Yo',
        lastname: 'Lo',
        emails: ['yolo@test.net']
      },
      {
        password: 'secret',
        firstname: 'Jimmy',
        lastname: 'Hendrix',
        emails: ['jhendrix@pipo.net']
      }
    ],
    communities: [
      {
        title: 'OpenPaaS restricted',
        type: 'restricted',
        creator: 'itadmin@lng.net',
        members: [{objectType: 'user', id: 'jdoe@lng.net'}, {objectType: 'user', id: 'yolo@test.net'}, {objectType: 'user', id: 'jhendrix@pipo.net'}]
      }
    ],
    projects: [
    ]
  };

};
