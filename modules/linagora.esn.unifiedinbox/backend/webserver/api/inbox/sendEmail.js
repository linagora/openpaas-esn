'use strict';

var logger, emailModule;

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

  if (email.attachments) {
    message.attachments = email.attachments
      .filter(function(attachment) {
        return attachment.url;
      })
      .map(function(attachment) {
        return {
          filename: attachment.name,
          contentType: attachment.type,
          path: attachment.url
        };
      });
  }

  emailModule.getMailer(req.user.preferredDomainId).send(message, function(err) {
    if (err) {
      logger.error('Error when sending email', err);

      return res.status(500).json({error: {code: 500, message: 'Server Error', details: 'Cannot send email'}});
    }

    return res.status(200).end();
  });
}

module.exports = function(dependencies) {
  emailModule = dependencies('email');
  logger = dependencies('logger');

  return {
    sendEmailToRecipients: sendEmailToRecipients
  };
};
