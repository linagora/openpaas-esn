'use strict';

const expect = require('chai').expect;
const mockery = require('mockery');
const sinon = require('sinon');
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

  describe('The addMembers function', function() {
    it('should send back error if it failed to update collaboration', function(done) {
      modelMock.update = function(a, b, callback) {
        callback(new Error());
      };

      const collabMock = {
        members: [],
        _id: 'collaboration1',
        save: function(callback) {
          callback(new Error('failed to update collaboration'));
        }
      };
      const collaborationModule = getModule();

      collaborationModule.addMembers(collabMock, [{
        id: new ObjectId(),
        objectType: 'user'
      }], err => {
        expect(err).to.exist;
        expect(err.message).to.equal('failed to update collaboration');
        done();
      });
    });

    it('should send back error if a member is not a supported tuple', function(done) {
      const collabMock = {
        members: [],
        _id: 'collaboration1',
        save: function() {}
      };
      const user = new ObjectId();
      const members = [
        { id: user, objectType: 'user' },
        { id: 'invalid', objectType: 'invalidtuple' }
      ];
      const collaborationModule = getModule();

      collaborationModule.addMembers(collabMock, members, err => {
        expect(err).to.exist;
        expect(err.message).to.equal(`${members[1].objectType} is not a supported tuple`);
        done();
      });
    });

    it('should add filtered members of duplicates or members which are currently existing in target collaboration', function(done) {
      const existingMember = { id: 'member@email.org', objectType: 'email' };
      const collabMock = {
        members: [{ member: existingMember, status: 'joined' }],
        _id: 'collaboration1',
        save: function(callback) {
          callback(null, this);
        }
      };
      const userId = String(new ObjectId());
      const addingMembers = [
        { id: userId, objectType: 'user' },
        { id: userId, objectType: 'user' },
        existingMember
      ];
      const expectedMembers = [
        { member: existingMember, status: 'joined' },
        { member: {id: userId, objectType: 'user'}, status: 'joined' }
      ];
      const collaborationModule = getModule();

      collaborationModule.addMembers(collabMock, addingMembers, (err, updated) => {
        expect(err).to.not.exist;
        expect(updated.members.length).to.equal(2);
        expect(updated.members).to.shallowDeepEqual(expectedMembers);
        done();
      });
    });

    it('should send back updated documents', function(done) {
      const collabMock = {
        members: [],
        _id: 'collaboration1',
        save: function(callback) {
          this.updated = true;
          callback(null, this);
        }
      };
      const userId = String(new ObjectId());
      const members = [
        { id: userId, objectType: 'user' },
        { id: userId, objectType: 'user' },
        { id: 'email@lngr.com', objectType: 'email' },
        { id: 'email@lngr.com', objectType: 'email' }
      ];
      const expectedMembers = [
        { member: { id: userId, objectType: 'user' }, status: 'joined' },
        { member: { id: 'email@lngr.com', objectType: 'email' }, status: 'joined' }
      ];
      const collaborationModule = getModule();

      collaborationModule.addMembers(collabMock, members, (err, update) => {
        expect(err).to.not.exist;
        expect(update.updated).to.be.true;
        expect(update.members.length).to.equal(2);
        expect(update.members).to.shallowDeepEqual(expectedMembers);
        done();
      });
    });
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

      collaborationModule.leave('community', 123, 456, new ObjectId(), function(err) {
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

      collaborationModule.leave('community', 123, 456, new ObjectId(), function(err, update) {
        expect(err).to.not.exist;
        expect(update).to.deep.equal(result);
        done();
      });
    });

    it('should forward message into collaboration:leave', function(done) {
      const result = {_id: 123};
      const localstub = {}, globalstub = {};
      const userTarget = String(new ObjectId());

      modelMock.update = function(a, b, callback) {
        callback(null, result);
      };

      this.helpers.mock.pubsub('../../pubsub', localstub, globalstub);

      const collaborationModule = getModule();

      collaborationModule.leave('community', 123, '456', userTarget, function(err, update) {
        expect(err).to.not.exist;
        expect(update).to.deep.equal(result);
        expect(localstub.topics['collaboration:leave'].data[0]).to.deep.equal({
          author: '456',
          target: userTarget,
          collaboration: {objectType: 'community', id: 123}
        });
        expect(globalstub.topics['collaboration:leave'].data[0]).to.deep.equal({
          author: '456',
          target: userTarget,
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
          callback(null, this, 1);
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

    it('should not forward message into collaboration:join if no member is added', function(done) {
      const pubsubMock = {
        local: {
          topic: sinon.spy()
        }
      };

      mockery.registerMock('../../pubsub', pubsubMock);

      const member = new ObjectId();
      const user = new ObjectId();
      const collaboration = {
        members: [{
          member: {
            objectType: 'user',
            id: member
          }
        }],
        _id: 'collaboration',
        save: callback => {
          this.updated = true;
          callback(null, this, 0);
        }
      };

      const collaborationModule = getModule();

      collaborationModule.join('collaboration', collaboration, user, member, 'user', err => {
        expect(err).to.not.exist;
        expect(pubsubMock.local.topic).to.not.have.been.called;
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

  describe('The removeMembers function', function() {
    it('should callback with error when collaboration is missing', function(done) {
      const collaboration = null;
      const members = [];

      getModule().removeMembers(collaboration, members, err => {
        expect(err.message).to.equal('Collaboration and members are required');
        done();
      });
    });

    it('should callback with error when members is not an array', function(done) {
      const collaboration = { objectType: 'objectType', id: 'id' };
      const members = 'not an array';

      getModule().removeMembers(collaboration, members, err => {
        expect(err.message).to.equal('Collaboration and members are required');
        done();
      });
    });

    it('should callback with error when some member tuples are invalid', function(done) {
      const collaboration = { objectType: 'objectType', id: 'id' };
      const members = [{ objectType: 'user', id: 1 }, { objectType: 'unknown', id: 2 }];
      const tupleMock = { get: sinon.stub() };

      tupleMock.get.withArgs(members[0]).returns(members[0]);
      tupleMock.get.withArgs(members[1]).returns(null);

      mockery.registerMock('../../tuple', tupleMock);
      getModule().removeMembers(collaboration, members, err => {
        expect(err.message).to.equal('Some members are invalid or unsupported tuples');
        done();
      });
    });

    it('should call Model.update to remove members', function(done) {
      const collaboration = { objectType: 'objectType', id: 'id' };
      const members = [{ objectType: 'user', id: 1 }, { objectType: 'user', id: 2 }];
      const tupleMock = { get: tuple => tuple };
      const updatedData = { key: 'value' };

      mockery.registerMock('../../tuple', tupleMock);
      modelMock.update = sinon.spy((query, option, callback) => callback(null, updatedData));

      getModule().removeMembers(collaboration, members, (err, updated) => {
        expect(err).to.not.exist;
        expect(updated).to.deep.equal(updatedData);
        expect(modelMock.update).to.have.been.calledOnce;
        done();
      });
    });
  });

  describe('the getManagers() method', function() {

    const managersModelMock = {
      findById: function() {
        return this;
      },
      populate: function() {
        return this;
      }
    };

    it('should return an error when the model is not found', function() {
      modelMock = undefined;

      getModule().getManagers('channel', '123', err => {
        expect(err).to.exist;
        expect(err.message).to.match(/is unknown/);
      });
    });

    it('should return an empty array when the collaboration is not found', function() {
      modelMock = managersModelMock;
      modelMock.exec = function(callback) {
        return callback(null, null);
      };

      getModule().getManagers('channel', '123', (err, managers) => {
        expect(err).to.not.exist;
        expect(managers).to.be.an('array');
        expect(managers).to.have.length(0);
      });
    });

    it('should return an empty array when the collaboration creator does not exist', function() {
      modelMock = managersModelMock;
      modelMock.exec = function(callback) {
        return callback(null, {creator: undefined});
      };

      getModule().getManagers('channel', '123', (err, managers) => {
        expect(err).to.not.exist;
        expect(managers).to.be.an('array');
        expect(managers).to.have.length(0);
      });
    });

    it('should return an array with the collaboration creator when it exists', function() {
      const creator = {_id: 'user1'};
      modelMock = managersModelMock;
      modelMock.exec = function(callback) {
        return callback(null, {creator});
      };

      getModule().getManagers('channel', '123', (err, managers) => {
        expect(err).to.not.exist;
        expect(managers).to.be.an('array');
        expect(managers).to.have.length(1);
        expect(managers[0]).to.deep.equal(creator);
      });
    });
  });

  describe('The getMemberAndMembershipRequestIds function', function() {
    it('should filter all ids of members and membershipRequests', function() {
      const collaborationMock = {
        members: [{member: {id: '1'}}, {member: {id: '2'}}],
        membershipRequests: [{user: '3'}, {user: '4'}, {user: '5'}]
      };
      const collaborationModule = getModule();
      const results = collaborationModule.getMemberAndMembershipRequestIds(collaborationMock);

      expect(results).to.deep.equal(['1', '2', '3', '4', '5']);
    });

  });
});
