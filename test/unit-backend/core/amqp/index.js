'use strict';

const expect = require('chai').expect;
const mockery = require('mockery');
const q = require('q');

describe('The amqp module', function() {

  let helpers;
  let channel;
  let amqpConnection;

  function mockEsnConfig(mock) {
    mockery.registerMock('../../core/esn-config', mock || testingEsnConfig());
  }

  function mockAmqplib(mock) {
    mockery.registerMock('amqp-connection-manager', mock);
  }

  function testingEsnConfig() {
    return () => ({
      get: () => q.when({ url: 'amqp://testing-url' })
    });
  }

  function getClient() {
    return helpers.requireBackend('core/amqp').getClient();
  }

  beforeEach(function() {
    helpers = this.helpers;
    channel = {
      assertExchange: () => q.resolve()
    };

    amqpConnection = {
      on: function() {
        return this;
      },
      createChannel: () => channel
    };
  });

  describe('The getClient method', function() {

    it('should create a channel through the connection', function(done) {
      mockEsnConfig();

      amqpConnection.createChannel = () => {
        done();

        return channel;
      };
      mockAmqplib({
        connect: () => amqpConnection
      });

      getClient().catch(err => done(err || 'should resolve'));
    });

    it('should return the same resolution promise', function() {
      const promise1 = getClient();
      const promise2 = getClient();

      expect(promise1).to.equal(promise2);
    });
  });

});
