'use strict';

var mockery = require('mockery');
var expect = require('chai').expect;

describe('The notification module', function() {

  describe('get fn', function() {
    it('get should send back error if ID is not defined', function(done) {

      var mongoose = {
        model: function() {
          return function() {};
        }
      };
      mockery.registerMock('mongoose', mongoose);

      var module = require(this.testEnv.basePath + '/backend/core/notification');
      module.get(null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('get should call mongoose findById when ID is defined', function(done) {

      var mongoose = {
        model: function() {
          return {
            findById: function() {
              return {
                exec: function() {
                  done();
                }
              };
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var module = require(this.testEnv.basePath + '/backend/core/notification');
      module.get(1);
    });
  });

  describe('find fn', function() {
    it('should call mongoose.find even when options are not defined', function(done) {
      var mongoose = {
        model: function() {
          return {
            find: function() {
              return {
                exec: function() {
                  done();
                }
              };
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var module = require(this.testEnv.basePath + '/backend/core/notification');
      module.find();
    });

    it('should call mongoose.find with input options', function(done) {
      var mongoose = {
        model: function() {
          return {
            find: function() {
              return {
                exec: function(cb) {
                  return cb(null, []);
                }
              };
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var module = require(this.testEnv.basePath + '/backend/core/notification');
      module.find({foo: 'bar'}, function(err, result) {
        expect(err).to.not.exist;
        done();
      });
    });
  });

  describe('setAsRead fn', function() {
    it('should send back error when notification is undefined', function(done) {
      var mongoose = {
        model: function() {
          return function() {};
        }
      };
      mockery.registerMock('mongoose', mongoose);

      var module = require(this.testEnv.basePath + '/backend/core/notification');
      module.setAsRead(null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should set notification.read to true and call notification.save', function(done) {
      var mongoose = {
        model: function() {
          return function() {};
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var saved = false;
      var notification = {
        save: function(cb) {
          saved = true;
          return cb();
        }
      };

      var module = require(this.testEnv.basePath + '/backend/core/notification');
      module.setAsRead(notification, function() {
        expect(saved).to.be.true;
        expect(notification.read).to.be.true;
        done();
      });
    });
  });

  describe('saveOne fn', function() {
    it('should send back error if notification is not defined', function(done) {
      var mongoose = {
        model: function() {
          return function() {};
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var module = require(this.testEnv.basePath + '/backend/core/notification');
      module.saveOne(null, null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error if notification.save fails', function(done) {
      var mongoose = {
        model: function() {
          return function() {
            return {
              save: function(callback) {
                return callback(new Error());
              }
            };
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);
      var module = require(this.testEnv.basePath + '/backend/core/notification');
      module.saveOne({}, null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should publish a notification when notification.save is ok', function(done) {
      var mongoose = {
        model: function() {
          return function() {
            return {
              save: function(callback) {
                return callback(null, {});
              }
            };
          };
        }
      };

      var called = false;
      var pubsub = {
        global: {
          topic: function() {
            return {
              publish: function() {
                called = true;
              }
            };
          }
        }
      };

      mockery.registerMock('mongoose', mongoose);
      mockery.registerMock('../pubsub', pubsub);
      var module = require(this.testEnv.basePath + '/backend/core/notification');
      module.saveOne({}, null, function(err, saved) {
        expect(err).to.not.exist;
        expect(saved).to.exist;
        expect(called).to.be.true;
        done();
      });
    });

    it('should not publish a notification when notification.save is not ok', function(done) {
      var mongoose = {
        model: function() {
          return function() {
            return {
              save: function(callback) {
                return callback(new Error());
              }
            };
          };
        }
      };

      var called = false;
      var pubsub = {
        global: {
          topic: function() {
            return {
              publish: function() {
                called = true;
              }
            };
          }
        }
      };

      mockery.registerMock('mongoose', mongoose);
      mockery.registerMock('../pubsub', pubsub);
      var module = require(this.testEnv.basePath + '/backend/core/notification');
      module.saveOne({}, null, function(err, saved) {
        expect(err).to.exist;
        expect(saved).to.not.exist;
        expect(called).to.be.false;
        done();
      });
    });

    it('should return the saved notification when notification.save is ok', function(done) {
      var notification = {
        _id: 123
      };

      var mongoose = {
        model: function() {
          return function() {
            return {
              save: function(callback) {
                return callback(null, notification);
              }
            };
          };
        }
      };

      var called = false;
      var pubsub = {
        global: {
          topic: function() {
            return {
              publish: function() {
                called = true;
              }
            };
          }
        }
      };

      mockery.registerMock('mongoose', mongoose);
      mockery.registerMock('../pubsub', pubsub);
      var module = require(this.testEnv.basePath + '/backend/core/notification');
      module.saveOne({}, null, function(err, saved) {
        expect(err).to.not.exist;
        expect(saved).to.exist;
        expect(saved).to.deep.equal(notification);
        expect(called).to.be.true;
        done();
      });
    });
  });

  describe('save fn', function() {

    it('should send back error if notification is not defined', function(done) {
      var mongoose = {
        model: function() {
          return function(notification) {
            return {
              save: function(callback) {
                return callback(null, notification);
              }
            };
          };
        }
      };

      mockery.registerMock('mongoose', mongoose);
      var module = require(this.testEnv.basePath + '/backend/core/notification');
      module.save(null, function(err, saved) {
        expect(err).to.exist;
        expect(saved).to.not.exist;
        done();
      });
    });

    it('should call save one time if the notification is the parent with no targets', function(done) {
      var mongoose = {
        model: function() {
          return function(notification) {
            return {
              save: function(callback) {
                return callback(null, notification);
              }
            };
          };
        }
      };

      var called = 0;
      var pubsub = {
        global: {
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

      mockery.registerMock('mongoose', mongoose);
      mockery.registerMock('../pubsub', pubsub);
      var module = require(this.testEnv.basePath + '/backend/core/notification');

      var notification = {_id: 123, target: []};
      module.save(notification, function() {
        expect(called).to.equal(1);
        done();
      });
    });

    it('should publish N notifications in the pubsub where N = notification parent + targets', function(done) {
      var mongoose = {
        model: function() {
          return function(notification) {
            return {
              save: function(callback) {
                return callback(null, notification);
              }
            };
          };
        }
      };

      var called = 0;
      var pubsub = {
        global: {
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

      mockery.registerMock('mongoose', mongoose);
      mockery.registerMock('../pubsub', pubsub);
      var module = require(this.testEnv.basePath + '/backend/core/notification');

      var notification = {_id: 123, target: [1, 2, 3], timestamps: []};
      module.save(notification, function() {
        expect(called).to.equal(4);
        done();
      });
    });

    it('should send back all the saved notifications as result', function(done) {
      var mongoose = {
        model: function() {
          return function(notification) {
            return {
              save: function(callback) {
                return callback(null, notification);
              }
            };
          };
        }
      };

      var pubsub = {
        global: {
          topic: function() {
            return {
              publish: function() {
                return;
              }
            };
          }
        }
      };

      mockery.registerMock('mongoose', mongoose);
      mockery.registerMock('../pubsub', pubsub);
      var module = require(this.testEnv.basePath + '/backend/core/notification');

      var notification = {_id: 123, target: [1, 2, 3], timestamps: []};
      module.save(notification, function(err, results) {
        expect(err).to.not.exist;
        expect(results).to.exist;
        expect(results.length).to.equal(4);
        done();
      });
    });
  });
});
