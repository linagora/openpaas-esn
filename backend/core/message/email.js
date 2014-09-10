'use strict';

var MailParser = require('mailparser').MailParser;
var mongoose = require('mongoose');
var EmailMessage = mongoose.model('EmailMessage');
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
    mail.author = author;

    if (mail_object.from && mail_object.from.length > 0) {
      mail.from = mail_object.from[0].address;
    }

    if (mail_object.to) {
      mail.to = mail_object.to.map(function(to) {
        return to.address;
      });
    }

    if (mail_object.cc) {
      mail.cc = mail_object.cc.map(function(cc) {
        return cc.address;
      });
    }
    mail.subject = mail_object.subject;

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
