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
  if (!mailConfig) {
    throw new Error('mailConfig cannot be null');
  }

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
  function getMailTransport(callback) {
    if (transport) {
      return callback(null, transport);
    }

    if (!mailConfig.transport) {
      return callback(new Error('Mail transport is not configured'));
    }

    // require the nodemailer transport module if it is an external plugin
    if (mailConfig.transport.module) {
      try {
        var nodemailerPlugin = require(mailConfig.transport.module);

        transport = nodemailer.createTransport(nodemailerPlugin(mailConfig.transport.config));
      } catch (err) {
        return callback(err);
      }
    } else {
      transport = nodemailer.createTransport(mailConfig.transport.config);
    }

    return callback(null, transport);
  }

  /**
   * Send an HTML email rendered from a template
   *
   * @param {object} message      - message object forwarded to nodemailer
   * @param {string} templateName - template name forwarded to email-templates
   * @param {object} locals       - locals object forwarded to email-templates
   * @param {function} callback       - callback function like fn(err, response)
   * @return {*}
   */
  function sendHTML(message, templateName, locals, callback) {

    if (!_validate(message, false, callback)) {
      return;
    }

    getMailTransport(function(err, transport) {
      if (err) {
        return callback(err);
      }

      emailTemplates(templatesDir, function(err, template) {
        if (err) {
          return callback(err);
        }

        locals.juiceOptions = { removeStyleTags: false };
        locals.pretty = true;

        template(templateName, locals, function(err, html, text) {
          if (err) {
            return callback(err);
          }

          message.from = message.from || noreply;
          message.html = html;
          message.text = text;

          if (attachmentHelpers.hasAttachments(templatesDir, templateName)) {
            attachmentHelpers.getAttachments(templatesDir, templateName, locals.filter, function(err, attachments) {
              if (err) {
                return callback(err);
              }

              if (Array.isArray(message.attachments)) {
                message.attachments = message.attachments.concat(attachments);
              } else {
                message.attachments = attachments;
              }

              _sendRaw(transport, message, callback);
            });
          } else {
            _sendRaw(transport, message, callback);
          }
        });
      });
    });
  }

  /**
   * Send an email to recipient
   *
   * @param {object} message - message object forwarded to nodemailer
   * @param {function} callback  - callback function like fn(err, response)
   * @return {*}
   */
  function send(message, callback) {

    if (!_validate(message, true, callback)) {
      return;
    }

    getMailTransport(function(err, transport) {
      if (err) {
        return callback(err);
      }

      message.from = message.from || noreply;

      _sendRaw(transport, message, callback);
    });
  }

  /**
   * Send raw email using mail transport
   * @param  {Object}   transport mail transport object
   * @param  {Object}   message   message object forwarded to nodemailer
   * @param  {Function} callback      callback function like fn(err, response)
   * @return {*}
   */
  function _sendRaw(transport, message, callback) {
    transport.sendMail(message, function(err, response) {
      if (err) {
        logger.error('Error while sending email %s', err.message);

        return callback(err);
      }
      logger.debug('Email has been sent to %s from %s', message.to, message.from);
      callback(null, response);
    });
  }

  /**
   * Validate email message
   * @param  {Object} message message object to be validated
   * @param  {Boolean} requireContent require text/html attribute or not
   * @return {Boolean}         Return true if the message is well-formed
   */
  function _validate(message, requireContent, callback) {
    if (!message) {
      callback(new Error('message must be an object'));

      return false;
    }

    if (!message.to) {
      callback(new Error('message.to can not be null'));

      return false;
    }

    if (requireContent && !message.text && !message.html) {
      callback(new Error('message content can not be null'));

      return false;
    }

    return true;
  }
}

module.exports = init;
