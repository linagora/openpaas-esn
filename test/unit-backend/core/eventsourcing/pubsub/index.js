const { expect } = require('chai');
const sinon = require('sinon');
const mockery = require('mockery');

describe('The eventsourcing pubsub module', function() {
  let eventName, data, elasticsearch, mongodb, pubsub,
      listenerMock, Event;

  beforeEach(function() {
    eventName = 'foo.bar';
    data = {
      uuid: 1,
      objectType: 'user',
      id: 2,
      timestamp: 3
    };

    pubsub = {
      local: {
        client: {
          onAny: listener => {
            listenerMock = listener;
          }
        }
      }
    };

    elasticsearch = {
      handle: sinon.spy()
    };

    mongodb = {
      handle: sinon.spy()
    };

    mockery.registerMock('../../pubsub', pubsub);
    mockery.registerMock('./elasticsearch', elasticsearch);
    mockery.registerMock('./mongodb', mongodb);

    Event = this.helpers.requireBackend('core/models/event');

    this.helpers.requireBackend('core/eventsourcing/pubsub').init();
  });

  describe('The listener function', function() {
    describe('When event data is not an Event instance', function() {
      it('should build an Event instance then call handlers on the instance', function() {
        listenerMock(eventName, data);

        const expectedArg = sinon.match.instanceOf(Event).and(sinon.match({
          uuid: data.uuid,
          name: eventName,
          objectType: data.objectType,
          id: data.id,
          payload: data,
          timestamp: data.timestamp
        }));

        expect(elasticsearch.handle).has.been.calledWith(expectedArg);
        expect(mongodb.handle).has.been.calledWith(expectedArg);
      });

      it('should wrap data when not an object', function() {
        data = 1;

        listenerMock(eventName, data);

        expect(elasticsearch.handle.firstCall.args[0].payload).to.deep.equals({
          value: 1
        });
        expect(mongodb.handle.firstCall.args[0].payload).to.deep.equals({
          value: 1
        });
      });
    });

    describe('When event data is an instance of Event', function() {
      it('should set the name to event name', function() {
        const e = new Event('uuid');

        listenerMock(eventName, e);

        const expectedArg = sinon.match(e).and(sinon.match.has('name', eventName));

        expect(elasticsearch.handle).to.have.been.calledWith(expectedArg);
        expect(mongodb.handle).to.have.been.calledWith(expectedArg);
      });

      it('should set event.uuid when not defined', function() {
        const e = new Event();

        listenerMock(eventName, e);

        const expectedArg = sinon.match(e).and(sinon.match.has('uuid'));

        expect(elasticsearch.handle).to.have.been.calledWith(expectedArg);
        expect(mongodb.handle).to.have.been.calledWith(expectedArg);
      });
    });
  });
});
