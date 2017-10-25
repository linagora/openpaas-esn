const { expect } = require('chai');
const sinon = require('sinon');
const mockery = require('mockery');

describe('The eventsourcing pubsub module', function() {
  let elasticsearch, pubsub;

  beforeEach(function() {
    pubsub = {
      local: {
        client: {
          onAny: sinon.stub()
        }
      }
    };

    elasticsearch = {
      handle: () => {}
    };

    mockery.registerMock('../../pubsub', pubsub);
    mockery.registerMock('./elasticsearch', elasticsearch);

    this.loadModule = function() {
      return this.helpers.requireBackend('core/eventsourcing/pubsub');
    };
  });

  describe('The init function', function() {
    it('should register the elasticsearch listener on the client.onAny handler', function() {
      this.loadModule().init();

      expect(pubsub.local.client.onAny).to.have.been.calledWith(elasticsearch.handle);
    });
  });
});
