'use strict';

const chai = require('chai');
const expect = chai.expect;

describe('The order model module', function() {
  let Order;

  beforeEach(function(done) {
    this.mongoose = require('mongoose');
    this.helpers.requireBackend('core/db/mongo/models/order');
    this.testEnv.writeDBConfigFile();
    Order = this.mongoose.model('Order');

    this.connectMongoose(this.mongoose, done);
  });

  afterEach(function(done) {
    this.helpers.mongo.dropDatabase(done);
  });

  function saveOrder(orderJson, callback) {
    const order = new Order(orderJson);

    order.save(callback);
  }

  describe('The number field', function() {
    it('should be set to 1 if there is no order in database', function(done) {
      const orderJson = {
        title: 'test',
        startDate: new Date(),
        terminationDate: new Date()
      };

      saveOrder(orderJson, (err, savedOrder) => {
        if (err) {
          done(err);
        }

        expect(savedOrder.number).to.equal(1);
        done();
      });
    });

    it('should increase automatically', function(done) {
      const orderJson = {
        title: 'test',
        startDate: new Date(),
        terminationDate: new Date()
      };

      saveOrder(orderJson, err => {
        if (err) {
          done(err);
        }

        saveOrder(orderJson, (err, savedOrder) => {
          if (err) {
            done(err);
          }

          expect(savedOrder.number).to.equal(2);
          done();
        });
      });
    });
  });
});
