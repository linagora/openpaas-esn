'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');
var rewire = require('rewire');
var q = require('q');

describe('The daily digest core module', function() {

  function notCalled(done) {
    return function(result) {
      return done(new Error('Should not be called' + result));
    };
  }

  function called(done) {
    return done();
  }

  describe('The digest fn', function() {

    beforeEach(function() {
      mockery.registerMock('../collaboration', {});
      mockery.registerMock('../activitystreams', {});
      mockery.registerMock('../message', {});
      mockery.registerMock('./weight', {});
      mockery.registerMock('../activitystreams/tracker', {
        getTracker: function() {}
      });
    });

    describe('The userModule call', function() {

      it('should reject if user list fails', function(done) {
        mockery.registerMock('../user', {
          list: function(callback) {
            return callback(new Error());
          }
        });
        var module = this.helpers.requireBackend('core/digest/daily');
        module.digest().then(notCalled(done), called(done));
      });

      it('should send back empty array if user list returns empty array', function(done) {
        var users = [];
        mockery.registerMock('../user', {
          list: function(callback) {
            return callback(null, users);
          }
        });
        var module = this.helpers.requireBackend('core/digest/daily');
        module.digest().then(function(result) {
          expect(result).to.deep.equal(users);
          done();
        }, notCalled(done));
      });

      it('should send back empty array if user list returns undefined', function(done) {
        mockery.registerMock('../user', {
          list: function(callback) {
            return callback();
          }
        });
        var module = this.helpers.requireBackend('core/digest/daily');
        module.digest().then(function(result) {
          expect(result).to.be.an.empty.array;
          done();
        }, notCalled(done));
      });
    });

    describe('when users are available', function() {

      it('should call userDailyDigest as many time as there are users', function(done) {

        var users = [1, 2, 3];
        mockery.registerMock('../user', {
          list: function(callback) {
            return callback(null, users);
          }
        });
        var called = 0;

        var module = rewire('../../../../backend/core/digest/daily');
        var userDailyDigest = function(user) {
          called++;
          return q(user);
        };
        module.__set__('userDailyDigest', userDailyDigest);

        module.digest().then(function() {
          expect(called).to.equal(users.length);
          done();
        }, notCalled(done));
      });
    });
  });

  describe('The userDailyDigest function', function() {

    it('should reject when user is undefined', function(done) {

      mockery.registerMock('../collaboration', {});
      mockery.registerMock('../activitystreams', {});
      mockery.registerMock('../message', {});
      mockery.registerMock('../user', {});
      mockery.registerMock('./weight', {});
      mockery.registerMock('../activitystreams/tracker', {
        getTracker: function() {}
      });

      var module = this.helpers.requireBackend('core/digest/daily');
      module.userDailyDigest().then(notCalled(done), called(done));
    });

    describe('when collaborationModule.getCollaborationsForTuple sends back', function() {
      var user = {_id: 1};

      beforeEach(function() {
        mockery.registerMock('../message', {});
        mockery.registerMock('../activitystreams', {});
        mockery.registerMock('../user', {});
        mockery.registerMock('./weight', {});
        mockery.registerMock('../activitystreams/tracker', {
          getTracker: function() {}
        });
      });

      it('error', function(done) {
        mockery.registerMock('../collaboration', {
          getCollaborationsForTuple: function(tuple, callback) {
            return callback(new Error());
          }
        });

        var module = this.helpers.requireBackend('core/digest/daily');
        module.userDailyDigest(user).then(notCalled(done), called(done));
      });

      it('undefined collaborations', function(done) {
        mockery.registerMock('../collaboration', {
          getCollaborationsForTuple: function(tuple, callback) {
            return callback();
          }
        });

        var module = this.helpers.requireBackend('core/digest/daily');
        module.userDailyDigest(user).then(function(result) {
          expect(result.data.length).to.equal(0);
          expect(result.status).to.match(/No collaborations found/);
          done();
        }, notCalled(done));
      });

      it('empty collaborations', function(done) {
        mockery.registerMock('../collaboration', {
          getCollaborationsForTuple: function(tuple, callback) {
            return callback(null, []);
          }
        });

        var module = this.helpers.requireBackend('core/digest/daily');
        module.userDailyDigest(user).then(function(result) {
          expect(result.data.length).to.equal(0);
          expect(result.status).to.match(/No collaborations found/);
          done();
        }, notCalled(done));
      });

      describe('collaboration list', function() {
        it('should call loadUserDataForCollaboration as many times as there are collaborations', function(done) {
          var collaborations = [1, 2, 3, 4];
          var called = 0;

          mockery.registerMock('../collaboration', {
            getCollaborationsForTuple: function(tuple, callback) {
              return callback(null, collaborations);
            }
          });

          mockery.registerMock('./weight', {
            compute: function() {
              return q({});
            }
          });

          var module = rewire('../../../../backend/core/digest/daily');
          var loadUserDataForCollaboration = function(u, c, t) {
            expect(u).to.deep.equal(user);
            called++;
            return q({messages: [], collaboration: c});
          };
          module.__set__('loadUserDataForCollaboration', loadUserDataForCollaboration);
          module.userDailyDigest(user).then(function(result) {
            expect(result.status).to.not.exist;
            expect(called).to.equal(collaborations.length);
            done();
          }, notCalled(done));
        });
      });
    });

  });

  describe('The loadUserDataForCollaboration function', function() {

    beforeEach(function() {
      mockery.registerMock('../message', {});
      mockery.registerMock('../collaboration', {});
      mockery.registerMock('../activitystreams', {});
      mockery.registerMock('../user', {});
      mockery.registerMock('./weight', {});
      mockery.registerMock('../activitystreams/tracker', {
        getTracker: function() {}
      });
    });

    it('should reject when user is undefined', function(done) {
      var module = this.helpers.requireBackend('core/digest/daily');
      module.loadUserDataForCollaboration(null, {}).then(notCalled(done), called(done));
    });

    it('should reject when collaboration is undefined', function(done) {
      var module = this.helpers.requireBackend('core/digest/daily');
      module.loadUserDataForCollaboration({}, null).then(notCalled(done), called(done));
    });

    describe('When getting tracker', function() {
      it('should reject when getTracker sends back error', function(done) {
        var module = rewire('../../../../backend/core/digest/daily');
        var getTracker = function() {
          return q.reject(new Error());
        };
        module.__set__('getTracker', getTracker);
        module.loadUserDataForCollaboration({}, {}).then(notCalled(done), called(done));
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

        var module = rewire('../../../../backend/core/digest/daily');
        var getTracker = function() {
          return q(tracker);
        };
        module.__set__('getTracker', getTracker);
        module.loadUserDataForCollaboration(user, collaboration).then(notCalled(done), called(done));
      });

      it('should resolve when buildThreadViewSinceLastTimelineEntry sends back empty thread', function(done) {
        var tracker = {
          buildThreadViewSinceLastTimelineEntry: function(userId, uuid, callback) {
            return callback();
          }
        };

        var module = rewire('../../../../backend/core/digest/daily');
        var getTracker = function() {
          return q(tracker);
        };
        module.__set__('getTracker', getTracker);
        module.loadUserDataForCollaboration(user, collaboration).then(function(result) {
          expect(result).to.deep.equal({
            messages: [],
            collaboration: collaboration
          });
          done();
        }, notCalled(done));
      });

      it('should call buildMessageContext as many times as there are threads', function(done) {
        var threads = {'1': {}, '2': {}, '3': {}};
        var call = 0;

        var tracker = {
          buildThreadViewSinceLastTimelineEntry: function(userId, uuid, callback) {
            return callback(null, threads);
          }
        };

        var module = rewire('../../../../backend/core/digest/daily');
        var getTracker = function() {
          return q(tracker);
        };
        module.__set__('getTracker', getTracker);
        var buildMessageContext = function() {
          call++;
          return q({original: {}, thread: {}});
        };
        module.__set__('buildMessageContext', buildMessageContext);
        module.loadUserDataForCollaboration(user, collaboration, tracker).then(called(done), notCalled(done));
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

    beforeEach(function() {
      mockery.registerMock('../message', {});
      mockery.registerMock('../collaboration', {});
      mockery.registerMock('../activitystreams', {});
      mockery.registerMock('../user', {});
      mockery.registerMock('./weight', {});
      mockery.registerMock('../activitystreams/tracker', {
        getTracker: function() {}
      });
    });

    it('should reject when thread is undefined', function(done) {
      var module = this.helpers.requireBackend('core/digest/daily');
      module.buildMessageContext().then(notCalled(done), called(done));
    });

    it('should resolve with message and thread when message#get is ok', function(done) {
      var message = {_id: 1, content: 'YOLO'};

      mockery.registerMock('../message', {
        get: function(id, callback) {
          return callback(null, message);
        }
      });

      var module = rewire('../../../../backend/core/digest/daily');
      var setReadFlags = function(message) {
        return q(message);
      };
      module.__set__('setReadFlags', setReadFlags);
      module.buildMessageContext(thread).then(function(result) {
        expect(result).to.deep.equal(message);
        done();
      }, notCalled(done));
    });

    it('should resolve with empty message and thread when message#get is ko', function(done) {
      mockery.registerMock('../message', {
        get: function(id, callback) {
          return callback(new Error('KO'));
        }
      });

      var module = rewire('../../../../backend/core/digest/daily');
      var setReadFlags = function(message) {
        return q(message);
      };
      module.__set__('setReadFlags', setReadFlags);

      module.buildMessageContext(thread).then(function(result) {
        expect(result).to.deep.equal({});
        done();
      }, notCalled(done));
    });
  });

  describe('getTracker function', function() {
    beforeEach(function() {
      mockery.registerMock('../message', {});
      mockery.registerMock('../collaboration', {});
      mockery.registerMock('../activitystreams', {});
      mockery.registerMock('../user', {});
      mockery.registerMock('./weight', {});
      mockery.registerMock('../activitystreams/tracker', {
        getTracker: function() {
        }
      });
    });

    it('should reject when user is undefined', function(done) {
      var module = this.helpers.requireBackend('core/digest/daily');
      module.getTracker(null, {}).then(notCalled(done), called(done));
    });

    it('should reject when collaboration is undefined', function(done) {
      var module = this.helpers.requireBackend('core/digest/daily');
      module.getTracker({}).then(notCalled(done), called(done));
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

      mockery.registerMock('../activitystreams/tracker', {
        getTracker: function(type) {
          return trackers[type];
        }
      });


      var getMostRecentTimelineEntry = function(id1, id2) {
        return q(id1);
      };

      var module = rewire('../../../../backend/core/digest/daily');
      module.__set__('getMostRecentTimelineEntry', getMostRecentTimelineEntry);

      module.getTracker({_id: 1}, {activity_stream: {uuid: 2}}).then(function(result) {
        expect(read).to.equal(1);
        expect(push).to.equal(1);
        done();
      }, notCalled(done));
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
        mockery.registerMock('../activitystreams/tracker', {
          getTracker: function(type) {
            return trackers[type];
          }
        });

      });

      it('should resolve with read tracker when no result is returned from getMostRecentTimelineEntry', function(done) {
        var getMostRecentTimelineEntry = function(id1, id2) {
          return q();
        };

        var module = rewire('../../../../backend/core/digest/daily');
        module.__set__('getMostRecentTimelineEntry', getMostRecentTimelineEntry);

        module.getTracker({_id: 1}, {activity_stream: {uuid: 2}}).then(function(result) {
          expect(result).to.deep.equal(trackers.read);
          done();
        }, notCalled(done));
      });

      it('should resolve with read tracker when read is most recent than push', function(done) {
        var getMostRecentTimelineEntry = function(id1, id2) {
          return q(id1);
        };

        var module = rewire('../../../../backend/core/digest/daily');
        module.__set__('getMostRecentTimelineEntry', getMostRecentTimelineEntry);

        module.getTracker({_id: 1}, {activity_stream: {uuid: 2}}).then(function(result) {
          expect(result).to.deep.equal(trackers.read);
          done();
        }, notCalled(done));
      });

      it('should resolve with push tracker when push is most recent than read', function(done) {
        var getMostRecentTimelineEntry = function(id1, id2) {
          return q(id2);
        };

        var module = rewire('../../../../backend/core/digest/daily');
        module.__set__('getMostRecentTimelineEntry', getMostRecentTimelineEntry);

        module.getTracker({_id: 1}, {activity_stream: {uuid: 2}}).then(function(result) {
          expect(result).to.deep.equal(trackers.push);
          done();
        }, notCalled(done));
      });
    });
  });

  describe('getMostRecentTimelineEntry function', function() {

    beforeEach(function() {
      mockery.registerMock('../message', {});
      mockery.registerMock('../collaboration', {});
      mockery.registerMock('../activitystreams', {});
      mockery.registerMock('../user', {});
      mockery.registerMock('./weight', {});
      mockery.registerMock('../activitystreams/tracker', {
        getTracker: function() {}
      });
    });

    it('should resolve empty when timelineentries are null', function(done) {
      var module = this.helpers.requireBackend('core/digest/daily');
      module.getMostRecentTimelineEntry().then(function(result) {
        expect(result).to.not.be.defined;
        done();
      }, notCalled(done));
    });

    it('should resolve with timelineEntryId1 when timelineEntryId2 is not defined', function(done) {
      var id = 1;
      var module = this.helpers.requireBackend('core/digest/daily');
      module.getMostRecentTimelineEntry(id).then(function(result) {
        expect(result).to.be.equal(id);
        done();
      }, notCalled(done));
    });

    it('should resolve with timelineEntryId2 when timelineEntryId1 is not defined', function(done) {
      var id = 1;
      var module = this.helpers.requireBackend('core/digest/daily');
      module.getMostRecentTimelineEntry(null, id).then(function(result) {
        expect(result).to.be.equal(id);
        done();
      }, notCalled(done));
    });

    it('should resolve with empty when timelinesEntries are not found', function(done) {
      var id1 = 1, id2 = 2;
      mockery.registerMock('../activitystreams', {
        getTimelineEntry: function(id, callback) {
          return callback();
        }
      });
      var module = this.helpers.requireBackend('core/digest/daily');
      module.getMostRecentTimelineEntry(id1, id2).then(function(result) {
        expect(result).to.be.undefined;
        done();
      }, notCalled(done));
    });

    it('should resolve with timelineEntryId1 when getTimelineEntry does not return timelineEntryId2', function(done) {
      var id1 = 1, id2 = 2;
      mockery.registerMock('../activitystreams', {
        getTimelineEntry: function(id, callback) {
          if (id === id1) {
            return callback(null, {id: id});
          }
          return callback();
        }
      });
      var module = this.helpers.requireBackend('core/digest/daily');
      module.getMostRecentTimelineEntry(id1, id2).then(function(result) {
        expect(result).to.equal(id1);
        done();
      }, notCalled(done));
    });

    it('should resolve with timelineEntryId2 when getTimelineEntry does not return timelineEntryId1', function(done) {
      var id1 = 1, id2 = 2;
      mockery.registerMock('../activitystreams', {
        getTimelineEntry: function(id, callback) {
          if (id === id2) {
            return callback(null, {id: id});
          }
          return callback();
        }
      });
      var module = this.helpers.requireBackend('core/digest/daily');
      module.getMostRecentTimelineEntry(id1, id2).then(function(result) {
        expect(result).to.equal(id2);
        done();
      }, notCalled(done));
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

      mockery.registerMock('../activitystreams', {
        getTimelineEntry: function(id, callback) {
          if (id === id1) {
            return callback(null, tl1);
          }
          return callback(null, tl2);
        }
      });
      var module = this.helpers.requireBackend('core/digest/daily');
      module.getMostRecentTimelineEntry(id1, id2).then(function(result) {
        expect(result).to.equal(id2);
        done();
      }, notCalled(done));
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

      mockery.registerMock('../activitystreams', {
        getTimelineEntry: function(id, callback) {
          if (id === id1) {
            return callback(null, tl1);
          }
          return callback(null, tl2);
        }
      });
      var module = this.helpers.requireBackend('core/digest/daily');
      module.getMostRecentTimelineEntry(id1, id2).then(function(result) {
        expect(result).to.equal(id1);
        done();
      }, notCalled(done));
    });
  });

  describe('setReadFlags function', function() {
    beforeEach(function() {
      mockery.registerMock('../message', {});
      mockery.registerMock('../collaboration', {});
      mockery.registerMock('../activitystreams', {});
      mockery.registerMock('../user', {});
      mockery.registerMock('./weight', {});
      mockery.registerMock('../activitystreams/tracker', {
        getTracker: function() {}
      });
    });

    it('should set original message read flag to true on original when it does have responses', function(done) {

      var message = {
        original: {
        },
        thread: {
          responses: [1, 2, 3]
        }
      };

      var module = this.helpers.requireBackend('core/digest/daily');
      module.setReadFlags(message).then(function(result) {
        expect(result.original.read).to.be.true;
        done();
      }, notCalled(done));
    });

    it('should set original message read flag to false on original when it does have undefined responses', function(done) {

      var message = {
        original: {
        },
        thread: {
        }
      };

      var module = this.helpers.requireBackend('core/digest/daily');
      module.setReadFlags(message).then(function(result) {
        expect(result.original.read).to.be.false;
        done();
      }, notCalled(done));
    });

    it('should set original message read flag to false on original when it does have empty responses', function(done) {

      var message = {
        original: {
        },
        thread: {
          responses: []
        }
      };

      var module = this.helpers.requireBackend('core/digest/daily');
      module.setReadFlags(message).then(function(result) {
        expect(result.original.read).to.be.false;
        done();
      }, notCalled(done));
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

        var module = this.helpers.requireBackend('core/digest/daily');
        module.setReadFlags(message).then(function(result) {
          expect(result.original.responses[0].read).to.be.true;
          done();
        }, notCalled(done));
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

        var module = this.helpers.requireBackend('core/digest/daily');
        module.setReadFlags(message).then(function(result) {
          expect(result.original.responses[0].read).to.be.false;
          done();
        }, notCalled(done));
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

        var module = this.helpers.requireBackend('core/digest/daily');
        module.setReadFlags(message).then(function(result) {
          expect(result.original.responses[0].read).to.be.true;
          done();
        }, notCalled(done));
      });

    });

  });
});
