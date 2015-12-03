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

  return {
    getImporter: getImporter
  };

};
