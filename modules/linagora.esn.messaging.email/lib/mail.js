'use strict';

var MailParser = require('mailparser').MailParser;

module.exports.parse = function(stream, callback) {

  var mailparser = new MailParser({streamAttachments: true});

  mailparser.on('end', function(mail_object) {

    var mail = {};

    if (!mail_object) {
      return callback(new Error('Can not parse email'));
    }

    mail.parsedHeaders = {};

    if (mail_object.to) {
      mail.to = mail_object.to;
    }

    if (mail_object.from && mail_object.from.length > 0) {
      mail.from = mail_object.from[0];
    }

    if (mail_object.cc) {
      mail.cc = mail_object.cc;
    }

    if (mail_object.bcc) {
      mail.bcc = mail_object.bcc;
    }

    if (mail_object.date) {
      mail.date = mail_object.date;
    }

    if (mail_object.subject) {
      mail.subject = mail_object.subject;
    }

    mail.body = {};
    mail.body.text = mail_object.text;
    mail.body.html = mail_object.html;

    return callback(null, mail);
  });
  stream.pipe(mailparser);
};
