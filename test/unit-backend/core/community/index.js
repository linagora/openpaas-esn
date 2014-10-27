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

  describe('The leave fn', function() {

    it('should send back error when Community.update fails', function(done) {
      var mongoose = {
        model: function() {
          return {
            update: function(a, b, callback) {
              return callback(new Error());
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.leave(123, 456, 456, function(err) {
        expect(err).to.exist;
        return done();
      });
    });

    it('should send back updated document when Community.update is ok', function(done) {
      var result = {_id: 123};
      var mongoose = {
        model: function() {
          return {
            update: function(a, b, callback) {
              return callback(null, result);
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.leave(123, 456, 456, function(err, update) {
        expect(err).to.not.exist;
        expect(update).to.deep.equal(result);
        return done();
      });
    });

    it('should forward message into community:leave', function(done) {
      var result = {_id: 123};
      var mongoose = {
        model: function() {
          return {
            update: function(a, b, callback) {
              return callback(null, result);
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);

      var localstub = {}, globalstub = {};
      this.helpers.mock.pubsub('../pubsub', localstub, globalstub);

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.leave(123, 456, 789, function(err, update) {
        expect(err).to.not.exist;
        expect(update).to.deep.equal(result);

        expect(localstub.topics['community:leave'].data[0]).to.deep.equal({
          author: 456,
          target: 789,
          community: 123
        });
        expect(globalstub.topics['community:leave'].data[0]).to.deep.equal({
          author: 456,
          target: 789,
          community: 123
        });

        return done();
      });
    });
  });

  describe('The join fn', function() {

    it('should send back error when Community.update fails', function(done) {
      var mongoose = {
        model: function() {
          return {
            update: function(a, b, callback) {
              return callback(new Error());
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.join(123, 456, 456, 'user', function(err) {
        expect(err).to.exist;
        return done();
      });
    });

    it('should send back updated document when Community.update is ok', function(done) {
      var result = {_id: 123};
      var mongoose = {
        model: function() {
          return {
            update: function(a, b, callback) {
              return callback(null, result);
            },
            findOne: function(query, callback) {
              callback(null, {
                activity_stream: {
                  uuid: '123'
                }
              });
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);
      mockery.registerMock('../../core/activitystreams/tracker', {
        updateLastTimelineEntryRead: function(userId, activityStreamUuid, lastTimelineEntry, callback) {
          return callback(null, {});
        }
      });
      mockery.registerMock('../../core/activitystreams', {
        query: function(options, callback) {
          return callback(null, [
            {_id: '123'}
          ]);
        }
      });

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.join(123, 456, 456, 'user', function(err, update) {
        expect(err).to.not.exist;
        expect(update).to.deep.equal(result);
        return done();
      });
    });

    it('should forward message into community:join', function(done) {
      var result = {_id: 123};
      var mongoose = {
        model: function() {
          return {
            update: function(a, b, callback) {
              return callback(null, result);
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);

      var localstub = {}, globalstub = {};
      this.helpers.mock.pubsub('../pubsub', localstub, globalstub);

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.join(123, 456, 789, 'user', function(err, update) {
        expect(err).to.not.exist;
        expect(update).to.deep.equal(result);

        expect(localstub.topics['community:join'].data[0]).to.deep.equal({
          author: 456,
          target: 789,
          actor: 'user',
          community: 123
        });
        expect(globalstub.topics['community:join'].data[0]).to.deep.equal({
          author: 456,
          target: 789,
          actor: 'user',
          community: 123
        });

        return done();
      });
    });
  });

  describe('The isManager fn', function() {

    it('should send back error when Community.findOne fails', function(done) {
      var mongoose = {
        model: function() {
          return {
            findOne: function(a, callback) {
              return callback(new Error());
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.isManager(123, 456, function(err) {
        expect(err).to.exist;
        return done();
      });
    });

    it('should send back true when Community.findOne finds user', function(done) {
      var mongoose = {
        model: function() {
          return {
            findOne: function(a, callback) {
              return callback(null, {});
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.isManager(123, 456, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.true;
        return done();
      });
    });

    it('should send back false when Community.findOne does not find user', function(done) {
      var mongoose = {
        model: function() {
          return {
            findOne: function(a, callback) {
              return callback();
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.isManager(123, 456, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.false;
        return done();
      });
    });
  });

  describe('The isMember fn', function() {

    it('should send back error when Community.findOne fails', function(done) {
      var mongoose = {
        model: function() {
          return {
            findOne: function(a, callback) {
              return callback(new Error());
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.isMember(123, 456, function(err) {
        expect(err).to.exist;
        return done();
      });
    });

    it('should send back true when Community.findOne finds user', function(done) {
      var mongoose = {
        model: function() {
          return {
            findOne: function(a, callback) {
              return callback(null, {});
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.isMember(123, 456, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.true;
        return done();
      });
    });

    it('should send back false when Community.findOne does not find user', function(done) {
      var mongoose = {
        model: function() {
          return {
            findOne: function(a, callback) {
              return callback();
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.isMember(123, 456, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.false;
        return done();
      });
    });
  });

  describe('The getMembers fn', function() {

    it('should send back error when Community.exec fails', function(done) {
      var mongoose = {
        model: function() {
          return {
            findById: function(id) {
              return {
                slice: function() {},
                populate: function() {},
                exec: function(callback) {
                  return callback(new Error());
                }
              };
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.getMembers({_id: 123}, null, function(err) {
        expect(err).to.exist;
        return done();
      });
    });

    it('should send back [] when Community.exec does not find members', function(done) {
      var mongoose = {
        model: function() {
          return {
            findById: function() {
              return {
                slice: function() {},
                populate: function() {},
                exec: function(callback) {
                  return callback();
                }
              };
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.getMembers({_id: 123}, null, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.an.array;
        expect(result.length).to.equal(0);
        return done();
      });
    });

    it('should send back result members', function(done) {
      var result = [{user: 1}, {user: 2}];
      var mongoose = {
        model: function() {
          return {
            findById: function(a) {
              return {
                slice: function() {},
                populate: function() {},
                exec: function(callback) {
                  return callback(null, {members: result});
                }
              };
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.getMembers({_id: 123}, null, function(err, members) {
        expect(err).to.not.exist;
        expect(members).to.be.an.array;
        expect(members).to.deep.equal(result);
        return done();
      });
    });

    it('should slice members when query is defined', function(done) {
      var query = {
        limit: 2,
        offset: 10
      };

      var mongoose = {
        model: function() {
          return {
            findById: function(a) {
              return {
                populate: function() {},
                slice: function(field, array) {
                  expect(field).to.equal('members');
                  expect(array).to.exist;
                  expect(array[0]).to.equal(query.offset);
                  expect(array[1]).to.equal(query.limit);
                },
                exec: function(callback) {
                  return callback(null, {members: []});
                }
              };
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.getMembers({_id: 123}, query, function() {
        done();
      });
    });

    it('should slice members even if query is not defined', function(done) {
      var mongoose = {
        model: function() {
          return {
            findById: function(a) {
              return {
                slice: function(field, array) {
                  expect(field).to.equal('members');
                  expect(array).to.exist;
                  expect(array[0]).to.exist;
                  expect(array[1]).to.exist;
                },
                populate: function() {},
                exec: function(callback) {
                  return callback(null, {members: []});
                }
              };
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.getMembers({_id: 123}, null, function() {
        done();
      });
    });
  });

  describe('The getManagers fn', function() {

    it('should send back error when Community.exec fails', function(done) {
      var mongoose = {
        model: function() {
          return {
            findById: function(id) {
              return {
                slice: function() {},
                populate: function() {},
                exec: function(callback) {
                  return callback(new Error());
                }
              };
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.getManagers({_id: 123}, null, function(err) {
        expect(err).to.exist;
        return done();
      });
    });

    it('should send back [] when Community.exec does not find members', function(done) {
      var mongoose = {
        model: function() {
          return {
            findById: function() {
              return {
                slice: function() {},
                populate: function() {},
                exec: function(callback) {
                  return callback();
                }
              };
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.getManagers({_id: 123}, null, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.an.array;
        expect(result.length).to.equal(0);
        return done();
      });
    });

    it('should send back result members', function(done) {
      var result = { user: 1 };
      var mongoose = {
        model: function() {
          return {
            findById: function(a) {
              return {
                slice: function() {},
                populate: function() {},
                exec: function(callback) {
                  return callback(null, {creator: result});
                }
              };
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.getManagers({_id: 123}, null, function(err, managers) {
        expect(err).to.not.exist;
        expect(managers).to.be.an.array;
        expect(managers).to.deep.equal([result]);
        return done();
      });
    });

  });

  describe('The getUserCommunities fn', function() {
    it('should send back error when user is null', function(done) {
      var mongoose = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.getUserCommunities(null, function(err) {
        expect(err).to.exist;
        return done();
      });
    });
  });

  describe('The userToMember fn', function() {
    it('should send back result even if user is null', function(done) {
      var mongoose = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      var member = community.userToMember(null);
      expect(member).to.exist;
      done();
    });

    it('should send back result even if document.user is null', function(done) {
      var mongoose = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      var member = community.userToMember({});
      expect(member).to.exist;
      done();
    });

    it('should filter document', function(done) {
      var mongoose = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mongoose);

      var user = {
        _id: 1,
        firstname: 'Me',
        password: '1234',
        avatars: [1, 2, 3],
        login: [4, 5, 6]
      };

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      var member = community.userToMember({user: user});
      expect(member).to.exist;
      expect(member.user).to.exist;
      expect(member.user._id).to.exist;
      expect(member.user.firstname).to.exist;
      expect(member.user.password).to.not.exist;
      expect(member.user.avatars).to.not.exist;
      expect(member.user.login).to.not.exist;
      done();
    });

  });


  describe('The addMembershipRequest fn', function() {
    beforeEach(function() {
      var mongoose = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mongoose);
    });

    it('should send back error when userAuthor is null', function() {
      var communityModule = require(this.testEnv.basePath + '/backend/core/community/index');
      communityModule.addMembershipRequest({}, null, {}, 'request', null, function(err, c) {
        expect(err).to.exist;
        expect(c).to.not.exist;
      });
    });

    it('should send back error when userTarget is null', function() {
      var communityModule = require(this.testEnv.basePath + '/backend/core/community/index');
      communityModule.addMembershipRequest({}, {}, null, 'request', null, function(err, c) {
        expect(err).to.exist;
        expect(c).to.not.exist;
      });
    });

    it('should send back error when community is null', function() {
      var communityModule = require(this.testEnv.basePath + '/backend/core/community/index');
      communityModule.addMembershipRequest(null, {}, {}, 'request', null, function(err, c) {
        expect(err).to.exist;
        expect(c).to.not.exist;
      });
    });

    it('should send back error when workflow is null', function() {
      var communityModule = require(this.testEnv.basePath + '/backend/core/community/index');
      communityModule.addMembershipRequest({}, {}, {}, null, null, function(err, c) {
        expect(err).to.exist;
        expect(c).to.not.exist;
      });
    });

    it('should send back error when workflow is not "request" or "invitation"', function() {
      var communityModule = require(this.testEnv.basePath + '/backend/core/community/index');
      communityModule.addMembershipRequest({}, {}, {}, 'test', null, function(err, c) {
        expect(err).to.exist;
        expect(c).to.not.exist;
      });
    });

    it('should send back error if community type is not restricted or private', function() {
      var communityModule = require(this.testEnv.basePath + '/backend/core/community/index');
      communityModule.addMembershipRequest({type: 'open'}, {}, {}, 'request', null, function(err, c) {
        expect(err).to.exist;
        expect(c).to.not.exist;
      });
      communityModule.addMembershipRequest({type: 'confidential'}, {}, {}, 'request', null, function(err, c) {
        expect(err).to.exist;
        expect(c).to.not.exist;
      });
    });

    it('should send back error if userTarget is already member of the community', function() {
      var user = { _id: 'uid' };
      var community = {
        _id: 'cid',
        type: 'restricted'
      };
      var communityModule = require(this.testEnv.basePath + '/backend/core/community/index');
      communityModule.isMember = function(c, u, callback) {
        expect(c).to.deep.equal(community);
        expect(u).to.deep.equal(user._id);
        callback(null, true);
      };
      communityModule.addMembershipRequest(community, {}, user, 'request', null, function(err, c) {
        expect(err).to.exist;
        expect(c).to.not.exist;
      });
    });

    it('should send back error if the check if the target user is member of the community fails', function() {
      var user = { _id: 'uid' };
      var community = {
        _id: 'cid',
        type: 'restricted'
      };
      var communityModule = require(this.testEnv.basePath + '/backend/core/community/index');
      communityModule.isMember = function(c, u, callback) {
        expect(c).to.deep.equal(community);
        expect(u).to.deep.equal(user._id);
        callback(new Error('isMember fail'));
      };
      communityModule.addMembershipRequest(community, {}, user, 'request', null, function(err, c) {
        expect(err).to.exist;
        expect(c).to.not.exist;
      });
    });

    it('should not add a request if the target user has already a pending membership', function() {
      var user = { _id: this.helpers.objectIdMock('uid') };
      var community = {
        _id: 'cid',
        type: 'restricted',
        membershipRequests: [{user: user._id}]
      };
      var workflow = 'request';
      var communityModule = require(this.testEnv.basePath + '/backend/core/community/index');
      communityModule.isMember = function(c, u, callback) {
        expect(c).to.deep.equal(community);
        expect(u).to.deep.equal(user._id);
        callback(null, false);
      };
      communityModule.addMembershipRequest(community, {}, user, workflow, null, function(err, c) {
        expect(err).to.not.exist;
        expect(c).to.exist;
        expect(c.membershipRequests).to.deep.equal(community.membershipRequests);
      });
    });

    it('should fail if the updated community save fails', function() {
      var user = { _id: this.helpers.objectIdMock('uid') };
      var community = {
        _id: 'cid',
        type: 'restricted',
        membershipRequests: [{user: this.helpers.objectIdMock('otherUser')}],
        save: function(callback) {
          return callback(new Error('save fail'));
        }
      };
      var communityModule = require(this.testEnv.basePath + '/backend/core/community/index');
      communityModule.isMember = function(c, u, callback) {
        expect(c).to.deep.equal(community);
        expect(u).to.deep.equal(user._id);
        callback(null, false);
      };
      communityModule.addMembershipInviteUserNotification = function(community, userAuthor, userTarget, actor, callback) {
        return callback(null, {});
      };
      communityModule.addMembershipRequest(community, {}, user, 'request', null, function(err, c) {
        expect(err).to.exist;
        expect(c).to.not.exist;
      });
    });

    it('should add a new request and return the updated community', function() {
      var user = { _id: this.helpers.objectIdMock('uid') };
      var community = {
        _id: 'cid',
        type: 'restricted',
        membershipRequests: [{user: this.helpers.objectIdMock('otherUser')}],
        save: function(callback) {
          return callback(null, community);
        }
      };
      var workflow = 'request';
      var communityModule = require(this.testEnv.basePath + '/backend/core/community/index');
      communityModule.isMember = function(c, u, callback) {
        expect(c).to.deep.equal(community);
        expect(u).to.deep.equal(user._id);
        callback(null, false);
      };
      communityModule.addMembershipInviteUserNotification = function(community, userAuthor, userTarget, actor, callback) {
        return callback(null, {});
      };
      communityModule.addMembershipRequest(community, {}, user, workflow, null, function(err, c) {
        expect(err).to.not.exist;
        expect(c).to.exist;
        expect(c.membershipRequests.length).to.equal(2);
        var newRequest = c.membershipRequests[1];
        expect(newRequest.user).to.deep.equal(user._id);
        expect(newRequest.workflow).to.deep.equal(workflow);
      });
    });

  });

  describe('getMembershipRequest() method', function() {
    it('should support communities that have no membershipRequests array property', function() {
      var mongoose = { model: function() {} };
      mockery.registerMock('mongoose', mongoose);
      var user = {_id: 'user1'};
      var community = {_id: 'community1'};
      var communityModule = require(this.testEnv.basePath + '/backend/core/community/index');
      var mr = communityModule.getMembershipRequest(community, user);
      expect(mr).to.be.false;
    });
    it('should return nothing if user does not have a membership request', function() {
      var mongoose = { model: function() {} };
      mockery.registerMock('mongoose', mongoose);
      var user = {_id: 'user1'};
      var community = {_id: 'community1', membershipRequests: [{
        user: { equals: function() { return false; } },
        timestamp: {creation: new Date()}
      }]};
      var communityModule = require(this.testEnv.basePath + '/backend/core/community/index');
      var mr = communityModule.getMembershipRequest(community, user);
      expect(mr).to.be.not.ok;
    });
    it('should return the membership object if user have a membership request', function() {
      var mongoose = { model: function() {} };
      mockery.registerMock('mongoose', mongoose);
      var user = {_id: 'user1'};
      var community = {_id: 'community1', membershipRequests: [{
        user: { equals: function() { return true; } },
        timestamp: {creation: new Date(1419509532000)}
      }]};
      var communityModule = require(this.testEnv.basePath + '/backend/core/community/index');
      var mr = communityModule.getMembershipRequest(community, user);
      expect(mr).to.be.ok;
      expect(mr.timestamp).to.have.property('creation');
      expect(mr.timestamp.creation).to.be.a('Date');
      expect(mr.timestamp.creation.getTime()).to.equal(1419509532000);
    });
  });

  describe('The removeMembershipRequest fn', function() {
    beforeEach(function() {
      var mongoose = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mongoose);
    });

    it('should send back error when author is null', function() {
      var communityModule = require(this.testEnv.basePath + '/backend/core/community/index');
      communityModule.removeMembershipRequest({}, null, {}, '', function(err, c) {
        expect(err).to.exist;
        expect(c).to.not.exist;
      });
    });

    it('should send back error when target is null', function() {
      var communityModule = require(this.testEnv.basePath + '/backend/core/community/index');
      communityModule.removeMembershipRequest({}, {}, null, '', function(err, c) {
        expect(err).to.exist;
        expect(c).to.not.exist;
      });
    });

    it('should send back error when community is null', function() {
      var communityModule = require(this.testEnv.basePath + '/backend/core/community/index');
      communityModule.removeMembershipRequest(null, {}, {}, '', function(err, c) {
        expect(err).to.exist;
        expect(c).to.not.exist;
      });
    });

    it('should send back error if community type is not restricted or private', function() {
      var communityModule = require(this.testEnv.basePath + '/backend/core/community/index');
      communityModule.removeMembershipRequest({type: 'open'}, {}, {}, '', function(err, c) {
        expect(err).to.exist;
        expect(c).to.not.exist;
      });
      communityModule.removeMembershipRequest({type: 'confidential'}, {}, {}, '', function(err, c) {
        expect(err).to.exist;
        expect(c).to.not.exist;
      });
    });

    it('should send back error if user is already member of the community', function() {
      var user = { _id: 'uid' };
      var author = { _id: 'uuid' };
      var community = {
        _id: 'cid',
        type: 'restricted'
      };
      var communityModule = require(this.testEnv.basePath + '/backend/core/community/index');
      communityModule.isMember = function(c, u, callback) {
        expect(c).to.deep.equal(community);
        expect(u).to.deep.equal(user._id);
        callback(null, true);
      };
      communityModule.removeMembershipRequest(community, author, user, '', function(err, c) {
        expect(err).to.exist;
        expect(c).to.not.exist;
      });
    });

    it('should send back error if the check if the user is member of the community fails', function() {
      var user = { _id: 'uid' };
      var author = { _id: 'uuid' };
      var community = {
        _id: 'cid',
        type: 'restricted'
      };
      var communityModule = require(this.testEnv.basePath + '/backend/core/community/index');
      communityModule.isMember = function(c, u, callback) {
        expect(c).to.deep.equal(community);
        expect(u).to.deep.equal(user._id);
        callback(new Error('isMember fail'));
      };
      communityModule.removeMembershipRequest(community, author, user, '', function(err, c) {
        expect(err).to.exist;
        expect(c).to.not.exist;
      });
    });

    it('should fail if the updated community save fails', function() {
      var user = { _id: this.helpers.objectIdMock('uid') };
      var author = { _id: this.helpers.objectIdMock('uuid') };
      var community = {
        _id: 'cid',
        type: 'restricted',
        membershipRequests: [
          {user: this.helpers.objectIdMock('otherUser')}
        ],
        save: function(callback) {
          return callback(new Error('save fail'));
        }
      };
      var communityModule = require(this.testEnv.basePath + '/backend/core/community/index');
      communityModule.isMember = function(c, u, callback) {
        expect(c).to.deep.equal(community);
        expect(u).to.deep.equal(user._id);
        callback(null, false);
      };
      communityModule.removeMembershipRequest(community, author, user, '', function(err, c) {
        expect(err).to.exist;
        expect(c).to.not.exist;
      });
    });

    it('should remove the request and return the updated community', function() {
      var user = { _id: this.helpers.objectIdMock('uid') };
      var author = { _id: this.helpers.objectIdMock('uuid') };
      var community = {
        _id: 'cid',
        type: 'restricted',
        membershipRequests: [
          {user: this.helpers.objectIdMock('uid')}
        ],
        save: function(callback) {
          return callback(null, community);
        }
      };
      var communityModule = require(this.testEnv.basePath + '/backend/core/community/index');
      communityModule.isMember = function(c, u, callback) {
        expect(c).to.deep.equal(community);
        expect(u).to.deep.equal(user._id);
        callback(null, false);
      };
      communityModule.removeMembershipRequest(community, author, user, '', function(err, c) {
        expect(err).to.not.exist;
        expect(c).to.exist;
        expect(c.membershipRequests.length).to.equal(0);
      });
    });
  });

  describe('The getMembershipRequests fn', function() {

    it('should send back error when Community.exec fails', function(done) {
      var mongoose = {
        model: function() {
          return {
            findById: function(id) {
              return {
                slice: function() {},
                populate: function() {},
                exec: function(callback) {
                  return callback(new Error());
                }
              };
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.getMembershipRequests({_id: 123}, null, function(err) {
        expect(err).to.exist;
        return done();
      });
    });

    it('should send back [] when Community.exec does not find requests', function(done) {
      var mongoose = {
        model: function() {
          return {
            findById: function() {
              return {
                slice: function() {},
                populate: function() {},
                exec: function(callback) {
                  return callback();
                }
              };
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.getMembershipRequests({_id: 123}, null, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.an.array;
        expect(result.length).to.equal(0);
        return done();
      });
    });

    it('should send back result requests', function(done) {
      var result = [{user: 1}, {user: 2}];
      var mongoose = {
        model: function() {
          return {
            findById: function(a) {
              return {
                slice: function() {},
                populate: function() {},
                exec: function(callback) {
                  return callback(null, {membershipRequests: result});
                }
              };
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.getMembershipRequests({_id: 123}, null, function(err, requests) {
        expect(err).to.not.exist;
        expect(requests).to.be.an.array;
        expect(requests).to.deep.equal(result);
        return done();
      });
    });

    it('should slice members when query is defined', function(done) {
      var query = {
        limit: 2,
        offset: 10
      };

      var mongoose = {
        model: function() {
          return {
            findById: function(a) {
              return {
                populate: function() {},
                slice: function(field, array) {
                  expect(field).to.equal('membershipRequests');
                  expect(array).to.exist;
                  expect(array[0]).to.equal(query.offset);
                  expect(array[1]).to.equal(query.limit);
                },
                exec: function(callback) {
                  return callback(null, {members: []});
                }
              };
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.getMembershipRequests({_id: 123}, query, function() {
        done();
      });
    });

    it('should slice members even if query is not defined', function(done) {
      var mongoose = {
        model: function() {
          return {
            findById: function(a) {
              return {
                slice: function(field, array) {
                  expect(field).to.equal('membershipRequests');
                  expect(array).to.exist;
                  expect(array[0]).to.exist;
                  expect(array[1]).to.exist;
                },
                populate: function() {},
                exec: function(callback) {
                  return callback(null, {members: []});
                }
              };
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.getMembershipRequests({_id: 123}, null, function() {
        done();
      });
    });
  });
});
