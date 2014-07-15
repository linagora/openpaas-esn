'use strict';

var mockery = require('mockery');
var expect = require('chai').expect;

describe('The communities module', function() {
  describe('The save fn', function() {
    it('should send back error if community is undefined', function(done) {
      var mongoose = {
        model: function() {}
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.save(null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should call save on mongoose model', function(done) {
      var mongoose = {
        model: function() {
          return function() {
            return {
              save: function() {
                return done();
              }
            };
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.save({}, function(err) {
        expect(err).to.exist;
        done();
      });
    });
  });

  describe('The load fn', function() {
    it('should send back error if community is undefined', function(done) {
      var mongoose = {
        model: function() {}
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.load(null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should call mongoose#findOne', function(done) {
      var mongoose = {
        model: function() {
          return {
            findOne: function() {
              return done();
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.load(123, function(err) {
        expect(err).to.not.exist;
      });
    });
  });

  describe('The query fn', function() {
    it('should call mongoose#find even when query is undefined', function(done) {
      var mongoose = {
        model: function() {
          return {
            find: function() {
              return done();
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.query(null, function(err) {
        expect(err).to.not.exist;
      });
    });

    it('should call mongoose#find even when query is defined', function(done) {
      var mongoose = {
        model: function() {
          return {
            find: function() {
              return done();
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.query({}, function(err) {
        expect(err).to.not.exist;
      });
    });
  });

  describe('The delete fn', function() {
    it('should send back error if community is undefined', function(done) {
      var mongoose = {
        model: function() {}
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.delete(null, function(err) {
        expect(err).to.exist;
        done();
      });
    });
  });
});
