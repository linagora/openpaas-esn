'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The activity streams tracker core module', function() {

  describe('The getTracker fn', function() {
    it('should throw error', function() {
      this.helpers.mock.models({TimeLineEntriesTracker: {}});
      var tracker = this.helpers.requireBackend('core/activitystreams/tracker');
      expect(tracker.getTracker).to.throw(/is not a valid tracker type/);
    });

    it('should throw error when tracker can not be found', function(done) {
      this.helpers.mock.models({TimeLineEntriesTracker: {}});
      var tracker = this.helpers.requireBackend('core/activitystreams/tracker');
      try {
        tracker.getTracker('fake');
      } catch (err) {
        return done();
      }
      done(new Error());
    });
  });

  describe('The updateLastTimelineEntry fn', function() {

    it('should send back error when a parameter is null', function(done) {
      this.helpers.mock.models({ReadTimeLineEntriesTracker: {}});
      var tracker = this.helpers.requireBackend('core/activitystreams/tracker').getTracker('read');
      tracker.updateLastTimelineEntry(null, '', '', function(err, saved) {
        expect(err).to.exist;
        expect(saved).to.not.exist;
        tracker.updateLastTimelineEntry('', null, '', function(err, saved) {
          expect(err).to.exist;
          expect(saved).to.not.exist;
          tracker.updateLastTimelineEntry('', '', null, function(err, saved) {
            expect(err).to.exist;
            expect(saved).to.not.exist;
            done();
          });
        });
      });
    });

    it('should send back error when mongoose request send back an error', function(done) {
      this.helpers.mock.models({
        TimelineEntry: {
          findById: function(id, callback) {
            return callback(new Error('Error test'));
          }
        },
        ReadTimeLineEntriesTracker: {}
      });

      var tracker = this.helpers.requireBackend('core/activitystreams/tracker').getTracker('read');
      tracker.updateLastTimelineEntry('', '', '', function(err, saved) {
        expect(err).to.exist;
        expect(saved).to.not.exist;
        done();
      });
    });

    it('should create the timeline entries tracker and save it', function(done) {
      mockery.registerMock('mongoose', {
        model: function() {
          var object = function() {
            done();
          };
          object.findById = function(id, callback) {
            return callback(null, null);
          };
          object.prototype.markModified = function() {};
          object.prototype.save = function(callback) {
            this._id = '12345';
            this.timelines = {};
            callback(null, this);
          };
          return object;
        }
      });
      mockery.registerMock('./', {});

      var tracker = this.helpers.requireBackend('core/activitystreams/tracker').getTracker('read');
      tracker.updateLastTimelineEntry('12345', '98765', '34567', function(err, saved) {
        expect(err).to.not.exist;
        expect(saved).to.exist;
      });
    });

    it('should get the existing timeline entries tracker and update it', function(done) {
      var saved = {
        _id: '12345',
        timelines: {},
        markModified: function() {},
        save: function(callback) {
          callback(null, saved);
          done();
        }
      };

      mockery.registerMock('mongoose', {
        model: function() {
          var object = function() {
            done(new Error('Should not pass here'));
          };
          object.findById = function(id, callback) {
            return callback(null, saved);
          };
          return object;
        }
      });
      mockery.registerMock('./', {});

      var tracker = this.helpers.requireBackend('core/activitystreams/tracker').getTracker('read');
      tracker.updateLastTimelineEntry('12345', '98765', '34567', function(err, saved) {
        expect(err).to.not.exist;
        expect(saved).to.exist;
      });
    });
  });

  describe('The getLastTimelineEntry fn', function() {
    it('should send back error when a parameter is null', function(done) {
      this.helpers.mock.models({ReadTimeLineEntriesTracker: {}});
      var tracker = this.helpers.requireBackend('core/activitystreams/tracker').getTracker('read');
      tracker.getLastTimelineEntry(null, '', function(err, objectId) {
        expect(err).to.exist;
        expect(objectId).to.not.exist;
        tracker.getLastTimelineEntry('', null, function(err, objectId) {
          expect(err).to.exist;
          expect(objectId).to.not.exist;
          done();
        });
      });
    });

    it('should send back error when mongoose request send back an error', function(done) {
      mockery.registerMock('mongoose', {
        model: function() {
          return {
            findById: function(id, callback) {
              return callback(new Error('Error test'));
            }
          };
        }
      });
      mockery.registerMock('./', {});

      var tracker = this.helpers.requireBackend('core/activitystreams/tracker').getTracker('read');
      tracker.getLastTimelineEntry('', '', function(err, objectId) {
        expect(err).to.exist;
        expect(objectId).to.not.exist;
        done();
      });
    });

    it('should return the last timeline entry', function(done) {
      mockery.registerMock('mongoose', {
        model: function() {
          return {
            findById: function(id, callback) {
              return callback(null, {
                _id: '12345',
                timelines: {
                  '98765': '6789'
                }
              });
            }
          };
        }
      });
      mockery.registerMock('./', {});

      var tracker = this.helpers.requireBackend('core/activitystreams/tracker').getTracker('read');
      tracker.getLastTimelineEntry('12345', '98765', function(err, objectId) {
        expect(err).to.not.exist;
        expect(objectId).to.exist;
        expect(objectId).to.deep.equal('6789');
        done();
      });
    });
  });

  describe('The countSinceLastTimelineEntry fn', function() {
    it('should send back error when a parameter is null', function(done) {
      this.helpers.mock.models({ReadTimeLineEntriesTracker: {}});
      var tracker = this.helpers.requireBackend('core/activitystreams/tracker').getTracker('read');
      tracker.countSinceLastTimelineEntry(null, '', function(err, count) {
        expect(err).to.exist;
        expect(count).to.not.exist;
        tracker.countSinceLastTimelineEntry('', null, function(err, count) {
          expect(err).to.exist;
          expect(count).to.not.exist;
          done();
        });
      });
    });

    it('should return 0 if there is no last timeline entries', function(done) {
      var handlerClose = null;

      mockery.registerMock('mongoose', {
        model: function() {
          return {
            findById: function(id, callback) {
              return callback(null, null);
            }
          };
        }
      });
      mockery.registerMock('./', {
        query: function(options, callback) {
          callback(null, {
            on: function(event, handler) {
              if (event === 'close') {
                handlerClose = handler;
              }
            }
          });
        }
      });

      var tracker = this.helpers.requireBackend('core/activitystreams/tracker').getTracker('read');
      tracker.countSinceLastTimelineEntry('12345', '98765', function(err, count) {
        expect(err).to.not.exist;
        expect(count).to.exist;
        expect(count).to.deep.equal(0);
        done();
      });
      expect(handlerClose).to.be.a('function');
      handlerClose();
    });
  });

  describe('The buildThreadViewSinceLastTimelineEntry fn', function() {

    beforeEach(function() {
      mockery.registerMock('./', {});
    });

    it('should send back error when a parameter is null', function(done) {
      this.helpers.mock.models({ReadTimeLineEntriesTracker: {}});
      var tracker = this.helpers.requireBackend('core/activitystreams/tracker').getTracker('read');
      tracker.buildThreadViewSinceLastTimelineEntry(null, '', function(err, count) {
        expect(err).to.exist;
        expect(count).to.not.exist;
        tracker.buildThreadViewSinceLastTimelineEntry('', null, function(err, count) {
          expect(err).to.exist;
          expect(count).to.not.exist;
          done();
        });
      });
    });

    it('should return result with all messages if there is no last timeline entries', function(done) {

      var handlerClose;
      mockery.registerMock('mongoose', {
        model: function() {
          return {
            findById: function(id, callback) {
              return callback(null, null);
            }
          };
        }
      });
      mockery.registerMock('./', {
        query: function(options, callback) {
          expect(options.after).to.not.exist;
          callback(null, {
            on: function(event, handler) {
              if (event === 'close') {
                handlerClose = handler;
              }
            }
          });
        }
      });

      var tracker = this.helpers.requireBackend('core/activitystreams/tracker').getTracker('read');
      tracker.buildThreadViewSinceLastTimelineEntry('12345', '98765', function(err, threads) {
        expect(err).to.not.exist;
        expect(threads).to.exist;
        done();
      });
      expect(handlerClose).to.be.a('function');
      handlerClose();
    });

    it('should set the replyTo as key if timeline entry is a reply', function(done) {
      var handlerClose = null;
      var replyTo = 456;
      var id = '123';
      var message = 234;
      var userId = 1;
      var asId = 123456789;
      var timelines = {timelines: {}};
      timelines.timelines[asId] = message;

      mockery.registerMock('mongoose', {
        model: function() {
          return {
            findById: function(id, callback) {
              return callback(null, timelines);
            }
          };
        }
      });
      mockery.registerMock('./', {
        query: function(options, callback) {
          callback(null, {
            on: function(event, handler) {

              if (event === 'close') {
                handlerClose = handler;
              }

              if (event === 'data') {
                return handler({
                  _id: id,
                  object: {objectType: 'whatsup', _id: message},
                  inReplyTo: [{_id: replyTo}]
                });
              }
            }
          });
        }
      });

      var tracker = this.helpers.requireBackend('core/activitystreams/tracker').getTracker('read');
      tracker.buildThreadViewSinceLastTimelineEntry(userId, asId, function(err, threads) {
        expect(threads).to.exist;
        expect(threads[replyTo]).to.exist;
        expect(threads[replyTo].responses).to.exist;
        expect(threads[replyTo].responses).to.be.an.array;
        expect(threads[replyTo].responses.length).to.equal(1);
        done();
      });
      expect(handlerClose).to.be.a('function');
      handlerClose();
    });

    it('should set the message as key if timeline entry is not a reply', function(done) {
      var handlerClose = null;
      var id = '123';
      var message = 234;
      var userId = 1;
      var asId = 123456789;
      var timelines = {timelines: {}};
      timelines.timelines[asId] = message;

      mockery.registerMock('mongoose', {
        model: function() {
          return {
            findById: function(id, callback) {
              return callback(null, timelines);
            }
          };
        }
      });
      mockery.registerMock('./', {
        query: function(options, callback) {
          callback(null, {
            on: function(event, handler) {

              if (event === 'close') {
                handlerClose = handler;
              }

              if (event === 'data') {
                return handler({
                  _id: id,
                  object: {objectType: 'whatsup', _id: message},
                  inReplyTo: []
                });
              }
            }
          });
        }
      });

      var tracker = this.helpers.requireBackend('core/activitystreams/tracker').getTracker('read');
      tracker.buildThreadViewSinceLastTimelineEntry(userId, asId, function(err, threads) {
        expect(threads).to.exist;
        expect(threads[message]).to.exists;
        expect(threads[message].responses).to.be.an.array;
        expect(threads[message].responses).to.be.empty;
        done();
      });
      expect(handlerClose).to.be.a('function');
      handlerClose();
    });
  });
});
