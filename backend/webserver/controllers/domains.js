'use strict';

var mongoose = require('mongoose');
var Domain = mongoose.model('Domain');

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
  var company_name = req.params.company_name;
  var name = req.params.name;
  var data = req.body;

  if (!data.administrator || !data.administrator.email || !data.administrator.firstname || !data.administrator.lastname || !data.administrator.password) {
    return res.send(400, { error: { status: 400, message: 'Bad Request', details: 'An administrator is required (email, firstname, lastname and password)'}});
  }

  var json = {
    name: name,
    company_name: company_name,
    administrator: {
      firstname: data.administrator.firstname,
      lastname: data.administrator.lastname,
      email: data.administrator.email,
      password: data.administrator.password
    }
  };

  var domain = new Domain(json);

  domain.save(function(err, saved) {
    if (err) {
      return res.send(500, { error: { status: 500, message: 'Server Error', details: 'Can not create domains ' + name + '. ' + err.message}});
    }
    if (saved) {
      return res.send(200);
    }

    return res.send(404);
  });
}

module.exports.createDomain = createDomain;
