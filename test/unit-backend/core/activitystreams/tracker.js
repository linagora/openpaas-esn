'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');
var sinon = require('sinon');

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
        ReadTimeLineEntriesTracker: {
          update: function(query, update, options, callback) {
            return callback(new Error('Error test'));
          }
        }
      });

      var tracker = this.helpers.requireBackend('core/activitystreams/tracker').getTracker('read');
      tracker.updateLastTimelineEntry('1', '1', '1', function(err, saved) {
        expect(err).to.exist;
        expect(saved).to.not.exist;
        done();
      });
    });

    it('should update the timeline entries tracker', function(done) {
      var userId = '1';
      var activityStreamUuid = '2';
      var lastTimelineEntryReadId = '3';
      var trackerUpdate = sinon.spy();

      this.helpers.mock.models({
        ReadTimeLineEntriesTracker: {
          update: function(query, update, options, callback) {
            expect(query).to.deep.equal({_id: userId});
            var expectedUpdate = {$set: {}};
            expectedUpdate.$set['timelines.' + activityStreamUuid] = lastTimelineEntryReadId;
            expect(update).to.deep.equal(expectedUpdate);
            expect(options).to.deep.equal({upsert: true});
            trackerUpdate();
            return callback();
          }
        }
      });

      var tracker = this.helpers.requireBackend('core/activitystreams/tracker').getTracker('read');
      tracker.updateLastTimelineEntry(userId, activityStreamUuid, lastTimelineEntryReadId, function(err) {
        expect(err).to.not.exist;
        expect(trackerUpdate).to.have.been.calledOnce;
        done();
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
      var self = this;
      this.helpers.mock.models({ReadTimeLineEntriesTracker: {}});
      var tracker = this.helpers.requireBackend('core/activitystreams/tracker').getTracker('read');
      tracker.buildThreadViewSinceLastTimelineEntry(null, '', function(err, count) {
        expect(err).to.exist;
        expect(count).to.not.exist;
        tracker.buildThreadViewSinceLastTimelineEntry('', null, self.helpers.callbacks.error(done));
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
        expect(threads).to.deep.equal({});
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
        expect(threads[replyTo].responses).to.have.length(1);
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
        expect(threads[message].responses).to.deep.equal([]);
        done();
      });
      expect(handlerClose).to.be.a('function');
      handlerClose();
    });

    it('should not return timelines entries when the actual user is the timeline entry actor', function(done) {
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
                  actor: {_id: userId},
                  object: {objectType: 'whatsup', _id: message}
                });
              }
            }
          });
        }
      });

      var tracker = this.helpers.requireBackend('core/activitystreams/tracker').getTracker('read');
      tracker.buildThreadViewSinceLastTimelineEntry(userId, asId, function(err, threads) {
        expect(threads).to.exist;
        expect(threads).to.deep.equal({});
        done();
      });
      expect(handlerClose).to.be.a('function');
      handlerClose();
    });

    it('should set correctly read flags', function(done) {
      var handlerClose = null;
      var handlerData = null;
      var asId = 123456789;
      var timelines = {timelines: {}};
      timelines.timelines[asId] = '1';

      var timelinesEntries = [{
        _id: 'timelineEntry1',
        object: {objectType: 'whatsup', _id: 'message1Unread'}
      }, {
        _id: 'timelineEntry2',
        object: {objectType: 'whatsup', _id: 'message2UnreadInReplyTo3'},
        inReplyTo: [{_id: 'message3Read'}]
      }, {
        _id: 'timelineEntry3',
        object: {objectType: 'whatsup', _id: 'message4UnreadInReplyTo5'},
        inReplyTo: [{_id: 'message5Unread'}]
      }, {
        _id: 'timelineEntry4',
        object: {objectType: 'whatsup', _id: 'message5Unread'}
      }];

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
                handlerData = handler;
              }
            }
          });
        }
      });

      var tracker = this.helpers.requireBackend('core/activitystreams/tracker').getTracker('read');
      tracker.buildThreadViewSinceLastTimelineEntry('1', asId, function(err, threads) {
        expect(err).to.not.exist;
        expect(threads).to.exist;
        var expectedObject = {};
        expectedObject[timelinesEntries[0].object._id] = {
          message: timelinesEntries[0].object,
          timelineentry: {
            _id: timelinesEntries[0]._id
          },
          responses: [],
          read: false
        };
        expectedObject[timelinesEntries[1].inReplyTo[0]._id] = {
          message: timelinesEntries[1].inReplyTo[0],
          timelineentry: {
            _id: timelinesEntries[1]._id
          },
          responses: [{
            message: timelinesEntries[1].object,
            timelineentry: {
              _id: timelinesEntries[1]._id
            },
            read: false
          }],
          read: true
        };
        expectedObject[timelinesEntries[2].inReplyTo[0]._id] = {
          message: timelinesEntries[2].inReplyTo[0],
          timelineentry: {
            _id: timelinesEntries[2]._id
          },
          responses: [{
            message: timelinesEntries[2].object,
            timelineentry: {
              _id: timelinesEntries[2]._id
            },
            read: false
          }],
          read: false
        };
        expect(threads).to.shallowDeepEqual(expectedObject);
        done();
      });
      expect(handlerData).to.be.a('function');
      timelinesEntries.forEach(function(timelineEntry) {
        handlerData(timelineEntry);
      });
      expect(handlerClose).to.be.a('function');
      handlerClose();
    });
  });
});
