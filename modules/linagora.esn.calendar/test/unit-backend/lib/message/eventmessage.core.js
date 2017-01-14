'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The event message module', function() {
  var module, localstub, globalstub;

  beforeEach(function() {
    localstub = {};
    globalstub = {};
    this.moduleHelpers.backendPath = this.moduleHelpers.modulesPath + 'linagora.esn.calendar/backend';
    this.moduleHelpers.addDep('pubsub', this.helpers.mock.pubsub('', localstub, globalstub));
    mockery.registerMock('./eventmessage.model', function() {});
  });

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

      module = require(this.moduleHelpers.backendPath + '/lib/message/eventmessage.core')(this.moduleHelpers.dependencies);
      module.save({}, function(err) {
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

      module = require(this.moduleHelpers.backendPath + '/lib/message/eventmessage.core')(this.moduleHelpers.dependencies);
      module.save({}, function(err, saved) {
        expect(err).to.not.exist;
        expect(saved).to.exist;
        expect(localstub.topics['message:stored'].data[0]).to.deep.equal(messageSaved);
        done();
      });
    });
  });
});
