'use strict';

var mockery = require('mockery');
var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');

describe('The User helper module', function() {

  describe('The saveAndIndexUser function', function() {
    it('should not index when save send back error', function(done) {
      var spy = sinon.spy();
      mockery.registerMock('./listener', {});
      mockery.registerMock('../elasticsearch/listeners', {
        index: spy
      });

      var e = new Error('This is a failure');
      var module = this.helpers.requireBackend('core/user/helpers');
      module.saveAndIndexUser({
        save: function(callback) {
          return callback(e);
        }
      }, function(err) {
        expect(spy).to.not.have.been.called;
        expect(err).to.equal(e);
        done();
      });
    });

    it('should index document and call callback', function(done) {
      var document = {_id: 1};
      var opts = {foo: 'bar'};

      var optionsSpy = sinon.stub().returns(opts);
      var indexSpy = sinon.spy();

      mockery.registerMock('./listener', {
        getOptions: optionsSpy
      });
      mockery.registerMock('../elasticsearch/listeners', {
        index: function(data, options, callback) {
          indexSpy();
          expect(data).to.deep.equal(document);
          expect(options).to.deep.equal(opts);
          callback(new Error(), {some: 'index result'});
        }
      });
      mockery.registerMock('../logger', {
        error: function() {},
        debug: function() {}
      });

      var module = this.helpers.requireBackend('core/user/helpers');
      module.saveAndIndexUser({
        save: function(callback) {
          return callback(null, document);
        }
      }, function() {
        expect(optionsSpy).to.have.been.called;
        expect(indexSpy).to.have.been.called;
        done();
      });
    });
  });
});
