'use strict';

module.exports = function() {

  function importContacts(req, res) {
    var options = {
      accountId: req.body.account_id,
      esnToken: req.token && req.token.token ? req.token.token : '',
      user: req.user
    };

    req.importer.importContact(options)
      .then(function() {
        return res.status(202).json();
      }, function(err) {
        return res.status(500).json(err);
      });
  }

  return {
    importContacts: importContacts
  };

};
