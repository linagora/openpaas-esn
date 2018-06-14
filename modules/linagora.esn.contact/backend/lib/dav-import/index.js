'use strict';

module.exports = function(dependencies) {
  const vcardHandler = require('./vcard-handler')(dependencies);
  const davImport = dependencies('dav.import');

  return {
    init
  };

  function init() {
    davImport.lib.importer.addFileHandler(vcardHandler.contentType, vcardHandler);
  }
};
