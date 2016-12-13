'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');
var q = require('q');

describe('The amqp client', function() {

  let topic;
  let publishingMessage;
  let amqpConfig;
  let client;

  beforeEach(function(done) {
    amqpConfig = { url: this.testEnv.serversConfig.rabbitmq.url };
    mockery.registerMock('../../core/esn-config', () => ({ get: () => q.when(amqpConfig)}));
    topic = 'a topic';
    publishingMessage = { one: 'field', and: [{ an: 'array', as: 'message value'}] };

    this.helpers.requireBackend('core/amqp')
      .getClient()
      .then(clientInstance => { client = clientInstance; })
      .then(() => done())
      .catch(err => done(err || 'Cannot create the amqp client'));
  });

  afterEach(function(done) {
    client.dispose(() => done());
  });

  it('should make a subscriber getting a published message', function(done) {
    const subscriber = message => {
        expect(message).to.deep.equal(publishingMessage);
        done();
    };

    client.subscribe(topic, subscriber)
      .then(() => client.publish(topic, publishingMessage));
  });

  it('should make multiple subscribers getting the same published message', function(done) {
    let calledOnce = false;

    const subscriber = message => {
      expect(message).to.deep.equal(publishingMessage);
      calledOnce && done();
      calledOnce = true;
    };

    client.subscribe(topic, subscriber)
      .then(() => client.subscribe(topic, subscriber))
      .then(() => client.publish(topic, publishingMessage));
  });

  it('should make a subscriber able to get multiple published message', function(done) {
    let calledOnce = false;

    const subscriber = message => {
      expect(message).to.deep.equal(publishingMessage);
      calledOnce && done();
      calledOnce = true;
    };

    client.subscribe(topic, subscriber)
      .then(() => client.publish(topic, publishingMessage))
      .then(() => client.publish(topic, publishingMessage));
  });

  it('should make an unsubscribed handler unable to get published message anymore', function(done) {
    const considerOkTimeout = setTimeout(done, 500);
    const subscriber = () => {
      clearTimeout(considerOkTimeout);
      done('No call expected as I should be unsubscribed');
    };

    client.subscribe(topic, subscriber)
      .then(() => client.unsubscribe(topic, subscriber))
      .then(() => client.publish(topic, publishingMessage));
  });

  it('should unsubscribe all the handlers if they are the same', function(done) {
    const subscriber = () => {
      done('No call expected as I should be unsubscribed');
    };

    client.subscribe(topic, subscriber)
      .then(() => client.subscribe(topic, subscriber))
      .then(() => client.unsubscribe(topic, subscriber))
      .then(() => client.publish(topic, publishingMessage))
      .then(() => setTimeout(done, 500))
      .catch(err => done(err));
  });

  it('should make nothing when trying to unsubscribe an unknown handler', function(done) {
    client
      .unsubscribe(topic, () => {})
      .then(() => done());
  });

  it('should be unable to publish any message when the client has been disposed', function(done) {
    client.dispose(() => {
      client.publish(topic, publishingMessage)
        .then(() => done('The client should be disposed'))
        .catch(() => done());
    });
  });

  it('should be unable to subscribe when the client has been disposed', function(done) {
    client.dispose(() => {
      client.subscribe(topic, () => {})
        .then(() => done('The client should be disposed'))
        .catch(() => done());
    });
  });

});
