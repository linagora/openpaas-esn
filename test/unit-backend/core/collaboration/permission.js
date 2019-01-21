'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');

describe('The Collaboration permission module', function() {

  let lib, getModule, collaborationModuleMock;

  beforeEach(function() {
    lib = {};
    collaborationModuleMock = {
      getLib: () => {}
    };

    getModule = () => this.helpers.requireBackend('core/collaboration/permission')(lib, collaborationModuleMock);
  });

  describe('The canFind function', function() {
    it('should fail when collaboration is undefined', function(done) {
      getModule().canFind(null, {}, this.helpers.callbacks.errorWithMessage(done, 'Collaboration object is required'));
    });

    it('should fail when collaboration.type is undefined', function(done) {
      getModule().canFind({}, {}, this.helpers.callbacks.errorWithMessage(done, 'Collaboration object is required'));
    });

    it('should fail when tuple is undefined', function(done) {
      getModule().canFind({type: 'open'}, null, this.helpers.callbacks.errorWithMessage(done, 'Tuple is required'));
    });

    it('should return true when collaboration is not confidential', function(done) {
      getModule().canFind({type: 'open'}, {}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.true;
        done();
      });
    });

    it('should return the isIndirectMember result', function(done) {
      lib.isIndirectMember = sinon.spy(function(collaboration, tuple, callback) {
        callback(null, true);
      });

      getModule().canFind({type: 'confidential'}, {}, function(err, result) {
        expect(err).to.not.exist;
        expect(lib.isIndirectMember).to.have.been.called;
        expect(result).to.be.true;
        done();
      });
    });
  });

  describe('The canRead function', function() {
    it('should fail when collaboration is undefined', function(done) {
      getModule().canRead(null, {}, this.helpers.callbacks.errorWithMessage(done, 'collaboration object is required'));
    });

    it('should fail when collaboration.type is undefined', function(done) {
      getModule().canRead({}, {}, this.helpers.callbacks.errorWithMessage(done, 'collaboration object is required'));
    });

    it('should fail when tuple is undefined', function(done) {
      getModule().canRead({type: 'open'}, null, this.helpers.callbacks.errorWithMessage(done, 'Tuple is required'));
    });

    it('should return true when collaboration is open', function(done) {
      getModule().canRead({type: 'open'}, {}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.true;
        done();
      });
    });

    it('should return true when collaboration is restricted', function(done) {
      getModule().canRead({type: 'restricted'}, {}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.true;
        done();
      });
    });

    it('should return the isIndirectMember result', function(done) {
      lib.isIndirectMember = sinon.spy(function(collaboration, tuple, callback) {
        callback(null, true);
      });

      getModule().canRead({type: 'confidential'}, {}, function(err, result) {
        expect(err).to.not.exist;
        expect(lib.isIndirectMember).to.have.been.called;
        expect(result).to.be.true;
        done();
      });
    });

    it('should use #canRead function of the registered module when there is a private collaboration', function(done) {
      const collaboration = { type: 'private' };
      const tuple = { id: 'AFF2018' };
      const canReadMock = sinon.spy((_collaboration, _tuple, callback) => {
        expect(_collaboration).to.deep.equal(collaboration);
        expect(_tuple).to.deep.equal(tuple);
        callback(null, true);
      });

      collaborationModuleMock.getLib = () => ({
        permission: { canRead: canReadMock }
      });

      getModule().canRead(collaboration, tuple, (err, result) => {
        expect(err).to.not.exist;
        expect(result).to.be.true;
        expect(canReadMock).to.have.been.calledOnce;
        done();
      });
    });
  });

  describe('The canWrite function', function() {
    it('should fail when collaboration is undefined', function(done) {
      getModule().canWrite(null, {}, this.helpers.callbacks.errorWithMessage(done, 'collaboration object is required'));
    });

    it('should fail when collaboration.type is undefined', function(done) {
      getModule().canWrite({}, {}, this.helpers.callbacks.errorWithMessage(done, 'collaboration object is required'));
    });

    it('should fail when tuple is undefined', function(done) {
      getModule().canWrite({type: 'open'}, null, this.helpers.callbacks.errorWithMessage(done, 'Tuple is required'));
    });

    it('should return true when collaboration is open', function(done) {
      getModule().canWrite({type: 'open'}, {}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.true;
        done();
      });
    });

    it('should return the isIndirectMember result', function(done) {
      lib.isIndirectMember = sinon.spy(function(collaboration, tuple, callback) {
        callback(null, true);
      });

      getModule().canWrite({type: 'confidential'}, {}, function(err, result) {
        expect(err).to.not.exist;
        expect(lib.isIndirectMember).to.have.been.called;
        expect(result).to.be.true;
        done();
      });
    });
  });

  describe('The canLeave function', function() {
    it('should fail if creator want to leave collaboration', function(done) {
      getModule().canLeave({ creator: 'creatorId' }, { id: 'creatorId' }, (err, result) => {
        expect(err).to.not.exist;
        expect(result).to.be.false;
        done();
      });
    });

    it('should return the result of registered canLeave permission of collaboration', function(done) {
      const objectType = 'foobar';

      collaborationModuleMock.getLib = sinon.spy(() => ({
        permission: {
          canLeave: sinon.stub().returns(Promise.resolve(false))
        }
      }));

      getModule().canLeave({ creator: 'creatorId', objectType }, { id: 'userId' }, function(err, result) {
        expect(err).to.not.exist;
        expect(collaborationModuleMock.getLib).to.have.been.calledWith(objectType);
        expect(result).to.be.false;
        done();
      });
    });

    it('should true if member want to leave collaboration', function(done) {
      collaborationModuleMock.getLib = () => {};

      getModule().canLeave({ creator: 'creatorId' }, { id: 'userId' }, (err, result) => {
        expect(err).to.not.exist;
        expect(result).to.be.true;
        done();
      });
    });
  });

  describe('The filterWritable function', function() {
    it('should fail when collaborations is undefined', function(done) {
      getModule().filterWritable(null, {}, this.helpers.callbacks.errorWithMessage(done, 'collaborations is required'));
    });

    it('should fail when tuple is undefined', function(done) {
      getModule().filterWritable([], null, this.helpers.callbacks.errorWithMessage(done, 'tuple is required'));
    });

    it('should return only writable collaborations', function(done) {
      const collaborations = [{_id: 1, type: 'private'}, {_id: 2, type: 'private'}, {_id: 3, type: 'private'}];
      const user = {objectType: 'user', id: 123456789};

      lib.isIndirectMember = function(collaboration, tuple, callback) {
        if (collaboration._id === 1) {
          return callback(null, false);
        }

        callback(null, true);
      };

      getModule().filterWritable(collaborations, user, function(err, result) {
        expect(result.length).to.exist;
        expect(result).to.not.include(collaborations[0]);
        expect(result).to.include(collaborations[1]);
        expect(result).to.include(collaborations[2]);
        done();
      });
    });
  });

  describe('The canRemoveContent function', function() {
    it('should return false if there is no registered module', function(done) {
      getModule().canRemoveContent({}, {}, (err, result) => {
        expect(err).to.not.exist;
        expect(result).to.be.false;
        done();
      });
    });

    it('should use #canRemoveContent function of the registered module', function(done) {
      const collaboration = { type: 'open' };
      const tuple = { id: 'AFF2018' };
      const canRemoveContentMock = sinon.spy((_collaboration, _tuple, callback) => {
        expect(_collaboration).to.deep.equal(collaboration);
        expect(_tuple).to.deep.equal(tuple);
        callback(null, true);
      });

      collaborationModuleMock.getLib = () => ({
        permission: { canRemoveContent: canRemoveContentMock }
      });

      getModule().canRemoveContent(collaboration, tuple, (err, result) => {
        expect(err).to.not.exist;
        expect(result).to.be.true;
        expect(canRemoveContentMock).to.have.been.calledOnce;
        done();
      });
    });
  });
});
