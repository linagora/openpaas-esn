'use strict';

var mongoose = require('mongoose');
var contactModule = require('../../core').contact;

function isValidObjectId(id) {
  try {
    new mongoose.Types.ObjectId(id);
  } catch (e) {
    return false;
  }
  return true;
}

var areAddressBookIdsValid = function(address_book_ids) {
  var idArray;
  if (address_book_ids instanceof Array) {
    idArray = address_book_ids;
  }
  else {
    idArray = [address_book_ids];
  }
  var valid = true;
  idArray.forEach(function(id) {
    if (!isValidObjectId(id)) {
      valid = false;
    }
  });
  return valid;
};

function getContacts(req, res) {
  if (!req.query.owner) {
    return res.json(412, {error: {status: 412, message: 'parameter missing', details: '"owner" parameter should be set'}});
  }

  if (!isValidObjectId(req.query.owner)) {
    return res.json(412, {error: {status: 412, message: 'Invalid parameter', details: '"owner" parameter should be a valid objectId'}});
  }

  var query = {
    owner: req.query.owner,
    query: req.param('search') || null,
    addressbooks: req.param('addressbooks') || null
  };

  if (req.param('limit')) {
    var limit = parseInt(req.param('limit'));
    if (!isNaN(limit)) {
      query.limit = limit;
    }
  }
  if (req.param('offset')) {
    var offset = parseInt(req.param('offset'));
    if (!isNaN(offset)) {
      query.offset = offset;
    }
  }
  if (query.addressbooks && !areAddressBookIdsValid(query.addressbooks)) {
    return res.json(400, { error: { status: 400, message: 'Server error', details: 'Bad request : address book id is not a valid id'}});
  }

contactModule.list(query, function(err, response) {
    if (err) {
      return res.json(500, { error: { status: 500, message: 'Contacts list failed', details: err}});
    }
    res.header('X-ESN-Items-Count', response.count);
    return res.json(200, response.items);
  });
}
module.exports.getContacts = getContacts;
