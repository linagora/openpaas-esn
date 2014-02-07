'use strict';

function addUserTemplate(callback) {
    var esnConf = require('../core/esn-config');
    var user = esnConf('user', 'templates');

    user.store(require('./data/user-template.json'), function(err) {
        if (err) {
          return callback(err);
        }
      });
  }

module.exports.addUserTemplate = addUserTemplate();

