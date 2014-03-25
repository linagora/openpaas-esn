'use strict';

var mongoose = require('mongoose');
var Domain = mongoose.model('Domain');
var User = mongoose.model('User');
var userDomain = require('../../core/user/domain');

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
    limit: req.param('limit') ||  50,
    offset: req.param('offset') ||  0,
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

      res.header('X-ESN-Items-Count', result.length);
      return res.json(200, result);
    });
  });
}
module.exports.getMembers = getMembers;
