'use strict';

var mockery = require('mockery');
var expect = require('chai').expect;

describe('The notification module', function() {

  describe('get fn', function() {
    it('get should send back error if ID is not defined', function(done) {
      this.helpers.mock.models({});

      var module = this.helpers.requireBackend('core/notification/notification');
      module.get(null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('get should call mongoose findById when ID is defined', function(done) {
      this.helpers.mock.models({
        Notification: {
          findById: function() {
            return {
              exec: function() {
                done();
              }
            };
          }
        }
      });

      var module = this.helpers.requireBackend('core/notification/notification');
      module.get(1);
    });
  });

  describe('find fn', function() {
    it('should call mongoose.find even when options are not defined', function(done) {
      this.helpers.mock.models({
        Notification: {
          find: function() {
            return {
              exec: function() {
                done();
              }
            };
          }
        }
      });

      var module = this.helpers.requireBackend('core/notification/notification');
      module.find();
    });

    it('should call mongoose.find with input options', function(done) {
      this.helpers.mock.models({
        Notification: {
          find: function() {
            return {
              exec: function(cb) {
                return cb(null, []);
              }
            };
          }
        }
      });

      var module = this.helpers.requireBackend('core/notification/notification');
      module.find({foo: 'bar'}, function(err, result) {
        expect(err).to.not.exist;
        done();
      });
    });
  });

  describe('setAsRead fn', function() {
    it('should send back error when notification is undefined', function(done) {
      this.helpers.mock.models({});

      var module = this.helpers.requireBackend('core/notification/notification');
      module.setAsRead(null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should set notification.read to true and call notification.save', function(done) {
      this.helpers.mock.models({});

      var saved = false;
      var notification = {
        save: function(cb) {
          saved = true;
          return cb();
        }
      };

      var module = this.helpers.requireBackend('core/notification/notification');
      module.setAsRead(notification, function() {
        expect(saved).to.be.true;
        expect(notification.read).to.be.true;
        done();
      });
    });
  });

  describe('save fn', function() {

    it('should send back error if notification is not defined', function(done) {
      this.helpers.mock.models({});

      var module = this.helpers.requireBackend('core/notification/notification');
      module.save(null, function(err, saved) {
        expect(err).to.exist;
        expect(saved).to.not.exist;
        done();
      });
    });

    it('should not publish if notification has no targets', function(done) {
      this.helpers.mock.models({});

      var called = 0;
      var pubsub = {
        local: {
          topic: function() {
            return {
              publish: function() {
                called++;
                return;
              }
            };
          }
        }
      };
      mockery.registerMock('../pubsub', pubsub);
      var module = this.helpers.requireBackend('core/notification/notification');

      var notification = {_id: 123, target: []};
      module.save(notification, function() {
        expect(called).to.equal(0);
        done();
      });
    });

    it('should publish N notifications if targets are N users', function(done) {
      this.helpers.mock.models({});

      var called = 0;
      var pubsub = {
        local: {
          topic: function() {
            return {
              publish: function() {
                called++;
                return;
              }
            };
          }
        }
      };
      mockery.registerMock('../pubsub', pubsub);

      var helperMock = {
        getUserIds: function(targets, callback) {
          return callback(null, ['1', '2', '3']);
        }
      };
      mockery.registerMock('../../helpers/targets', helperMock);

      var notification = {
        _id: 123,
        target: [
          {objectType: 'user', id: '1'},
          {objectType: 'user', id: '2'},
          {objectType: 'user', id: '3'}
        ],
        timestamps: []};
      var module = this.helpers.requireBackend('core/notification/notification');
      module.save(notification, function() {
        expect(called).to.equal(3);
        done();
      });
    });

  });
});
