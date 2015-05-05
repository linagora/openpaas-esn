'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The messages middleware', function() {

  describe('The canReplyTo fn', function() {

    beforeEach(function() {
      mockery.registerMock('../community', {});
      mockery.registerMock('../../core/collaboration', {});
      mockery.registerMock('../../core/message/permission', {});
      mockery.registerMock('../../core/message', {});
      mockery.registerMock('../../core/community', {});
    });

    it('should call next if req.body.replyTo is undefined', function(done) {
      mockery.registerMock('../../core/message', {});
      var middleware = this.helpers.requireBackend('webserver/middleware/message').canReplyTo;
      var req = {
        body: {
        }
      };
      middleware(req, {}, done);
    });

    it('should send back 400 if messageModule.get returns error', function(done) {
      mockery.registerMock('../../core/message', {
        get: function(id, callback) {
          return callback(new Error());
        }
      });
      var middleware = this.helpers.requireBackend('webserver/middleware/message').canReplyTo;
      var req = {
        body: {
          inReplyTo: {
            _id: 1
          }
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };
      middleware(req, res);
    });

    it('should send back 400 if messageModule.get returns null message', function(done) {
      mockery.registerMock('../../core/message', {
        get: function(id, callback) {
          return callback();
        }
      });
      var middleware = this.helpers.requireBackend('webserver/middleware/message').canReplyTo;
      var req = {
        body: {
          inReplyTo: {
            _id: 1
          }
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };
      middleware(req, res);
    });

    it('should send back 403 if messagePermission.canReply returns error', function(done) {
      mockery.registerMock('../../core/message/permission', {
        canReply: function(message, user, callback) {
          return callback(new Error());
        }
      });
      mockery.registerMock('../../core/message', {
        get: function(id, callback) {
          return callback(null, {_id: id});
        }
      });
      var middleware = this.helpers.requireBackend('webserver/middleware/message').canReplyTo;
      var req = {
        body: {
          inReplyTo: {
            _id: 1
          }
        },
        user: {
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(403);
          done();
        }
      };
      middleware(req, res);
    });

    it('should send back 403 if messagePermission.canReply returns false', function(done) {
      mockery.registerMock('../../core/message/permission', {
        canReply: function(message, user, callback) {
          return callback(null, false);
        }
      });
      mockery.registerMock('../../core/message', {
        get: function(id, callback) {
          return callback(null, {_id: id});
        }
      });
      var middleware = this.helpers.requireBackend('webserver/middleware/message').canReplyTo;
      var req = {
        body: {
          inReplyTo: {
            _id: 1
          }
        },
        user: {
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(403);
          done();
        }
      };
      middleware(req, res);
    });

    it('should call next if messagePermission.canReply returns true', function(done) {
      mockery.registerMock('../../core/message/permission', {
        canReply: function(message, user, callback) {
          return callback(null, true);
        }
      });
      mockery.registerMock('../../core/message', {
        get: function(id, callback) {
          return callback(null, {_id: id});
        },
        typeSpecificReplyPermission: function(message, user, replyData, callback) {
          return callback(null, true);
        }
      });
      var middleware = this.helpers.requireBackend('webserver/middleware/message').canReplyTo;
      var req = {
        body: {
          inReplyTo: {
            _id: 1
          }
        },
        user: {
        }
      };
      var res = {
        json: function() {
          done(new Error());
        }
      };
      middleware(req, res, done);
    });


    it('should send back 403 if type specific reply permissions return false', function(done) {
      mockery.registerMock('../../core/message/permission', {
        canReply: function(message, user, callback) {
          return callback(null, true);
        }
      });
      mockery.registerMock('../../core/message', {
        get: function(id, callback) {
          return callback(null, {_id: id});
        },
        typeSpecificReplyPermission: function(message, user, replyData, callback) {
          return callback(null, false);
        }
      });
      var middleware = this.helpers.requireBackend('webserver/middleware/message').canReplyTo;
      var req = {
        body: {
          inReplyTo: {
            _id: 1
          }
        },
        user: {
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(403);
          done();
        }
      };
      middleware(req, res, done);
    });

    it('should send back 500 if type specific reply permissions are not ok', function(done) {
      mockery.registerMock('../../core/message/permission', {
        canReply: function(message, user, callback) {
          return callback(null, true);
        }
      });
      mockery.registerMock('../../core/message', {
        get: function(id, callback) {
          return callback(null, {_id: id});
        },
        typeSpecificReplyPermission: function(message, user, replyData, callback) {
          return callback(new Error());
        }
      });
      var middleware = this.helpers.requireBackend('webserver/middleware/message').canReplyTo;
      var req = {
        body: {
          inReplyTo: {
            _id: 1
          }
        },
        user: {
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(500);
          done();
        }
      };
      middleware(req, res, done);
    });
  });

  describe('The canShareTo function', function() {

    beforeEach(function() {
      mockery.registerMock('../community', {});
      mockery.registerMock('../../core/collaboration', {});
      mockery.registerMock('../../core/message/permission', {});
      mockery.registerMock('../../core/message', {});
      mockery.registerMock('../../core/community', {});
    });

    it('should send back 400 when target is undefined', function(done) {
      var middleware = this.helpers.requireBackend('webserver/middleware/message').canShareTo;
      var req = {
        body: {}
      };
      var res = {
        json: function(code, body) {
          expect(code).to.equal(400);
          expect(body.error.details).to.match(/Target is required/);
          done();
        }
      };
      middleware(req, res, this.helpers.callbacks.notCalled(done));
    });

    it('should send back 400 when target is empty', function(done) {
      var middleware = this.helpers.requireBackend('webserver/middleware/message').canShareTo;
      var req = {
        body: {
          target: []
        }
      };
      var res = {
        json: function(code, body) {
          expect(code).to.equal(400);
          expect(body.error.details).to.match(/Target is required/);
          done();
        }
      };
      middleware(req, res, this.helpers.callbacks.notCalled(done));
    });

    it('should send back 400 when target is empty after checking rights', function(done) {
      mockery.registerMock('../../core/collaboration/permission', {
        canWrite: function(collaboration, tuple, callback) {
          return callback(null, false);
        }
      });
      mockery.registerMock('../../core/collaboration', {
        findCollaborationFromActivityStreamID: function(id, callback) {
          callback(null, [{_id: 1}]);
        }
      });

      var middleware = this.helpers.requireBackend('webserver/middleware/message').canShareTo;
      var req = {
        user: {_id: '1'},
        body: {
          target: [
            {objectType: 'activitystream', id: '123'},
            {objectType: 'activitystream', id: '456'}
          ]
        }
      };
      var res = {
        json: function(code, body) {
          expect(code).to.equal(400);
          expect(body.error.details).to.match(/Can not find any writable target in request/);
          done();
        }
      };
      middleware(req, res, this.helpers.callbacks.notCalled(done));
    });

    it('should call next with the updated target', function(done) {
      var self = this;
      var target = [
        {objectType: 'activitystream', id: 1},
        {objectType: 'activitystream', id: 2}
      ];

      mockery.registerMock('../../core/collaboration/permission', {
        canWrite: function(collaboration, tuple, callback) {
          return callback(null, collaboration === target[0].id);
        }
      });
      mockery.registerMock('../../core/collaboration', {
        findCollaborationFromActivityStreamID: function(id, callback) {
          callback(null, [id]);
        }
      });

      var middleware = this.helpers.requireBackend('webserver/middleware/message').canShareTo;
      var req = {
        user: {_id: '1'},
        body: {
          target: target
        }
      };
      var res = {
        json: function() {
          self.helpers.callbacks.notCalled(done);
        }
      };
      middleware(req, res, function() {
        expect(req.body.target).to.have.length(1);
        expect(req.body.target[0]).to.deep.equal(target[0]);
        done();
      });
    });
  });

  describe('The canShareFrom function', function() {

    beforeEach(function() {
      mockery.registerMock('../community', {});
      mockery.registerMock('../../core/collaboration', {});
      mockery.registerMock('../../core/message/permission', {});
      mockery.registerMock('../../core/message', {});
      mockery.registerMock('../../core/community', {});
    });

    it('should send back 400 when resource is undefined', function(done) {
      var middleware = this.helpers.requireBackend('webserver/middleware/message').canShareFrom;
      var req = {
        body: {}
      };
      var res = {
        json: function(code, body) {
          expect(code).to.equal(400);
          expect(body.error.details).to.match(/Invalid tuple/);
          done();
        }
      };
      middleware(req, res, this.helpers.callbacks.notCalled(done));
    });

    it('should send back 400 when tuple is invalid', function(done) {
      var middleware = this.helpers.requireBackend('webserver/middleware/message').canShareFrom;
      var req = {
        body: {
          resource: {
            objectType: 'yolo', id: '123'
          }
        }
      };
      var res = {
        json: function(code, body) {
          expect(code).to.equal(400);
          expect(body.error.details).to.match(/Invalid tuple/);
          done();
        }
      };
      middleware(req, res, this.helpers.callbacks.notCalled(done));
    });

    it('should send back 500 when error while getting collaboration from stream', function(done) {
      mockery.registerMock('../../core/collaboration', {
        findCollaborationFromActivityStreamID: function(id, callback) {
          callback(new Error());
        }
      });
      var middleware = this.helpers.requireBackend('webserver/middleware/message').canShareFrom;
      var req = {
        body: {
          resource: {
            objectType: 'activitystream', id: '123'
          }
        }
      };
      var res = {
        json: function(code, body) {
          expect(code).to.equal(500);
          expect(body.error.details).to.match(/Server Error while searching collaboration/);
          done();
        }
      };
      middleware(req, res, this.helpers.callbacks.notCalled(done));
    });

    it('should send back 404 when collaboration is not found', function(done) {
      mockery.registerMock('../../core/collaboration', {
        findCollaborationFromActivityStreamID: function(id, callback) {
          callback();
        }
      });
      var middleware = this.helpers.requireBackend('webserver/middleware/message').canShareFrom;
      var req = {
        user: {_id: 1},
        body: {
          resource: {
            objectType: 'activitystream', id: '123'
          }
        }
      };
      var res = {
        json: function(code, body) {
          expect(code).to.equal(404);
          expect(body.error.details).to.match(/Collaboration not found/);
          done();
        }
      };
      middleware(req, res, this.helpers.callbacks.notCalled(done));
    });

    it('should send back 500 when rights check fails', function(done) {
      mockery.registerMock('../../core/collaboration', {
        findCollaborationFromActivityStreamID: function(id, callback) {
          callback(null, [1]);
        }
      });
      mockery.registerMock('../../core/collaboration/permission', {
        canRead: function(collaboration, tuple, callback) {
          return callback(new Error());
        }
      });

      var middleware = this.helpers.requireBackend('webserver/middleware/message').canShareFrom;
      var req = {
        user: {_id: 1},
        body: {
          resource: {
            objectType: 'activitystream', id: '123'
          }
        }
      };
      var res = {
        json: function(code, body) {
          expect(code).to.equal(500);
          expect(body.error.details).to.match(/Server Error while checking read rights/);
          done();
        }
      };
      middleware(req, res, this.helpers.callbacks.notCalled(done));
    });

    it('should send back 403 when collaboration can not be read', function(done) {
      mockery.registerMock('../../core/collaboration', {
        findCollaborationFromActivityStreamID: function(id, callback) {
          callback(null, [1]);
        }
      });
      mockery.registerMock('../../core/collaboration/permission', {
        canRead: function(collaboration, tuple, callback) {
          return callback(null, false);
        }
      });

      var middleware = this.helpers.requireBackend('webserver/middleware/message').canShareFrom;
      var req = {
        user: {_id: 1},
        body: {
          resource: {
            objectType: 'activitystream', id: '123'
          }
        }
      };
      var res = {
        json: function(code, body) {
          expect(code).to.equal(403);
          expect(body.error.details).to.match(/Not enough rights to read messages from collaboration/);
          done();
        }
      };
      middleware(req, res, this.helpers.callbacks.notCalled(done));
    });

    it('should call next when all is ok', function(done) {
      mockery.registerMock('../../core/collaboration', {
        findCollaborationFromActivityStreamID: function(id, callback) {
          callback(null, [1]);
        }
      });
      mockery.registerMock('../../core/collaboration/permission', {
        canRead: function(collaboration, tuple, callback) {
          return callback(null, true);
        }
      });

      var middleware = this.helpers.requireBackend('webserver/middleware/message').canShareFrom;
      var req = {
        user: {_id: 1},
        body: {
          resource: {
            objectType: 'activitystream', id: '123'
          }
        }
      };
      var res = {
        json: function() {
          done(new Error());
        }
      };
      middleware(req, res, done);
    });
  });


  });
