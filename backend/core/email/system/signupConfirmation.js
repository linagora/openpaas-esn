'use strict';

var email = require('../index');
var i18n = require('../../../i18n');
var conf = require('../../../../backend/core/esn-config')('mail');

var properties = {
  subject: 'Please activate your account',
  template: 'signup-email-confirmation'
};

module.exports = function(invitation, done) {
  if (!invitation) {
    return done(new Error('Invitation can not be null'));
  }

  if (!invitation.data) {
    return done(new Error('Invitation data can not be null'));
  }

  conf.get(function(err, data) {
    if (err) {
      return done(err);
    }
    var from = data && data.mail && data.mail.noreply ? data.mail.noreply : 'no-reply@openpaas.org';
    var to = invitation.data.email;
    var subject = i18n.__(properties.subject);
    email.sendHTML(from, to, subject, properties.template, invitation.data, done);
  });
};
