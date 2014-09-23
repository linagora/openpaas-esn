'use strict';

var MailParser = require('mailparser').MailParser;
var mongoose = require('mongoose');
var EmailMessage = mongoose.model('EmailMessage');
var emailHelpers = require('../../helpers/email');
var logger = require('../logger');

/**
 *
 * @param {Stream} stream
 * @param {Object} author
 * @param {Array} shares
 * @param {Function} callback
 */
function saveEmail(stream, author, shares, callback) {
  if (!stream) {
    return callback(new Error('email stream is required'));
  }

  if (!author) {
    return callback(new Error('Author is required'));
  }

  var mailparser = new MailParser({streamAttachments: true});
  mailparser.on('end', function(mail_object) {
    logger.debug('Parsed email', mail_object);

    if (!mail_object) {
      return callback(new Error('Can not parse email'));
    }

    var mail = new EmailMessage();

    mail.parsedHeaders = {};

    if (mail_object.to) {
      mail.parsedHeaders.to = mail_object.to;
    }

    if (mail_object.from) {
      mail.parsedHeaders.from = mail_object.from;
    }

    if (mail_object.cc) {
      mail.parsedHeaders.cc = mail_object.cc;
    }

    if (mail_object.bcc) {
      mail.parsedHeaders.bcc = mail_object.bcc;
    }

    if (mail_object.date) {
      mail.parsedHeaders.date = mail_object.date;
    }

    if (mail_object.subject) {
      mail.parsedHeaders.subject = mail_object.subject;
    }

    mail.author = author;

    mail.headers = emailHelpers.formatHeaders(mail_object.headers);

    mail.body = {};

    mail.body.text = mail_object.text;

    mail.body.html = mail_object.html;

    if (shares) {
      mail.shares = shares;
    }

    return mail.save(callback);
  });

  mailparser.on('attachment', function(attachment) {
    logger.debug('Got attachment', attachment);
  });
  stream.pipe(mailparser);
}

module.exports.saveEmail = saveEmail;
