'use strict';

var logger = require(__dirname + '/../../core').logger,
  mongoose = require('mongoose'),
  Feedback = mongoose.model('Feedback'),
  i18n = require('../../i18n'),
  esnConfig = require('../../core/esn-config'),
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
    return esnConfig('mail').forUser(user).get(function(err, email) {
      if (err) {
        return callback(err);
      }
      return callback(null, email.mail ? email.mail.feedback : DEFAULT_FEEDBACK_EMAIL);
    });
}

function sendEmail(feedbackObject, req, callback) {
  getFeedbackEmail(req.user, function(err, email) {
    if (err) {
      return callback(err);
    }
    var context = {
      firstname: req.user.firstname,
      lastname: req.user.lastname,
      email: req.user.preferredEmail,
      subject: feedbackObject.subject,
      content: feedbackObject.content
    };
    var message = {
      from: req.user.preferredEmail,
      to: email,
      subject: i18n.__('You received a feedback on OpenPaas') || ['Feedback']
    };

    email.getMailer(req.user).sendHTML(message, 'core.feedback', context, callback);
  });
}

module.exports = {
  save,
  sendEmail
};
