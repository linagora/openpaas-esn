'use strict';

const expect = require('chai').expect;
const mockery = require('mockery');
const q = require('q');

describe('The ldap controller', function() {
  describe('The search fn', function() {
    it('should return HTTP 500 when search process has error', function(done) {
      const ldapCoreMock = {
        search: function() {
          return q.reject(new Error('Something error'));
        }
      };

      mockery.registerMock('mongoose', {model: function() {}});
      mockery.registerMock('../../core/ldap', ldapCoreMock);

      const req = {
      };
      const res = this.helpers.express.jsonResponse(
        function(status) {
          expect(status).to.equal(500);
          done();
        }
      );
      const controller = this.helpers.requireBackend('webserver/controllers/ldap');

      controller.search(req, res);
    });

    it('should return HTTP 200 with list of users', function(done) {
      const ldapCoreMock = {
        search: function() {
          return q.resolve([]);
        }
      };

      mockery.registerMock('mongoose', {model: function() {}});
      mockery.registerMock('../../core/ldap', ldapCoreMock);

      const req = {
        user: {
          _id: 123456789
        },
        query: {
          search: 'a',
          limit: 20
        }
      };
      const res = this.helpers.express.jsonResponse(
        function(status) {
          expect(status).to.equal(200);
          done();
        }
      );
      const controller = this.helpers.requireBackend('webserver/controllers/ldap');

      controller.search(req, res);
    });
  });
});
