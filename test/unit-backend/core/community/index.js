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
      community.loadWithDomains(null, function(err) {
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
      community.loadWithDomains(123, function(err) {
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

  describe('The userIsCommunityMember fn', function(done) {
    it('should send back error when user is undefined', function(done) {
      var mongoose = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mongoose);

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.userIsCommunityMember(null, {_id: 123}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error when user._id is undefined', function(done) {
      var mongoose = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mongoose);

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.userIsCommunityMember({}, {_id: 123}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error when community is undefined', function(done) {
      var mongoose = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mongoose);

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.userIsCommunityMember({_id: 123}, null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error when community._id is undefined', function(done) {
      var mongoose = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mongoose);

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.userIsCommunityMember({_id: 123}, {}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error when community.domain_ids is undefined', function(done) {
      var mongoose = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mongoose);

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.userIsCommunityMember({_id: 123}, {_id: 123}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error when community.domain_ids is empty', function(done) {
      var mongoose = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mongoose);

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.userIsCommunityMember({_id: 123}, {_id: 123, domain_ids: []}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back false when domain module can not load domain', function(done) {
      var mongoose = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var called = false;

      var domainMock = {
        load: function(id, callback) {
          called = true;
          return callback(new Error());
        }
      };
      mockery.registerMock('../domain', domainMock);
      var ObjectId = require('bson').ObjectId;

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.userIsCommunityMember({_id: 123}, {_id: 123, domain_ids: [new ObjectId()]}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.false;
        expect(called).to.be.true;
        done();
      });
    });

    it('should send back false when domain module send back error on userIsDomainMember', function(done) {
      var mongoose = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var called = false;

      var domainMock = {
        load: function(id, callback) {
          return callback(null, {_id: 123});
        },
        userIsDomainMember: function(user, domain, callback) {
          called = true;
          return callback(new Error());
        }
      };
      mockery.registerMock('../domain', domainMock);
      var ObjectId = require('bson').ObjectId;

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.userIsCommunityMember({_id: 123}, {_id: 123, domain_ids: [new ObjectId()]}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.false;
        expect(called).to.be.true;
        done();
      });
    });

    it('should send back false when domain module send back false on userIsDomainMember', function(done) {
      var mongoose = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var called = false;

      var domainMock = {
        load: function(id, callback) {
          return callback(null, {_id: 123});
        },
        userIsDomainMember: function(user, domain, callback) {
          called = true;
          return callback(null, false);
        }
      };
      mockery.registerMock('../domain', domainMock);
      var ObjectId = require('bson').ObjectId;

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.userIsCommunityMember({_id: 123}, {_id: 123, domain_ids: [new ObjectId()]}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.false;
        expect(called).to.be.true;
        done();
      });
    });

    it('should send back false when domain module send back true on userIsDomainMember', function(done) {
      var mongoose = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var called = 0;

      var domainMock = {
        load: function(id, callback) {
          return callback(null, {_id: id});
        },
        userIsDomainMember: function(user, domain, callback) {
          called++;
          return callback(null, called === 2);
        }
      };
      mockery.registerMock('../domain', domainMock);
      var ObjectId = require('bson').ObjectId;

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.userIsCommunityMember({_id: 123}, {_id: 123, domain_ids: [new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId()]}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.true;
        expect(called).to.equal(2);
        done();
      });
    });
  });
});
