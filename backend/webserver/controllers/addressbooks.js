'use strict';

var addressbookModule = require('../../core').addressbook;
var mongoose = require('mongoose');

function isValidObjectId(id) {
  try {
    new mongoose.Types.ObjectId(id);
  } catch (e) {
    return false;
  }
  return true;
}

function getAddressBooks(req, res) {
  if (!req.query.creator) {
    return res.json(412, {error: {status: 412, message: 'parameter missing', details: '"creator" parameter should be set'}});
  }

  if (!isValidObjectId(req.query.creator)) {
    return res.json(412, {error: {status: 412, message: 'Invalid parameter', details: '"creator" parameter should be a valid objectId'}});
  }


  addressbookModule.list(req.query.creator, function(err, response) {
    if (err) {
      return res.json(500, { error: { status: 500, message: 'Can not load addressbooks', details: err}});
    }
    res.header('X-ESN-Items-Count', response.count);
    return res.json(200, response.items);
  });
}

module.exports = {
  getAddressBooks: getAddressBooks
};
