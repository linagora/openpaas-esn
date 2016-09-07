'use strict';

var expect = require('chai').expect;
var sinon = require('sinon');
var q = require('q');

describe('The message role module', function() {

  describe('The apply function', function() {

    it('should call the handlers and return true if all handlers returned true', function(done) {
      var spyA = sinon.spy();
      var spyB = sinon.spy();
      var handlerFoo = function() {
        spyA();
        return q(true);
      };
      var handlerBar = function() {
        spyB();
        return q(true);
      };

      var module = this.helpers.requireBackend('core/message/role');
      module.addHandler('foo', handlerFoo);
      module.addHandler('bar', handlerBar);

      module.canReadMessage({}, {}).then(function(result) {
        expect(result).to.be.true;
        expect(spyA).to.have.been.calledOnce;
        expect(spyB).to.have.been.calledOnce;
        done();
      });
    });

    it('should call the handlers and return false if one handler handler returned false', function(done) {
      var spyA = sinon.spy();
      var spyB = sinon.spy();
      var spyC = sinon.spy();
      var handlerFoo = function() {
        spyA();
        return q(true);
      };

      var handlerBar = function() {
        spyB();
        return q(false);
      };

      var handlerBaz = function() {
        spyC();
        return q(true);
      };

      var module = this.helpers.requireBackend('core/message/role');
      module.addHandler('foo', handlerFoo);
      module.addHandler('bar', handlerBar);
      module.addHandler('baz', handlerBaz);

      module.canReadMessage({}, {}).then(function(result) {
        expect(result).to.be.false;
        expect(spyA).to.have.been.calledOnce;
        expect(spyB).to.have.been.calledOnce;
        expect(spyC).to.have.been.calledOnce;
        done();
      });
    });
  });
});
