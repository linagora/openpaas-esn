'use strict';

var mongoose = require('mongoose');
var Domain = mongoose.model('Domain');
var User = mongoose.model('User');

function doDomainAndCompanyExist(req, res) {
  var company_name = req.params.company_name;
  var domain_name = req.params.domain_name;

  if (!company_name || !domain_name) {
    return res.send(400, { error: { status: 400, message: 'Bad Request', details: 'company and domain names are required'}});
  }

  Domain.testDomainCompany(company_name, domain_name, function(err, resp) {

    if (err) {
      return res.send(500, { error: { status: 500, message: 'Server Error', details: 'Can not access domains ' + domain_name + ' of ' + company_name}});
    }

    if (resp) {
      return res.send(200);
    }

    return res.send(404);
  });
}

module.exports.doDomainAndCompanyExist = doDomainAndCompanyExist;

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
