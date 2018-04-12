'use strict';

var chai = require('chai');
var expect = chai.expect;
var mockery = require('mockery');

describe('The core user notifications module', function() {
  describe('The getForUser fn', function() {

    it('should call mongoose with valid parameters', function(done) {

      var user = {_id: 123};
      var query = {offset: 1, limit: 2, read: true};

      mockery.registerMock('mongoose', {
        model: function() {
          return {
            find: function(q) {

              expect(q).to.exist;
              expect(q.target).to.exist;
              expect(q.target).to.equal(user._id);
              expect(q.read).to.be.true;

              return {
                limit: function(value) {
                  expect(value).to.equal(query.limit);
                },
                skip: function(value) {
                  expect(value).to.equal(query.offset);
                },
                sort: function(value) {
                  expect(value).to.equal('-timestamps.creation');
                },
                exec: function(callback) {
                  return callback();
                }
              };
            }
          };
        }
      });

      var module = this.helpers.requireBackend('core/notification/usernotification');
      module.getForUser(user, query, done);
    });

    it('should call mongoose without read in query', function(done) {

      var user = {_id: 123};
      var query = {offset: 1, limit: 2};

      mockery.registerMock('mongoose', {
        model: function() {
          return {
            find: function(q) {

              expect(q).to.exist;
              expect(q.target).to.equal(user._id);
              expect(q.read).to.be.undefined;

              return {
                limit: function(value) {
                  expect(value).to.equal(query.limit);
                },
                skip: function(value) {
                  expect(value).to.equal(query.offset);
                },
                sort: function(value) {
                  expect(value).to.equal('-timestamps.creation');
                },
                exec: function(callback) {
                  return callback();
                }
              };
            }
          };
        }
      });

      var module = this.helpers.requireBackend('core/notification/usernotification');
      module.getForUser(user, query, done);
    });
  });

  describe('The count fn', function() {

    it('should call mongoose with valid parameters', function(done) {
      var user = {_id: 123};
      var query = {offset: 1, limit: 2, read: true};

      mockery.registerMock('mongoose', {
        model: function() {
          return {
            count: function(q) {

              expect(q).to.exist;
              expect(q.target).to.exist;
              expect(q.target).to.equal(user._id);
              expect(q.read).to.be.true;

              return {
                exec: function(callback) {
                  return callback();
                }
              };
            }
          };
        }
      });

      var module = this.helpers.requireBackend('core/notification/usernotification');
      module.countForUser(user, query, done);
    });

    it('should call mongoose without the read parameters', function(done) {
      var user = {_id: 123};
      var query = {offset: 1, limit: 2};

      mockery.registerMock('mongoose', {
        model: function() {
          return {
            count: function(q) {

              expect(q).to.exist;
              expect(q.target).to.exist;
              expect(q.target).to.equal(user._id);
              expect(q.read).to.be.undefined;

              return {
                exec: function(callback) {
                  return callback();
                }
              };
            }
          };
        }
      });

      var module = this.helpers.requireBackend('core/notification/usernotification');
      module.countForUser(user, query, done);
    });
  });

  describe('get method', function() {
    it('should return an error if id is not defined', function(done) {
      this.helpers.mock.models({});
      var module = this.helpers.requireBackend('core/notification/usernotification');
      module.get(null, function(err) {
        expect(err).to.exists;
        done();
      });
    });

    it('should findById then exec callback', function(done) {
      var models = {
        Usernotification: {
          findById: function() {
            return {
              exec: function(callback) {
                callback();
              }
            };
          }
        }
      };
      this.helpers.mock.models(models);
      var module = this.helpers.requireBackend('core/notification/usernotification');

      module.get(123456, done);
    });

  });

  describe('getAll method', function() {
    it('should return an error if id is not defined', function(done) {
      this.helpers.mock.models({});
      var module = this.helpers.requireBackend('core/notification/usernotification');
      module.getAll(null, function(err) {
        expect(err).to.exists;
        done();
      });
    });

    it('should find then exec callback', function(done) {
      var models = {
        Usernotification: {
          find: function() {
            return {
              exec: function(callback) {
                callback();
              }
            };
          }
        }
      };
      this.helpers.mock.models(models);
      var module = this.helpers.requireBackend('core/notification/usernotification');

      module.getAll([123, 456], done);
    });

  });

  describe('setRead method', function() {
    it('should return an error if usernotification is not defined', function(done) {
      this.helpers.mock.models({});
      var module = this.helpers.requireBackend('core/notification/usernotification');
      module.setRead(null, false, function(err) {
        expect(err).to.exists;
        done();
      });
    });

    it('should update a usernotification by setting read to true then forward it into global usernotification:updated', function(done) {
      const globalstub = {};
      const usernotification = {
        save: function(callback) {
          callback(null, 'saved');
        }
      };

      this.helpers.mock.pubsub('../pubsub', {}, globalstub);
      this.helpers.mock.models({});
      var module = this.helpers.requireBackend('core/notification/usernotification');
      module.setRead(usernotification, true, function() {
        expect(usernotification.read).to.be.true;
        expect(globalstub.topics['usernotification:updated'].data[0]).to.equal('saved');
        done();
      });
    });
  });

  describe('setAllRead method', function() {
    it('should return an error if usernotification is no defined', function(done) {
      this.helpers.mock.models({});
      var module = this.helpers.requireBackend('core/notification/usernotification');
      module.setAllRead(null, false, function(err) {
        expect(err).to.exists;
        done();
      });
    });

    it('should update all usernotifications by setting read to true then forward each into global usernotification:updated', function(done) {
      const globalstub = {};
      const usernotification1 = {
        save: function(callback) {
          callback(null, 'saved');
        }
      };
      const usernotification2 = {
        save: function(callback) {
          callback(null, 'saved');
        }
      };

      this.helpers.mock.pubsub('../pubsub', {}, globalstub);
      this.helpers.mock.models({});
      var module = this.helpers.requireBackend('core/notification/usernotification');
      module.setAllRead([usernotification1, usernotification2], true, function() {
        expect(usernotification1.read).to.be.true;
        expect(usernotification2.read).to.be.true;
        expect(globalstub.topics.length).to.equal(2);
        done();
      });
    });
  });

  describe('setAcknowledged method', function() {
    it('should return an error if usernotification is not defined', function(done) {
      this.helpers.mock.models({});
      var module = this.helpers.requireBackend('core/notification/usernotification');
      module.setAcknowledged(null, false, function(err) {
        expect(err).to.exists;
        done();
      });
    });

    it('should update a usernotification by setting acknowledged to true then forward it into global usernotification:updated', function(done) {
      const globalstub = {};
      const usernotification = {
        save: function(callback) {
          callback(null, 'saved');
        }
      };

      this.helpers.mock.pubsub('../pubsub', {}, globalstub);
      this.helpers.mock.models({});

      const module = this.helpers.requireBackend('core/notification/usernotification');

      module.setAcknowledged(usernotification, true, function() {
        expect(usernotification.acknowledged).to.be.true;
        expect(globalstub.topics['usernotification:updated'].data[0]).to.equal('saved');
        done();
      });
    });
  });

  describe('create method', function() {
    it('should return an error if usernotification is not defined', function(done) {
      this.helpers.mock.models({});
      var module = this.helpers.requireBackend('core/notification/usernotification');
      module.create(null, function(err) {
        expect(err).to.exists;
        done();
      });
    });

    it('should create a usernotification then forward it into global usernotification:created', function(done) {
      const globalstub = {};
      var usernotification = {
        subject: 'test'
      };

      this.helpers.mock.pubsub('../pubsub', {}, globalstub);
      this.helpers.mock.models({
        Usernotification: function(object) {
          object.save = function(callback) {
            expect(object).to.exist;
            expect(object.subject).to.equal('test');
            return callback(null, object);
          };
          return object;
        }
      });
      var module = this.helpers.requireBackend('core/notification/usernotification');
      module.create(usernotification, function(err, saved) {
        expect(err).to.not.exist;
        expect(saved).to.exist;
        expect(saved.subject).to.equal('test');
        expect(globalstub.topics['usernotification:created'].data[0].subject).to.equal('test');
        done();
      });
    });
  });

});
