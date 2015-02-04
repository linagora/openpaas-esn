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
        firstname: 'Foo',
        lastname: 'Bar',
        emails: ['foobar@lng.net']
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

