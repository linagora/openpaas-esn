'use strict';

var logger, mailer;

function getEmailFromRecipient(recipients) {
  return recipients.map(function(recipient) {
    return recipient.email;
  });
}

function sendEmailToRecipients(req, res) {
  var email = req.body;

  var message = {
    from: email.from,
    to: getEmailFromRecipient(email.to),
    cc: getEmailFromRecipient(email.cc),
    bcc: getEmailFromRecipient(email.bcc),
    subject: email.subject
  };

  if (email.htmlBody) {
    message.html = email.htmlBody;
  } else if (email.textBody) {
    message.text = email.textBody;
  }

  mailer.send(message, function(err) {
    if (err) {
      logger.error('Error when trying to send email', err);
      return res.json(500, {error: {code: 500, message: 'Error when trying to send email', details: err.message}});
    }
    return res.status(200).end();
  });
}

module.exports = function(dependencies) {
  mailer = dependencies('mailer');
  logger = dependencies('logger');

  return {
    sendEmailToRecipients: sendEmailToRecipients
  };
};
