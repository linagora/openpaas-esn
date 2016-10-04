'use strict';

var mongoose = require('mongoose');
var Domain = mongoose.model('Domain');

function search(req, res) {
  var company_name = req.query.name;

  if (!company_name) {
    return res.status(400).send({ error: { status: 400, message: 'Bad Request', details: 'company name is required'}});
  }

  Domain.testCompany(company_name, function(err, company) {

    if (err) {
      return res.status(500).send({ error: { status: 500, message: 'Server Error', details: 'Can not access domains with ' + company_name}});
    }

    if (company) {
      return res.status(200).send([{name: company_name}]);
    }

    return res.status(404).end();
  });
}

module.exports.search = search;
