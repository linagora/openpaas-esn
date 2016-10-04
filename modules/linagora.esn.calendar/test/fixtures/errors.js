'use strict';

module.exports = {
  send: function(res, code, error) {
    res.status(code).json(error);
  }
};
