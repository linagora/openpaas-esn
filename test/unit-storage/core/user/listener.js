'use strict';

const expect = require('chai').expect;

describe('The core/user/listener module', function() {
  let mongoose;
  let User;
  let localPubsub;
  let userConsants;
  let userListener;
  let checkUsersDocumentsFullyIndexed;

  beforeEach(function(done) {
    mongoose = require('mongoose');
    User = this.helpers.requireBackend('core/db/mongo/models/user');
    this.helpers.requireBackend('core/db/mongo/models/domain');
    userConsants = this.helpers.requireBackend('core/user/constants');
    userListener = this.helpers.requireBackend('core/user/listener');
    localPubsub = this.helpers.requireBackend('core/pubsub').local;
    checkUsersDocumentsFullyIndexed = this.helpers.elasticsearch.checkUsersDocumentsFullyIndexed;

    userListener.register();

    this.connectMongoose(mongoose, err => {
      if (err) {
        return done(err);
      }

      this.helpers.elasticsearch.saveTestConfiguration(done);
    });
  });

  afterEach(function(done) {
    this.helpers.mongo.dropDatabase(done);
  });

  function checkIndexResult(total) {
    return res => (res.status === 200 && res.body.hits.total === total);
  }

  it('should make Elasticsearch to index the user on userCreated pubsub event', function(done) {
    const user = new User({
      firstname: 'Paul',
      lastname: 'Scholes',
      accounts: [{
        type: 'email',
        hosted: true,
        emails: ['paul@scholes.com']
      }]
    });

    user.save((err, savedUser) => {
      expect(err).to.not.exist;

      localPubsub.topic(userConsants.EVENTS.userCreated).publish(savedUser);

      checkUsersDocumentsFullyIndexed([savedUser._id], checkIndexResult(1), done);
    });
  });

  it('should make Elasticsearch to index the user on userUpdated pubsub event', function(done) {
    const user = new User({
      firstname: 'Paul',
      lastname: 'Scholes',
      accounts: [{
        type: 'email',
        hosted: true,
        emails: ['paul@scholes.com']
      }]
    });

    user.save((err, savedUser) => {
      expect(err).to.not.exist;

      localPubsub.topic(userConsants.EVENTS.userUpdated).publish(savedUser);

      checkUsersDocumentsFullyIndexed([savedUser._id], checkIndexResult(1), done);
    });
  });

  it('should make Elasticsearch to remove user index on userDeleted pubsub event', function(done) {
    const user = new User({
      firstname: 'Paul',
      lastname: 'Scholes',
      accounts: [{
        type: 'email',
        hosted: true,
        emails: ['paul@scholes.com']
      }]
    });

    user.save((err, savedUser) => {
      expect(err).to.not.exist;

      localPubsub.topic(userConsants.EVENTS.userCreated).publish(savedUser);

      checkUsersDocumentsFullyIndexed([savedUser._id], checkIndexResult(1), err => {
        expect(err).to.not.exist;

        localPubsub.topic(userConsants.EVENTS.userDeleted).publish(savedUser);

        checkUsersDocumentsFullyIndexed([savedUser._id], checkIndexResult(0), done);
      });
    });
  });

});
