'use strict';

module.exports = function(dependencies) {

  function getAccounts(req, res) {
    return res.status(200).json([]);
  }

  return {
    getAccounts: getAccounts
  };

};
