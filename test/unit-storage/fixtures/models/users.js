'use strict';

module.exports = function(User) {
  var defaultPassword = 'secret',
      defaultEmails = [
        'foo@linagora.com',
        'bar@linagora.com'
      ];

  return {
    newDummyUser: function(emails, password) {
      return new User({
        firstname: 'foo',
        lastname: 'bar',
        password: password || defaultPassword,
        accounts: [{
          type: 'email',
          hosted: true,
          emails: emails || defaultEmails
        }]
      });
    },
    password: defaultPassword,
    emails: defaultEmails
  };
};
