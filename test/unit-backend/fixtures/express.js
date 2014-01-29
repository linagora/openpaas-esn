'use strict';

exports.express = function() {
  function expressMock() {
    return expressMock.constructorResponse;
  }
  expressMock.logger = function() {};
  expressMock.static = function() {};
  expressMock.bodyParser = function() {};
  expressMock.json = function() {};
  expressMock.constructorResponse = {
    listen: function() {},
    use: function() {},
    set: function() {},
    get: function() {},
    post: function() {},
    put: function() {}
  };

  return expressMock;
};
