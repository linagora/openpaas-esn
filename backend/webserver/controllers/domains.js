'use strict';

var mongoose = require('mongoose');
var Domain = mongoose.model('Domain');
var User = mongoose.model('User');
var userDomain = require('../../core/user/domain');
var logger = require('../../core').logger;
var async = require('async');
var pubsub = require('../../core/pubsub').local;

function createDomain(req, res) {
  var data = req.body;
  var company_name = data.company_name;
  var name = data.name;

  if (!data.administrator) {
    return res.send(400, { error: { status: 400, message: 'Bad Request', details: 'An administrator is required'}});
  }

  var u = new User(data.administrator);

  if (u.emails.length === 0) {
    return res.send(400, { error: { status: 400, message: 'Bad Request', details: 'At least one administrator email address is required'}});
  }

  var domainJson = {
    name: name,
    company_name: company_name,
    administrator: u
  };

  var domain = new Domain(domainJson);

  domain.save(function(err, saved) {
    if (err) {
      return res.send(500, { error: { status: 500, message: 'Server Error', details: 'Can not create domains ' + name + '. ' + err.message}});
    }
    if (saved) {
      return res.send(201);
    }

    return res.send(404);
  });
}

module.exports.createDomain = createDomain;

/**
 * Get Members of a domain
 *
 * @param {Request} req
 * @param {Response} res
 */
function getMembers(req, res) {
  var uuid = req.params.uuid;
  if (!uuid) {
    return res.json(400, {error: {code: 400, message: 'Bad parameters', details: 'Domain ID is missing'}});
  }

  var query = {
    limit: req.param('limit') || 50,
    offset: req.param('offset') || 0,
    search: req.param('search') || null
  };

  Domain.loadFromID(uuid, function(err, domain) {
    if (err) {
      return res.json(500, { error: { status: 500, message: 'Server error', details: 'Can not load domain: ' + err.message}});
    }

    if (!domain) {
      return res.json(404, { error: { status: 404, message: 'Not Found', details: 'Domain ' + uuid + ' has not been found'}});
    }

    userDomain.getUsers(domain, query, function(err, result) {
      if (err) {
        return res.json(500, { error: { status: 500, message: 'Server error', details: 'Error while getting members: ' + err.message}});
      }

      res.header('X-ESN-Items-Count', result.total_count);
      return res.json(200, result.list);
    });
  });
}
module.exports.getMembers = getMembers;

/**
 * Load middleware. Load a domain from its UUID and push it into the request (req.domain) for later use.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
function load(req, res, next) {
  Domain.loadFromID(req.params.uuid, function(err, domain) {
    if (err) {
      return next(err);
    }
    if (!domain) {
      return res.send(404);
    }
    req.domain = domain;
    return next();
  });
}
module.exports.load = load;

/**
 * Send invitations to a list of emails.
 *
 * @param {Request} req - The request with user and domain as attribute. The body MUST contains an array of emails.
 * @param {Response} res
 */
function sendInvitations(req, res) {
  if (!req.body || !(req.body instanceof Array)) {
    return res.json(400, { error: { status: 400, message: 'Bad request', details: 'Missing input emails'}});
  }

  var emails = req.body;
  var user = req.user;
  var domain = req.domain;
  var handler = require('../../core/invitation');
  var Invitation = mongoose.model('Invitation');
  var sent = [];

  res.send(202);

  var sendInvitation = function(email, callback) {

    var payload = {
      type: 'addmember',
      data: {
        user: user,
        domain: domain,
        email: email
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
          logger.error('Can not save invitation %s : %s', payload, err.message);
          return callback();
        }

        saved.data.url = require('./invitation').getInvitationURL(req, saved);
        handler.init(saved, function(err, result) {
          if (err || !result) {
            logger.error('Invitation can not be initialized %s : %s', saved, err ? err.message : result);
          } else {
            sent.push(email);
          }
          return callback();
        });
      });
    });
  };

  async.eachLimit(emails, 10, sendInvitation, function(err) {
    if (err) {
      logger.error('Unexpected error occured : %s', err);
    }
    logger.info('Invitations have been sent to emails %s', '' + sent);
    pubsub.topic('domain:invitations:sent').publish({user: user._id, domain: domain._id, emails: sent});
  });
}
module.exports.sendInvitations = sendInvitations;

function getDomain(req, res) {
  if (req.domain) {
    return res.json(200, req.domain);
  }
  return res.json(404, {error: 404, message: 'Not found', details: 'Domain not found'});
}
module.exports.getDomain = getDomain;
