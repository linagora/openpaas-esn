'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The collaboration module', function() {

  describe('query() method', function() {
    it('should fail if the collaboration objectType is unknown', function(done) {
      this.helpers.mock.models({});
      var collaboration = require(this.testEnv.basePath + '/backend/core/collaboration');
      collaboration.query('i dont exist', {}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should call mongoose#find even when query is undefined', function(done) {
      this.helpers.mock.models({
        Community: {
          find: function() {
            done();
          }
        }
      });
      var collaboration = require(this.testEnv.basePath + '/backend/core/collaboration');
      collaboration.query('community', 'collaboration', {}, function(err) {});
    });

    it('should call mongoose#find even when query is undefined', function(done) {
      var theQuery = {
        find: true,
        what: 'sushi'
      };
      this.helpers.mock.models({
        Community: {
          find: function(query) {
            expect(query).to.deep.equal(theQuery);
            done();
          }
        }
      });
      var collaboration = require(this.testEnv.basePath + '/backend/core/collaboration');
      collaboration.query('community', theQuery, function(err) {});
    });
  });

  describe('The addMembershipRequest fn', function() {
    beforeEach(function() {
      this.helpers.mock.models({});
    });

    it('should send back error when userAuthor is null', function() {
      var collaborationModule = require(this.testEnv.basePath + '/backend/core/collaboration/index');
      collaborationModule.addMembershipRequest('community', {}, null, {}, 'request', null, function(err, c) {
        expect(err).to.exist;
        expect(c).to.not.exist;
      });
    });

    it('should send back error when userTarget is null', function() {
      var collaborationModule = require(this.testEnv.basePath + '/backend/core/collaboration/index');
      collaborationModule.addMembershipRequest('community', {}, {}, null, 'request', null, function(err, c) {
        expect(err).to.exist;
        expect(c).to.not.exist;
      });
    });

    it('should send back error when collaboration is null', function() {
      var collaborationModule = require(this.testEnv.basePath + '/backend/core/collaboration/index');
      collaborationModule.addMembershipRequest('community', null, {}, {}, 'request', null, function(err, c) {
        expect(err).to.exist;
        expect(c).to.not.exist;
      });
    });

    it('should send back error when workflow is null', function() {
      var collaborationModule = require(this.testEnv.basePath + '/backend/core/collaboration/index');
      collaborationModule.addMembershipRequest('community', {}, {}, {}, null, null, function(err, c) {
        expect(err).to.exist;
        expect(c).to.not.exist;
      });
    });

    it('should send back error when workflow is not "request" or "invitation"', function() {
      var collaborationModule = require(this.testEnv.basePath + '/backend/core/collaboration/index');
      collaborationModule.addMembershipRequest('community', {}, {}, {}, 'test', null, function(err, c) {
        expect(err).to.exist;
        expect(c).to.not.exist;
      });
    });

    it('should send back error if collaboration type is not restricted or private for membership request', function() {
      var collaborationModule = require(this.testEnv.basePath + '/backend/core/collaboration/index');
      collaborationModule.addMembershipRequest('community', {type: 'open'}, {}, {}, 'request', null, function(err, c) {
        expect(err).to.exist;
        expect(c).to.not.exist;
      });
      collaborationModule.addMembershipRequest('community', {type: 'confidential'}, {}, {}, 'request', null, function(err, c) {
        expect(err).to.exist;
        expect(c).to.not.exist;
      });
    });

    it('should send back error if userTarget is already member of the collaboration', function() {
      var user = { _id: 'uid' };
      var collaboration = {
        _id: 'cid',
        type: 'restricted',
        members: [
          {
            member: {
              objectType: 'user',
              id: 'uid'
            }
          }
        ]
      };
      var collaborationModule = require(this.testEnv.basePath + '/backend/core/collaboration/index');
      collaborationModule.addMembershipRequest('community', collaboration, {}, user, 'request', null, function(err, c) {
        expect(err).to.exist;
        expect(c).to.not.exist;
      });
    });

    it('should send back error if the check if the target user is member of the collaboration fails', function() {
      var user = { _id: 'uid' };
      var collaborationModule = require(this.testEnv.basePath + '/backend/core/collaboration/index');
      collaborationModule.addMembershipRequest('community', null, {}, user, 'request', null, function(err, c) {
        expect(err).to.exist;
        expect(c).to.not.exist;
      });
    });

    it('should not add a request if the target user has already a pending membership', function() {
      var user = { _id: this.helpers.objectIdMock('uid') };
      var collaboration = {
        _id: 'cid',
        type: 'restricted',
        membershipRequests: [{user: user._id}],
        members: [
          {
            member: {
              objectType: 'user',
              id: 'uid123465'
            }
          }
        ]
      };
      var workflow = 'request';
      var collaborationModule = require(this.testEnv.basePath + '/backend/core/collaboration/index');
      collaborationModule.addMembershipRequest('community', collaboration, {}, user, workflow, null, function(err, c) {
        expect(err).to.not.exist;
        expect(c).to.exist;
        expect(c.membershipRequests).to.deep.equal(collaboration.membershipRequests);
      });
    });

    it('should fail if the updated collaboration save fails', function() {
      var user = { _id: this.helpers.objectIdMock('uid') };
      var collaboration = {
        _id: 'cid',
        type: 'restricted',
        members: [
          {
            member: {
              objectType: 'user',
              id: 'uid456789'
            }
          }
        ],
        membershipRequests: [{user: this.helpers.objectIdMock('otherUser')}],
        save: function(callback) {
          return callback(new Error('save fail'));
        }
      };
      var collaborationModule = require(this.testEnv.basePath + '/backend/core/collaboration/index');
      collaborationModule.addMembershipInviteUserNotification = function(collaboration, userAuthor, userTarget, actor, callback) {
        return callback(null, {});
      };
      collaborationModule.addMembershipRequest('community', collaboration, {}, user, 'request', null, function(err, c) {
        expect(err).to.exist;
        expect(c).to.not.exist;
      });
    });

    it('should add a new request and return the updated collaboration', function() {
      var user = { _id: this.helpers.objectIdMock('uid') };
      var collaboration = {
        _id: 'cid',
        type: 'restricted',
        members: [
          {
            member: {
              objectType: 'user',
              id: 'uid456789'
            }
          }
        ],
        membershipRequests: [{user: this.helpers.objectIdMock('otherUser')}],
        save: function(callback) {
          return callback(null, collaboration);
        }
      };
      var workflow = 'request';
      var collaborationModule = require(this.testEnv.basePath + '/backend/core/collaboration/index');
      collaborationModule.addMembershipInviteUserNotification = function(collaboration, userAuthor, userTarget, actor, callback) {
        return callback(null, {});
      };
      collaborationModule.addMembershipRequest('community', collaboration, {}, user, workflow, null, function(err, c) {
        expect(err).to.not.exist;
        expect(c).to.exist;
        expect(c.membershipRequests.length).to.equal(2);
        var newRequest = c.membershipRequests[1];
        expect(newRequest.user).to.deep.equal(user._id);
        expect(newRequest.workflow).to.deep.equal(workflow);
      });
    });

    it('should add a new invitation and return the updated collaboration with open type', function() {
      var user = { _id: this.helpers.objectIdMock('uid') };
      var collaboration = {
        _id: 'cid',
        type: 'open',
        members: [
          {
            member: {
              objectType: 'user',
              id: 'uid456789'
            }
          }
        ],
        membershipRequests: [{user: this.helpers.objectIdMock('otherUser')}],
        save: function(callback) {
          return callback(null, collaboration);
        }
      };
      var workflow = 'invitation';
      var collaborationModule = require(this.testEnv.basePath + '/backend/core/collaboration/index');
      collaborationModule.addMembershipInviteUserNotification = function(collaboration, userAuthor, userTarget, actor, callback) {
        return callback(null, {});
      };
      collaborationModule.addMembershipRequest('community', collaboration, {}, user, workflow, null, function(err, c) {
        expect(err).to.not.exist;
        expect(c).to.exist;
        expect(c.membershipRequests.length).to.equal(2);
        var newRequest = c.membershipRequests[1];
        expect(newRequest.user).to.deep.equal(user._id);
        expect(newRequest.workflow).to.deep.equal(workflow);
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

      var collaboration = require(this.testEnv.basePath + '/backend/core/collaboration/index');
      collaboration.isManager('community', 123, 456, function(err) {
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

      var collaboration = require(this.testEnv.basePath + '/backend/core/collaboration/index');
      collaboration.isManager('community', 123, 456, function(err, result) {
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

      var collaboration = require(this.testEnv.basePath + '/backend/core/collaboration/index');
      collaboration.isManager('community', 123, 456, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.false;
        return done();
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

      var collaboration = require(this.testEnv.basePath + '/backend/core/collaboration/index');
      collaboration.leave('community', 123, 456, 456, function(err) {
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

      var collaboration = require(this.testEnv.basePath + '/backend/core/collaboration/index');
      collaboration.leave('community', 123, 456, 456, function(err, update) {
        expect(err).to.not.exist;
        expect(update).to.deep.equal(result);
        return done();
      });
    });

    it('should forward message into collaboration:leave', function(done) {
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

      var collaboration = require(this.testEnv.basePath + '/backend/core/collaboration/index');
      collaboration.leave('community', 123, 456, 789, function(err, update) {
        expect(err).to.not.exist;
        expect(update).to.deep.equal(result);

        expect(localstub.topics['collaboration:leave'].data[0]).to.deep.equal({
          author: 456,
          target: 789,
          collaboration: {objectType: 'community', id: 123}
        });
        expect(globalstub.topics['collaboration:leave'].data[0]).to.deep.equal({
          author: 456,
          target: 789,
          collaboration: {objectType: 'community', id: 123}
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
        _id: 'collaboration1',
        save: function(callback) {
          return callback(new Error());
        }
      };
      var collaboration = require(this.testEnv.basePath + '/backend/core/collaboration/index');
      collaboration.join('community', comMock, 456, 456, 'user', function(err) {
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
        _id: 'collaboration1',
        save: function(callback) {
          this.updated = true;
          return callback(null, this);
        }
      };

      var collaboration = require(this.testEnv.basePath + '/backend/core/collaboration/index');
      collaboration.join('community', comMock, 456, 456, 'user', function(err, update) {
        expect(err).to.not.exist;
        expect(update.updated).to.be.true;
        return done();
      });
    });

    it('should forward message into collaboration:join', function(done) {
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

      var collaboration = require(this.testEnv.basePath + '/backend/core/collaboration/index');
      var comMock = {
        members: [],
        _id: 'collaboration1',
        save: function(callback) {
          this.updated = true;
          return callback(null, this);
        }
      };
      collaboration.join('community', comMock, 456, 789, 'user', function(err, update) {
        expect(err).to.not.exist;

        expect(localstub.topics['collaboration:join'].data[0]).to.deep.equal({
          author: 456,
          target: 789,
          actor: 'user',
          collaboration: {objectType: 'community', id: 'collaboration1'}
        });
        expect(globalstub.topics['collaboration:join'].data[0]).to.deep.equal({
          author: 456,
          target: 789,
          actor: 'user',
          collaboration: {objectType: 'community', id: 'collaboration1'}
        });

        return done();
      });
    });
  });

  describe('cancelMembershipInvitation() method', function() {

    beforeEach(function() {
      this.helpers.mock.models({});

      this.membership = {
        user: 'user1',
        workflow: 'invitation'
      };
      this.collaboration = {_id: 'collaboration1', membershipRequests: [this.membership]};
      this.user = {_id: 'user1'};
      this.manager = {_id: 'manager1'};
    });

    it('should call cleanMembershipRequest() method, with the collaboration and user._id', function(done) {
      var self = this;
      var collaborationModule = require(this.testEnv.basePath + '/backend/core/collaboration');
      collaborationModule.cleanMembershipRequest = function(collaboration, userid, callback) {
        expect(collaboration).to.deep.equal(self.collaboration);
        expect(userid).to.equal('user1');
        expect(callback).to.be.a('function');
        callback();
      };
      collaborationModule.cancelMembershipInvitation('community', this.collaboration, this.membership, this.manager, done);
    });

    describe('cleanMembershipRequest callback', function() {
      var localstub = {}, globalstub = {};
      beforeEach(function() {
        this.helpers.mock.pubsub('../pubsub', localstub, globalstub);
      });

      it('should fire callback with an error in case of an error', function(done) {
        var collaborationModule = require(this.testEnv.basePath + '/backend/core/collaboration');
        collaborationModule.cleanMembershipRequest = function(collaboration, userid, callback) {
          callback(new Error('test error'));
        };
        function onResponse(err, resp) {
          expect(err).to.be.ok;
          expect(err.message).to.equal('test error');
          done();
        }
        collaborationModule.cancelMembershipInvitation('community', this.collaboration, this.membership, this.manager, onResponse);
      });

      it('should fire a collaboration:membership:invitation:cancel topic message', function(done) {
        var collaborationModule = require(this.testEnv.basePath + '/backend/core/collaboration');
        collaborationModule.cleanMembershipRequest = function(collaboration, userid, callback) {
          callback(null, collaboration);
          expect(localstub.topics).to.have.property('collaboration:membership:invitation:cancel');
          expect(localstub.topics['collaboration:membership:invitation:cancel'].data).to.have.length(1);
          expect(localstub.topics['collaboration:membership:invitation:cancel'].data[0]).to.deep.equal({
            author: 'manager1',
            target: 'user1',
            membership: { user: 'user1', workflow: 'invitation' },
            collaboration: {objectType: 'community', id: 'collaboration1'}
          });
          expect(globalstub.topics).to.have.property('collaboration:membership:invitation:cancel');
          expect(globalstub.topics['collaboration:membership:invitation:cancel'].data).to.have.length(1);
          expect(globalstub.topics['collaboration:membership:invitation:cancel'].data[0]).to.deep.equal({
            author: 'manager1',
            target: 'user1',
            membership: { user: 'user1', workflow: 'invitation' },
            collaboration: {objectType: 'community', id: 'collaboration1'}
          });
          done();
        };
        function onResponse(err, resp) {
        }
        collaborationModule.cancelMembershipInvitation('community', this.collaboration, this.membership, this.manager, onResponse);
      });

      it('should fire the callback', function(done) {
        var collaborationModule = require(this.testEnv.basePath + '/backend/core/collaboration');
        collaborationModule.cleanMembershipRequest = function(collaboration, userid, callback) {
          callback(null, collaboration);
        };
        collaborationModule.cancelMembershipInvitation('community', this.collaboration, this.membership, this.manager, done);
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
      this.collaboration = {_id: 'collaboration1', membershipRequests: [this.membership]};
      this.user = {_id: 'user1'};
      this.manager = {_id: 'manager1'};
    });

    it('should call cleanMembershipRequest() method, with the collaboration and user._id', function() {
      var self = this;
      var collaborationModule = require(this.testEnv.basePath + '/backend/core/collaboration');
      collaborationModule.cleanMembershipRequest = function(collaboration, userid, callback) {
        expect(collaboration).to.deep.equal(self.collaboration);
        expect(userid).to.equal('user1');
        expect(callback).to.be.a('function');
      };
      collaborationModule.refuseMembershipRequest('community', this.collaboration, this.membership, this.manager, function() {});
    });

    describe('cleanMembershipRequest callback', function() {
      var localstub = {}, globalstub = {};
      beforeEach(function() {
        this.helpers.mock.pubsub('../pubsub', localstub, globalstub);
      });

      it('should fire callback with an error in case of an error', function(done) {
        var collaborationModule = require(this.testEnv.basePath + '/backend/core/collaboration');
        collaborationModule.cleanMembershipRequest = function(collaboration, userid, callback) {
          callback(new Error('test error'));
        };
        function onResponse(err, resp) {
          expect(err).to.be.ok;
          expect(err.message).to.equal('test error');
          done();
        }
        collaborationModule.refuseMembershipRequest('community', this.collaboration, this.membership, this.manager, onResponse);
      });

      it('should fire a collaboration:membership:request:refuse topic message', function(done) {
        var collaborationModule = require(this.testEnv.basePath + '/backend/core/collaboration');
        collaborationModule.cleanMembershipRequest = function(collaboration, userid, callback) {
          callback(null, collaboration);
          expect(localstub.topics).to.have.property('collaboration:membership:request:refuse');
          expect(localstub.topics['collaboration:membership:request:refuse'].data).to.have.length(1);
          expect(localstub.topics['collaboration:membership:request:refuse'].data[0]).to.deep.equal({
            author: 'manager1',
            target: 'user1',
            membership: { user: 'user1', workflow: 'invitation' },
            collaboration: {objectType: 'community', id: 'collaboration1'}
          });
          expect(globalstub.topics).to.have.property('collaboration:membership:request:refuse');
          expect(globalstub.topics['collaboration:membership:request:refuse'].data).to.have.length(1);
          expect(globalstub.topics['collaboration:membership:request:refuse'].data[0]).to.deep.equal({
            author: 'manager1',
            target: 'user1',
            membership: { user: 'user1', workflow: 'invitation' },
            collaboration: {objectType: 'community', id: 'collaboration1'}
          });
          done();
        };
        function onResponse(err, resp) {
        }
        collaborationModule.refuseMembershipRequest('community', this.collaboration, this.membership, this.manager, onResponse);
      });

      it('should fire the callback', function(done) {
        var collaborationModule = require(this.testEnv.basePath + '/backend/core/collaboration');
        collaborationModule.cleanMembershipRequest = function(collaboration, userid, callback) {
          callback(null, collaboration);
        };
        collaborationModule.refuseMembershipRequest('community', this.collaboration, this.membership, this.manager, done);
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
      this.collaboration = {_id: 'collaboration1', membershipRequests: [this.membership]};
      this.user = {_id: 'user1'};
      this.manager = {_id: 'manager1'};
    });

    it('should call cleanMembershipRequest() method, with the collaboration and user._id', function() {
      var self = this;
      var collaborationModule = require(this.testEnv.basePath + '/backend/core/collaboration');
      collaborationModule.cleanMembershipRequest = function(collaboration, userid, callback) {
        expect(collaboration).to.deep.equal(self.collaboration);
        expect(userid).to.equal('user1');
        expect(callback).to.be.a('function');
      };
      collaborationModule.declineMembershipInvitation('community', this.collaboration, this.membership, this.manager, function() {});
    });

    describe('cleanMembershipRequest callback', function() {
      var localstub = {}, globalstub = {};
      beforeEach(function() {
        this.helpers.mock.pubsub('../pubsub', localstub, globalstub);
      });

      it('should fire callback with an error in case of an error', function(done) {
        var collaborationModule = require(this.testEnv.basePath + '/backend/core/collaboration');
        collaborationModule.cleanMembershipRequest = function(collaboration, userid, callback) {
          callback(new Error('test error'));
        };
        function onResponse(err, resp) {
          expect(err).to.be.ok;
          expect(err.message).to.equal('test error');
          done();
        }
        collaborationModule.declineMembershipInvitation('community', this.collaboration, this.membership, this.manager, onResponse);
      });

      it('should fire a collaboration:membership:invitation:decline topic message', function(done) {
        var collaborationModule = require(this.testEnv.basePath + '/backend/core/collaboration');
        collaborationModule.cleanMembershipRequest = function(collaboration, userid, callback) {
          callback(null, collaboration);
          expect(localstub.topics).to.have.property('collaboration:membership:invitation:decline');
          expect(localstub.topics['collaboration:membership:invitation:decline'].data).to.have.length(1);
          expect(localstub.topics['collaboration:membership:invitation:decline'].data[0]).to.deep.equal({
            author: 'manager1',
            target: 'collaboration1',
            membership: { user: 'user1', workflow: 'invitation' },
            collaboration: {objectType: 'community', id: 'collaboration1'}
          });
          expect(globalstub.topics).to.have.property('collaboration:membership:invitation:decline');
          expect(globalstub.topics['collaboration:membership:invitation:decline'].data).to.have.length(1);
          expect(globalstub.topics['collaboration:membership:invitation:decline'].data[0]).to.deep.equal({
            author: 'manager1',
            target: 'collaboration1',
            membership: { user: 'user1', workflow: 'invitation' },
            collaboration: {objectType: 'community', id: 'collaboration1'}
          });
          done();
        };
        function onResponse(err, resp) {
        }
        collaborationModule.declineMembershipInvitation('community', this.collaboration, this.membership, this.manager, onResponse);
      });

      it('should fire the callback', function(done) {
        var collaborationModule = require(this.testEnv.basePath + '/backend/core/collaboration');
        collaborationModule.cleanMembershipRequest = function(collaboration, userid, callback) {
          callback(null, collaboration);
        };
        collaborationModule.declineMembershipInvitation('community', this.collaboration, this.membership, this.manager, done);
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
      this.collaboration = {_id: 'collaboration1', membershipRequests: [this.membership]};
      this.user = {_id: 'user1'};
      this.manager = {_id: 'manager1'};
    });

    it('should call cleanMembershipRequest() method, with the collaboration and user._id', function() {
      var self = this;
      var collaborationModule = require(this.testEnv.basePath + '/backend/core/collaboration');
      collaborationModule.cleanMembershipRequest = function(collaboration, userid, callback) {
        expect(collaboration).to.deep.equal(self.collaboration);
        expect(userid).to.equal('user1');
        expect(callback).to.be.a('function');
      };
      collaborationModule.cancelMembershipRequest('community', this.collaboration, this.membership, this.manager, function() {});
    });

    describe('cleanMembershipRequest callback', function() {
      var localstub = {}, globalstub = {};
      beforeEach(function() {
        this.helpers.mock.pubsub('../pubsub', localstub, globalstub);
      });

      it('should fire callback with an error in case of an error', function(done) {
        var collaborationModule = require(this.testEnv.basePath + '/backend/core/collaboration');
        collaborationModule.cleanMembershipRequest = function(collaboration, userid, callback) {
          callback(new Error('test error'));
        };
        function onResponse(err, resp) {
          expect(err).to.be.ok;
          expect(err.message).to.equal('test error');
          done();
        }
        collaborationModule.cancelMembershipRequest('community', this.collaboration, this.membership, this.manager, onResponse);
      });

      it('should fire a collaboration:membership:request:cancel topic message', function(done) {
        var collaborationModule = require(this.testEnv.basePath + '/backend/core/collaboration');
        collaborationModule.cleanMembershipRequest = function(collaboration, userid, callback) {
          callback(null, collaboration);
          expect(localstub.topics).to.have.property('collaboration:membership:request:cancel');
          expect(localstub.topics['collaboration:membership:request:cancel'].data).to.have.length(1);
          expect(localstub.topics['collaboration:membership:request:cancel'].data[0]).to.deep.equal({
            author: 'manager1',
            target: 'collaboration1',
            membership: { user: 'user1', workflow: 'invitation' },
            collaboration: {objectType: 'community', id: 'collaboration1'}
          });
          expect(globalstub.topics).to.have.property('collaboration:membership:request:cancel');
          expect(globalstub.topics['collaboration:membership:request:cancel'].data).to.have.length(1);
          expect(globalstub.topics['collaboration:membership:request:cancel'].data[0]).to.deep.equal({
            author: 'manager1',
            target: 'collaboration1',
            membership: { user: 'user1', workflow: 'invitation' },
            collaboration: {objectType: 'community', id: 'collaboration1'}
          });
          done();
        };
        function onResponse(err, resp) {
        }
        collaborationModule.cancelMembershipRequest('community', this.collaboration, this.membership, this.manager, onResponse);
      });

      it('should fire the callback', function(done) {
        var collaborationModule = require(this.testEnv.basePath + '/backend/core/collaboration');
        collaborationModule.cleanMembershipRequest = function(collaboration, userid, callback) {
          callback(null, collaboration);
        };
        collaborationModule.cancelMembershipRequest('community', this.collaboration, this.membership, this.manager, done);
      });

    });

  });

  describe('userToMember fn', function() {
    it('should send back result even if user is null', function(done) {
      this.helpers.mock.models({});

      var collaboration = require(this.testEnv.basePath + '/backend/core/collaboration/index');
      var member = collaboration.userToMember(null);
      expect(member).to.exist;
      done();
    });

    it('should send back result even if document.user is null', function(done) {
      this.helpers.mock.models({});

      var collaboration = require(this.testEnv.basePath + '/backend/core/collaboration/index');
      var member = collaboration.userToMember({});
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

      var collaboration = require(this.testEnv.basePath + '/backend/core/collaboration/index');
      var member = collaboration.userToMember({member: user});
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
});
