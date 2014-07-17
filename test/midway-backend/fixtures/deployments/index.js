'use strict';

module.exports.linagora_IT = function() {

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
