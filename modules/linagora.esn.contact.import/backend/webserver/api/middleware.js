'use strict';

module.exports = function(dependencies, lib) {

  function getImporter(req, res, next) {

    var type = req.params.type;
    var importer = lib.importers.get(type);
    if (!importer || !importer.lib || !importer.lib.importer) {
      return res.status(404).json({error: {status: 404, message: 'Not found', details: 'Can not find importer'}});
    }

    req.importer = importer.lib.importer;
    next();
  }

  function checkRequiredBody(req, res, next) {
    if (!req.body || !req.body.account_id) {
      return res.status(400).json({error: {status: 400, message: 'Bad Request', details: 'account_id is required'}});
    }
    next();
  }

  return {
    getImporter: getImporter,
    checkRequiredBody: checkRequiredBody
  };

};
