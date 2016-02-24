'use strict';

var mongoose = require('mongoose');
var User = mongoose.model('User');
var Community = mongoose.model('Community');
var esPlugin = require('./elasticsearch');
var userListener = require('../../../user/listener');
var communityListener = require('../../../community/listener');

function applyPlugins() {
  User.schema.plugin(esPlugin(userListener.getOptions()));
  Community.schema.plugin(esPlugin(communityListener.getOptions()));
}
module.exports.applyPlugins = applyPlugins;
