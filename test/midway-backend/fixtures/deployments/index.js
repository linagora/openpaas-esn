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
        accounts: [{
          type: 'email',
          hosted: true,
          emails: ['itadmin@lng.net']
        }]
      },
      {
        password: 'secret',
        firstname: 'John',
        lastname: 'Doe',
        accounts: [{
          type: 'email',
          hosted: true,
          emails: ['jdoe@lng.net']
        }]
      },
      {
        password: 'secret',
        firstname: 'Jane',
        lastname: 'Dee',
        accounts: [{
          type: 'email',
          hosted: true,
          emails: ['jdee@lng.net']
        }]
      },
      {
        password: 'secret',
        firstname: 'Kurt',
        lastname: 'Cobain',
        accounts: [{
          type: 'email',
          hosted: true,
          emails: ['kcobain@linagora.com']
        }]
      },
      {
        password: 'secret',
        firstname: 'Jimmy',
        lastname: 'Hendrix',
        accounts: [{
          type: 'email',
          hosted: true,
          emails: ['jhendrix@linagora.com']
        }]
      },
      {
        password: 'secret',
        firstname: 'External',
        lastname: 'User1',
        accounts: [{
          type: 'email',
          hosted: true,
          emails: ['user@externalcompany1.com']
        }]
      },
      {
        password: 'secret',
        firstname: 'External',
        lastname: 'User2',
        accounts: [{
          type: 'email',
          hosted: true,
          emails: ['user@externalcompany2.com']
        }]
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
      },
      {
        title: 'OpenPaaS open 2',
        type: 'open',
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
      company_name: 'Linagora',
      administrator: 'user1@lng.net'
    },
    users: [
      {
        password: 'secret',
        firstname: 'a ',
        lastname: 'user1',
        accounts: [{
          type: 'email',
          hosted: true,
          emails: ['user1@lng.net']
        }]
      },
      {
        password: 'secret',
        firstname: 'b',
        lastname: 'user2',
        accounts: [{
          type: 'email',
          hosted: true,
          emails: ['user2@lng.net']
        }]
      },
      {
        password: 'secret',
        firstname: 'c',
        lastname: 'user3',
        accounts: [{
          type: 'email',
          hosted: true,
          emails: ['user3@lng.net']
        }]
      },
      {
        password: 'secret',
        firstname: 'd',
        lastname: 'user4',
        accounts: [{
          type: 'email',
          hosted: true,
          emails: ['user4@linagora.com']
        }]
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
        accounts: [{
          type: 'email',
          hosted: true,
          emails: ['user12@lng.net']
        }]
      },
      {
        password: 'secret',
        firstname: 'b2',
        lastname: 'user22',
        accounts: [{
          type: 'email',
          hosted: true,
          emails: ['user22@lng.net']
        }]
      },
      {
        password: 'secret',
        firstname: 'c2',
        lastname: 'user32',
        accounts: [{
          type: 'email',
          hosted: true,
          emails: ['user32@lng.net']
        }]
      },
      {
        password: 'secret',
        firstname: 'd2',
        lastname: 'user42',
        accounts: [{
          type: 'email',
          hosted: true,
          emails: ['user42@linagora.com']
        }]
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
        accounts: [{
          type: 'email',
          hosted: true,
          emails: ['itadmin@lng.net']
        }]
      },
      {
        password: 'secret',
        firstname: 'John',
        lastname: 'Doe',
        accounts: [{
          type: 'email',
          hosted: true,
          emails: ['jdoe@lng.net']
        }]
      },
      {
        password: 'secret',
        firstname: 'Yo',
        lastname: 'Lo',
        accounts: [{
          type: 'email',
          hosted: true,
          emails: ['yolo@lng.net']
        }]
      },
      {
        password: 'secret',
        firstname: 'Jimmy',
        lastname: 'Hendrix',
        accounts: [{
          type: 'email',
          hosted: true,
          emails: ['jhendrix@lng.net']
        }]
      },
      {
        password: 'secret',
        firstname: 'Not',
        lastname: 'Member',
        accounts: [{
          type: 'email',
          hosted: true,
          emails: ['notmember@lng.net']
        }]
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
      },
      {
        title: 'Nested Members',
        type: 'open',
        creator: 'itadmin@lng.net',
        members: [
          {objectType: 'user', id: 'yolo@lng.net'},
          {objectType: 'user', id: 'jhendrix@lng.net'},
          {objectType: 'community', id: 'No members'}
        ]
      }
    ],
    projects: [
    ]
  };

};

module.exports.openAndPrivateCommunities = function() {
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
        accounts: [{
          type: 'email',
          hosted: true,
          emails: ['itadmin@lng.net']
        }]
      },
      {
        password: 'secret',
        firstname: 'John',
        lastname: 'Doe',
        accounts: [{
          type: 'email',
          hosted: true,
          emails: ['jdoe@lng.net']
        }]
      },
      {
        password: 'secret',
        firstname: 'Yo',
        lastname: 'Lo',
        accounts: [{
          type: 'email',
          hosted: true,
          emails: ['yolo@lng.net']
        }]
      },
      {
        password: 'secret',
        firstname: 'Jimmy',
        lastname: 'Hendrix',
        accounts: [{
          type: 'email',
          hosted: true,
          emails: ['jhendrix@lng.net']
        }]
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
        members: [{objectType: 'user', id: 'jhendrix@lng.net'}]
      },
      {
        title: 'No members',
        type: 'open',
        creator: 'itadmin@lng.net',
        members: []
      }
    ],
    projects: []
  };
};
