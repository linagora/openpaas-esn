'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');
var q = require('q');

describe('The daily digest core module', function() {

  var deps = {};
  var dependencies = function(name) {
    return deps[name];
  };

  var tracker = {
    getTracker: function() {}
  };

  var activitystreams = {
    tracker: tracker
  };
  var helpers = {
    array: require('../../../../../backend/helpers/array')
  };

  function initDependencies() {
    deps = {
      collaboration: {},
      message: {},
      user: {},
      activitystreams: activitystreams,
      helpers: helpers,
      logger: {
        error: function() {},
        info: function() {},
        warning: function() {}
      }
    };
  }

  describe('The digest fn', function() {

    beforeEach(function() {
      initDependencies();
    });

    describe('The userModule call', function() {

      it('should reject if user list fails', function(done) {
        deps.user.list = function(callback) {
          return callback(new Error());
        };

        var module = require('../../../lib/daily')(dependencies);
        module.digest().then(this.helpers.callbacks.notCalled(done), this.helpers.callbacks.called(done));
      });

      it('should send back empty array if user list returns empty array', function(done) {
        var users = [];
        deps.user.list = function(callback) {
          return callback(null, users);
        };
        var module = require('../../../lib/daily')(dependencies);
        module.digest().then(function(result) {
          expect(result).to.deep.equal(users);
          done();
        }, this.helpers.callbacks.notCalled(done));
      });

      it('should send back empty array if user list returns undefined', function(done) {
        deps.user.list = function(callback) {
          return callback();
        };
        var module = require('../../../lib/daily')(dependencies);
        module.digest().then(function(result) {
          expect(result).to.be.an.empty.array;
          done();
        }, this.helpers.callbacks.notCalled(done));
      });
    });

    describe('when users are available', function() {

      it('should call userDailyDigest as many time as there are users', function(done) {

        var users = [1, 2, 3];
        deps.user.list = function(callback) {
          return callback(null, users);
        };
        var called = 0;

        var module = require('../../../lib/daily')(dependencies);
        module.userDailyDigest = function(user) {
          called++;
          return q(user);
        };

        module.digest().then(function() {
          expect(called).to.equal(users.length);
          done();
        }, this.helpers.callbacks.notCalled(done));
      });
    });
  });

  describe('The userDailyDigest function', function() {

    it('should reject when user is undefined', function(done) {
      var module = require('../../../lib/daily')(dependencies);
      module.userDailyDigest().then(this.helpers.callbacks.notCalled(done), this.helpers.callbacks.called(done));
    });

    describe('when collaborationModule.getCollaborationsForTuple sends back', function() {
      var user = {_id: 1};

      it('error', function(done) {
        deps.collaboration = {
          getCollaborationsForTuple: function(tuple, callback) {
            return callback(new Error());
          }
        };

        var module = require('../../../lib/daily')(dependencies);
        module.userDailyDigest(user).then(this.helpers.callbacks.notCalled(done), this.helpers.callbacks.called(done));
      });

      it('undefined collaborations', function(done) {
        deps.collaboration = {
          getCollaborationsForTuple: function(tuple, callback) {
            return callback();
          }
        };

        var module = require('../../../lib/daily')(dependencies);
        module.userDailyDigest(user).then(function(result) {
          expect(result.data.length).to.equal(0);
          expect(result.status).to.match(/No collaborations found/);
          done();
        }, this.helpers.callbacks.notCalled(done));
      });

      it('empty collaborations', function(done) {
        deps.collaboration = {
          getCollaborationsForTuple: function(tuple, callback) {
            return callback(null, []);
          }
        };

        var module = require('../../../lib/daily')(dependencies);
        module.userDailyDigest(user).then(function(result) {
          expect(result.data.length).to.equal(0);
          expect(result.status).to.match(/No collaborations found/);
          done();
        }, this.helpers.callbacks.notCalled(done));
      });

      describe('collaboration list', function() {
        it('should call loadUserDataForCollaboration as many times as there are collaborations', function(done) {
          var collaborations = [1, 2, 3, 4];
          var called = 0;

          deps.collaboration = {
            getCollaborationsForTuple: function(tuple, callback) {
              return callback(null, collaborations);
            }
          };

          mockery.registerMock('./weight',
            function() {
              return {
                compute: function() {
                  return q({});
                }
              };
          });

          var module = require('../../../lib/daily')(dependencies);
          var loadUserDataForCollaboration = function(u, c, t) {
            expect(u).to.deep.equal(user);
            called++;
            return q({messages: [], collaboration: c});
          };
          module.loadUserDataForCollaboration = loadUserDataForCollaboration;

          module.userDailyDigest(user).then(function(result) {
            expect(result.status).to.not.exist;
            expect(called).to.equal(collaborations.length);
            done();
          }, this.helpers.callbacks.notCalled(done));
        });
      });
    });

  });

  describe('The loadUserDataForCollaboration function', function() {

    it('should reject when user is undefined', function(done) {
      var module = require('../../../lib/daily')(dependencies);
      module.loadUserDataForCollaboration(null, {}).then(this.helpers.callbacks.notCalled(done), this.helpers.callbacks.called(done));
    });

    it('should reject when collaboration is undefined', function(done) {
      var module = require('../../../lib/daily')(dependencies);
      module.loadUserDataForCollaboration({}, null).then(this.helpers.callbacks.notCalled(done), this.helpers.callbacks.called(done));
    });

    describe('When getting tracker', function() {
      it('should reject when getTracker sends back error', function(done) {

        var module = require('../../../lib/daily')(dependencies);
        var getTracker = function() {
          return q.reject(new Error());
        };
        module.getTracker = getTracker;

        module.loadUserDataForCollaboration({}, {}).then(this.helpers.callbacks.notCalled(done), this.helpers.callbacks.called(done));
      });
    });

    describe('when loading thread', function() {

      var user = {_id: 1};
      var collaboration = {
        activity_stream: {
          uuid: 123
        }
      };

      it('should reject when buildThreadViewSinceLastTimelineEntry sends back error', function(done) {
        var tracker = {
          buildThreadViewSinceLastTimelineEntry: function(userId, uuid, callback) {
            return callback(new Error());
          }
        };

        var module = require('../../../lib/daily')(dependencies);
        var getTracker = function() {
          return q(tracker);
        };
        module.getTracker = getTracker;

        module.loadUserDataForCollaboration(user, collaboration).then(this.helpers.callbacks.notCalled(done), this.helpers.callbacks.called(done));
      });

      it('should resolve when buildThreadViewSinceLastTimelineEntry sends back empty thread', function(done) {
        var tracker = {
          buildThreadViewSinceLastTimelineEntry: function(userId, uuid, callback) {
            return callback();
          }
        };

        var module = require('../../../lib/daily')(dependencies);
        var getTracker = function() {
          return q(tracker);
        };
        module.getTracker = getTracker;

        module.loadUserDataForCollaboration(user, collaboration).then(function(result) {
          expect(result).to.deep.equal({
            messages: [],
            collaboration: collaboration
          });
          done();
        }, this.helpers.callbacks.notCalled(done));
      });

      it('should call buildMessageContext as many times as there are threads', function(done) {
        var threads = {'1': {}, '2': {}, '3': {}};
        var call = 0;

        var tracker = {
          buildThreadViewSinceLastTimelineEntry: function(userId, uuid, callback) {
            return callback(null, threads);
          }
        };

        var module = require('../../../lib/daily')(dependencies);
        var getTracker = function() {
          return q(tracker);
        };
        module.getTracker = getTracker;
        var buildMessageContext = function() {
          call++;
          return q({original: {}, thread: {}});
        };
        module.buildMessageContext = buildMessageContext;

        module.loadUserDataForCollaboration(user, collaboration, tracker).then(this.helpers.callbacks.called(done), this.helpers.callbacks.notCalled(done));
      });
    });
  });

  describe('The buildMessageContext function', function() {

    var id = 123;
    var thread = {
      message: {
        _id: id
      }
    };

    it('should reject when thread is undefined', function(done) {
      var module = require('../../../lib/daily')(dependencies);
      module.buildMessageContext().then(this.helpers.callbacks.notCalled(done), this.helpers.callbacks.called(done));
    });

    it('should resolve with message and thread when message#get is ok', function(done) {
      var message = {_id: 1, content: 'YOLO'};

      deps.message = {
        get: function(id, callback) {
          return callback(null, message);
        }
      };

      var module = require('../../../lib/daily')(dependencies);
      var setReadFlags = function(message) {
        return q(message);
      };
      module.setReadFlags = setReadFlags;

      module.buildMessageContext(thread).then(function(result) {
        expect(result).to.deep.equal(message);
        done();
      }, this.helpers.callbacks.notCalled(done));
    });

    it('should resolve with empty message and thread when message#get is ko', function(done) {
      deps.message = {
        get: function(id, callback) {
          return callback(new Error('KO'));
        }
      };

      var module = require('../../../lib/daily')(dependencies);
      var setReadFlags = function(message) {
        return q(message);
      };
      module.setReadFlags = setReadFlags;

      module.buildMessageContext(thread).then(function(result) {
        expect(result).to.deep.equal({});
        done();
      }, this.helpers.callbacks.notCalled(done));
    });
  });

  describe('getTracker function', function() {
    it('should reject when user is undefined', function(done) {
      var module = require('../../../lib/daily')(dependencies);
      module.getTracker(null, {}).then(this.helpers.callbacks.notCalled(done), this.helpers.callbacks.called(done));
    });

    it('should reject when collaboration is undefined', function(done) {
      var module = require('../../../lib/daily')(dependencies);
      module.getTracker({}).then(this.helpers.callbacks.notCalled(done), this.helpers.callbacks.called(done));
    });

    it('should call getLastTimelineEntry on each tracker', function(done) {

      var read = 0;
      var push = 0;

      var lastRead = 1;
      var lastPush = 2;

      var trackers = {
        read: {
          getLastTimelineEntry: function(user, uuid, callback) {
            read++;
            return callback(null, lastRead);
          }
        },

        push: {
          getLastTimelineEntry: function(user, uuid, callback) {
            push++;
            return callback(null, lastPush);
          }
        }
      };

      deps.activitystreams.tracker = {
        getTracker: function(type) {
          return trackers[type];
        }
      };

      var getMostRecentTimelineEntry = function(id1, id2) {
        return q(id1);
      };

      var module = require('../../../lib/daily')(dependencies);
      module.getMostRecentTimelineEntry = getMostRecentTimelineEntry;

      module.getTracker({_id: 1}, {activity_stream: {uuid: 2}}).then(function(result) {
        expect(read).to.equal(1);
        expect(push).to.equal(1);
        done();
      }, this.helpers.callbacks.notCalled(done));
    });

    describe('When calling getMostRecentTimelineEntry', function() {

      var trackers = {
        read: {
          getLastTimelineEntry: function(user, uuid, callback) {
            return callback(null, 1);
          }
        },

        push: {
          getLastTimelineEntry: function(user, uuid, callback) {
            return callback(null, 2);
          }
        }
      };

      beforeEach(function() {
        deps.activitystreams.tracker = {
          getTracker: function(type) {
            return trackers[type];
          }
        };
      });

      it('should resolve with read tracker when no result is returned from getMostRecentTimelineEntry', function(done) {
        var getMostRecentTimelineEntry = function(id1, id2) {
          return q();
        };

        var module = require('../../../lib/daily')(dependencies);
        module.getMostRecentTimelineEntry = getMostRecentTimelineEntry;

        module.getTracker({_id: 1}, {activity_stream: {uuid: 2}}).then(function(result) {
          expect(result).to.deep.equal(trackers.read);
          done();
        }, this.helpers.callbacks.notCalled(done));
      });

      it('should resolve with read tracker when read is most recent than push', function(done) {
        var getMostRecentTimelineEntry = function(id1, id2) {
          return q(id1);
        };

        var module = require('../../../lib/daily')(dependencies);
        module.getMostRecentTimelineEntry = getMostRecentTimelineEntry;

        module.getTracker({_id: 1}, {activity_stream: {uuid: 2}}).then(function(result) {
          expect(result).to.deep.equal(trackers.read);
          done();
        }, this.helpers.callbacks.notCalled(done));
      });

      it('should resolve with push tracker when push is most recent than read', function(done) {
        var getMostRecentTimelineEntry = function(id1, id2) {
          return q(id2);
        };

        var module = require('../../../lib/daily')(dependencies);
        module.getMostRecentTimelineEntry = getMostRecentTimelineEntry;

        module.getTracker({_id: 1}, {activity_stream: {uuid: 2}}).then(function(result) {
          expect(result).to.deep.equal(trackers.push);
          done();
        }, this.helpers.callbacks.notCalled(done));
      });
    });
  });

  describe('getMostRecentTimelineEntry function', function() {

    it('should resolve empty when timelineentries are null', function(done) {
      var module = require('../../../lib/daily')(dependencies);
      module.getMostRecentTimelineEntry().then(function(result) {
        expect(result).to.not.be.defined;
        done();
      }, this.helpers.callbacks.notCalled(done));
    });

    it('should resolve with timelineEntryId1 when timelineEntryId2 is not defined', function(done) {
      var id = 1;
      var module = require('../../../lib/daily')(dependencies);
      module.getMostRecentTimelineEntry(id).then(function(result) {
        expect(result).to.be.equal(id);
        done();
      }, this.helpers.callbacks.notCalled(done));
    });

    it('should resolve with timelineEntryId2 when timelineEntryId1 is not defined', function(done) {
      var id = 1;
      var module = require('../../../lib/daily')(dependencies);
      module.getMostRecentTimelineEntry(null, id).then(function(result) {
        expect(result).to.be.equal(id);
        done();
      }, this.helpers.callbacks.notCalled(done));
    });

    it('should resolve with empty when timelinesEntries are not found', function(done) {
      var id1 = 1, id2 = 2;
      deps.activitystreams.getTimelineEntry = function(id, callback) {
        return callback();
      };

      var module = require('../../../lib/daily')(dependencies);
      module.getMostRecentTimelineEntry(id1, id2).then(function(result) {
        expect(result).to.be.undefined;
        done();
      }, this.helpers.callbacks.notCalled(done));
    });

    it('should resolve with timelineEntryId1 when getTimelineEntry does not return timelineEntryId2', function(done) {
      var id1 = 1, id2 = 2;
      deps.activitystreams.getTimelineEntry = function(id, callback) {
        if (id === id1) {
          return callback(null, {id: id});
        }
        return callback();
      };

      var module = require('../../../lib/daily')(dependencies);
      module.getMostRecentTimelineEntry(id1, id2).then(function(result) {
        expect(result).to.equal(id1);
        done();
      }, this.helpers.callbacks.notCalled(done));
    });

    it('should resolve with timelineEntryId2 when getTimelineEntry does not return timelineEntryId1', function(done) {
      var id1 = 1, id2 = 2;
      deps.activitystreams.getTimelineEntry = function(id, callback) {
        if (id === id2) {
          return callback(null, {id: id});
        }
        return callback();
      };

      var module = require('../../../lib/daily')(dependencies);
      module.getMostRecentTimelineEntry(id1, id2).then(function(result) {
        expect(result).to.equal(id2);
        done();
      }, this.helpers.callbacks.notCalled(done));
    });

    it('should resolve with timelineEntryId2 if published date is bigger than timelineEntryId1 one', function(done) {
      var id1 = 1, id2 = 2;
      var date = new Date();
      var date2 = new Date();
      date2.setSeconds(date.getSeconds() + 10);

      var tl1 = {
        id: id1,
        published: date
      };

      var tl2 = {
        id: id2,
        published: date2
      };

      deps.activitystreams.getTimelineEntry = function(id, callback) {
        if (id === id1) {
          return callback(null, tl1);
        }
        return callback(null, tl2);
      };

      var module = require('../../../lib/daily')(dependencies);
      module.getMostRecentTimelineEntry(id1, id2).then(function(result) {
        expect(result).to.equal(id2);
        done();
      }, this.helpers.callbacks.notCalled(done));
    });

    it('should resolve with timelineEntryId1 if published date is bigger than timelineEntryId2 one', function(done) {
      var id1 = 1, id2 = 2;
      var date = new Date();
      var date2 = new Date();
      date2.setSeconds(date.getSeconds() + 10);
      var tl2 = {
        id: id2,
        published: date
      };

      var tl1 = {
        id: id1,
        published: date2
      };

      deps.activitystreams.getTimelineEntry = function(id, callback) {
        if (id === id1) {
          return callback(null, tl1);
        }
        return callback(null, tl2);
      };

      var module = require('../../../lib/daily')(dependencies);
      module.getMostRecentTimelineEntry(id1, id2).then(function(result) {
        expect(result).to.equal(id1);
        done();
      }, this.helpers.callbacks.notCalled(done));
    });
  });

  describe('setReadFlags function', function() {

    it('should set original message read flag to true on original when it does have responses', function(done) {

      var message = {
        original: {
        },
        thread: {
          responses: [1, 2, 3]
        }
      };

      var module = require('../../../lib/daily')(dependencies);
      module.setReadFlags(message).then(function(result) {
        expect(result.original.read).to.be.true;
        done();
      }, this.helpers.callbacks.notCalled(done));
    });

    it('should set original message read flag to false on original when it does have undefined responses', function(done) {

      var message = {
        original: {
        },
        thread: {
        }
      };

      var module = require('../../../lib/daily')(dependencies);
      module.setReadFlags(message).then(function(result) {
        expect(result.original.read).to.be.false;
        done();
      }, this.helpers.callbacks.notCalled(done));
    });

    it('should set original message read flag to false on original when it does have empty responses', function(done) {

      var message = {
        original: {
        },
        thread: {
          responses: []
        }
      };

      var module = require('../../../lib/daily')(dependencies);
      module.setReadFlags(message).then(function(result) {
        expect(result.original.read).to.be.false;
        done();
      }, this.helpers.callbacks.notCalled(done));
    });

    describe('when processing responses', function() {

      it('should set flag to true when thread does not have responses', function(done) {
        var message = {
          original: {
            responses: [
              {_id: 1}
            ]
          },
          thread: {
            responses: []
          }
        };

        var module = require('../../../lib/daily')(dependencies);
        module.setReadFlags(message).then(function(result) {
          expect(result.original.responses[0].read).to.be.true;
          done();
        }, this.helpers.callbacks.notCalled(done));
      });

      it('should set read flag to false when thread contains response', function(done) {
        var id = 1;
        var message = {
          original: {
            responses: [
              {_id: id}
            ]
          },
          thread: {
            responses: [
              {message: {_id: id}}
            ]
          }
        };

        var module = require('../../../lib/daily')(dependencies);
        module.setReadFlags(message).then(function(result) {
          expect(result.original.responses[0].read).to.be.false;
          done();
        }, this.helpers.callbacks.notCalled(done));
      });

      it('should set read flag to true when thread does not contains response', function(done) {
        var message = {
          original: {
            responses: [
              {_id: 1}
            ]
          },
          thread: {
            responses: [
              {message: {_id: 2}}
            ]
          }
        };

        var module = require('../../../lib/daily')(dependencies);
        module.setReadFlags(message).then(function(result) {
          expect(result.original.responses[0].read).to.be.true;
          done();
        }, this.helpers.callbacks.notCalled(done));
      });

    });

  });
});
