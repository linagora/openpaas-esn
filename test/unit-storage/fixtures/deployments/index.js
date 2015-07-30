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
        accounts: [{
          type: 'email',
          hosted: true,
          emails: ['tyrell@linagora.fr']
        }]
      },
      {
        password: 'secret',
        firstname: 'Philippe',
        lastname: 'Mifasol',
        accounts: [{
          type: 'email',
          hosted: true,
          emails: ['roybatty@linagora.com']
        }]
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
        accounts: [{
          type: 'email',
          hosted: true,
          emails: ['tyrell@interne.fr']
        }]
      }
    ]
  };

};
