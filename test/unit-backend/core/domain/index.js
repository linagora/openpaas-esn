'use strict';

var mockery = require('mockery');
var expect = require('chai').expect;

describe('The domain module', function() {
  describe('The load fn', function() {
    it('should send back error when id is undefined', function(done) {
      var mongooseMock = {
        model: function() {
          return {};
        }
      };
      mockery.registerMock('mongoose', mongooseMock);
      var domain = require(this.testEnv.basePath + '/backend/core/domain');
      domain.load(null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should call Domain.findOne', function(done) {
      var called = false;
      var mongooseMock = {
        model: function() {
          return {
            findOne: function(id, callback) {
              called = true;
              return callback();
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongooseMock);
      var domain = require(this.testEnv.basePath + '/backend/core/domain');
      domain.load(123, function(err) {
        expect(err).to.not.exist;
        expect(called).to.be.true;
        done();
      });
    });
  });
});
