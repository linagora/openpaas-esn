const { expect } = require('chai');
const sinon = require('sinon');
const mockery = require('mockery');

describe('The eventsourcing pubsub elasticsearch module', function() {
  let eventName, data, elasticsearch, CONSTANTS, Event;

  beforeEach(function() {
    eventName = 'foo.bar';
    data = {
      uuid: 1,
      objectType: 'user',
      id: 2,
      timestamp: 3
    };

    elasticsearch = {
      addDocumentToIndex: sinon.stub()
    };

    mockery.registerMock('../../elasticsearch', elasticsearch);

    CONSTANTS = this.helpers.requireBackend('core/eventsourcing/constants');
    Event = this.helpers.requireBackend('core/models/event');

    this.loadModule = function() {
      return this.helpers.requireBackend('core/eventsourcing/pubsub/elasticsearch');
    };
  });

  describe('The handle function', function() {
    describe('when data is not an instance of Event', function() {
      it('it should build an Event from data and eventName then index it in ES', function() {
        this.loadModule().handle(eventName, data);

        expect(elasticsearch.addDocumentToIndex).to.have.been.calledWith(
          sinon.match.instanceOf(Event).and(sinon.match(function(event) {
            return event.uuid === data.uuid &&
              event.name === eventName &&
              event.objectType === data.objectType &&
              event.id === data.id &&
              event.payload === data &&
              event.timestamp === data.timestamp;
          })),
          {
            index: CONSTANTS.ELASTICSEARCH.INDEX_NAME,
            type: CONSTANTS.ELASTICSEARCH.INDEX_TYPE,
            id: data.uuid
          },
          sinon.match.func
        );
      });

      it('should wrap data when not an object', function() {
        data = 1;

        this.loadModule().handle(eventName, data);

        expect(elasticsearch.addDocumentToIndex.firstCall.args[0].payload).to.deep.equals({
          value: data
        });
      });
    });

    describe('when data is an instance of Event', function() {
      it('should set the event.name to eventName', function() {
        const e = new Event('uuid');

        this.loadModule().handle(eventName, e);

        expect(elasticsearch.addDocumentToIndex).to.have.been.calledWith(
          sinon.match(function(event) {
            return event === e &&
            event.name === eventName;
          }),
          {
            index: CONSTANTS.ELASTICSEARCH.INDEX_NAME,
            type: CONSTANTS.ELASTICSEARCH.INDEX_TYPE,
            id: e.uuid
          },
          sinon.match.func
        );
      });
    });

    it('should set event.uuid when not defined', function() {
      const e = new Event();

      this.loadModule().handle(eventName, e);

      expect(elasticsearch.addDocumentToIndex).to.have.been.calledWith(
        sinon.match(function(event) {
          return event === e && event.uuid;
        }),
        {
          index: CONSTANTS.ELASTICSEARCH.INDEX_NAME,
          type: CONSTANTS.ELASTICSEARCH.INDEX_TYPE,
          id: e.uuid
        },
        sinon.match.func
      );
    });
  });
});
