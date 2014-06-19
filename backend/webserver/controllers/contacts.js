'use strict';

var mongoose = require('mongoose');
var Invitation = mongoose.model('Invitation');
var OAuth2Client = require('googleapis').OAuth2Client;
var https = require('https');
var googleContacts = require('../../core/contact/google');
var contactModule = require('../../core').contact;
var logger = require('../../core').logger;
var domainModule = require('../../core/user/domain');

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

var singleClient = null;
function getGoogleOAuthClient(baseUrl) {
  if (!singleClient) {
    var CLIENT_ID = '810414134078-2mvksu56u3grvej4tg67pb64tlmsqf92.apps.googleusercontent.com';
    var CLIENT_SECRET = 'h-9jLjgIsugUlKYhv2ThV11E';
    var REDIRECT_URL = baseUrl + '/api/contacts/google/callback';
    singleClient = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
  }
  return singleClient;
}

function getGoogleOAuthURL(req, res) {
  var oauth2Client = getGoogleOAuthClient(req.protocol + '://' + req.get('host'));
  var url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: 'https://www.google.com/m8/feeds'
  });
  res.json({url: url});
}
module.exports.getGoogleOAuthURL = getGoogleOAuthURL;


function fetchGoogleContacts(req, response) {
  if (!req.user || !req.user.emails || !req.user.emails.length) {
    return response.send(500, 'User not set');
  }

  var code = req.query.code;
  if (!code) {
    return response.redirect('/#/contacts');
  }

  var oauth2Client = getGoogleOAuthClient(req.protocol + '://' + req.get('host'));
  oauth2Client.getToken(code, function(err, tokens) {
    if (err) {
      return response.json(500, {error: 500, message: 'Could not get authentication token', details: err});
    }

    oauth2Client.setCredentials(tokens);
    var options = {
      host: 'www.google.com',
      port: 443,
      path: '/m8/feeds/contacts/default/full',
      headers: {
        'GData-Version': '3.0',
        'Authorization': 'Bearer ' + oauth2Client.credentials.access_token
      }
    };

    https.get(options, function(res) {
      var body = '';
      res.on('data', function(data) {
        body += data;
      });

      res.on('end', function() {
        googleContacts.saveGoogleContacts(body, req.user, function(err) {
          if (err) {
            return response.json(500, {error: 500, message: 'Could not save contacts', details: err});
          }
          response.redirect('/#/contacts');
        });
      });

      res.on('error', function(e) {
        return response.json(500, {error: 500, message: 'Contact fetch error', details: e});
      });
    });
  });

}
module.exports.fetchGoogleContacts = fetchGoogleContacts;

function sendInvitation(req, res) {
  var contact = req.contact;
  var user = req.user;
  var domain_id = req.body.domain;

  if (!domain_id) {
    return response.json(400, {error: 400, message: 'Bad request', details: 'Domain is required'});
  }

  if (!contact || !contact.emails || contact.emails.length === 0) {
    return response.json(400, {error: 400, message: 'Bad request', details: 'Missing contact information'});
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
        email: email
      }
    };

    handler.validate(payload, function (err, result) {
      if (err || !result) {
        logger.warn('Invitation data is not valid %s : %s', payload, err ? err.message : result);
        return callback();
      }

      var invitation = new Invitation(payload);
      invitation.save(function (err, saved) {
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
};
module.exports.sendInvitation = sendInvitation;

function getInvitations(req, res) {
  var contact = req.contact;
  if (!contact || !contact.emails || contact.emails.length === 0) {
    return response.json(400, {error: 400, message: 'Bad request', details: 'Missing contact information'});
  }
  var query = {
    type: 'addmember',
    'data.email': contact.emails[0]
  };

  Invitation.find(query, function(err, invitations) {
    if (err) {
      return res.json(500, {error: 500, message: 'Server Error', details: err.message});
    }
    if (!invitations) {
      return res.json(404);
    }
    return res.json(200, invitations);
  });
};
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
    console.log(contact);
    return next();
  });
}
module.exports.load = load;