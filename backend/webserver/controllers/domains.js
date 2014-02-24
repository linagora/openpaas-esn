'use strict';

var domain = require('../../core').domain;

function doesCompanyExist(req, res) {
  var company_name = req.params.name;

  if (!company_name) {
    return res.send(400, { error: { status: 400, message: 'Bad Request', details: 'company name is required'}});
  }

  domain.testCompany(company_name, function(err, company) {

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
