'use strict';

function store(callback) {
  var esnConf = require('../esn-config');
  var user = esnConf('user');

  user.get(function(err, doc) {
    if (err || !doc) {
      user.store(require('./data/user-template.js'), callback);
    }
  });
}

module.exports.store = store;
