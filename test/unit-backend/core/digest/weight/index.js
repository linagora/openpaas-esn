'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');
var q = require('q');

describe('The weight module', function() {

  function expectReturnDataInput(data, done) {
    return function(result) {
      expect(result).to.deep.equal(data);
      done();
    };
  }

  describe('The compute fn', function() {

    it('should reject when user is undefined', function(done) {
      var module = this.helpers.requireBackend('core/digest/weight');
      module.compute(null, {}).then(this.helpers.callback.notCalled(done), this.helpers.callback.called(done));
    });

    it('should reject when data is undefined', function(done) {
      var module = this.helpers.requireBackend('core/digest/weight');
      module.compute({}).then(this.helpers.callback.notCalled(done), this.helpers.callback.called(done));
    });

    it('should return data when data does not contain messages', function(done) {
      var data = {a: 1, b: 2, c: 3};
      var module = this.helpers.requireBackend('core/digest/weight');
      module.compute({}, data).then(expectReturnDataInput(data, done));
    });

    it('should return data when data contains empty messages array', function(done) {
      var data = {a: 1, b: 2, c: 3, messages: []};
      var module = this.helpers.requireBackend('core/digest/weight');
      module.compute({}, data).then(expectReturnDataInput(data, done));
    });

    it('should call the startegy#computeMessagesWeight', function(done) {
      var messages = [1, 2, 3];
      var data = {a: 1, b: 2, c: 3, messages: messages};
      var user = {_id: 1};
      var count = 0;

      mockery.registerMock('./strategies/date', {
        computeMessagesWeight: function(messages) {
          count++;
          return q(messages);
        }
      });
      var module = this.helpers.requireBackend('core/digest/weight');
      module.compute(user, data).then(function(result) {
        expect(result).to.exist;
        expect(count).to.equal(1);
        done();
      }, this.helpers.callback.notCalled(done));
    });
  });
});
