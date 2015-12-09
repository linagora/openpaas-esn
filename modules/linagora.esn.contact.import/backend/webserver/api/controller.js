'use strict';

module.exports = function(dependencies, lib) {

  var logger = dependencies('logger');

  function importContacts(req, res) {
    var options = {
      type: req.params.type,
      accountId: req.body.account_id,
      esnToken: req.token && req.token.token ? req.token.token : '',
      user: req.user
    };

    lib.importContacts(options).then(function() {
      return res.status(202).json();
    }, function(err) {
      logger.error('Error while importing contacts', err);
      return res.status(500).json({error: {status: 500, message: 'Server Error', details: 'Error while importing contacts'}});

    });
  }

  return {
    importContacts: importContacts
  };

};
