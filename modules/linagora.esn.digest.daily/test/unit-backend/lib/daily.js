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

  beforeEach(function() {
    initDependencies();
  });

  describe('The digest fn', function() {

    describe('The userModule call', function() {

      it('should reject if user list fails', function() {
        deps.user.list = function(callback) {
          return callback(new Error());
        };

        var module = require('../../../lib/daily')(dependencies);
        return expect(module.digest()).to.be.rejected;
      });

      it('should send back empty array if user list returns empty array', function() {
        var users = [];
        deps.user.list = function(callback) {
          return callback(null, users);
        };
        var module = require('../../../lib/daily')(dependencies);
        return expect(module.digest()).to.become(users);
      });

      it('should send back empty array if user list returns undefined', function() {
        deps.user.list = function(callback) {
          return callback();
        };
        var module = require('../../../lib/daily')(dependencies);
        return expect(module.digest()).to.become([]);
      });
    });

    describe('when users are available', function() {

      it('should call userDailyDigest as many time as there are users', function() {

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

        return module.digest().then(function() {
          expect(called).to.equal(users.length);
        });
      });
    });
  });

  describe('The userDailyDigest function', function() {

    it('should reject when user is undefined', function() {
      var module = require('../../../lib/daily')(dependencies);
      return expect(module.userDailyDigest()).to.be.rejected;
    });

    describe('when collaborationModule.getCollaborationsForTuple sends back', function() {
      var user = {_id: Number('1'), emails: ['anEmail'] };

      it('error', function() {
        deps.collaboration = {
          getCollaborationsForTuple: function(tuple, callback) {
            return callback(new Error());
          }
        };

        var module = require('../../../lib/daily')(dependencies);
        return expect(module.userDailyDigest(user)).to.be.rejected;
      });

      it('undefined collaborations', function() {
        deps.collaboration = {
          getCollaborationsForTuple: function(tuple, callback) {
            return callback();
          }
        };

        var module = require('../../../lib/daily')(dependencies);
        return module.userDailyDigest(user).then(function(result) {
          expect(result.data).to.have.length(0);
          expect(result.status).to.match(/No collaborations found/);
        });
      });

      it('empty collaborations', function() {
        deps.collaboration = {
          getCollaborationsForTuple: function(tuple, callback) {
            return callback(null, []);
          }
        };

        var module = require('../../../lib/daily')(dependencies);
        module.userDailyDigest(user).then(function(result) {
          expect(result.data).to.have.length(0);
          expect(result.status).to.match(/No collaborations found/);
        });
      });

      describe('collaboration list', function() {
        it('should call loadUserDataForCollaboration as many times as there are collaborations', function() {
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

          mockery.registerMock('./mail',
            function() {
              return {
                process: function() {
                  return q({});
                }
              };
            });

          mockery.registerMock('./tracker',
            function() {
              return {
                updateTracker: function() {
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

          return module.userDailyDigest(user).then(function(result) {
            expect(result.status).to.not.exist;
            expect(called).to.equal(collaborations.length);
          });
        });

        it('should send email if there is at least one message returns by loadUserDataForCollaboration', function() {
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
                compute: function(user, data) {
                  return q(data);
                }
              };
            });

          mockery.registerMock('./mail',
            function() {
              return {
                process: function() {
                  called++;
                  return q({});
                }
              };
            });

          mockery.registerMock('./tracker',
            function() {
              return {
                updateTracker: function() {
                  return q({});
                }
              };
            });

          var module = require('../../../lib/daily')(dependencies);
          var loadUserDataForCollaboration = function(user, collaboration) {
            if (collaboration === collaborations[0]) {
              return q({messages: [{}], collaboration: collaboration});
            } else {
              return q({messages: [], collaboration: collaboration});
            }
          };
          module.loadUserDataForCollaboration = loadUserDataForCollaboration;

          return module.userDailyDigest(user).then(function(result) {
            expect(result.status).to.not.exist;
            expect(called).to.equal(1);
          });
        });

        it('should NOT send email if there is no message returns by loadUserDataForCollaboration', function() {
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
                compute: function(user, data) {
                  return q(data);
                }
              };
            });

          mockery.registerMock('./mail',
            function() {
              return {
                process: function() {
                  called++;
                  return q({});
                }
              };
            });

          mockery.registerMock('./tracker',
            function() {
              return {
                updateTracker: function() {
                  return q({});
                }
              };
            });

          var module = require('../../../lib/daily')(dependencies);
          var loadUserDataForCollaboration = function(user, collaboration) {
            return q({messages: [], collaboration: collaboration});
          };
          module.loadUserDataForCollaboration = loadUserDataForCollaboration;

          return module.userDailyDigest(user).then(function(result) {
            expect(result.status).to.not.exist;
            expect(called).to.equal(0);
          });
        });
      });
    });

  });

  describe('The loadUserDataForCollaboration function', function() {

    it('should reject when user is undefined', function() {
      var module = require('../../../lib/daily')(dependencies);
      return expect(module.loadUserDataForCollaboration(null, {})).to.be.rejected;
    });

    it('should reject when collaboration is undefined', function() {
      var module = require('../../../lib/daily')(dependencies);
      return expect(module.loadUserDataForCollaboration({}, null)).to.be.rejected;
    });

    describe('When getting tracker', function() {
      it('should reject when getTracker sends back error', function() {

        var module = require('../../../lib/daily')(dependencies);
        var getTracker = function() {
          return q.reject(new Error());
        };
        module.getTracker = getTracker;

        return expect(module.loadUserDataForCollaboration({}, {})).to.be.rejected;
      });
    });

    describe('when loading thread', function() {

      var user = {_id: 1};
      var collaboration = {
        activity_stream: {
          uuid: 123
        }
      };

      it('should reject when buildThreadViewSinceLastTimelineEntry sends back error', function() {
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

        return expect(module.loadUserDataForCollaboration(user, collaboration)).to.be.rejected;
      });

      it('should resolve when buildThreadViewSinceLastTimelineEntry sends back empty thread', function() {
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

        return expect(module.loadUserDataForCollaboration(user, collaboration)).to.become({
          messages: [],
          collaboration: collaboration
        });
      });

      it('should call buildMessageContext as many times as there are threads', function() {
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
          return q({});
        };
        module.buildMessageContext = buildMessageContext;

        return module.loadUserDataForCollaboration(user, collaboration, tracker)
          .then(function() {
            expect(call).to.equal(3);
          });
      });

      it('should return only message which have the involved field set to false', function() {
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
          if (call === 2) {
            return q({involved: true});
          }
          return q({involved: false});
        };
        module.buildMessageContext = buildMessageContext;

        return module.loadUserDataForCollaboration(user, collaboration, tracker)
          .then(function(data) {
            expect(call).to.equal(Object.keys(threads).length);
            expect(data.messages).to.have.length(2);
            data.messages.forEach(function(message) {
              expect(message.involved).to.be.false;
            });
          });
      });

      it('should not return undefined, empty message or message with involved field set to undefined', function() {
        var threads = {'1': {}, '2': {}, '3': {}, '4': {}};
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
          if (call === 1) {
            return q({involved: false});
          } else if (call === 2) {
            return q({});
          } else if (call === 3) {
            return q();
          }
          return q({involved: undefined});
        };
        module.buildMessageContext = buildMessageContext;

        return module.loadUserDataForCollaboration(user, collaboration, tracker)
          .then(function(data) {
            expect(call).to.equal(Object.keys(threads).length);
            expect(data.messages).to.have.length(1);
            data.messages.forEach(function(message) {
              expect(message.involved).to.be.false;
            });
          });
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

    it('should reject when thread is undefined', function() {
      var module = require('../../../lib/daily')(dependencies);
      return expect(module.buildMessageContext()).to.be.rejected;
    });

    it('should reject when user is undefined', function() {
      var module = require('../../../lib/daily')(dependencies);
      return expect(module.buildMessageContext({})).to.be.rejected;
    });

    it('should resolve with message and thread when message#get is ok', function() {
      var message = {_id: 1, content: 'YOLO'};

      deps.message = {
        get: function(id, callback) {
          return callback(null, message);
        }
      };

      var module = require('../../../lib/daily')(dependencies);
      var setReadAndInvolvedFlags = function(message) {
        return q(message);
      };
      module.setReadAndInvolvedFlags = setReadAndInvolvedFlags;

      return expect(module.buildMessageContext(thread, {})).to.become(message);
    });

    it('should resolve with empty message and thread when message#get is ko', function() {
      deps.message = {
        get: function(id, callback) {
          return callback(new Error('KO'));
        }
      };

      var module = require('../../../lib/daily')(dependencies);
      var setReadAndInvolvedFlags = function(message) {
        return q(message);
      };
      module.setReadAndInvolvedFlags = setReadAndInvolvedFlags;

      return expect(module.buildMessageContext(thread, {})).to.become({});
    });
  });

  describe('getTracker function', function() {
    it('should reject when user is undefined', function() {
      var module = require('../../../lib/daily')(dependencies);
      return expect(module.getTracker(null, {})).to.be.rejected;
    });

    it('should reject when collaboration is undefined', function() {
      var module = require('../../../lib/daily')(dependencies);
      return expect(module.getTracker({})).to.be.rejected;
    });

    it('should call getLastTimelineEntry on each tracker', function() {

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

      return module.getTracker({_id: 1}, {activity_stream: {uuid: 2}}).then(function(result) {
        expect(read).to.equal(1);
        expect(push).to.equal(1);
      });
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

      it('should resolve with read tracker when no result is returned from getMostRecentTimelineEntry', function() {
        var getMostRecentTimelineEntry = function(id1, id2) {
          return q();
        };

        var module = require('../../../lib/daily')(dependencies);
        module.getMostRecentTimelineEntry = getMostRecentTimelineEntry;

        return expect(module.getTracker({_id: 1}, {activity_stream: {uuid: 2}})).to.become(trackers.read);
      });

      it('should resolve with read tracker when read is most recent than push', function() {
        var getMostRecentTimelineEntry = function(id1, id2) {
          return q(id1);
        };

        var module = require('../../../lib/daily')(dependencies);
        module.getMostRecentTimelineEntry = getMostRecentTimelineEntry;

        return expect(module.getTracker({_id: 1}, {activity_stream: {uuid: 2}})).to.become(trackers.read);
      });

      it('should resolve with push tracker when push is most recent than read', function() {
        var getMostRecentTimelineEntry = function(id1, id2) {
          return q(id2);
        };

        var module = require('../../../lib/daily')(dependencies);
        module.getMostRecentTimelineEntry = getMostRecentTimelineEntry;

        return expect(module.getTracker({_id: 1}, {activity_stream: {uuid: 2}})).to.become(trackers.push);
      });
    });
  });

  describe('getMostRecentTimelineEntry function', function() {

    it('should resolve empty when timelineentries are null', function() {
      var module = require('../../../lib/daily')(dependencies);
      return expect(module.getMostRecentTimelineEntry()).to.become(undefined);
    });

    it('should resolve with timelineEntryId1 when timelineEntryId2 is not defined', function() {
      var id = 1;
      var module = require('../../../lib/daily')(dependencies);
      return expect(module.getMostRecentTimelineEntry(id)).to.become(id);
    });

    it('should resolve with timelineEntryId2 when timelineEntryId1 is not defined', function() {
      var id = 1;
      var module = require('../../../lib/daily')(dependencies);
      return expect(module.getMostRecentTimelineEntry(null, id)).to.become(id);
    });

    it('should resolve with empty when timelinesEntries are not found', function() {
      var id1 = 1, id2 = 2;
      deps.activitystreams.getTimelineEntry = function(id, callback) {
        return callback();
      };

      var module = require('../../../lib/daily')(dependencies);
      return expect(module.getMostRecentTimelineEntry(id1, id2)).to.become(undefined);
    });

    it('should resolve with timelineEntryId1 when getTimelineEntry does not return timelineEntryId2', function() {
      var id1 = 1, id2 = 2;
      deps.activitystreams.getTimelineEntry = function(id, callback) {
        if (id === id1) {
          return callback(null, {id: id});
        }
        return callback();
      };

      var module = require('../../../lib/daily')(dependencies);
      return expect(module.getMostRecentTimelineEntry(id1, id2)).to.become(id1);
    });

    it('should resolve with timelineEntryId2 when getTimelineEntry does not return timelineEntryId1', function() {
      var id1 = 1, id2 = 2;
      deps.activitystreams.getTimelineEntry = function(id, callback) {
        if (id === id2) {
          return callback(null, {id: id});
        }
        return callback();
      };

      var module = require('../../../lib/daily')(dependencies);
      return expect(module.getMostRecentTimelineEntry(id1, id2)).to.become(id2);
    });

    it('should resolve with timelineEntryId2 if published date is bigger than timelineEntryId1 one', function() {
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
      return expect(module.getMostRecentTimelineEntry(id1, id2)).to.become(id2);
    });

    it('should resolve with timelineEntryId1 if published date is bigger than timelineEntryId2 one', function() {
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
      return expect(module.getMostRecentTimelineEntry(id1, id2)).to.become(id1);
    });
  });

  describe('setReadAndInvolvedFlags function', function() {

    it('should set message read flag to the thread read flag', function() {

      var message = {};
      var thread = {read: true};

      var module = require('../../../lib/daily')(dependencies);
      return expect(module.setReadAndInvolvedFlags(message, thread)).to.become({
        read: thread.read,
        involved: false
      });
    });

    it('should set message involved flag to true if the user id is equal to the author id', function() {

      var userId = '1';
      var message = {
        author: {_id: userId}
      };
      var thread = {};
      var user = {_id: userId};

      var module = require('../../../lib/daily')(dependencies);
      return expect(module.setReadAndInvolvedFlags(message, thread, user)).to.eventually.shallowDeepEqual({
        involved: true
      });
    });

    it('should set message and responses read flag to true if the message it not in the thread object', function() {

      var message = {
        _id: '1',
        responses: [{
          _id: '2'
        }, {
          _id: '3'
        }]
      };
      var thread = {};

      var module = require('../../../lib/daily')(dependencies);
      return expect(module.setReadAndInvolvedFlags(message, thread)).to.eventually.shallowDeepEqual({
        read: true,
        responses: [{
          read: true
        }, {
          read: true
        }]
      });
    });

    it('should set message and responses read flag to the thread read flag message and responses', function() {

      var message = {
        _id: '1',
        responses: [{
          _id: '2'
        }, {
          _id: '3'
        }]
      };
      var thread = {
        read: false,
        responses: [{
          message: {
            _id: message.responses[0]._id
          },
          read: false
        }, {
          message: {
            _id: message.responses[1]._id
          },
          read: true
        }]
      };

      var module = require('../../../lib/daily')(dependencies);
      return expect(module.setReadAndInvolvedFlags(message, thread)).to.eventually.shallowDeepEqual({
        read: false,
        responses: [{
          read: false
        }, {
          read: true
        }]
      });
    });

    it('should set message involved flag to true if a response have the same author id than the user', function() {

      var userId = 'userId';
      var userId2 = 'userId2';
      var message = {
        _id: '1',
        author: {_id: userId},
        responses: [{
          _id: '2',
          author: {_id: userId2}
        }, {
          _id: '3',
          author: {_id: userId}
        }]
      };
      var thread = {};
      var user = {_id: userId2};

      var module = require('../../../lib/daily')(dependencies);
      return expect(module.setReadAndInvolvedFlags(message, thread, user)).to.eventually.shallowDeepEqual({
        involved: true
      });
    });

    it('should set message involved flag to false if no response have the same author id than the user', function() {

      var userId = 'userId';
      var userId2 = 'userId2';
      var message = {
        _id: '1',
        author: {_id: userId},
        responses: [{
          _id: '2',
          author: {_id: userId}
        }, {
          _id: '3',
          author: {_id: userId}
        }]
      };
      var thread = {};
      var user = {_id: userId2};

      var module = require('../../../lib/daily')(dependencies);
      return expect(module.setReadAndInvolvedFlags(message, thread, user)).to.eventually.shallowDeepEqual({
        involved: false
      });
    });
  });
});
