'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');
var q = require('q');

describe('The thing controller', function() {
  var controller, mockedCore;

  before(function() {
    mockedCore = function(dependencies) {
      return {
        getOne: function(id) {
          var defer = q.defer();
          if (id === '1234') {
            defer.resolve({id: '1234'});
          } else if (id === '4321') {
            defer.reject(new Error());
          } else {
            defer.resolve();
          }
          return defer.promise;
        }
      };
    };
  });

  beforeEach(function() {
    mockery.registerMock('./thing.core', mockedCore);
    controller = require(this.moduleHelpers.backendPath + '/webserver/api/thing/thing.controller')(this.moduleHelpers.dependencies);
  });

  describe('getOne method', function() {

    it('should send back 404 if thing is not found', function(done) {
      var res = {
        json: function(code, body) {
          expect(code).to.equal(404);
          expect(body).to.equal('Not Found');
          done();
        }
      };
      var req = {
        params: {
          id: '1111'
        }
      };

      controller.getOne(req, res);
    });

    it('should send back 200 with thing if it is found', function(done) {
      var res = {
        json: function(code, body) {
          expect(code).to.equal(200);
          expect(body).to.deep.equal({ id: '1234' });
          done();
        }
      };
      var req = {
        params: {
          id: '1234'
        }
      };

      controller.getOne(req, res);
    });

    it('should send back 500 if an error occured', function(done) {
      var res = {
        json: function(code, body) {
          expect(code).to.equal(500);
          expect(body).to.equal('Server Error');
          done();
        }
      };
      var req = {
        params: {
          id: '4321'
        }
      };

      controller.getOne(req, res);
    });

  });

  describe('create method', function() {

    it('should be tested', function() {
      expect(true).to.be.true;
    });

  });

  describe('remove method', function() {

    it('should be tested', function() {
      expect(true).to.be.true;
    });

  });

});
