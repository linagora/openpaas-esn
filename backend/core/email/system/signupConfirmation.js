'use strict';

var email = require('../index');
var i18n = require('../../../i18n');
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
    subject: i18n.__(properties.subject)
  };

  email.getMailer().sendHTML(message, properties.template, invitation.data, done);

};
