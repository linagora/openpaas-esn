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

    it('should ask for "amqp" key from esnconfig', function(done) {
      mockEsnConfig(key => {
        expect(key).to.equal('amqp');
        done();

        return { get: () => q.reject(new Error()) };
      });

      getClient();
    });

    it('should reject when esnconfig rejects', function(done) {
      const error = new Error('I failed to get amqp configuration');

      mockEsnConfig(() => ({
        get: () => q.reject(error)
      }));

      getClient()
        .then(() => done('Failed, an error is expected'))
        .catch(err => {
          expect(err.message).to.equal(error.message);
          done();
        });
    });

    it('should use default url when esnconfig does not return amqp configuration', function(done) {
      mockEsnConfig(() => ({
        get: () => q()
      }));

      mockAmqplib({
        connect: url => {
          expect(url).to.deep.equal(['amqp://localhost:5672']);

          return amqpConnection;
        }
      });

      getClient()
        .then(() => done())
        .catch(err => done(err || 'should resolve'));
    });

    it('should connect to the server using the expected esnconfig options', function(done) {
      mockEsnConfig();
      mockAmqplib({
        connect: url => {
          expect(url).to.deep.equal(['amqp://testing-url']);

          return amqpConnection;
        }
      });

      getClient()
        .then(() => done())
        .catch(err => done(err || 'should resolve'));
    });

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
