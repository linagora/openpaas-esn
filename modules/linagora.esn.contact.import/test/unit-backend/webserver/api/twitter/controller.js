'use strict';

var chai = require('chai');
var expect = chai.expect;
var mockery = require('mockery');
var q = require('q');

describe('The twitter controller', function() {

  var req = {
    token: {
      token: 123
    },
    user: {
      id: 456
    }
  };
  var twitterLibMock = {
    importer: {
      importContact: function() {

      }
    }
  };
  var getController = function() {
    return require('../../../../../backend/webserver/api/twitter/controller')();
  };

  beforeEach(function() {
    mockery.registerMock('../../../lib/twitter', function() {
      return twitterLibMock;
    });
  });

  it('should return 500 if can not get oauth config', function(done) {
    twitterLibMock.importer.importContact = function() {
      return q.reject('Can not get ouath config');
    };
    getController().importTwitterFollowing(req, {
      status: function(code) {
        expect(code).to.equal(500);
        return {
          json: function(data) {
            expect(data).to.match(/Can not get ouath config/);
            done();
          }
        };
      }
    });
  });

  it('should return 202 if success getting oauth config', function(done) {
    twitterLibMock.importer.importContact = function() {
      return q.resolve();
    };
    getController().importTwitterFollowing(req, {
      status: function(code) {
        expect(code).to.equal(202);
        done();
      }
    });
  });
});
