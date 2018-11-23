'use strict';

module.exports = function(dependencies) {
  const logger = dependencies('logger');
  const vcardHandler = require('./vcard-handler')(dependencies);
  const davImport = dependencies('dav.import');

  return {
    init
  };

  function init() {
    if (davImport) {
      davImport.lib.importer.addFileHandler(vcardHandler.contentTypes, vcardHandler);
    } else {
      logger.warn('linagora.esn.dav.import module is not enabled, importing contact from .vcf files will not work');
    }
  }
};
