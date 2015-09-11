'use strict';

module.exports = function(User) {
  var defaultPassword = 'secret',
      defaultEmails = [
        'foo@linagora.com',
        'bar@linagora.com'
      ];

  return {
    newDummyUser: function(emails, password, preferredEmailIndex) {
      return new User({
        firstname: 'foo',
        lastname: 'bar',
        password: password || defaultPassword,
        accounts: [{
          type: 'email',
          hosted: true,
          emails: emails || defaultEmails,
          preferredEmailIndex: preferredEmailIndex || 0
        }]
      });
    },
    password: defaultPassword,
    emails: defaultEmails
  };
};
