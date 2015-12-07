'use strict';

module.exports = function(dependencies, lib) {

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
      return res.status(500).json(err);
    });
  }

  return {
    importContacts: importContacts
  };

};
