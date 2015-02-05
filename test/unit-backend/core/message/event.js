'use strict';

var expect = require('chai').expect;

describe('The event message module', function() {

  describe('The save fn', function() {

    it('should not publish in topic message:stored if there was an error', function(done) {
      var eventMessageMock = function() {
        return eventMessageMock;
      };
      eventMessageMock.save = function(callback) {
        return callback(new Error());
      };

      this.helpers.mock.models({
        EventMessage: eventMessageMock
      });

      var localstub = {}, globalstub = {};
      this.helpers.mock.pubsub('../pubsub', localstub, globalstub);

      this.helpers.requireBackend('core/message/event').save({}, function(err, saved) {
        expect(err).to.exist;
        expect(localstub.topics['message:stored'].data).to.have.length(0);
        done();
      });
    });

    it('should publish in topic message:stored if there is no error', function(done) {
      var ObjectId = require('bson').ObjectId;
      var messageSaved = {
        _id: new ObjectId()
      };

      var eventMessageMock = function() {
        return eventMessageMock;
      };
      eventMessageMock.save = function(callback) {
        return callback(null, messageSaved);
      };

      this.helpers.mock.models({
        EventMessage: eventMessageMock
      });

      var localstub = {}, globalstub = {};
      this.helpers.mock.pubsub('../pubsub', localstub, globalstub);

      this.helpers.requireBackend('core/message/event').save({}, function(err, saved) {
        expect(err).to.not.exist;
        expect(saved).to.exist;
        expect(localstub.topics['message:stored'].data[0]).to.deep.equal(messageSaved);
        done();
      });
    });
  });
});
