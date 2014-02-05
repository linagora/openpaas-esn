'use strict';

var esnConfig = require(__dirname + '/../../core')['esn-config'];
var extend = require('extend');
var User = require(__dirname + '/../../core').db.mongo.user;

function getUserTemplate(callback) {
  esnConfig('user', 'templates').get(callback);
}

function extendUserTemplate(template, data) {
  extend(template, data);
}

function recordUser(userData, callback) {
  var user = new User(userData);
  user.save(callback);
}

module.exports.provisionUser = function(data, callback) {
  getUserTemplate(function(err, user) {
    if (err) {
      return callback(err);
    }
    delete user._id;
    extendUserTemplate(user, data);
    recordUser(user, callback);
  });
};
