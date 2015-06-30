'use strict';

//
// Email service. Send emails to recipients in raw or HTML format.
//

var nodemailer = require('nodemailer');
var emailTemplates = require('email-templates');
var path = require('path');
var templatesDir = path.resolve(__dirname + '/templates');
var esnConf = require('../esn-config');
var logger = require('../../core/logger');
var transport;

var opts = {
  from: 'no-reply@openpaas.org'
};

/**
 * Set the nodemailer transport
 *
 * @param {transport} t
 */
exports.setTransport = function(t) {
  transport = t;
};

/**
 * Set the templates directory
 *
 * @param {string} t
 */
exports.setTemplatesDir = function(t) {
  templatesDir = t;
};

/**
 * Get the mail configuration
 *
 * @param {fn} done
 */
var mailconfig = function(done) {
  esnConf('mail').get(function(err, data) {
    return done(err, data ||  opts);
  });
};
exports.mailconfig = mailconfig;

/**
 * Initialize the mail transport on first call else get it from cache
 *
 * @param {fn} done
 */
var getMailTransport = function(done) {
  if (transport) {
    return done(null, transport);
  }

  mailconfig(function(err, data) {
    if (err) {
      return done(err);
    }
    if (!data.transport) {
      return done(new Error('Mail transport is not configured'));
    }
    // require the nodemailer transport module if it is an external plugin
    if (data.transport.module) {
      try {
        var nodemailerPlugin = require(data.transport.module);
        transport = nodemailer.createTransport(nodemailerPlugin(data.transport.config));
      } catch (err) {
        return done(err);
      }
    } else {
      transport = nodemailer.createTransport(data.transport.config);
    }
    return done(null, transport);
  });
};

/**
 * Check if template has attachments
 *
 * @param {string} template
 */
var hasAttachments = function(template) {
  return false;
};

/**
 * Get the template attachments as array of {filename, filepath, cid}
 *
 * @param {string} template
 */
var attachments = function(template) {
  return [];
};

/**
 * Send an HTML email rendered from a template
 *
 * @param {string} from - source
 * @param {string} to - recipient (as CSV if N recipients)
 * @param {string} type
 * @param {hash} locals
 * @param {fn} done
 */
exports.sendHTML = function(from, to, subject, type, locals, done) {
  if (!to) {
    return done(new Error('Recipient can not be null'));
  }

  getMailTransport(function(err, transport) {
    if (err) {
      return done(err);
    }

    emailTemplates(templatesDir, function(err, template) {
      if (err) {
        return done(err);
      }

      template(type, locals, function(err, html, text) {
        if (err) {
          return done(err);
        }

        mailconfig(function(err, data) {
          if (err) {
            return done(err);
          }
          var message = {
            from: from ||  data.from,
            to: to,
            subject: subject,
            html: html,
            text: text
          };

          if (hasAttachments(type)) {
            message.attachments = attachments(type);
            message.forceEmbeddedImages = true;
          }
          transport.sendMail(message, function(err, response) {
            if (err) {
              logger.warn('Error while sending email %s', err.message);
              return done(err);
            }
            logger.debug('Email has been sent to %s from %s', to, from);
            done(null, response);
          });
        });
      });
    });
  });
};

/**
 * Send raw email to recipient
 *
 * @param {string} from - source
 * @param {string} to - recipient (as CSV if multiple recipients)
 * @param {string} text
 * @param {fn} done
 */
exports.send = function(from, to, subject, text, done) {
  if (!to) {
    return done(new Error('Recipient can not be null'));
  }
  if (!text) {
    return done(new Error('Email content can not be null'));
  }

  getMailTransport(function(err, transport) {
    if (err) {
      return done(err);
    }

    mailconfig(function(err, data) {
      if (err) {
        return done(err);
      }

      var message = {
        from: from ||  data.from,
        to: to,
        subject: subject,
        text: text
      };
      transport.sendMail(message, function(err, response) {
        if (err) {
          logger.warn('Error while sending email %s', err.message);
          return done(err);
        }
        logger.debug('Email has been sent to %s from %s', to, from);
        done(null, response);
      });
    });
  });
};
