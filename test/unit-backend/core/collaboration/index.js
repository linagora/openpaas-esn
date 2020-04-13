'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const mockery = require('mockery');

describe('The collaboration module', function() {
  beforeEach(function() {
    mockery.registerMock('./usernotification', function() {});
    mockery.registerMock('../../user', {});
    this.getModule = function() {
      return this.helpers.requireBackend('core/collaboration');
    };
  });

  describe('The query function', function() {
    it('should fail if the collaboration objectType is unknown', function(done) {
      const collaboration = this.getModule();

      collaboration.query('i dont exist', {}, function(err) {
        expect(err.message).to.match(/Collaboration model i dont exist is unknown/);
        done();
      });
    });

    it('should call mongoose#find even when query is undefined', function(done) {
      const objectType = 'collaboration';
      const CollaborationModel = {
        find: sinon.spy(function(query, callback) {
          callback();
        })
      };

      this.helpers.mock.models({
        Collaboration: CollaborationModel
      });

      const collaboration = this.getModule();

      collaboration.registerCollaborationModel(objectType, 'Collaboration');

      collaboration.query(objectType, null, function() {
        expect(CollaborationModel.find).to.have.been.called;
        done();
      });
    });

    it('should call mongoose#find with query', function(done) {
      const query = 'fo bar';
      const objectType = 'collaboration';
      const CollaborationModel = {
        find: sinon.spy(function(query, callback) {
          callback();
        })
      };

      this.helpers.mock.models({
        Collaboration: CollaborationModel
      });

      const collaboration = this.getModule();

      collaboration.registerCollaborationModel(objectType, 'Collaboration');

      collaboration.query(objectType, query, function() {
        expect(CollaborationModel.find).to.have.been.calledWith(query);
        done();
      });
    });
  });

  describe('The userToMember function', function() {
    it('should send back result even if user is null', function() {
      const collaboration = this.getModule();
      const member = collaboration.userToMember(null);

      expect(member).to.exist;
    });

    it('should send back result even if document.user is null', function() {
      const collaboration = this.getModule();
      const member = collaboration.userToMember({});

      expect(member).to.exist;
    });

    it('should filter document', function() {
      const user = {
        _id: 1,
        firstname: 'Me',
        password: '1234',
        avatars: [1, 2, 3],
        login: [4, 5, 6]
      };
      const collaboration = this.getModule();
      const member = collaboration.userToMember({member: user});

      expect(member).to.exist;
      expect(member.user).to.exist;
      expect(member.user._id).to.exist;
      expect(member.user.firstname).to.exist;
      expect(member.user.password).to.not.exist;
      expect(member.user.avatars).to.not.exist;
      expect(member.user.login).to.not.exist;
    });
  });

  describe('The getCollaborationsForUser function', function() {
    it('should return nothing if no collaboration lib has a getCollaborationsForUser function', function(done) {
      const collaborationModule = this.getModule();

      collaborationModule.registerCollaborationLib('collaboration', {});
      collaborationModule.getCollaborationsForUser('userId', {}, function(err, collaborations) {
        expect(err).to.not.exist;
        expect(collaborations).to.deep.equal([]);
        done();
      });
    });

    it('should call all libs getCollaborationsForUser function with the right options', function(done) {
      const libCalled = [];
      const userId = 'userId';
      const testOptions = {
        opt1: 'test',
        opt2: []
      };
      const collaborationModule = this.getModule();

      collaborationModule.registerCollaborationLib('collaboration', {
        getCollaborationsForUser: function(id, options, callback) {
          expect(id).to.equal(userId);
          expect(options).to.deep.equal(testOptions);
          libCalled.push('collaboration');
          callback(null, null);
        }
      });

      collaborationModule.registerCollaborationLib('otherLib', {
        getCollaborationsForUser: function(id, options, callback) {
          expect(id).to.equal(userId);
          expect(options).to.equal(testOptions);
          libCalled.push('otherLib');
          callback(null, null);
        }
      });

      collaborationModule.getCollaborationsForUser(userId, testOptions, function(err, collaborations) {
        expect(err).to.not.exist;
        expect(collaborations).to.deep.equal([]);
        expect(libCalled).to.deep.equal(['collaboration', 'otherLib']);
        done();
      });
    });

    it('should return the aggregated results of libs getCollaborationsForUser', function(done) {
      const collaborations = [{_id: 'collaboration1'}, {_id: 'collaboration2'}];
      const otherCollaborations = [{_id: 'other1'}, {_id: 'other2'}];
      const collaborationModule = this.getModule();

      collaborationModule.registerCollaborationLib('collaboration', {
        getCollaborationsForUser: function(id, options, callback) {
          callback(null, collaborations);
        }
      });

      collaborationModule.registerCollaborationLib('otherLib', {
        getCollaborationsForUser: function(id, options, callback) {
          callback(null, otherCollaborations);
        }
      });

      collaborationModule.getCollaborationsForUser('userId', {}, function(err, collaborations) {
        expect(err).to.not.exist;
        collaborations.forEach(function(collaboration) {
          expect(collaborations).to.contain(collaboration);
        });
        otherCollaborations.forEach(function(other) {
          expect(collaborations).to.contain(other);
        });
        done();
      });
    });

    it('should return the aggregated results of libs getCollaborationsForUser even if some are null', function(done) {
      const collaborationModule = this.getModule();
      const otherCollaborations = [{_id: 'other1'}, {_id: 'other2'}];

      collaborationModule.registerCollaborationLib('collaboration', {
        getCollaborationsForUser: function(id, options, callback) {
          callback(null, null);
        }
      });

      collaborationModule.registerCollaborationLib('otherLib', {
        getCollaborationsForUser: function(id, options, callback) {
          callback(null, otherCollaborations);
        }
      });

      collaborationModule.getCollaborationsForUser('userId', {}, function(err, collaborations) {
        expect(err).to.not.exist;
        expect(collaborations).to.deep.equal(otherCollaborations);
        done();
      });
    });

    it('should return the aggregated results of libs getCollaborationsForUser even if some are empty', function(done) {
      const collaborations = [{_id: 'collaboration1'}, {_id: 'collaboration2'}];
      const collaborationModule = this.getModule();

      collaborationModule.registerCollaborationLib('collaboration', {
        getCollaborationsForUser: function(id, options, callback) {
          callback(null, collaborations);
        }
      });

      collaborationModule.registerCollaborationLib('otherLib', {
        getCollaborationsForUser: function(id, options, callback) {
          callback(null, []);
        }
      });

      collaborationModule.getCollaborationsForUser('userId', {}, function(err, collaborations) {
        expect(err).to.not.exist;
        expect(collaborations).to.deep.equal(collaborations);
        done();
      });
    });

    it('should return if there are errors in libs getCollaborationsForUser', function(done) {
      const collaborations = [{_id: 'collaboration1'}, {_id: 'collaboration2'}];
      const errorInOther = new Error('error in other');
      const collaborationModule = this.getModule();

      collaborationModule.registerCollaborationLib('collaboration', {
        getCollaborationsForUser: function(id, options, callback) {
          callback(null, collaborations);
        }
      });

      collaborationModule.registerCollaborationLib('otherLib', {
        getCollaborationsForUser: function(id, options, callback) {
          callback(errorInOther);
        }
      });

      collaborationModule.getCollaborationsForUser('userId', {}, function(err) {
        expect(err).to.deep.equal(errorInOther);
        done();
      });
    });
  });

  describe('The hasDomain function', function() {
    it('should test the domainId', function() {
      const hasDomain = this.getModule().hasDomain;

      expect(hasDomain({domain_ids: []}, '12')).to.be.false;
      expect(hasDomain({domain_ids: ['12']}, '12')).to.be.true;
      expect(hasDomain({domain_ids: ['12232499', '13412', '1125']}, '12')).to.be.false;
      expect(hasDomain({domain_ids: ['999', '111', '12', '13']}, '12')).to.be.true;
    });
  });
});
