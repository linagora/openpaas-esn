'use strict';

const expect = require('chai').expect;
const mockery = require('mockery');
const ObjectId = require('bson').ObjectId;

describe('The collaboration member module', function() {

  let lib, modelMock, getModule;

  beforeEach(function() {
    modelMock = {};
    lib = {
      getModel: function() {
        return modelMock;
      }
    };
    getModule = () => this.helpers.requireBackend('core/collaboration/member')(lib);
  });

  describe('The addMembershipRequest function', function() {
    beforeEach(function() {
      this.helpers.mock.models({});
    });

    it('should send back error when userAuthor is null', function(done) {
      const collaborationModule = getModule();

      collaborationModule.addMembershipRequest('community', {}, null, {}, 'request', null, function(err, c) {
        expect(err.message).to.match(/Author user object is required/);
        expect(c).to.not.exist;
        done();
      });
    });

    it('should send back error when userTarget is null', function(done) {
      const collaborationModule = getModule();

      collaborationModule.addMembershipRequest('community', {}, {}, null, 'request', null, function(err, c) {
        expect(err.message).to.match(/Target user object is required/);
        expect(c).to.not.exist;
        done();
      });
    });

    it('should send back error when collaboration is null', function(done) {
      const collaborationModule = getModule();

      collaborationModule.addMembershipRequest('community', null, {}, {}, 'request', null, function(err, c) {
        expect(err.message).to.match(/Collaboration object is required/);
        expect(c).to.not.exist;
        done();
      });
    });

    it('should send back error when workflow is null', function(done) {
      const collaborationModule = getModule();

      collaborationModule.addMembershipRequest('community', {}, {}, {}, null, null, function(err, c) {
        expect(err.message).to.match(/Workflow string is required/);
        expect(c).to.not.exist;
        done();
      });
    });

    it('should send back error when workflow is not "request" or "invitation"', function(done) {
      const collaborationModule = getModule();

      collaborationModule.addMembershipRequest('community', {}, {}, {}, 'test', null, function(err, c) {
        expect(err.message).to.match(/Invalid workflow, must be/);
        expect(c).to.not.exist;
        done();
      });
    });

    it('should send back error if collaboration type is open and workflow is request', function(done) {
      const collaborationModule = getModule();

      collaborationModule.addMembershipRequest('community', {type: 'open'}, {}, {}, 'request', null, function(err) {
        expect(err.message).to.match(/Only Restricted and Private collaborations allow membership requests/);
        done();
      });
    });

    it('should send back error if collaboration type is confidential and workflow is request', function(done) {
      const collaborationModule = getModule();

      collaborationModule.addMembershipRequest('community', {type: 'confidential'}, {}, {}, 'request', null, function(err) {
        expect(err.message).to.match(/Only Restricted and Private collaborations allow membership requests/);
        done();
      });
    });

    it('should send back error if userTarget is already member of the collaboration', function(done) {
      const user = { _id: 'uid' };
      const collaboration = {
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
      const collaborationModule = getModule();

      collaborationModule.addMembershipRequest('community', collaboration, {}, user, 'request', null, function(err, c) {
        expect(err).to.exist;
        expect(c).to.not.exist;
        done();
      });
    });

    it('should send back error if the check if the target user is member of the collaboration fails', function(done) {
      const user = { _id: 'uid' };
      const collaborationModule = getModule();

      collaborationModule.addMembershipRequest('community', null, {}, user, 'request', null, function(err, c) {
        expect(err).to.exist;
        expect(c).to.not.exist;
        done();
      });
    });

    it('should not add a request if the target user has already a pending membership', function(done) {
      const user = { _id: this.helpers.objectIdMock('uid') };
      const workflow = 'request';
      const collaboration = {
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
      const collaborationModule = getModule();

      collaborationModule.addMembershipRequest('community', collaboration, {}, user, workflow, null, function(err, c) {
        expect(err).to.not.exist;
        expect(c).to.exist;
        expect(c.membershipRequests).to.deep.equal(collaboration.membershipRequests);
        done();
      });
    });

    it('should fail if the updated collaboration save fails', function(done) {
      const user = { _id: this.helpers.objectIdMock('uid') };
      const collaboration = {
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
          callback(new Error('save fail'));
        }
      };
      const collaborationModule = getModule();

      collaborationModule.addMembershipInviteUserNotification = function(collaboration, userAuthor, userTarget, actor, callback) {
        callback(null, {});
      };

      collaborationModule.addMembershipRequest('community', collaboration, {}, user, 'request', null, function(err, c) {
        expect(err).to.exist;
        expect(c).to.not.exist;
        done();
      });
    });

    it('should add a new request and return the updated collaboration', function(done) {
      const user = { _id: this.helpers.objectIdMock('uid') };
      const workflow = 'request';
      const collaboration = {
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
          callback(null, collaboration);
        }
      };
      const collaborationModule = getModule();

      collaborationModule.addMembershipInviteUserNotification = function(collaboration, userAuthor, userTarget, actor, callback) {
        callback(null, {});
      };

      collaborationModule.addMembershipRequest('community', collaboration, {}, user, workflow, null, function(err, c) {
        const newRequest = c.membershipRequests[1];

        expect(err).to.not.exist;
        expect(c).to.exist;
        expect(c.membershipRequests.length).to.equal(2);
        expect(newRequest.user).to.deep.equal(user._id);
        expect(newRequest.workflow).to.deep.equal(workflow);
        done();
      });
    });

    it('should add a new invitation and return the updated collaboration with open type', function(done) {
      const user = { _id: this.helpers.objectIdMock('uid') };
      const collaboration = {
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
      const workflow = 'invitation';
      const collaborationModule = getModule();

      collaborationModule.addMembershipInviteUserNotification = function(collaboration, userAuthor, userTarget, actor, callback) {
        return callback(null, {});
      };

      collaborationModule.addMembershipRequest('community', collaboration, {}, user, workflow, null, function(err, c) {
        const newRequest = c.membershipRequests[1];

        expect(err).to.not.exist;
        expect(c).to.exist;
        expect(c.membershipRequests.length).to.equal(2);
        expect(newRequest.user).to.deep.equal(user._id);
        expect(newRequest.workflow).to.deep.equal(workflow);
        done();
      });
    });

  });

  describe('The isManager function', function() {

    it('should send back error when Community.findOne fails', function(done) {
      const error = new Error('I failed');

      modelMock.findOne = function(a, callback) {
        callback(error);
      };

      const collaborationModule = getModule();

      collaborationModule.isManager('community', 123, 456, function(err) {
        expect(err.message).to.equal(error.message);
        done();
      });
    });

    it('should send back true when Community.findOne finds user', function(done) {
      modelMock.findOne = function(a, callback) {
        callback(null, {});
      };

      const collaborationModule = getModule();

      collaborationModule.isManager('community', 123, 456, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.true;
        done();
      });
    });

    it('should send back false when Community.findOne does not find user', function(done) {
      modelMock.findOne = function(a, callback) {
        callback();
      };

      const collaborationModule = getModule();

      collaborationModule.isManager('community', 123, 456, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.false;
        done();
      });
    });
  });

  describe('The leave function', function() {

    it('should send back error when Community.update fails', function(done) {
      const error = new Error('Update failed');

      modelMock.update = function(a, b, callback) {
        callback(error);
      };

      const collaborationModule = getModule();

      collaborationModule.leave('community', 123, 456, 456, function(err) {
        expect(err.message).to.equal(error.message);
        done();
      });
    });

    it('should send back updated document when Community.update is ok', function(done) {
      const result = {_id: 123};

      modelMock.update = function(a, b, callback) {
        callback(null, result);
      };

      const collaborationModule = getModule();

      collaborationModule.leave('community', 123, 456, 456, function(err, update) {
        expect(err).to.not.exist;
        expect(update).to.deep.equal(result);
        done();
      });
    });

    it('should forward message into collaboration:leave', function(done) {
      const result = {_id: 123};
      const localstub = {}, globalstub = {};

      modelMock.update = function(a, b, callback) {
        callback(null, result);
      };

      this.helpers.mock.pubsub('../../pubsub', localstub, globalstub);

      const collaborationModule = getModule();

      collaborationModule.leave('community', 123, 456, 789, function(err, update) {
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

        done();
      });
    });
  });

  describe('The join function', function() {

    it('should send back error when Community.update fails', function(done) {
      modelMock.update = function(a, b, callback) {
        callback(new Error());
      };

      const comMock = {
        members: [],
        _id: 'collaboration1',
        save: function(callback) {
          callback(new Error());
        }
      };
      const user = new ObjectId();
      const collaborationModule = getModule();

      collaborationModule.join('community', comMock, user, user, 'user', function(err) {
        expect(err).to.exist;
        done();
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
          callback(null, [
            {_id: '123'}
          ]);
        }
      });

      const comMock = {
        members: [],
        _id: 'collaboration1',
        save: function(callback) {
          this.updated = true;
          callback(null, this);
        }
      };
      const user = new ObjectId();
      const collaborationModule = getModule();

      collaborationModule.join('community', comMock, user, user, 'user', function(err, update) {
        expect(err).to.not.exist;
        expect(update.updated).to.be.true;
        done();
      });
    });

    it('should forward message into collaboration:join', function(done) {
      const result = {_id: 123};
      const localstub = {}, globalstub = {};
      const comMock = {
        members: [],
        _id: 'collaboration1',
        save: function(callback) {
          this.updated = true;
          callback(null, this);
        }
      };
      const user = new ObjectId();
      const target = new ObjectId();

      modelMock.update = function(a, b, callback) {
        callback(null, result);
      };

      this.helpers.mock.pubsub('../../pubsub', localstub, globalstub);

      const collaborationModule = getModule();

      collaborationModule.join('community', comMock, user, target, 'user', function(err) {
        expect(err).to.not.exist;
        expect(localstub.topics['collaboration:join'].data[0]).to.deep.equal({
          author: user,
          target: target,
          actor: 'user',
          collaboration: {objectType: 'community', id: 'collaboration1'}
        });
        expect(globalstub.topics['collaboration:join'].data[0]).to.deep.equal({
          author: user,
          target: target,
          actor: 'user',
          collaboration: {objectType: 'community', id: 'collaboration1'}
        });

        done();
      });
    });
  });

  describe('The cancelMembershipInvitation function', function() {

    beforeEach(function() {
      this.helpers.mock.models({});
      this.userId = this.helpers.objectIdMock('user1');

      this.membership = {
        user: this.userId,
        workflow: 'invitation'
      };
      this.collaboration = {_id: 'collaboration1', membershipRequests: [this.membership], save: function(callback) {callback();}};
      this.user = {_id: this.userId};
      this.manager = {_id: 'manager1'};
    });

    describe('cleanMembershipRequest callback', function() {
      const localstub = {}, globalstub = {};

      beforeEach(function() {
        this.helpers.mock.pubsub('../../pubsub', localstub, globalstub);
      });

      it('should fire a collaboration:membership:invitation:cancel topic message', function(done) {
        const self = this;
        const collaborationModule = getModule();

        collaborationModule.cancelMembershipInvitation('community', this.collaboration, this.membership, this.manager, function() {
          expect(localstub.topics).to.have.property('collaboration:membership:invitation:cancel');
          expect(localstub.topics['collaboration:membership:invitation:cancel'].data).to.have.length(1);
          expect(localstub.topics['collaboration:membership:invitation:cancel'].data[0]).to.deep.equal({
            author: 'manager1',
            target: self.userId,
            membership: { user: self.userId, workflow: 'invitation' },
            collaboration: {objectType: 'community', id: 'collaboration1'}
          });
          expect(globalstub.topics).to.have.property('collaboration:membership:invitation:cancel');
          expect(globalstub.topics['collaboration:membership:invitation:cancel'].data).to.have.length(1);
          expect(globalstub.topics['collaboration:membership:invitation:cancel'].data[0]).to.deep.equal({
            author: 'manager1',
            target: self.userId,
            membership: { user: self.userId, workflow: 'invitation' },
            collaboration: {objectType: 'community', id: 'collaboration1'}
          });
          done();
        });
      });
    });
  });

  describe('The refuseMembershipRequest function', function() {
    beforeEach(function() {
      this.helpers.mock.models({});
      this.userId = this.helpers.objectIdMock('user1');

      this.membership = {
        user: this.userId,
        workflow: 'invitation'
      };
      this.collaboration = {_id: 'collaboration1', membershipRequests: [this.membership]};
      this.user = {_id: this.userId};
      this.manager = {_id: 'manager1'};
    });

    describe('The cleanMembershipRequest callback', function() {
      const localstub = {}, globalstub = {};

      beforeEach(function() {
        this.helpers.mock.pubsub('../../pubsub', localstub, globalstub);
      });

      it('should fire callback with an error in case of an error', function(done) {
        const collaborationModule = getModule();
        const error = new Error('I failed');

        this.collaboration.save = function(callback) {
          callback(error);
        };

        function onResponse(err) {
          expect(err.message).to.equal(error.message);
          done();
        }

        collaborationModule.refuseMembershipRequest('community', this.collaboration, this.membership, this.manager, onResponse);
      });

      it('should fire a collaboration:membership:request:refuse topic message', function(done) {
        const collaborationModule = getModule();
        const self = this;

        this.collaboration.save = function(callback) {
          callback();
        };

        collaborationModule.refuseMembershipRequest('community', this.collaboration, this.membership, this.manager, function() {
          expect(localstub.topics).to.have.property('collaboration:membership:request:refuse');
          expect(localstub.topics['collaboration:membership:request:refuse'].data).to.have.length(1);
          expect(localstub.topics['collaboration:membership:request:refuse'].data[0]).to.deep.equal({
            author: 'manager1',
            target: self.userId,
            membership: { user: self.userId, workflow: 'invitation' },
            collaboration: {objectType: 'community', id: 'collaboration1'}
          });
          expect(globalstub.topics).to.have.property('collaboration:membership:request:refuse');
          expect(globalstub.topics['collaboration:membership:request:refuse'].data).to.have.length(1);
          expect(globalstub.topics['collaboration:membership:request:refuse'].data[0]).to.deep.equal({
            author: 'manager1',
            target: self.userId,
            membership: { user: self.userId, workflow: 'invitation' },
            collaboration: {objectType: 'community', id: 'collaboration1'}
          });
          done();
        });
      });
    });
  });

  describe('The declineMembershipInvitation function', function() {
    beforeEach(function() {
      this.helpers.mock.models({});
      this.userId = this.helpers.objectIdMock('user1');

      this.membership = {
        user: this.userId,
        workflow: 'invitation'
      };
      this.collaboration = {_id: 'collaboration1', membershipRequests: [this.membership], save: function(callback) {callback();}};
      this.user = {_id: this.userId};
      this.manager = {_id: 'manager1'};
    });

    describe('cleanMembershipRequest callback', function() {
      const localstub = {}, globalstub = {};

      beforeEach(function() {
        this.helpers.mock.pubsub('../../pubsub', localstub, globalstub);
      });

      it('should fire callback with an error in case of an error', function(done) {
        const collaborationModule = getModule();
        const error = new Error('I failed');

        this.collaboration.save = function(callback) {
          callback(error);
        };

        function onResponse(err) {
          expect(err.message).to.equal(error.message);
          done();
        }

        collaborationModule.declineMembershipInvitation('community', this.collaboration, this.membership, this.manager, onResponse);
      });

      it('should fire a collaboration:membership:invitation:decline topic message', function(done) {
        const self = this;
        const collaborationModule = getModule();

        collaborationModule.declineMembershipInvitation('community', this.collaboration, this.membership, this.manager, function() {
          expect(localstub.topics).to.have.property('collaboration:membership:invitation:decline');
          expect(localstub.topics['collaboration:membership:invitation:decline'].data).to.have.length(1);
          expect(localstub.topics['collaboration:membership:invitation:decline'].data[0]).to.deep.equal({
            author: 'manager1',
            target: 'collaboration1',
            membership: { user: self.userId, workflow: 'invitation' },
            collaboration: {objectType: 'community', id: 'collaboration1'}
          });
          expect(globalstub.topics).to.have.property('collaboration:membership:invitation:decline');
          expect(globalstub.topics['collaboration:membership:invitation:decline'].data).to.have.length(1);
          expect(globalstub.topics['collaboration:membership:invitation:decline'].data[0]).to.deep.equal({
            author: 'manager1',
            target: 'collaboration1',
            membership: { user: self.userId, workflow: 'invitation' },
            collaboration: {objectType: 'community', id: 'collaboration1'}
          });
          done();
        });
      });
    });
  });

  describe('The cancelMembershipRequest function', function() {
    beforeEach(function() {
      this.helpers.mock.models({});
      this.userId = this.helpers.objectIdMock('user1');

      this.membership = {
        user: this.userId,
        workflow: 'invitation'
      };
      this.collaboration = {_id: 'collaboration1', membershipRequests: [this.membership]};
      this.user = {_id: this.userId};
      this.manager = {_id: 'manager1'};
    });

    describe('cleanMembershipRequest callback', function() {
      const localstub = {}, globalstub = {};

      beforeEach(function() {
        this.helpers.mock.pubsub('../../pubsub', localstub, globalstub);
      });

      it('should fire callback with an error in case of an error', function(done) {
        const error = new Error('I failed');
        const collaborationModule = getModule();

        this.collaboration.save = function(callback) {
          callback(error);
        };

        function onResponse(err) {
          expect(err.message).to.equal(error.message);
          done();
        }

        collaborationModule.cancelMembershipRequest('community', this.collaboration, this.membership, this.manager, onResponse);
      });

      it('should fire a collaboration:membership:request:cancel topic message', function(done) {
        const self = this;
        const collaborationModule = getModule();

        this.collaboration.save = function(callback) {
          callback();
        };

        collaborationModule.cancelMembershipRequest('community', this.collaboration, this.membership, this.manager, function() {
          expect(localstub.topics).to.have.property('collaboration:membership:request:cancel');
          expect(localstub.topics['collaboration:membership:request:cancel'].data).to.have.length(1);
          expect(localstub.topics['collaboration:membership:request:cancel'].data[0]).to.deep.equal({
            author: 'manager1',
            target: 'collaboration1',
            membership: { user: self.userId, workflow: 'invitation' },
            collaboration: {objectType: 'community', id: 'collaboration1'}
          });
          expect(globalstub.topics).to.have.property('collaboration:membership:request:cancel');
          expect(globalstub.topics['collaboration:membership:request:cancel'].data).to.have.length(1);
          expect(globalstub.topics['collaboration:membership:request:cancel'].data[0]).to.deep.equal({
            author: 'manager1',
            target: 'collaboration1',
            membership: { user: self.userId, workflow: 'invitation' },
            collaboration: {objectType: 'community', id: 'collaboration1'}
          });
          done();
        });
      });
    });
  });

  describe('The supportsMemberShipRequests fn', function() {

    it('should return false if community is undefined', function() {
      const collaborationModule = getModule();

      expect(collaborationModule.supportsMemberShipRequests(null)).to.be.false;
    });

    it('should return false if community does not have type property', function() {
      const collaborationModule = getModule();

      expect(collaborationModule.supportsMemberShipRequests({foo: 'bar'})).to.be.false;
    });

    it('should return false if community is not private or restricted', function() {
      const collaborationModule = getModule();

      expect(collaborationModule.supportsMemberShipRequests({type: 'bar'})).to.be.false;
    });

    it('should return false if community is private', function() {
      const collaborationModule = getModule();

      expect(collaborationModule.supportsMemberShipRequests({type: 'private'})).to.be.true;
    });

    it('should return false if community is restricted', function() {
      const collaborationModule = getModule();

      expect(collaborationModule.supportsMemberShipRequests({type: 'restricted'})).to.be.true;
    });

  });
});
