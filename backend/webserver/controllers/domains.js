'use strict';

var domain = require('../../core').domain;

function companyExists(req, res) {
  var company_name = req.params.name;

  if (!company_name) {
    return res.json(400, { error: { status: 400, message: 'Bad Request', details: 'company name is required'}});
  }

  domain.testCompany(company_name, function(err, company) {
    if (err) {
      res.json(500, { error: { status: 500, message: 'Server Error', details: 'Can not access domains with ' + company_name}});
    } else if (company) {
      res.json(200, { company_name: company_name, exists: true });
    }else {
      res.json(404, { company_name: company_name, exists: false});
    }
  });
}

module.exports.companyExists = companyExists;
