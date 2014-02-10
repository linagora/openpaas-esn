'use strict';

function store(callback) {
    var esnConf = require('../esn-config');
    var user = esnConf('user', 'templates');

    user.store(require('./data/user-template.js'), callback);
  }

module.exports.store = store;

