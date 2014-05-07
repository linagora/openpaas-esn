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
