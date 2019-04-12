const { expect } = require('chai');
const sinon = require('sinon');
const mockery = require('mockery');

describe('The eventsourcing pubsub elasticsearch module', () => {
  let elasticsearch, reindexRegistry;

  beforeEach(function() {
    reindexRegistry = {
      register: sinon.spy()
    };

    mockery.registerMock('../../elasticsearch', { reindexRegistry });
    mockery.registerMock('../events', {});

    elasticsearch = this.helpers.requireBackend('core/eventsourcing/pubsub/elasticsearch');
  });

  describe('The reindexRegistry fn', () => {
    it('should register elasticsearch reindex options for core.events', function() {
      elasticsearch.registerReindexTask();

      expect(reindexRegistry.register).to.have.been.calledWith(
        'core.events',
        {
          name: 'core.events.idx',
          buildReindexOptionsFunction: sinon.match.func
        }
      );
    });
  });
});
