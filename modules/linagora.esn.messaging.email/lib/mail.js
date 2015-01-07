'use strict';

var MailParser = require('mailparser').MailParser;
var q = require('q');

module.exports = function(dependencies) {
  var attachmentsModule = dependencies('message').attachments;

  return {
    parse: function(stream, author, callback) {

      var attachments = [];
      var mailparser = new MailParser({streamAttachments: true});

      mailparser.on('end', function(mail_object) {
        q.all(attachments).then(function(attachmentModels) {

          var mail = {
            attachments: []
          };

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

          attachmentModels.forEach(function(model) {
            mail.attachments.push(model);
          });

          return callback(null, mail);
        }, function(err) {
          return callback(err);
        });
      });

      mailparser.on('attachment', function(attachment) {
        var d = q.defer();
        attachments.push(d.promise);
        var metaData = {
          name: attachment.fileName,
          contentType: attachment.contentType,
          length: attachment.length,
          creator: {objectType: 'user', id: author._id}
        };

        attachmentsModule.storeAttachment(metaData, attachment.stream, {chunk_size: 10}, function(err, attachmentModel) {
          if (err) {
            d.reject(err);
          } else {
            d.resolve(attachmentModel);
          }
        });
      });
      stream.pipe(mailparser);
    }
  };
};
