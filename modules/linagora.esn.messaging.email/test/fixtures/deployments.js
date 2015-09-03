'use strict';

module.exports.linagora_EMAILReply = function() {

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
          emails: ['itadmin@lng.net']
        }]
      },
      {
        password: 'secret',
        firstname: 'John',
        lastname: 'Doe',
        accounts: [{
          type: 'email',
          emails: ['jdoe@lng.net']
        }]
      },
      {
        password: 'secret',
        firstname: 'Foo',
        lastname: 'Bar',
        accounts: [{
          type: 'email',
          emails: ['foobar@lng.net']
        }]
      }
    ],
    communities: [
      {
        title: 'Restricted Community',
        type: 'restricted',
        creator: 'jdoe@lng.net',
        members: [{ objectType: 'user', id: 'jdoe@lng.net'}]
      }
    ]
  };
};

