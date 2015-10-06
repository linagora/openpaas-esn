'use strict';

var expect = require('chai').expect;

describe('The Accounts Controller', function() {

  function requireController(dependencies) {
    return require('../../../../../backend/webserver/api/accounts/controller')(dependencies);
  }

  describe('The getAccounts function', function() {
    it('should return the user account list', function(done) {

      var res = {
        status: function(code) {
          expect(code).to.equal(200);
          return {
            json: function(data) {
              expect(data).to.deep.equal([]);
              done();
            }
          };
        }
      };
      requireController().getAccounts({}, res);
    });
  });
});
