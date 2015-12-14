'use strict';

module.exports = function(dependencies, lib) {

  var logger = dependencies('logger');

  function importContacts(req, res) {
    lib.importAccountContacts(req.user, req.account).then(function() {
      return res.status(202).json();
    }, function(err) {
      logger.error('Error while importing contacts', err);
      return res.status(500).json({error: {code: 500, message: 'Server Error', details: 'Error while importing contacts'}});
    });
  }

  return {
    importContacts: importContacts
  };

};
