'use strict';

module.exports = function() {

  var noreply = process.env.MAIL_NO_REPLY || 'noreply@open-paas.org';

  return {
    'mail': {
      'noreply': noreply
    },
    'transport': {
    'module': 'nodemailer-browser',
      'type': 'MailBrowser',
      'config': {
        'dir': '/tmp',
        'browser': true
      }
    }
  };
};

