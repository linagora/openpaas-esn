'use strict';

const Q = require('q');
const path = require('path');
const logger = require('../logger');
const config = require('../config')('default');
const mailTransport = require('./mail-transport');
const messageBuilder = require('./message-builder');
const DEFAULT_NO_REPLY = 'no-reply@openpaas.org';
const TEMPLATES_DIR = (config.email && config.email.templatesDir) || path.resolve(__dirname + '/../../../templates/email');

module.exports = mailSender;

function mailSender(mailConfig) {
  if (!mailConfig) {
    throw new Error('mailConfig cannot be null');
  }

  const noreply = (mailConfig.mail && mailConfig.mail.noreply) ? mailConfig.mail.noreply : DEFAULT_NO_REPLY;

  return {
    send,
    sendHTML
  };

  /**
   * Send an HTML email rendered from a template
   *
   * @param {object} message      - message object forwarded to nodemailer
   * @param {string} template     - template object with name + optional path
   * @param {object} locals       - locals object forwarded to email-templates
   * @param {function} callback   - callback function like fn(err, response)
   * @return {*}
   */
  function sendHTML(message, template, locals, callback) {
    if (!_validate(message, false, callback)) {
      return;
    }

    Q.all([
      _getTransport(),
      messageBuilder({ noreply, defaultTemplatesDir: TEMPLATES_DIR})(message, template, locals)
    ])
    .spread((transport, htmlMessage) => {
      _sendRaw(transport, htmlMessage, callback);
    })
    .catch(callback);
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

    _getTransport().then(transport => {
      message.from = message.from || noreply;
      _sendRaw(transport, message, callback);
    }).catch(callback);
  }

  /**
   * Send raw email using mail transport
   * @param  {Object}   transport mail transport object
   * @param  {Object}   message   message object forwarded to nodemailer
   * @param  {Function} callback      callback function like fn(err, response)
   * @return {*}
   */
  function _sendRaw(transport, message, callback) {
    transport.sendMail(message, (err, response) => {
      if (err) {
        logger.error(`Error while sending email ${err.message}`);

        return callback(err);
      }

      logger.debug(`Email has been sent to ${message.to} from ${message.from}`);
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

  function _getTransport() {
    return mailTransport.get(mailConfig).then(transport => {
      if (!transport) {
        throw new Error('Transport can not be found');
      }

      return transport;
    });
  }
}
