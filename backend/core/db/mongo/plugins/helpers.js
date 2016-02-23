'use strict';

var User = require('mongoose').model('User');
var esPlugin = require('./elasticsearch');
var userListener = require('../../../user/listener');

function applyPlugins() {
  User.schema.plugin(esPlugin(userListener.getOptions()));
}
module.exports.applyPlugins = applyPlugins;
