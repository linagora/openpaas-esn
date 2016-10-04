'use strict';

var mockery = require('mockery');
var sinon = require('sinon');
var q = require('q');
var expect = require('chai').expect;

describe('The user moderation core module', function() {

  beforeEach(function() {
    mockery.registerMock('../pubsub', {
      local: {}
    });
  });

  describe('The handleEvent function', function() {
    it('should not process event when user is not defined', function(done) {
      var module = this.helpers.requireBackend('core/user/moderation');
      module.handleEvent({}).then(done, function(err) {
        expect(err.message).to.match(/User is not defined/);
        done();
      });
    });

    describe('When user is disabled', function() {

      it('should call all the defined onUserDisabled in handlers', function(done) {
        var user = {_id: 1};
        var spy = sinon.spy();

        var handler1 = {
          onUserDisabled: function(u) {
            expect(u).to.deep.equals(user);
            spy();
            return q({});
          }
        };

        var handler2 = {
          onUserDisabled: function(u) {
            expect(u).to.deep.equals(user);
            spy();
            return q({});
          }
        };

        var module = this.helpers.requireBackend('core/user/moderation');
        module.registerHandler('1', handler1);
        module.registerHandler('2', handler2);
        module.handleEvent({user: user, disabled: true}).then(function(result) {
          expect(result.length).to.equal(2);
          expect(spy).to.have.been.calledTwice;
          done();
        }, done);
      });

      it('should call as many times as there are registered handlers', function(done) {
        var user = {_id: 1};
        var spy = sinon.spy();

        var handler1 = {
          onUserDisabled: function(u) {
            expect(u).to.deep.equals(user);
            spy();
            return q({});
          }
        };

        var handler2 = {
        };

        var module = this.helpers.requireBackend('core/user/moderation');
        module.registerHandler('1', handler1);
        module.registerHandler('2', handler2);
        module.handleEvent({user: user, disabled: true}).then(function(result) {
          expect(result.length).to.equal(2);
          expect(spy).to.have.been.calledOnce;
          done();
        }, done);
      });
    });

    describe('When user is enabled', function() {

      it('should call all the defined onUserEnabled in handlers', function(done) {
        var user = {_id: 1};
        var spy = sinon.spy();

        var handler1 = {
          onUserEnabled: function(u) {
            expect(u).to.deep.equals(user);
            spy();
            return q({});
          }
        };

        var handler2 = {
          onUserEnabled: function(u) {
            expect(u).to.deep.equals(user);
            spy();
            return q({});
          }
        };

        var module = this.helpers.requireBackend('core/user/moderation');
        module.registerHandler('1', handler1);
        module.registerHandler('2', handler2);
        module.handleEvent({user: user, disabled: false}).then(function(result) {
          expect(result.length).to.equal(2);
          expect(spy).to.have.been.calledTwice;
          done();
        }, done);
      });

      it('should call as many times as there are registered handlers', function(done) {
        var user = {_id: 1};
        var spy = sinon.spy();

        var handler1 = {
          onUserEnabled: function(u) {
            expect(u).to.deep.equals(user);
            spy();
            return q({});
          }
        };

        var handler2 = {
        };

        var module = this.helpers.requireBackend('core/user/moderation');
        module.registerHandler('1', handler1);
        module.registerHandler('2', handler2);
        module.handleEvent({user: user, disabled: false}).then(function(result) {
          expect(result.length).to.equal(2);
          expect(spy).to.have.been.calledOnce;
          done();
        }, done);
      });
    });

  });

  describe('The registerHandler function', function() {
    it('should not add handler when name is not defined', function() {
      var module = this.helpers.requireBackend('core/user/moderation');
      module.registerHandler(null, {});
      expect(module.getHandlers()).to.deep.equals({});
    });

    it('should not add handler when handler is not defined', function() {
      var module = this.helpers.requireBackend('core/user/moderation');
      module.registerHandler('My handler');
      expect(module.getHandlers()).to.deep.equals({});
    });

    it('should add handler', function() {
      var module = this.helpers.requireBackend('core/user/moderation');
      var handler = {foo: 'bar'};
      module.registerHandler('My handler', handler);
      expect(module.getHandlers()).to.deep.equals({'My handler': handler});
    });
  });
});
