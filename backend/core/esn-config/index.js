'use strict';

var mongoconfig = require('mongoconfig');
var mongoose = require('mongoose');
mongoconfig.setDefaultMongoose(mongoose);
module.exports = mongoconfig;
