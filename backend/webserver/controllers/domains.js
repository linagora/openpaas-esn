'use strict';

var mongoose = require('mongoose');
var Domain = mongoose.model('Domain');
var User = mongoose.model('User');

function doesCompanyExist(req, res) {
  var company_name = req.params.name;

  if (!company_name) {
    return res.send(400, { error: { status: 400, message: 'Bad Request', details: 'company name is required'}});
  }

  Domain.testCompany(company_name, function(err, company) {

    if (err) {
      return res.send(500, { error: { status: 500, message: 'Server Error', details: 'Can not access domains with ' + company_name}});
    }

    if (company) {
      return res.send(200);
    }

    return res.send(404);
  });
}

module.exports.doesCompanyExist = doesCompanyExist;

function createDomain(req, res) {

  var data = req.body;
  var company_name = data.company_name;
  var name = data.name;

  if (!data.administrator) {
    return res.send(400, { error: { status: 400, message: 'Bad Request', details: 'An administrator is required (email(s), firstname and lastname)'}});
  }

  var u = new User(data.administrator);

  u.save(function(err, savedUser) {
    if (err) {
      return res.send(500, { error: { status: 500, message: 'Server Error', details: 'Can not create user administrator (at least one email address is required).' + err.message}});
    }

    var domainJson = {
      name: name,
      company_name: company_name,
      administrator: savedUser
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
  });
}

module.exports.createDomain = createDomain;
