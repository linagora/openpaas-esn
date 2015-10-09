'use strict';

module.exports = function(dependencies) {

  function getList(req, res) {
    return res.status(200).json([]);
  }

  return {
    getList: getList
  };

};
