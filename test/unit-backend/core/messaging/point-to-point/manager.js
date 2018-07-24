const sinon = require('sinon');
const mockery = require('mockery');
const { expect } = require('chai');

describe('The point to point messaging channel manager', function() {
  let logger, PointToPointMessagingChannelManager, message, pointToPointChannelManager, channelName1, channelName2;

  beforeEach(function() {
    logger = {
      debug: sinon.spy(),
      warn: sinon.spy(),
      error: sinon.spy()
    };

    channelName1 = 'foo:bar';
    channelName2 = 'bar:baz';
    message = { id: 1, content: 'My message content' };

    mockery.registerMock('../../../core/logger', logger);

    PointToPointMessagingChannelManager = this.helpers.requireBackend('core/messaging/point-to-point/manager');
    pointToPointChannelManager = new PointToPointMessagingChannelManager();
  });

  describe('The channel function', function() {
    it('should return a valid object', function() {
      const channel1 = pointToPointChannelManager.get(channelName1);

      expect(channel1).to.have.property('send').that.is.a('function');
      expect(channel1).to.have.property('receive').that.is.a('function');
      expect(channel1).to.have.property('unsubscribe').that.is.a('function');
    });

    it('should create as many channels as needed', function() {
      const channel1 = pointToPointChannelManager.get(channelName1);
      const channel2 = pointToPointChannelManager.get(channelName2);

      expect(channel1).to.not.equal(channel2);
    });

    it('should not create new channel if it already exists', function() {
      const channel1 = pointToPointChannelManager.get(channelName1);
      const channel2 = pointToPointChannelManager.get(channelName1);

      expect(channel1).to.equal(channel2);
    });

    describe('The channel#send function', function() {
      describe('When client is not set', function() {
        it('should cache message as publication', function() {
          expect(pointToPointChannelManager._sendBuffer).to.be.empty;

          pointToPointChannelManager.get(channelName1).send(message);

          expect(pointToPointChannelManager._sendBuffer).to.deep.equal([
            {
              channel: channelName1,
              message: message
            }
          ]);
        });
      });

      describe('When client is set', function() {
        it('should publish message on client', function() {
          const client = {
            publish: sinon.spy()
          };

          expect(pointToPointChannelManager._sendBuffer).to.be.empty;

          pointToPointChannelManager.client = client;
          pointToPointChannelManager.get(channelName1).send(message);

          expect(pointToPointChannelManager._sendBuffer).to.be.empty;
          expect(client.publish).to.have.been.calledOnce;
          expect(client.publish).to.have.been.calledWith(channelName1, message);
        });
      });
    });

    describe('The channel#receive function', function() {
      describe('When client is not set', function() {
        it('should cache receiver', function() {
          const receiver = () => {};

          expect(pointToPointChannelManager._receiversPromisesBuffer).to.be.empty;
          expect(pointToPointChannelManager._receiversCache).to.be.empty;

          const promise = pointToPointChannelManager.get(channelName1).receive(receiver);

          expect(promise).to.be.an.instanceof(Promise);
          expect(pointToPointChannelManager._receiversPromisesBuffer.length).to.equal(1);
        });

        it('should resolve when client is set', function(done) {
          const receiver = () => {};
          const client = {
            subscribeToDurableQueue: sinon.stub().returns(Promise.resolve())
          };
          const promise = pointToPointChannelManager.get(channelName1).receive(receiver);

          promise.then(function() {
            expect(client.subscribeToDurableQueue).to.have.been.calledOnce;
            done();
          });

          pointToPointChannelManager.setClient(client);
        });
      });

      describe('When client is set', function() {
        it('should subscribe to the client', function() {
          const receiver = () => {};
          const client = {
            subscribeToDurableQueue: sinon.stub().returns(Promise.resolve())
          };

          expect(pointToPointChannelManager._receiversPromisesBuffer).to.be.empty;
          expect(pointToPointChannelManager._receiversCache).to.be.empty;

          pointToPointChannelManager.client = client;
          pointToPointChannelManager.get(channelName1).receive(receiver);

          expect(pointToPointChannelManager._receiversPromisesBuffer).to.be.empty;
          expect(pointToPointChannelManager._receiversCache.length).to.equal(1);
          expect(client.subscribeToDurableQueue).to.have.been.calledOnce;
          expect(client.subscribeToDurableQueue).to.have.been.calledWith(channelName1, channelName1, sinon.match.func);
        });

        it('should wrap the receiver', function() {
          const receiver = () => {};
          const client = {
            subscribeToDurableQueue: sinon.stub().returns(Promise.resolve())
          };

          pointToPointChannelManager.client = client;
          pointToPointChannelManager.get(channelName1).receive(receiver);

          expect(client.subscribeToDurableQueue.firstCall.args[2]).to.be.a('function');
          expect(client.subscribeToDurableQueue.firstCall.args[2]).to.not.equal(receiver);
        });

        it('should wrap receiver and provide context to ack message', function() {
          const originalMessage = { text: 'The original message' };
          const receiver = sinon.spy();
          const client = {
            subscribeToDurableQueue: sinon.stub().returns(Promise.resolve()),
            ack: sinon.spy()
          };

          pointToPointChannelManager.client = client;
          pointToPointChannelManager.get(channelName1).receive(receiver);

          const wrappedReceiver = client.subscribeToDurableQueue.firstCall.args[2];

          wrappedReceiver(message, originalMessage);

          expect(receiver).to.have.been.calledWith(message, sinon.match(function(value) {
            expect(value.ack).to.be.a('function');
            value.ack();
            expect(client.ack).to.have.been.calledWith(originalMessage);

            return true;
          }));
        });
      });
    });

    describe('The channel#unsubscribe function', function() {
      it('should not fail when receiver is undefined', function() {
        pointToPointChannelManager._receiversCache.push({ channel: channelName1, receiver: function() {} });
        expect(pointToPointChannelManager._receiversCache.length).to.equal(1);

        pointToPointChannelManager.get(channelName1).unsubscribe();

        expect(pointToPointChannelManager._receiversCache.length).to.equal(1);
      });

      it('should not fail when receiver is not registered', function() {
        const receiver1 = () => {};
        const receiver2 = () => {};

        pointToPointChannelManager._receiversCache.push({ channel: channelName1, receiver: receiver1 });
        expect(pointToPointChannelManager._receiversCache.length).to.equal(1);

        pointToPointChannelManager.get(channelName1).unsubscribe(receiver2);

        expect(pointToPointChannelManager._receiversCache.length).to.equal(1);
      });

      it('should remove receiver from cache when it exists', function() {
        const receiver = () => {};

        pointToPointChannelManager._receiversCache.push({ channel: channelName1, receiver });
        expect(pointToPointChannelManager._receiversCache.length).to.equal(1);

        pointToPointChannelManager.get(channelName1).unsubscribe(receiver);

        expect(pointToPointChannelManager._receiversCache).to.be.empty;
      });

      describe('When client is set', function() {
        it('should unsubscribe from client', function() {
          const receiver = () => {};
          const client = {
            unsubscribe: sinon.spy()
          };

          pointToPointChannelManager.client = client;
          pointToPointChannelManager.get(channelName1).unsubscribe(receiver);

          expect(client.unsubscribe).to.have.been.calledWith(channelName1, receiver);
        });
      });
    });

    describe('The setClient function', function() {
      it('should reject when client is undefined', function(done) {
        pointToPointChannelManager.setClient()
          .then(function() {
            done(new Error('Should not occur'));
          })
          .catch(function(error) {
            expect(error.message).to.match(/PointToPointMessagingManager: Client is undefined/);
            done();
          });
      });

      it('should subscribe with all the receivers which were added', function(done) {
        const client = {
          subscribeToDurableQueue: sinon.stub().returns(Promise.resolve())
        };
        const receiver1 = () => {};
        const receiver2 = () => {};
        const receiver3 = () => {};

        const messaging1 = pointToPointChannelManager.get(channelName1);
        const messaging2 = pointToPointChannelManager.get(channelName2);

        messaging1.receive(receiver1);
        messaging1.receive(receiver2);
        messaging2.receive(receiver3);

        expect(pointToPointChannelManager._receiversPromisesBuffer.length).to.equal(3);

        pointToPointChannelManager.setClient(client).then(function() {
          expect(client.subscribeToDurableQueue).to.have.been.calledThrice;
          expect(pointToPointChannelManager._receiversPromisesBuffer).to.be.empty;
          done();
        }, done);
      });

      it('should send all messages which were sent while client was not defined', function(done) {
        const client = {
          publish: sinon.stub().returns(Promise.resolve())
        };
        const message1 = 'Message 1';
        const message2 = 'Message 2';
        const message3 = 'Message 3';
        const messaging1 = pointToPointChannelManager.get(channelName1);
        const messaging2 = pointToPointChannelManager.get(channelName2);

        expect(pointToPointChannelManager._sendBuffer).to.be.empty;

        messaging1.send(message1);
        messaging1.send(message2);
        messaging2.send(message3);

        expect(pointToPointChannelManager._sendBuffer.length).to.equal(3);

        pointToPointChannelManager.setClient(client).then(function() {
          expect(client.publish).to.have.been.calledThrice;
          expect(client.publish).to.have.been.calledWith(channelName1, message1);
          expect(client.publish).to.have.been.calledWith(channelName1, message2);
          expect(client.publish).to.have.been.calledWith(channelName2, message3);
          expect(pointToPointChannelManager._sendBuffer).to.be.empty;
          done();
        }, done);
      });
    });

    describe('The unsetClient function', function() {
      it('should call dispose on client if client was set and call the callback', function() {
        const callback = sinon.spy();
        const client = {
          dispose: sinon.spy(function(cb) {
            cb();
          })
        };

        pointToPointChannelManager.client = client;
        pointToPointChannelManager.unsetClient(callback);

        expect(client.dispose).to.have.been.calledOnce;
        expect(client.dispose).to.have.been.calledWith(callback);
        expect(callback).to.have.been.calledOnce;
      });

      it('should only call the callback if client was not set', function() {
        const callback = sinon.spy();

        pointToPointChannelManager.unsetClient(callback);

        expect(callback).to.have.been.calledOnce;
      });
    });

    describe('Integration tests', function() {
      it('should be able to subscribe to receivers which were registered before even if client is set, unset and set again', function(done) {
        const client1 = {
          dispose: sinon.spy(function(cb) {
            cb();
          }),
          subscribeToDurableQueue: sinon.spy()
        };
        const client2 = {
          dispose: sinon.spy(function(cb) {
            cb();
          }),
          subscribeToDurableQueue: sinon.spy()
        };
        const receiver1 = () => {};
        const receiver2 = () => {};

        pointToPointChannelManager.get(channelName1).receive(receiver1);
        pointToPointChannelManager.get(channelName1).receive(receiver2);

        pointToPointChannelManager.setClient(client1)
          .then(function() { testClient(channelName1, client1); })
          .then(function() { pointToPointChannelManager.unsetClient(); })
          .then(function() { pointToPointChannelManager.setClient(client2); })
          .then(function() { testClient(channelName1, client2); })
          .then(done)
          .catch(done);

        function testClient(channel, client) {
          expect(client.subscribeToDurableQueue).to.have.been.calledWith(channel, channel, sinon.match.func);
          expect(client.subscribeToDurableQueue).to.have.been.calledTwice;
        }
      });

      it('should be able to unsubscribe by giving the subscribe result', function(done) {
        const client = {
          subscribeToDurableQueue: sinon.stub().returns(Promise.resolve()),
          unsubscribe: sinon.spy()
        };
        const receiver = () => {};

        pointToPointChannelManager.setClient(client)
          .then(function() { return pointToPointChannelManager.get(channelName1).receive(receiver); })
          .then(function(handler) { return pointToPointChannelManager.get(channelName1).unsubscribe(handler); })
          .then(function() {
            expect(client.subscribeToDurableQueue).to.have.been.calledOnce;
            expect(client.unsubscribe).to.have.been.calledOnce;
            expect(pointToPointChannelManager._receiversCache).to.be.empty;
          })
          .then(done)
          .catch(done);
      });

      it('should be able to unsubscribe by giving the subscribe result from resolved promise after client is set', function(done) {
        const client = {
          subscribeToDurableQueue: sinon.stub().returns(Promise.resolve()),
          unsubscribe: sinon.spy()
        };
        const receiver = () => {};
        const channel = pointToPointChannelManager.get(channelName1);
        const promise = channel.receive(receiver);

        promise.then(function(handler) { channel.unsubscribe(handler); })
          .then(function() {
            expect(client.subscribeToDurableQueue).to.have.been.calledOnce;
            expect(client.unsubscribe).to.have.been.calledOnce;
            expect(pointToPointChannelManager._receiversCache).to.be.empty;
          })
          .then(done)
          .catch(done);

        pointToPointChannelManager.setClient(client).catch(done);
      });
    });
  });
});
