'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The daily digest tracker module', function() {

  var deps = {};
  var dependencies = function(name) {
    return deps[name];
  };

  var user = {
    _id: 123,
    emails: ['me@open-paas.org']
  };
  var activity_stream = {uuid: 34560};
  var timelineentry = {_id: 'timelineentry'};
  var message = {_id: 'message', published: new Date()};

  var tracker = {
    getTracker: function() {}
  };

  var activitystreams = {
    tracker: tracker
  };

  function initDependencies() {
    deps = {
      activitystreams: activitystreams,
      logger: {
        debug: function() {},
        error: function() {},
        info: function() {},
        warning: function() {}
      }
    };
  }

  describe('The updateTracker fn', function() {

    beforeEach(function() {
      initDependencies();
    });

    describe('input args', function() {
      it('should fail when user is not defined', function(done) {
        var module = require('../../../lib/tracker')(dependencies);
        module.updateTracker(null, {}).then(this.helpers.callbacks.notCalled(done), this.helpers.callbacks.called(done));
      });

      it('should fail when data is not defined', function(done) {
        var module = require('../../../lib/tracker')(dependencies);
        module.updateTracker({}, null).then(this.helpers.callbacks.notCalled(done), this.helpers.callbacks.called(done));
      });
    });

    describe('when calling createTrackerIfNeeded', function() {
      it('should create the tracker when it does not exists', function(done) {
        var tracker = {
          exists: function(u, callback) {
            expect(u).to.deep.equals(user);
            return callback(null, false);
          },

          createTimelineEntriesTracker: function(u) {
            expect(u).to.deep.equals(user);
            done();
          }
        };

        deps.activitystreams.tracker = {
          getTracker: function() {
            return tracker;
          }
        };

        var module = require('../../../lib/tracker')(dependencies);
        module.updateTracker(user, []).then(function() {
        }, this.helpers.callbacks.notCalled(done));
      });

      it('should not create the tracker when it exists', function(done) {
        var tracker = {
          exists: function(u, callback) {
            expect(u).to.deep.equals(user);
            return callback(null, true);
          },

          createTimelineEntriesTracker: function() {
            done(new Error());
          }
        };

        deps.activitystreams.tracker = {
          getTracker: function() {
            return tracker;
          }
        };

        var module = require('../../../lib/tracker')(dependencies);
        module.updateTracker(user, []).then(this.helpers.callbacks.called(done), this.helpers.callbacks.notCalled(done));
      });

      it('should not reject when checking tracker fails', function(done) {
        var tracker = {
          exists: function(u, callback) {
            expect(u).to.deep.equals(user);
            return callback(new Error());
          },

          createTimelineEntriesTracker: function() {
            done(new Error());
          }
        };

        deps.activitystreams.tracker = {
          getTracker: function() {
            return tracker;
          }
        };

        var module = require('../../../lib/tracker')(dependencies);
        module.updateTracker(user, []).then(this.helpers.callbacks.called(done), this.helpers.callbacks.notCalled(done));
      });
    });

    describe('when calling update', function() {

      it('should not try to update tracker when last timeline entry is not found', function(done) {

        mockery.registerMock('./helpers', {
          getMostRecentMessage: function() {
            return null;
          }
        });

        var tracker = {
          exists: function(u, callback) {
            return callback(null, true);
          },
          updateLastTimelineEntry: function() {
            done(new Error());
          }
        };

        deps.activitystreams.tracker = {
          getTracker: function() {
            return tracker;
          }
        };

        var data = [
          {messages: [], collaboration: {activity_stream: {uuid: 123}}}
        ];

        var module = require('../../../lib/tracker')(dependencies);
        module.updateTracker(user, data).then(this.helpers.callbacks.called(done), this.helpers.callbacks.notCalled(done));
      });

      it('should update the tracker when last timeline entry is found', function(done) {

        mockery.registerMock('./helpers', {
          getMostRecentMessage: function() {
            return message;
          }
        });

        var tracker = {
          exists: function(u, callback) {
            return callback(null, true);
          },
          updateLastTimelineEntry: function(u, stream, entry) {
            expect(u).to.equal(user._id);
            expect(stream).to.deep.equal(activity_stream.uuid);
            expect(entry).to.deep.equal(timelineentry);
            done();
          }
        };

        deps.activitystreams.getTimelineEntryFromStreamMessage = function(s, m, callback) {
          expect(s).to.deep.equal(activity_stream);
          expect(m).to.deep.equal(message);
          return callback(null, timelineentry);
        };

        deps.activitystreams.tracker = {
          getTracker: function() {
            return tracker;
          }
        };

        var data = [
          {messages: [message], collaboration: {activity_stream: activity_stream}}
        ];

        var module = require('../../../lib/tracker')(dependencies);
        module.updateTracker(user, data).then(function() {}, this.helpers.callbacks.notCalled(done));
      });

      it('should not reject when tracker#updateLastTimelineEntry fails', function(done) {

        mockery.registerMock('./helpers', {
          getMostRecentMessage: function() {
            return message;
          }
        });

        var tracker = {
          exists: function(u, callback) {
            return callback(null, true);
          },
          updateLastTimelineEntry: function(u, stream, entry, callback) {
            callback(new Error());
          }
        };

        deps.activitystreams.getTimelineEntryFromStreamMessage = function(s, m, callback) {
          expect(s).to.deep.equal(activity_stream);
          expect(m).to.deep.equal(message);
          return callback(null, timelineentry);
        };

        deps.activitystreams.tracker = {
          getTracker: function() {
            return tracker;
          }
        };

        var data = [
          {messages: [message], collaboration: {activity_stream: activity_stream}}
        ];

        var module = require('../../../lib/tracker')(dependencies);
        module.updateTracker(user, data).then(this.helpers.callbacks.called(done), this.helpers.callbacks.notCalled(done));
      });

      it('should not reject when stream#getTimelineEntryFromStreamMessage fails', function(done) {

        mockery.registerMock('./helpers', {
          getMostRecentMessage: function() {
            return message;
          }
        });

        var tracker = {
          exists: function(u, callback) {
            return callback(null, true);
          },
          updateLastTimelineEntry: function() {
            done(new Error());
          }
        };

        deps.activitystreams.getTimelineEntryFromStreamMessage = function(s, m, callback) {
          return callback(new Error());
        };

        deps.activitystreams.tracker = {
          getTracker: function() {
            return tracker;
          }
        };

        var data = [
          {messages: [message], collaboration: {activity_stream: activity_stream}}
        ];

        var module = require('../../../lib/tracker')(dependencies);
        module.updateTracker(user, data).then(this.helpers.callbacks.called(done), this.helpers.callbacks.notCalled(done));
      });
    });
  });
});
