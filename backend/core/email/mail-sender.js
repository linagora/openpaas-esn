'use strict';

var nodemailer = require('nodemailer');
var emailTemplates = require('email-templates');
var path = require('path');
var logger = require('../logger');
var config = require('../config')('default');
var attachmentHelpers = require('./attachment-helpers');

var DEFAULT_NO_REPLY = 'no-reply@openpaas.org';
var templatesDir = (config.email && config.email.templatesDir) || path.resolve(__dirname + '/../../../templates/email');

function init(mailConfig) {
  var transport;
  var noreply = (mailConfig.mail && mailConfig.mail.noreply) ? mailConfig.mail.noreply : DEFAULT_NO_REPLY;

  return {
    send: send,
    sendHTML: sendHTML
  };

  /**
   * Initialize the mail transport on first call else get it from cache
   *
   * @param {function} done
   * @return {*}
   */
  function getMailTransport(done) {
    if (transport) {
      return done(null, transport);
    }

    if (!mailConfig.transport) {
      return done(new Error('Mail transport is not configured'));
    }

    // require the nodemailer transport module if it is an external plugin
    if (mailConfig.transport.module) {
      try {
        var nodemailerPlugin = require(mailConfig.transport.module);

        transport = nodemailer.createTransport(nodemailerPlugin(mailConfig.transport.config));
      } catch (err) {
        return done(err);
      }
    } else {
      transport = nodemailer.createTransport(mailConfig.transport.config);
    }

    return done(null, transport);
  }

  /**
   * Send an HTML email rendered from a template
   *
   * @param {object} message      - message object forwarded to nodemailer
   * @param {string} templateName - template name forwarded to email-templates
   * @param {object} locals       - locals object forwarded to email-templates
   * @param {function} done       - callback function like fn(err, response)
   * @return {*}
   */
  function sendHTML(message, templateName, locals, done) {

    if (!_validate(message, false, done)) {
      return;
    }

    getMailTransport(function(err, transport) {
      if (err) {
        return done(err);
      }

      emailTemplates(templatesDir, function(err, template) {
        if (err) {
          return done(err);
        }

        locals.juiceOptions = { removeStyleTags: false };
        locals.pretty = true;

        template(templateName, locals, function(err, html, text) {
          if (err) {
            return done(err);
          }

          message.from = message.from || noreply;
          message.html = html;
          message.text = text;

          if (attachmentHelpers.hasAttachments(templatesDir, templateName)) {
            attachmentHelpers.getAttachments(templatesDir, templateName, locals.filter, function(err, attachments) {
              if (err) {
                return done(err);
              }

              if (Array.isArray(message.attachments)) {
                message.attachments = message.attachments.concat(attachments);
              } else {
                message.attachments = attachments;
              }

              _sendRaw(transport, message, done);

            });
          } else {
            _sendRaw(transport, message, done);
          }
        });
      });
    });
  }

  /**
   * Send an email to recipient
   *
   * @param {object} message - message object forwarded to nodemailer
   * @param {function} done  - callback function like fn(err, response)
   * @return {*}
   */
  function send(message, done) {

    if (!_validate(message, true, done)) {
      return;
    }

    getMailTransport(function(err, transport) {
      if (err) {
        return done(err);
      }

      message.from = message.from || noreply;

      _sendRaw(transport, message, done);
    });
  }

  /**
   * Send raw email using mail transport
   * @param  {Object}   transport mail transport object
   * @param  {Object}   message   message object forwarded to nodemailer
   * @param  {Function} done      callback function like fn(err, response)
   * @return {*}
   */
  function _sendRaw(transport, message, done) {
    transport.sendMail(message, function(err, response) {
      if (err) {
        logger.error('Error while sending email %s', err.message);

        return done(err);
      }
      logger.debug('Email has been sent to %s from %s', message.to, message.from);
      done(null, response);
    });
  }

  /**
   * Validate email message
   * @param  {Object} message message object to be validated
   * @param  {Boolean} requireContent require text/html attribute or not
   * @return {Boolean}         Return true if the message is well-formed
   */
  function _validate(message, requireContent, done) {
    if (!message) {
      done(new Error('message must be an object'));

      return false;
    }

    if (!message.to) {
      done(new Error('message.to can not be null'));

      return false;
    }

    if (requireContent && !message.text && !message.html) {
      done(new Error('message content can not be null'));

      return false;
    }

    return true;
  }
}

module.exports = init;
