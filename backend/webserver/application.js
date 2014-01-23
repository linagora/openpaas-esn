'use strict';
var express = require('express');
var i18n = require('../i18n');

var application = express();
exports = module.exports = application;
application.set('views', __dirname + '/views');
application.set('view engine', 'jade');
application.use(i18n.init); // Should stand before app.route
