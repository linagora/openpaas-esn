'use strict';

var email = require('../index');
var i18n = require('../../../i18n');
var properties = {
  subject: 'You are invited to join OpenPaas',
  template: 'core.add-member'
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

  email.getMailer(invitation.data.domain._id).sendHTML(message, properties.template, invitation.data, done);
};
