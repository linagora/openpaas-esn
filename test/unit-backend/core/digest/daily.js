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
      mockery.registerMock('../user', {});
      mockery.registerMock('./weight', {});
      mockery.registerMock('../activitystreams/tracker', {
        getTracker: function() {}
      });
    });

    it('should reject when user is undefined', function(done) {
      var module = this.helpers.requireBackend('core/digest/daily');
      module.loadUserDataForCollaboration(null, {}, {}).then(notCalled(done), called(done));
    });

    it('should reject when collaboration is undefined', function(done) {
      var module = this.helpers.requireBackend('core/digest/daily');
      module.loadUserDataForCollaboration({}, null, {}).then(notCalled(done), called(done));
    });

    it('should reject when tracker is undefined', function(done) {
      var module = this.helpers.requireBackend('core/digest/daily');
      module.loadUserDataForCollaboration({}, {}, null).then(notCalled(done), called(done));
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

        var module = this.helpers.requireBackend('core/digest/daily');
        module.loadUserDataForCollaboration(user, collaboration, tracker).then(notCalled(done), called(done));
      });

      it('should resolve when buildThreadViewSinceLastTimelineEntry sends back empty thread', function(done) {
        var tracker = {
          buildThreadViewSinceLastTimelineEntry: function(userId, uuid, callback) {
            return callback();
          }
        };

        var module = this.helpers.requireBackend('core/digest/daily');
        module.loadUserDataForCollaboration(user, collaboration, tracker).then(function(result) {
          expect(result).to.deep.equal({});
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
        var buildMessageContext = function(t) {
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

    it('should resolve with message and thread when message#dryGet is ok', function(done) {
      var m = {_id: 1, content: 'YOLO'};
      var message = {toObject: function() {return m;}};

      mockery.registerMock('../message', {
        dryGet: function(id, callback) {
          return callback(null, message);
        }
      });

      var module = rewire('../../../../backend/core/digest/daily');
      var setReadFlags = function(message) {
        return q(message);
      };
      module.__set__('setReadFlags', setReadFlags);
      module.buildMessageContext(thread).then(function(result) {
        expect(result).to.deep.equal(m);
        done();
      }, notCalled(done));
    });

    it('should resolve with empty message and thread when message#dryGet is ko', function(done) {
      mockery.registerMock('../message', {
        dryGet: function(id, callback) {
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
});
