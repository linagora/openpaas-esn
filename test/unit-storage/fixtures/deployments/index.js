'use strict';

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

module.exports.linagora_test_cases = function() {

  return {
    domain: {
      name: 'TestCases',
      company_name: 'Linagora'
    },
    users: [
      {
        password: 'secret',
        firstname: 'Delphine',
        lastname: 'Dorémi',
        emails: ['tyrell@interne.fr']
      },
      {
        password: 'secret',
        firstname: 'Philippe',
        lastname: 'Mifasol',
        emails: ['roybatty@interne.com']
      }
    ]
  };

};

module.exports.linagora_test_cases_extra = function() {

  return {
    domain: {
      name: 'TestCasesExtra',
      company_name: 'Linagora'
    },
    users: [
      {
        password: 'secret',
        firstname: 'éèêëaàâäïîç',
        emails: ['tyrell@interne.fr']
      }
    ]
  };

};
