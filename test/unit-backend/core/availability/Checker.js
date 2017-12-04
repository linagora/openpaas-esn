'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const q = require('q');

describe('The core/availability/Checker class', function() {
  let checker;

  beforeEach(function() {
    const Checker = this.helpers.requireBackend('core/availability/checker');

    checker = new Checker('email');
  });

  describe('The constructor', function() {
    it('should initialize the resource type', function() {
      expect(checker.resourceType).to.equal('email');
    });

    it('should initialize default validator that always returns true', function() {
      expect(checker.validator()).to.equal(true);
    });
  });

  describe('The addChecker method', function() {
    it('should throw error when checker has no name', function() {
      expect(function() {
        checker.addChecker({});
      }).to.throw(Error, 'checker must have a name');
    });

    it('should throw error when checker has no check function', function() {
      expect(function() {
        checker.addChecker({ name: 'user' });
      }).to.throw(Error, 'checker must have a check function');
    });

    it('should add the checker to the list', function() {
      checker.addChecker({ name: 'user', check: () => {} });
      expect(checker.checkers).to.have.length(1);
    });
  });

  describe('The isAvailable method', function() {
    beforeEach(function() {
      checker.addChecker({
        name: 'always available',
        check() {
          return q(true);
        }
      });
    });

    it('should resolve "available: false" when resource ID is validation failed', function(done) {
      const resourceId = 'e@mail';

      checker.validator = () => false;
      checker.isAvailable(resourceId)
        .then(result => {
          expect(result).to.deep.equal({
            available: false,
            message: `Invalid email: ${resourceId}`
          });
          done();
        });
    });

    it('should resolve "available: true" when all checkers resolve available', function(done) {
      const check = sinon.stub().returns(q(true));
      const resourceId = 'e@mail';

      checker.addChecker({
        name: 'user',
        check
      });

      checker.isAvailable(resourceId)
        .then(result => {
          expect(result).to.deep.equal({
            available: true
          });
          expect(check).to.have.calledOnce;
          expect(check).to.have.been.calledWith(resourceId);
          done();
        })
        .catch(err => done(err || 'should resolve'));
    });

    it('should resolve "available: false" when one of checkers resolve unavailable', function(done) {
      const check = sinon.stub().returns(q(false));
      const resourceId = 'e@mail';

      checker.addChecker({
        name: 'user',
        check
      });

      checker.isAvailable(resourceId)
        .then(result => {
          expect(result).to.deep.equal({
            available: false,
            message: 'email "e@mail" is in use, checked by "user" checker'
          });
          expect(check).to.have.calledOnce;
          expect(check).to.have.been.calledWith(resourceId);
          done();
        })
        .catch(err => done(err || 'should resolve'));
    });

    it('should reject when one of checkers rejects', function(done) {
      const check = sinon.stub().returns(q.reject(new Error('an_error')));
      const resourceId = 'e@mail';

      checker.addChecker({
        name: 'user',
        check
      });

      checker.isAvailable(resourceId)
        .then(() => done('should reject'))
        .catch(err => {
          expect(err.message).to.equal('an_error');
          expect(check).to.have.calledOnce;
          expect(check).to.have.been.calledWith(resourceId);
          done();
        });
    });
  });
});
