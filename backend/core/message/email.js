'use strict';

var MailParser = require('mailparser').MailParser;
var mongoose = require('mongoose');
var EmailMessage = mongoose.model('EmailMessage');
var emailHelpers = require('../../helpers/email');
var attachmentsModule = require('../attachment');
var logger = require('../logger');
var pubsub = require('../../core').pubsub.local,
    topic = pubsub.topic('message:stored');

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

  var errors = [];

  var mailparser = new MailParser({streamAttachments: true});
  mailparser.on('end', function(mail_object) {
    logger.debug('Parsed email', mail_object);

    if (errors.length > 0) {
      return callback(new Error('Error while saving attachments.'));
    }

    if (!mail_object) {
      return callback(new Error('Can not parse email'));
    }

    var mail = new EmailMessage();

    mail.parsedHeaders = {};

    if (mail_object.to) {
      mail.parsedHeaders.to = mail_object.to;
    }

    if (mail_object.from && mail_object.from.length > 0) {
      mail.parsedHeaders.from = mail_object.from[0];
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
    return mail.save(function(err, response) {
      if (!err) {
        topic.publish(response);
        logger.info('Added new message in database:', { _id: response._id.toString() });
      } else {
        logger.warn('Error while trying to add a new emailmessage in database:', err.message);
      }
      callback(err, response);
    });
  });

  mailparser.on('attachment', function(attachment) {
    logger.debug('Got attachment', attachment);
    attachmentsModule.storeAttachment(attachment.fileName, attachment.contentType, attachment.length,
      attachment.stream, function(err, attachmentModel) {
        if (err) {
          logger.debug('Error while saving attachment.', err);
          errors.push(err);
        }
      });
  });
  stream.pipe(mailparser);
}

module.exports.saveEmail = saveEmail;
