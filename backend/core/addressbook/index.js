'use strict';

var mongoose = require('mongoose');
var AddressBook = mongoose.model('AddressBook');

function list(creator, callback) {
  var query = {creator: creator};

  var abQuery = AddressBook.find().where(query);
  var totalAbQuery = require('extend')(true, {}, abQuery);
  totalAbQuery.count();

  return totalAbQuery.exec(function(err, count) {
    if (err) {
      err.queryType = 'count';
      return callback(err);
    }
    abQuery.exec(function(err, list) {
      if (err) {
        err.queryType = 'resultset';
        return callback(err);
      }
      return callback(null, {count: count, items: list});
    });
  });
}

module.exports.list = list;
