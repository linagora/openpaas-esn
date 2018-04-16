const sinon = require('sinon');
const mockery = require('mockery');
const { expect } = require('chai');

describe('The messages.filters utils', function() {
  describe('The filterMessageFromActivityStream function', function() {
    let getTimelineEntryFromStreamMessage, module, stream, message;

    beforeEach(function() {
      stream = { id: '123-345-567' };
      message = {};
      getTimelineEntryFromStreamMessage = sinon.stub();

      mockery.registerMock('../../core/activitystreams', {
        getTimelineEntryFromStreamMessage
      });

      module = this.helpers.requireBackend('webserver/controllers/messages.filter');
    });

    it('should return undefined when message is not defined', function() {
      expect(module.filterMessageFromActivityStream()).to.be.undefined;
    });

    it('should return undefined when activitystream is not defined and not in message.shares', function() {
      message.shares = [];

      expect(module.filterMessageFromActivityStream(message)).to.be.undefined;
    });

    it('should resolve with undefined if getTimelineEntryFromStreamMessage fails', function(done) {
      getTimelineEntryFromStreamMessage.callsArgWith(2, new Error());
      message.shares = [];

      module.filterMessageFromActivityStream(message, stream).then(result => {
        expect(getTimelineEntryFromStreamMessage).to.have.been.calledWith({uuid: stream.id}, message, sinon.match.func);
        expect(result).to.be.undefined;
        done();
      }).catch(done);
    });

    it('should resolve with undefined if getTimelineEntryFromStreamMessage does not send back timelineentry', function(done) {
      getTimelineEntryFromStreamMessage.callsArgWith(2, null, null);
      message.shares = [];

      module.filterMessageFromActivityStream(message, stream).then(result => {
        expect(getTimelineEntryFromStreamMessage).to.have.been.calledWith({uuid: stream.id}, message, sinon.match.func);
        expect(result).to.be.undefined;
        done();
      }).catch(done);
    });

    it('should resolve with undefined if getTimelineEntryFromStreamMessage sends back a timelineentry with a delete verb', function(done) {
      getTimelineEntryFromStreamMessage.callsArgWith(2, null, { verb: 'delete' });
      message.shares = [];

      module.filterMessageFromActivityStream(message, stream).then(result => {
        expect(getTimelineEntryFromStreamMessage).to.have.been.calledWith({uuid: stream.id}, message, sinon.match.func);
        expect(result).to.be.undefined;
        done();
      }).catch(done);
    });

    it('should send back the message when timelineentry verb is not delete', function(done) {
      message.shares = [];

      getTimelineEntryFromStreamMessage.callsArgWith(2, null, { verb: 'post' });
      var promise = module.filterMessageFromActivityStream(message, stream);

      promise.then(result => {
        expect(getTimelineEntryFromStreamMessage).to.have.been.calledWith({uuid: stream.id}, message, sinon.match.func);
        expect(result).to.equal(message);
        done();
      }).catch(done);
    });

    it('should remove all the responses which are with a delete timelineentry', function(done) {
      const response1 = {_id: 1};
      const response2 = {_id: 2};
      const response3 = {_id: 3};

      message.shares = [];
      message.responses = [response1, response2, response3];

      getTimelineEntryFromStreamMessage.withArgs({uuid: stream.id}, message).callsArgWith(2, null, { verb: 'post' });
      getTimelineEntryFromStreamMessage.withArgs({uuid: stream.id}, response1).callsArgWith(2, null, { verb: 'post' });
      getTimelineEntryFromStreamMessage.withArgs({uuid: stream.id}, response2).callsArgWith(2, null, { verb: 'delete' });
      getTimelineEntryFromStreamMessage.withArgs({uuid: stream.id}, response3).callsArgWith(2, null, { verb: 'post' });

      module.filterMessageFromActivityStream(message, stream).then(result => {
        expect(getTimelineEntryFromStreamMessage).to.have.been.calledWith({uuid: stream.id}, message, sinon.match.func);
        expect(result.responses).to.deep.equals([response1, response3]);
        done();
      }).catch(done);
    });
  });
});
