'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');

describe('The Collaboration permission module', function() {

  let lib, collaborationModuleMock;

  beforeEach(function() {
    lib = {
    };
    collaborationModuleMock = {};

    this.getModule = function() {
      return this.helpers.requireBackend('core/collaboration/permission')(lib, collaborationModuleMock);
    };
  });

  describe('The canFind function', function() {
    it('should fail when collaboration is undefined', function(done) {
      const module = this.getModule();

      module.canFind(null, {}, this.helpers.callbacks.errorWithMessage(done, 'Collaboration object is required'));
    });

    it('should fail when collaboration.type is undefined', function(done) {
      const module = this.getModule();

      module.canFind({}, {}, this.helpers.callbacks.errorWithMessage(done, 'Collaboration object is required'));
    });

    it('should fail when tuple is undefined', function(done) {
      const module = this.getModule();

      module.canFind({type: 'open'}, null, this.helpers.callbacks.errorWithMessage(done, 'Tuple is required'));
    });

    it('should return true when collaboration is not confidential', function(done) {
      const module = this.getModule();

      module.canFind({type: 'open'}, {}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.true;
        done();
      });
    });

    it('should return the isIndirectMember result', function(done) {
      lib.isIndirectMember = sinon.spy(function(collaboration, tuple, callback) {
        callback(null, true);
      });

      const module = this.getModule();

      module.canFind({type: 'confidential'}, {}, function(err, result) {
        expect(err).to.not.exist;
        expect(lib.isIndirectMember).to.have.been.called;
        expect(result).to.be.true;
        done();
      });
    });
  });

  describe('The canRead function', function() {
    it('should fail when collaboration is undefined', function(done) {
      const module = this.getModule();

      module.canRead(null, {}, this.helpers.callbacks.errorWithMessage(done, 'collaboration object is required'));
    });

    it('should fail when collaboration.type is undefined', function(done) {
      const module = this.getModule();

      module.canRead({}, {}, this.helpers.callbacks.errorWithMessage(done, 'collaboration object is required'));
    });

    it('should fail when tuple is undefined', function(done) {
      const module = this.getModule();

      module.canRead({type: 'open'}, null, this.helpers.callbacks.errorWithMessage(done, 'Tuple is required'));
    });

    it('should return true when collaboration is open', function(done) {
      const module = this.getModule();

      module.canRead({type: 'open'}, {}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.true;
        done();
      });
    });

    it('should return true when collaboration is restricted', function(done) {
      const module = this.getModule();

      module.canRead({type: 'restricted'}, {}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.true;
        done();
      });
    });

    it('should return the isIndirectMember result', function(done) {
      lib.isIndirectMember = sinon.spy(function(collaboration, tuple, callback) {
        callback(null, true);
      });

      const module = this.getModule();

      module.canRead({type: 'confidential'}, {}, function(err, result) {
        expect(err).to.not.exist;
        expect(lib.isIndirectMember).to.have.been.called;
        expect(result).to.be.true;
        done();
      });
    });
  });

  describe('The canWrite function', function() {
    it('should fail when collaboration is undefined', function(done) {
      const module = this.getModule();

      module.canWrite(null, {}, this.helpers.callbacks.errorWithMessage(done, 'collaboration object is required'));
    });

    it('should fail when collaboration.type is undefined', function(done) {
      const module = this.getModule();

      module.canWrite({}, {}, this.helpers.callbacks.errorWithMessage(done, 'collaboration object is required'));
    });

    it('should fail when tuple is undefined', function(done) {
      const module = this.getModule();

      module.canWrite({type: 'open'}, null, this.helpers.callbacks.errorWithMessage(done, 'Tuple is required'));
    });

    it('should return true when collaboration is open', function(done) {
      const module = this.getModule();

      module.canWrite({type: 'open'}, {}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.true;
        done();
      });
    });

    it('should return the isIndirectMember result', function(done) {
      lib.isIndirectMember = sinon.spy(function(collaboration, tuple, callback) {
        callback(null, true);
      });

      const module = this.getModule();

      module.canWrite({type: 'confidential'}, {}, function(err, result) {
        expect(err).to.not.exist;
        expect(lib.isIndirectMember).to.have.been.called;
        expect(result).to.be.true;
        done();
      });
    });
  });

  describe('The canLeave function', function() {
    it('should fail if creator want to leave collaboration', function(done) {
      const module = this.getModule();

      collaborationModuleMock.getLib = () => {};

      module.canLeave({ creator: 'creatorId' }, { id: 'creatorId' }, (err, result) => {
        expect(err).to.not.exist;
        expect(result).to.be.false;
        done();
      });
    });

    it('should return the result of registered canLeave permission of collaboration', function(done) {
      const module = this.getModule();
      const objectType = 'foobar';

      collaborationModuleMock.getLib = sinon.spy(() => ({
        permission: {
          canLeave: sinon.stub().returns(Promise.resolve(false))
        }
      }));

      module.canLeave({ creator: 'creatorId', objectType }, { id: 'userId' }, function(err, result) {
        expect(err).to.not.exist;
        expect(collaborationModuleMock.getLib).to.have.been.calledWith(objectType);
        expect(result).to.be.false;
        done();
      });
    });

    it('should true if member want to leave collaboration', function(done) {
      const module = this.getModule();

      collaborationModuleMock.getLib = () => {};

      module.canLeave({ creator: 'creatorId' }, { id: 'userId' }, (err, result) => {
        expect(err).to.not.exist;
        expect(result).to.be.true;
        done();
      });
    });
  });

  describe('The filterWritable function', function() {
    it('should fail when collaborations is undefined', function(done) {
      const module = this.getModule();

      module.filterWritable(null, {}, this.helpers.callbacks.errorWithMessage(done, 'collaborations is required'));
    });

    it('should fail when tuple is undefined', function(done) {
      const module = this.getModule();

      module.filterWritable([], null, this.helpers.callbacks.errorWithMessage(done, 'tuple is required'));
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

      const module = this.getModule();

      module.filterWritable(collaborations, user, function(err, result) {
        expect(result.length).to.exist;
        expect(result).to.not.include(collaborations[0]);
        expect(result).to.include(collaborations[1]);
        expect(result).to.include(collaborations[2]);
        done();
      });
    });
  });
});
