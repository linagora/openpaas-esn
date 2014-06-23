'use strict';

var mongoose = require('mongoose');
var Invitation = mongoose.model('Invitation');
var contactModule = require('../../core').contact;
var logger = require('../../core').logger;
var domainModule = require('../../core/domain');

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

function sendInvitation(req, res) {
  var contact = req.contact;
  var user = req.user;
  var domain_id = req.body.domain;

  if (!domain_id) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Domain is required'});
  }

  if (!contact || !contact.emails || contact.emails.length === 0) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing contact information'});
  }

  var handler = require('../../core/invitation');
  var getInvitationURL = require('./invitation').getInvitationURL;

  res.send(202);

  var send = function(domain, email, callback) {

    var payload = {
      type: 'addmember',
      data: {
        user: user,
        domain: domain,
        email: email,
        contact_id: contact._id.toString()
      }
    };

    handler.validate(payload, function(err, result) {
      if (err || !result) {
        logger.warn('Invitation data is not valid %s : %s', payload, err ? err.message : result);
        return callback();
      }

      var invitation = new Invitation(payload);
      invitation.save(function(err, saved) {
        if (err) {
          return callback(err);
        }
        saved.data.url = getInvitationURL(req, saved);
        handler.init(saved, callback);
      });
    });
  };


  domainModule.load(domain_id, function(err, domain) {
    if (err || !domain) {
      logger.error('Invitation error');
      return;
    }

    send(domain, contact.emails[0], function(err, result) {
      if (err) {
        logger.error('Invitation error', err);
      } else {
        logger.info('Invitation sent', result);
      }
    });
  });
}
module.exports.sendInvitation = sendInvitation;

function getContactInvitations(req, res) {
  var contact = req.contact;
  if (!contact) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing contact information'});
  }
  var query = {
    type: 'addmember',
    'data.contact_id': contact._id.toString()
  };

  Invitation.find(query, function(err, invitations) {
    if (err) {
      return res.json(500, {error: 500, message: 'Server Error', details: err.message});
    }
    if (!invitations) {
      return res.json(200, []);
    }
    return res.json(200, invitations);
  });
}
module.exports.getContactInvitations = getContactInvitations;

/**
 * Get invitations for all given contact ids.
 *
 * @param {Request} req
 * @param {Response} res
 */
function getInvitations(req, res) {
  if (!req.query || !req.query.ids) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing ids in query'});
  }

  Invitation.find({type: 'addmember', 'data.contact_id': {'$in': req.query.ids}}).exec(function(err, result) {
    if (err) {
      return res.json(500, {error: 500, message: 'Server Error', details: err.message});
    }

    var foundIds = result.map(function(invitation) {
      return invitation.data.contact_id.toString();
    });
    req.query.ids.filter(function(id) {
      return foundIds.indexOf(id) < 0;
    }).forEach(function(id) {
      result.push({
        error: {
          status: 404,
          message: 'Not Found',
          details: 'The contact ' + id + ' does not have any pending invitation'
        }
      });
    });
    return res.json(200, result);
  });
}
module.exports.getInvitations = getInvitations;

function load(req, res, next) {
  contactModule.get(req.params.id, function(err, contact) {
    if (err) {
      return next(err);
    }
    if (!contact) {
      return res.send(404);
    }
    req.contact = contact;
    return next();
  });
}
module.exports.load = load;
