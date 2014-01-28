'use strict';
var express = require('express');
var i18n = require('../i18n');
var fs = require('fs');

var application = express();
exports = module.exports = application;
application.set('views', __dirname + '/views');
application.set('view engine', 'jade');
application.use(i18n.init); // Should stand before app.route
application.use(express.bodyParser());
application.use(express.json());

// load the routes from the routes folder
var routes = __dirname + '/routes';
fs.readdirSync(routes).forEach(function(file) {
  require(routes + '/' + file)(application);
});


