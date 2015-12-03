'use strict';

var chai = require('chai');
var expect = chai.expect;

describe('The contact import middleware', function() {

  describe('The getImporter function', function() {

    var req, lib;

    beforeEach(function() {
      lib = {
        importers: {}
      };
      req = {
        params: {
          type: 'twitter'
        },
        token: {
          token: '123'
        },
        user: {
          _id: 1
        }
      };
    });

    var getMiddleware = function() {
      return require('../../../../backend/webserver/api/middleware')(function() {}, lib);
    };

    function checkResponseError(done) {
      return {
        status: function(code) {
          expect(code).to.equal(404);
          return {
            json: function() {
              done();
            }
          };
        }
      };
    }

    it('should send back HTTP 404 when importer is not found', function(done) {
      lib.importers.get = function() {
        return;
      };

      getMiddleware().getImporter(req, checkResponseError(done), function() {
        done(new Error());
      });
    });

    it('should send back HTTP 404 when importer.lib is undefined', function(done) {
      lib.importers.get = function() {
        return {};
      };

      getMiddleware().getImporter(req, checkResponseError(done), function() {
        done(new Error());
      });
    });

    it('should send back HTTP 404 when importer.lib.importer is undefined', function(done) {
      lib.importers.get = function() {
        return {lib: {}};
      };

      getMiddleware().getImporter(req, checkResponseError(done), function() {
        done(new Error());
      });
    });

    it('should set the importer and call next', function(done) {
      var importer = {foo: 'bar'};
      lib.importers.get = function() {
        return {lib: {importer: importer}};
      };

      getMiddleware().getImporter(req, {
        status: function() {
          done(new Error());
        }
      }, function() {
        expect(req.importer).to.deep.equal(importer);
        done();
      });
    });
  });
});
