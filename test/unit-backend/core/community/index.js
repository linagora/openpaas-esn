'use strict';

var mockery = require('mockery');
var expect = require('chai').expect;

describe('The community module', function() {
  describe('The save fn', function() {
    it('should send back error if community is undefined', function(done) {
      this.helpers.mock.models({});

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.save(null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error if community.title is undefined', function(done) {
      this.helpers.mock.models({});

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.save({domain_id: 123}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error if community.domain_id is undefined', function(done) {
      this.helpers.mock.models({});

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.save({title: 'title'}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error if Community.testTitleDomain sends back error', function(done) {
      this.helpers.mock.models({});

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.save({domain_id: 123, title: 'title'}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error if Community.testTitleDomain sends back result', function(done) {
      this.helpers.mock.models({});

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.save({domain_id: 123, title: 'title'}, function(err) {
        expect(err).to.exist;
        done();
      });
    });
  });

  describe('The load fn', function() {
    it('should send back error if community is undefined', function(done) {
      this.helpers.mock.models({});

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.load(null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should call mongoose#findOne', function(done) {
      this.helpers.mock.models({
        Community: {
          findOne: function() { return done(); }
        }
      });

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.load(123, function(err) {
        expect(err).to.not.exist;
      });
    });
  });

  describe('The loadWithDomain fn', function() {
    it('should send back error if community is undefined', function(done) {
      this.helpers.mock.models({});

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.loadWithDomains(null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should call mongoose#findOne', function(done) {
      this.helpers.mock.models({
        Community: {
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
        }
      });

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.loadWithDomains(123, function(err) {
        expect(err).to.not.exist;
      });
    });
  });

  describe('The query fn', function() {
    it('should call collaboration.query with the "community" objectType', function(done) {
      var collaborationMock = {
        query: function(objectType) {
          expect(objectType).to.equal('community');
          done();
        }
      };
      mockery.registerMock('../collaboration', collaborationMock);
      this.helpers.mock.models({});
      var community = require(this.testEnv.basePath + '/backend/core/community');
      community.query(null, function() {});
    });
  });

  describe('The delete fn', function() {
    it('should send back error if community is undefined', function(done) {
      this.helpers.mock.models({});

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.delete(null, function(err) {
        expect(err).to.exist;
        done();
      });
    });
  });

  describe('The updateAvatar fn', function() {
    it('should send back error when community is undefined', function(done) {
      this.helpers.mock.models({});

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.updateAvatar(null, 1, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error when avatar id is undefined', function(done) {
      this.helpers.mock.models({});

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.updateAvatar({}, null, function(err) {
        expect(err).to.exist;
        done();
      });
    });
  });

  describe('The leave fn', function() {

    it('should send back error when Community.update fails', function(done) {
      this.helpers.mock.models({
        Community: {
          update: function(a, b, callback) {
            return callback(new Error());
          }
        }
      });

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.leave(123, 456, 456, function(err) {
        expect(err).to.exist;
        return done();
      });
    });

    it('should send back updated document when Community.update is ok', function(done) {
      var result = {_id: 123};
      this.helpers.mock.models({
        Community: {
          update: function(a, b, callback) {
            return callback(null, result);
          }
        }
      });

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.leave(123, 456, 456, function(err, update) {
        expect(err).to.not.exist;
        expect(update).to.deep.equal(result);
        return done();
      });
    });

    it('should forward message into community:leave', function(done) {
      var result = {_id: 123};
      this.helpers.mock.models({
        Community: {
          update: function(a, b, callback) {
            return callback(null, result);
          }
        }
      });

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

  describe('join fn', function() {

    it('should send back error when Community.update fails', function(done) {
      this.helpers.mock.models({
        Community: {
          update: function(a, b, callback) {
            return callback(new Error());
          }
        }
      });

      var comMock = {
        members: [],
        _id: 'community1',
        save: function(callback) {
          return callback(new Error());
        }
      };
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.join(comMock, 456, 456, 'user', function(err) {
        expect(err).to.exist;
        return done();
      });
    });

    it('should send back updated document when Community.update is ok', function(done) {
      this.helpers.mock.models({});

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
      var comMock = {
        members: [],
        _id: 'community1',
        save: function(callback) {
          this.updated = true;
          return callback(null, this);
        }
      };

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.join(comMock, 456, 456, 'user', function(err, update) {
        expect(err).to.not.exist;
        expect(update.updated).to.be.true;
        return done();
      });
    });

    it('should forward message into community:join', function(done) {
      var result = {_id: 123};
      this.helpers.mock.models({
        Community: {
          update: function(a, b, callback) {
            return callback(null, result);
          }
        }
      });

      var localstub = {}, globalstub = {};
      this.helpers.mock.pubsub('../pubsub', localstub, globalstub);

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      var comMock = {
        members: [],
        _id: 'community1',
        save: function(callback) {
          this.updated = true;
          return callback(null, this);
        }
      };
      community.join(comMock, 456, 789, 'user', function(err, update) {
        expect(err).to.not.exist;

        expect(localstub.topics['community:join'].data[0]).to.deep.equal({
          author: 456,
          target: 789,
          actor: 'user',
          community: 'community1'
        });
        expect(globalstub.topics['community:join'].data[0]).to.deep.equal({
          author: 456,
          target: 789,
          actor: 'user',
          community: 'community1'
        });

        return done();
      });
    });
  });

  describe('The isManager fn', function() {

    it('should send back error when Community.findOne fails', function(done) {
      this.helpers.mock.models({
        Community: {
          findOne: function(a, callback) {
            return callback(new Error());
          }
        }
      });

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.isManager(123, 456, function(err) {
        expect(err).to.exist;
        return done();
      });
    });

    it('should send back true when Community.findOne finds user', function(done) {
      this.helpers.mock.models({
        Community: {
          findOne: function(a, callback) {
            return callback(null, {});
          }
        }
      });

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.isManager(123, 456, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.true;
        return done();
      });
    });

    it('should send back false when Community.findOne does not find user', function(done) {
      this.helpers.mock.models({
        Community: {
          findOne: function(a, callback) {
            return callback();
          }
        }
      });

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.isManager(123, 456, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.false;
        return done();
      });
    });
  });

  describe('The isMember fn', function() {

    it('should send back error when community is not a Mongo object', function(done) {
      this.helpers.mock.models({
        Community: {
          findOne: function() {}
        }
      });

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.isMember(123, {objectType: 'user', id: 456}, function(err) {
        expect(err).to.exist;
        return done();
      });
    });

    it('should send back true when user is part of the community', function(done) {
      this.helpers.mock.models({});
      var id = 456;

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      var comMock = {
        _id: 'community1',
        members: [
        {
          member: {
            objectType: 'user',
            id: 123
          }
        },
        {
            member: {
              objectType: 'user',
              id: id
            }
          }
        ]
      };
      community.isMember(comMock, {objectType: 'user', id: id}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.true;
        return done();
      });
    });

    it('should send back false when user is not part of the community', function(done) {
      this.helpers.mock.models({});
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      var comMock = {
        _id: 'community1',
        members: [
        {
          member: {
            objectType: 'user',
            id: 123
          }
        },
        {
          member: {
            objectType: 'user',
            id: 234
          }
        }
        ]
      };
      community.isMember(comMock, {objectType: 'user', id: 456}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.false;
        return done();
      });
    });

    it('should send back false when tuple is invalid', function(done) {
      this.helpers.mock.models({});
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      var comMock = {
        _id: 'community1',
        members: [
        {
          member: {
            id: 123
          }
        }
        ]
      };
      community.isMember(comMock, {objectType: 'user', id: 456}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.false;
        return done();
      });
    });

    it('should send back false when tuple is not a user', function(done) {
      this.helpers.mock.models({});
      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      var comMock = {
        _id: 'community1',
        members: [
        {
          member: {
            objectType: 'unicorn',
            id: 123
          }
        }
        ]
      };
      community.isMember(comMock, {objectType: 'user', id: 456}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.false;
        return done();
      });
    });

  });

  describe('The getMembers fn', function() {

    it('should send back error when Community.findById fails', function(done) {
      this.helpers.mock.models({
        Community: {
          findById: function(id, callback) {
            return callback(new Error());
          }
        }
      });

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.getMembers({_id: 123}, null, function(err) {
        expect(err).to.exist;
        return done();
      });
    });

    it('should send back [] when Community.exec does not find members', function(done) {
      this.helpers.mock.models({
        Community: {
          findById: function(id, callback) {
            return callback(null, {members: []});
          }
        },
        User: {
          find: function(query, callback) {
            return callback(null, []);
          }
        }
      });

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.getMembers({_id: 123}, null, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.an.array;
        expect(result.length).to.equal(0);
        return done();
      });
    });

    it('should send back result members', function(done) {
      var result = [{member: {_id: 'id1', firstname: 'user1'}}, {member: {_id: 'id2', firstname: 'user2'}}];
      this.helpers.mock.models({
        Community: {
          findById: function(id, callback) {
            return callback(null, {members: [
              {member: {id: 'id1', objectType: 'user'}},
              {member: {id: 'id2', objectType: 'user'}}
              ]});
          }
        },
        User: {
          find: function(query, callback) {
            expect(query._id.$in).to.be.an('array');
            expect(query._id.$in).to.have.length(2);
            expect(query._id.$in).to.contain('id1');
            expect(query._id.$in).to.contain('id2');
            return callback(null, [
              {_id: 'id1', firstname: 'user1'},
              {_id: 'id2', firstname: 'user2'}
              ]);
            }
          }
      });

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
        offset: 3
      };

      this.helpers.mock.models({
        Community: {
          findById: function(id, callback) {
            return callback(null, {members: [
            {member: {id: 'id1', objectType: 'user'}},
            {member: {id: 'id2', objectType: 'user'}},
            {member: {id: 'id3', objectType: 'user'}},
            {member: {id: 'id4', objectType: 'user'}},
            {member: {id: 'id5', objectType: 'user'}},
            {member: {id: 'id6', objectType: 'user'}}
            ]});
          }
        },
        User: {
          find: function(query, callback) {
            expect(query._id.$in).to.be.an('array');
            expect(query._id.$in).to.have.length(2);
            expect(query._id.$in).to.contain('id4');
            expect(query._id.$in).to.contain('id5');
            return done();
          }
        }
      });

      var community = require(this.testEnv.basePath + '/backend/core/community/index');

      community.getMembers({_id: 123}, query, function() {
      });
    });

    it('should slice members even if query is not defined', function(done) {
      this.helpers.mock.models({
        Community: {
          findById: function(a, callback) {
            return callback(
              null,
              {
                members: {
                  slice: function() {
                    return {
                      splice: function(offset, limit) {
                        expect(offset).to.equal(0);
                        expect(limit).to.equal(50);
                        done();
                        return [];
                      }
                    };
                  }
                }
              }
            );
          }
        },
        User: {
          find: function() {}
        }
      });

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.getMembers({_id: 123}, null, function() {
        done();
      });
    });
  });

  describe('The getManagers fn', function() {

    it('should send back error when Community.exec fails', function(done) {
      this.helpers.mock.models({
        Community: {
          findById: function(id) {
            return {
              slice: function() {},
              populate: function() {},
              exec: function(callback) {
                return callback(new Error());
              }
            };
          }
        }
      });

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.getManagers({_id: 123}, null, function(err) {
        expect(err).to.exist;
        return done();
      });
    });

    it('should send back [] when Community.exec does not find members', function(done) {
      this.helpers.mock.models({
        Community: {
          findById: function(id) {
            return {
              slice: function() {},
              populate: function() {},
              exec: function(callback) {
                return callback();
              }
            };
          }
        }
      });

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
      this.helpers.mock.models({
        Community: {
          findById: function(id) {
            return {
              slice: function() {},
              populate: function() {},
              exec: function(callback) {
                return callback(null, {creator: result});
              }
            };
          }
        }
      });

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
      this.helpers.mock.models({});

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.getUserCommunities(null, function(err) {
        expect(err).to.exist;
        return done();
      });
    });
  });

  describe('userToMember fn', function() {
    it('should send back result even if user is null', function(done) {
      this.helpers.mock.models({});

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      var member = community.userToMember(null);
      expect(member).to.exist;
      done();
    });

    it('should send back result even if document.user is null', function(done) {
      this.helpers.mock.models({});

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      var member = community.userToMember({});
      expect(member).to.exist;
      done();
    });

    it('should filter document', function(done) {
      this.helpers.mock.models({});

      var user = {
        _id: 1,
        firstname: 'Me',
        password: '1234',
        avatars: [1, 2, 3],
        login: [4, 5, 6]
      };

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      var member = community.userToMember({member: user});
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

  describe('getMembershipRequest() method', function() {
    it('should support communities that have no membershipRequests array property', function() {
      this.helpers.mock.models({});

      var user = {_id: 'user1'};
      var community = {_id: 'community1'};
      var communityModule = require(this.testEnv.basePath + '/backend/core/community/index');
      var mr = communityModule.getMembershipRequest(community, user);
      expect(mr).to.be.false;
    });
    it('should return nothing if user does not have a membership request', function() {
      this.helpers.mock.models({});

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
      this.helpers.mock.models({});

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

  describe('cancelMembershipInvitation() method', function() {
    beforeEach(function() {
      this.helpers.mock.models({});

      this.membership = {
        user: 'user1',
        workflow: 'invitation'
      };
      this.community = {_id: 'community1', membershipRequests: [this.membership]};
      this.user = {_id: 'user1'};
      this.manager = {_id: 'manager1'};
    });

    it('should call cleanMembershipRequest() method, with the community and user._id', function() {
      var self = this;
      var communityModule = require(this.testEnv.basePath + '/backend/core/community');
      communityModule.cleanMembershipRequest = function(community, userid, callback) {
        expect(community).to.deep.equal(self.community);
        expect(userid).to.equal('user1');
        expect(callback).to.be.a('function');
      };
      communityModule.cancelMembershipInvitation(this.community, this.membership, this.manager, function() {});
    });

    describe('cleanMembershipRequest callback', function() {
      var localstub = {}, globalstub = {};
      beforeEach(function() {
        this.helpers.mock.pubsub('../pubsub', localstub, globalstub);
      });

      it('should fire callback with an error in case of an error', function(done) {
        var communityModule = require(this.testEnv.basePath + '/backend/core/community');
        communityModule.cleanMembershipRequest = function(community, userid, callback) {
          callback(new Error('test error'));
        };
        function onResponse(err, resp) {
          expect(err).to.be.ok;
          expect(err.message).to.equal('test error');
          done();
        }
        communityModule.cancelMembershipInvitation(this.community, this.membership, this.manager, onResponse);
      });

      it('should fire a community:membership:invitation:cancel topic message', function(done) {
        var communityModule = require(this.testEnv.basePath + '/backend/core/community');
        communityModule.cleanMembershipRequest = function(community, userid, callback) {
          callback(null, community);
          expect(localstub.topics).to.have.property('community:membership:invitation:cancel');
          expect(localstub.topics['community:membership:invitation:cancel'].data).to.have.length(1);
          expect(localstub.topics['community:membership:invitation:cancel'].data[0]).to.deep.equal({
            author: 'manager1',
            target: 'user1',
            membership: { user: 'user1', workflow: 'invitation' },
            community: 'community1'
          });
          expect(globalstub.topics).to.have.property('community:membership:invitation:cancel');
          expect(globalstub.topics['community:membership:invitation:cancel'].data).to.have.length(1);
          expect(globalstub.topics['community:membership:invitation:cancel'].data[0]).to.deep.equal({
            author: 'manager1',
            target: 'user1',
            membership: { user: 'user1', workflow: 'invitation' },
            community: 'community1'
          });
          done();
        };
        function onResponse(err, resp) {
        }
        communityModule.cancelMembershipInvitation(this.community, this.membership, this.manager, onResponse);
      });

      it('should fire the callback', function(done) {
        var communityModule = require(this.testEnv.basePath + '/backend/core/community');
        communityModule.cleanMembershipRequest = function(community, userid, callback) {
          callback(null, community);
        };
        communityModule.cancelMembershipInvitation(this.community, this.membership, this.manager, done);
      });

    });

  });

  describe('refuseMembershipRequest() method', function() {
    beforeEach(function() {
      this.helpers.mock.models({});

      this.membership = {
        user: 'user1',
        workflow: 'invitation'
      };
      this.community = {_id: 'community1', membershipRequests: [this.membership]};
      this.user = {_id: 'user1'};
      this.manager = {_id: 'manager1'};
    });

    it('should call cleanMembershipRequest() method, with the community and user._id', function() {
      var self = this;
      var communityModule = require(this.testEnv.basePath + '/backend/core/community');
      communityModule.cleanMembershipRequest = function(community, userid, callback) {
        expect(community).to.deep.equal(self.community);
        expect(userid).to.equal('user1');
        expect(callback).to.be.a('function');
      };
      communityModule.refuseMembershipRequest(this.community, this.membership, this.manager, function() {});
    });

    describe('cleanMembershipRequest callback', function() {
      var localstub = {}, globalstub = {};
      beforeEach(function() {
        this.helpers.mock.pubsub('../pubsub', localstub, globalstub);
      });

      it('should fire callback with an error in case of an error', function(done) {
        var communityModule = require(this.testEnv.basePath + '/backend/core/community');
        communityModule.cleanMembershipRequest = function(community, userid, callback) {
          callback(new Error('test error'));
        };
        function onResponse(err, resp) {
          expect(err).to.be.ok;
          expect(err.message).to.equal('test error');
          done();
        }
        communityModule.refuseMembershipRequest(this.community, this.membership, this.manager, onResponse);
      });

      it('should fire a community:membership:request:refuse topic message', function(done) {
        var communityModule = require(this.testEnv.basePath + '/backend/core/community');
        communityModule.cleanMembershipRequest = function(community, userid, callback) {
          callback(null, community);
          expect(localstub.topics).to.have.property('community:membership:request:refuse');
          expect(localstub.topics['community:membership:request:refuse'].data).to.have.length(1);
          expect(localstub.topics['community:membership:request:refuse'].data[0]).to.deep.equal({
            author: 'manager1',
            target: 'user1',
            membership: { user: 'user1', workflow: 'invitation' },
            community: 'community1'
          });
          expect(globalstub.topics).to.have.property('community:membership:request:refuse');
          expect(globalstub.topics['community:membership:request:refuse'].data).to.have.length(1);
          expect(globalstub.topics['community:membership:request:refuse'].data[0]).to.deep.equal({
            author: 'manager1',
            target: 'user1',
            membership: { user: 'user1', workflow: 'invitation' },
            community: 'community1'
          });
          done();
        };
        function onResponse(err, resp) {
        }
        communityModule.refuseMembershipRequest(this.community, this.membership, this.manager, onResponse);
      });

      it('should fire the callback', function(done) {
        var communityModule = require(this.testEnv.basePath + '/backend/core/community');
        communityModule.cleanMembershipRequest = function(community, userid, callback) {
          callback(null, community);
        };
        communityModule.refuseMembershipRequest(this.community, this.membership, this.manager, done);
      });

    });

  });

  describe('declineMembershipInvitation() method', function() {
    beforeEach(function() {
      this.helpers.mock.models({});

      this.membership = {
        user: 'user1',
        workflow: 'invitation'
      };
      this.community = {_id: 'community1', membershipRequests: [this.membership]};
      this.user = {_id: 'user1'};
      this.manager = {_id: 'manager1'};
    });

    it('should call cleanMembershipRequest() method, with the community and user._id', function() {
      var self = this;
      var communityModule = require(this.testEnv.basePath + '/backend/core/community');
      communityModule.cleanMembershipRequest = function(community, userid, callback) {
        expect(community).to.deep.equal(self.community);
        expect(userid).to.equal('user1');
        expect(callback).to.be.a('function');
      };
      communityModule.declineMembershipInvitation(this.community, this.membership, this.manager, function() {});
    });

    describe('cleanMembershipRequest callback', function() {
      var localstub = {}, globalstub = {};
      beforeEach(function() {
        this.helpers.mock.pubsub('../pubsub', localstub, globalstub);
      });

      it('should fire callback with an error in case of an error', function(done) {
        var communityModule = require(this.testEnv.basePath + '/backend/core/community');
        communityModule.cleanMembershipRequest = function(community, userid, callback) {
          callback(new Error('test error'));
        };
        function onResponse(err, resp) {
          expect(err).to.be.ok;
          expect(err.message).to.equal('test error');
          done();
        }
        communityModule.declineMembershipInvitation(this.community, this.membership, this.manager, onResponse);
      });

      it('should fire a community:membership:invitation:decline topic message', function(done) {
        var communityModule = require(this.testEnv.basePath + '/backend/core/community');
        communityModule.cleanMembershipRequest = function(community, userid, callback) {
          callback(null, community);
          expect(localstub.topics).to.have.property('community:membership:invitation:decline');
          expect(localstub.topics['community:membership:invitation:decline'].data).to.have.length(1);
          expect(localstub.topics['community:membership:invitation:decline'].data[0]).to.deep.equal({
            author: 'manager1',
            target: 'community1',
            membership: { user: 'user1', workflow: 'invitation' },
            community: 'community1'
          });
          expect(globalstub.topics).to.have.property('community:membership:invitation:decline');
          expect(globalstub.topics['community:membership:invitation:decline'].data).to.have.length(1);
          expect(globalstub.topics['community:membership:invitation:decline'].data[0]).to.deep.equal({
            author: 'manager1',
            target: 'community1',
            membership: { user: 'user1', workflow: 'invitation' },
            community: 'community1'
          });
          done();
        };
        function onResponse(err, resp) {
        }
        communityModule.declineMembershipInvitation(this.community, this.membership, this.manager, onResponse);
      });

      it('should fire the callback', function(done) {
        var communityModule = require(this.testEnv.basePath + '/backend/core/community');
        communityModule.cleanMembershipRequest = function(community, userid, callback) {
          callback(null, community);
        };
        communityModule.declineMembershipInvitation(this.community, this.membership, this.manager, done);
      });

    });

  });


  describe('cancelMembershipRequest() method', function() {
    beforeEach(function() {
      this.helpers.mock.models({});

      this.membership = {
        user: 'user1',
        workflow: 'invitation'
      };
      this.community = {_id: 'community1', membershipRequests: [this.membership]};
      this.user = {_id: 'user1'};
      this.manager = {_id: 'manager1'};
    });

    it('should call cleanMembershipRequest() method, with the community and user._id', function() {
      var self = this;
      var communityModule = require(this.testEnv.basePath + '/backend/core/community');
      communityModule.cleanMembershipRequest = function(community, userid, callback) {
        expect(community).to.deep.equal(self.community);
        expect(userid).to.equal('user1');
        expect(callback).to.be.a('function');
      };
      communityModule.cancelMembershipRequest(this.community, this.membership, this.manager, function() {});
    });

    describe('cleanMembershipRequest callback', function() {
      var localstub = {}, globalstub = {};
      beforeEach(function() {
        this.helpers.mock.pubsub('../pubsub', localstub, globalstub);
      });

      it('should fire callback with an error in case of an error', function(done) {
        var communityModule = require(this.testEnv.basePath + '/backend/core/community');
        communityModule.cleanMembershipRequest = function(community, userid, callback) {
          callback(new Error('test error'));
        };
        function onResponse(err, resp) {
          expect(err).to.be.ok;
          expect(err.message).to.equal('test error');
          done();
        }
        communityModule.declineMembershipInvitation(this.community, this.membership, this.manager, onResponse);
      });

      it('should fire a community:membership:request:cancel topic message', function(done) {
        var communityModule = require(this.testEnv.basePath + '/backend/core/community');
        communityModule.cleanMembershipRequest = function(community, userid, callback) {
          callback(null, community);
          expect(localstub.topics).to.have.property('community:membership:request:cancel');
          expect(localstub.topics['community:membership:request:cancel'].data).to.have.length(1);
          expect(localstub.topics['community:membership:request:cancel'].data[0]).to.deep.equal({
            author: 'manager1',
            target: 'community1',
            membership: { user: 'user1', workflow: 'invitation' },
            community: 'community1'
          });
          expect(globalstub.topics).to.have.property('community:membership:request:cancel');
          expect(globalstub.topics['community:membership:request:cancel'].data).to.have.length(1);
          expect(globalstub.topics['community:membership:request:cancel'].data[0]).to.deep.equal({
            author: 'manager1',
            target: 'community1',
            membership: { user: 'user1', workflow: 'invitation' },
            community: 'community1'
          });
          done();
        };
        function onResponse(err, resp) {
        }
        communityModule.cancelMembershipRequest(this.community, this.membership, this.manager, onResponse);
      });

      it('should fire the callback', function(done) {
        var communityModule = require(this.testEnv.basePath + '/backend/core/community');
        communityModule.cleanMembershipRequest = function(community, userid, callback) {
          callback(null, community);
        };
        communityModule.cancelMembershipRequest(this.community, this.membership, this.manager, done);
      });

    });

  });

  describe('The getMembershipRequests fn', function() {

    it('should send back error when Community.exec fails', function(done) {
      this.helpers.mock.models({
        Community: {
          findById: function(id) {
            return {
              slice: function() {},
              populate: function() {},
              exec: function(callback) {
                return callback(new Error());
              }
            };
          }
        }
      });

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.getMembershipRequests({_id: 123}, null, function(err) {
        expect(err).to.exist;
        return done();
      });
    });

    it('should send back [] when Community.exec does not find requests', function(done) {
      this.helpers.mock.models({
        Community: {
          findById: function(id) {
            return {
              slice: function() {},
              populate: function() {},
              exec: function(callback) {
                return callback();
              }
            };
          }
        }
      });

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
      this.helpers.mock.models({
        Community: {
          findById: function(id) {
            return {
              slice: function() {},
              populate: function() {},
              exec: function(callback) {
                return callback(null, {membershipRequests: result});
              }
            };
          }
        }
      });

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
      this.helpers.mock.models({
        Community: {
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
        }
      });

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.getMembershipRequests({_id: 123}, query, function() {
        done();
      });
    });

    it('should slice members even if query is not defined', function(done) {
      this.helpers.mock.models({
        Community: {
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
        }
      });

      var community = require(this.testEnv.basePath + '/backend/core/community/index');
      community.getMembershipRequests({_id: 123}, null, function() {
        done();
      });
    });
  });

  describe('The cleanMembershipRequest fn', function() {

    beforeEach(function() {
      this.helpers.mock.models({});
    });

    it('should send back error when user is not defined', function() {
      var communityModule = require(this.testEnv.basePath + '/backend/core/community/index');
      communityModule.cleanMembershipRequest({}, null, function(err, c) {
        expect(err).to.exist;
        expect(c).to.not.exist;
      });
    });

    it('should send back error when community is not defined', function() {
      var communityModule = require(this.testEnv.basePath + '/backend/core/community/index');
      communityModule.cleanMembershipRequest(null, {}, function(err, c) {
        expect(err).to.exist;
        expect(c).to.not.exist;
      });
    });
  });
});
