'use strict';

var mockery = require('mockery');
var expect = require('chai').expect;
var sinon = require('sinon');
var q = require('q');

describe('The timeline denormalizer module', function() {

  beforeEach(function() {
    mockery.registerMock('./utils', {
      asObject: function(e) {
        return e;
      }
    });
  });

  describe('The denormalize function', function() {

    it('should not change the entry if no denormalizer is found', function(done) {
      var module = this.helpers.requireBackend('core/timeline/denormalizer');
      var entry = {verb: 'follow', foo: 'bar'};
      module.denormalize(entry).then(function(result) {
        expect(result).to.deep.equal(entry);
        done();
      }, done);
    });

    it('should denormalize the entry from registered denormalizer', function(done) {
      var verb = 'follow';
      var entry = {verb: verb, foo: 'bar'};
      var spy = sinon.spy();
      var handler = function(e) {
        expect(e).to.deep.equal(entry);
        e.bar = 'baz';
        spy();
        return q(e);
      };

      var module = this.helpers.requireBackend('core/timeline/denormalizer');
      module.register(verb, handler);

      module.denormalize(entry).then(function(result) {
        expect(result).to.deep.equal({
          verb: verb,
          foo: 'bar',
          bar: 'baz'
        });
        expect(spy).to.have.beenCalled;
        done();
      }, done);
    });
  });

});
