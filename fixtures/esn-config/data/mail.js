'use strict';

module.exports = function() {
  return {
    'mail': {
      'noreply': 'noreply@openpaas.io'
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

