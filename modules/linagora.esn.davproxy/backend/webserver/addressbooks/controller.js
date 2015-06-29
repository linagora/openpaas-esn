'use strict';

module.exports = function(dependencies) {

  function list(req, res) {
    return res.json(200, []);
  }

  return {
    list: list
  };

};
