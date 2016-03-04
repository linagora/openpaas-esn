'use strict';

var logger, mailer;

function getNodemailerRecipient(recipient) {
  var email = recipient.email,
      name = recipient.name;

  return name && name !== email ? '"' + name + '" ' + email : email;
}

function sendEmailToRecipients(req, res) {
  var email = req.body;

  var message = {
    from: getNodemailerRecipient(email.from),
    to: email.to.map(getNodemailerRecipient),
    cc: email.cc.map(getNodemailerRecipient),
    bcc: email.bcc.map(getNodemailerRecipient),
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
