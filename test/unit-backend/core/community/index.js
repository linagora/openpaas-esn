'use strict';

var mockery = require('mockery');
var expect = require('chai').expect;

describe('The communities module', function() {
  describe('The save fn', function() {
    it('should send back error if community is undefined', function(done) {
      var mongoose = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.save(null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error if community.title is undefined', function(done) {
      var mongoose = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.save({domain_id: 123}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error if community.domain_id is undefined', function(done) {
      var mongoose = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.save({title: 'title'}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error if Community.testTitleDomain sends back error', function(done) {
      var mongoose = {
        model: function() {
          return {
            testTitleDomain: function(title, domain, callback) {
              return callback(new Error());
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.save({domain_id: 123, title: 'title'}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error if Community.testTitleDomain sends back result', function(done) {
      var mongoose = {
        model: function() {
          return {
            testTitleDomain: function(title, domain, callback) {
              return callback(null, {});
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.save({domain_id: 123, title: 'title'}, function(err) {
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

  describe('The loadWithDomain fn', function() {
    it('should send back error if community is undefined', function(done) {
      var mongoose = {
        model: function() {}
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.loadWithDomain(null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should call mongoose#findOne', function(done) {
      var mongoose = {
        model: function() {
          return {
            findOne: function() {
              return {
                populate: function() {
                  return {
                    exec: function() {
                      done();
                    }
                  };
                }
              };
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.loadWithDomain(123, function(err) {
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

  describe('The updateAvatar fn', function() {
    it('should send back error when community is undefined', function(done) {
      var mongoose = {
        model: function() {}
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.updateAvatar(null, 1, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error when avatar id is undefined', function(done) {
      var mongoose = {
        model: function() {}
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.updateAvatar({}, null, function(err) {
        expect(err).to.exist;
        done();
      });
    });
  });
});
