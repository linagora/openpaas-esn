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

  function notCalled(done) {
    return function(result) {
      return done(new Error('Should not be called' + result));
    };
  }

  function called(done) {
    return done();
  }

  describe('The compute fn', function() {

    it('should reject when user is undefined', function(done) {
      var module = this.helpers.requireBackend('core/digest/weight');
      module.compute(null, {}).then(notCalled(done), called(done));
    });

    it('should reject when data is undefined', function(done) {
      var module = this.helpers.requireBackend('core/digest/weight');
      module.compute({}).then(notCalled(done), called(done));
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

    it('should call weight#computeIndividualMessageWeight as many times as there are messages', function(done) {
      var messages = [1, 2, 3];
      var data = {a: 1, b: 2, c: 3, messages: messages};
      var user = {_id: 1};
      var count = 0;

      mockery.registerMock('./simple', {
        computeIndividualMessageWeight: function(u, m) {
          expect(u).to.deep.equal(user);
          expect(messages).to.contain(m);
          count++;
          return q(m);
        },

        computeMessageWeightInCollaboration: function(u, m, c, ms) {
          return q(m);
        }
      });
      var module = this.helpers.requireBackend('core/digest/weight');
      module.compute(user, data).then(function(result) {
        expect(result).to.exist;
        expect(count).to.equal(messages.length);
        done();
      }, notCalled(done));
    });

    it('should call weight#computeMessageWeightInCollaboration as many times as there are messages', function(done) {
      var messages = [1, 2, 3];
      var collaboration = {_id: 2};
      var data = {a: 1, b: 2, c: 3, messages: messages, collaboration: collaboration};
      var user = {_id: 1};
      var count = 0;

      mockery.registerMock('./simple', {
        computeIndividualMessageWeight: function(u, m) {
          return q(m);
        },

        computeMessageWeightInCollaboration: function(u, m, c, ms) {
          expect(u).to.deep.equal(user);
          expect(messages).to.contain(m);
          expect(c).to.deep.equal(collaboration);
          expect(ms).to.deep.equal(messages);
          count++;
          return q(m);
        }
      });
      var module = this.helpers.requireBackend('core/digest/weight');
      module.compute(user, data).then(function(result) {
        expect(count).to.equal(messages.length);
        done();
      }, notCalled(done));
    });

  });
});
