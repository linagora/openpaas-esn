'use strict';

var logger = require(__dirname + '/../../core').logger,
  mongoose = require('mongoose'),
  Feedback = mongoose.model('Feedback'),
  i18n = require('../../i18n'),
  esnConfig = require('../../core/esn-config'),
  mail = require('../email'),
  constants = require('../../core/esn-config/constants');
var DEFAULT_FEEDBACK_EMAIL = constants.DEFAULT_FEEDBACK_EMAIL;

function save(feedback, callback) {
  var feedbackAsModel = new Feedback(feedback);
  feedbackAsModel.save(function(err, response) {
    if (err) {
      logger.warn('Error while trying to add a new feedback in database:', err.message);
      return callback(err);
    }
    logger.info('Added new feedback in database:', { _id: response._id.toString() });
    return callback(null, response);
  });
}

function getFeedbackEmail(user, callback) {
    return esnConfig('mail').forUser(user).get(function(err, mailConfig) {
      if (err) {
        return callback(err);
      }
      return callback(null, mailConfig.mail && mailConfig.mail.feedback ? mailConfig.mail.feedback : DEFAULT_FEEDBACK_EMAIL);
    });
}

function sendEmail(feedbackObject, user, callback) {
  getFeedbackEmail(user, function(err, email) {
    if (err) {
      return callback(err);
    }
    var context = {
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.preferredEmail,
      subject: feedbackObject.subject,
      content: feedbackObject.content
    };
    var message = {
      from: user.preferredEmail,
      to: email,
      subject: i18n.__('You received a feedback on OpenPaaS')
    };

    mail.getMailer(user).sendHTML(message, 'core.feedback', context, callback);
  });
}

module.exports = {
  getFeedbackEmail,
  save,
  sendEmail
};
