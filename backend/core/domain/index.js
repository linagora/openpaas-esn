'use strict';

var mongoose = require('mongoose');
var Domain = mongoose.model('Domain');

module.exports.testCompany = function(name, callback) {
  var query = {company_name: name};
  console.log('avant requete mongo');
  Domain.findOne(query, callback);
};
