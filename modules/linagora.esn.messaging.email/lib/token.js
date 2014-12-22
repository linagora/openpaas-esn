'use strict';

module.exports = function(lib, dependencies) {

  function generateToken(data, callback) {
    var Token = lib.emailTokenModel;
    new Token(data).save(callback);
  }

  function getToken(token, callback) {
    lib.emailTokenModel.findOne({token: token}).exec(callback);
  }

  return {
    generateToken: generateToken,
    getToken: getToken
  };
};
