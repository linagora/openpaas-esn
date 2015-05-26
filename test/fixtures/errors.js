'use strict';

module.exports = {
  send: function(res, code, error) {
    res.json(code, error);
  }
};
