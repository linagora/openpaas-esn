'use strict';

var properties = {
  subject: 'Please activate your account',
  template: 'core.signup-email-confirmation'
};

module.exports = function(invitation, done) {
  if (!invitation) {
    return done(new Error('Invitation can not be null'));
  }

  if (!invitation.data) {
    return done(new Error('Invitation data can not be null'));
  }

  var message = {
    to: invitation.data.email,
    subject: require('../../../i18n').__(properties.subject)
  };

  require('../index').getMailer().sendHTML(message, properties.template, invitation.data, done);
};
