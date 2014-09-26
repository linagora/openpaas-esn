'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The message core module', function() {
  it('should expose get() method', function() {
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/emailmessage');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/whatsup');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/community');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/domain');
    var messageModule = require(this.testEnv.basePath + '/backend/core/message');
    expect(messageModule).to.have.property('get');
    expect(messageModule.get).to.be.a('function');
  });
  it('should expose getModel() method', function() {
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/emailmessage');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/whatsup');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/community');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/domain');
    var messageModule = require(this.testEnv.basePath + '/backend/core/message');
    expect(messageModule).to.have.property('getModel');
    expect(messageModule.getModel).to.be.a('function');
  });
  it('should expose getInstance() method', function() {
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/emailmessage');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/whatsup');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/community');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/domain');
    var messageModule = require(this.testEnv.basePath + '/backend/core/message');
    expect(messageModule).to.have.property('getInstance');
    expect(messageModule.getInstance).to.be.a('function');
  });
  it('should expose addNewComment() method', function() {
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/emailmessage');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/whatsup');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/community');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/domain');
    var messageModule = require(this.testEnv.basePath + '/backend/core/message');
    expect(messageModule).to.have.property('addNewComment');
    expect(messageModule.addNewComment).to.be.a('function');
  });
  it('should expose type.whatsup & type.email sub-modules', function() {
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/emailmessage');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/whatsup');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/community');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/domain');
    var messageModule = require(this.testEnv.basePath + '/backend/core/message');
    expect(messageModule).to.have.property('type');
    expect(messageModule.type).to.be.a('object');
    expect(messageModule.type).to.have.property('whatsup');
    expect(messageModule.type).to.have.property('email');
  });
  it('should expose permission sub-module', function() {
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/emailmessage');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/whatsup');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/community');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/domain');
    var messageModule = require(this.testEnv.basePath + '/backend/core/message');
    expect(messageModule).to.have.property('permission');
    expect(messageModule.permission).to.be.a('object');
  });

  describe('get method', function() {
    beforeEach(function() {
      this.mongoose = require(this.testEnv.fixtures + '/mongoose').mongoose();
      mockery.registerMock('mongoose', this.mongoose);
    });

    it('should call the collection.findOne() method of the Whatsup model', function() {
      this.mongoose.model = function(name) {
        return {
          collection: {
            findOne: function() {
              expect(name).to.equal('Whatsup');
            }
          }
        };
      };
      var messageModule = require(this.testEnv.basePath + '/backend/core/message');
      messageModule.get('message1', function(err, resp) {});
    });

    it('should call the collection.findOne() with a query on id passed in argument', function() {
      this.mongoose.model = function(name) {
        return {
          collection: {
            findOne: function(query) {
              expect(query).to.deep.equal({ _id: { name: 'message1ObjectId' } });
            }
          }
        };
      };
      this.mongoose.Types.ObjectId = function(name) { return {name: name + 'ObjectId'}; };
      var messageModule = require(this.testEnv.basePath + '/backend/core/message');
      messageModule.get('message1', function(err, resp) {});
    });

    describe('findOne() callback', function() {
      beforeEach(function() {
        var self = this;
        this.mongoose.model = function(name) {
          function ModelMock() {
            this.init = function() {};
          }
          ModelMock.collection = {
            findOne: function(query, callback) {
              self.findOneCb = callback;
            }
          };
          return ModelMock;
        };
        this.mongoose.Types.ObjectId = function(name) { return {name: name + 'ObjectId'}; };
      });

      it('should forward an error', function(done) {
        var messageModule = require(this.testEnv.basePath + '/backend/core/message');
        messageModule.get('message1', function(err, resp) {
          expect(err).to.be.ok;
          done();
        });
        this.findOneCb(new Error('I am an error'));
      });

      it('should return an error on document not found', function(done) {
        var messageModule = require(this.testEnv.basePath + '/backend/core/message');
        messageModule.get('message1', function(err, resp) {
          expect(err).to.be.ok;
          done();
        });
        this.findOneCb();
      });
      it('should return an error on unknown objectType', function(done) {
        var messageModule = require(this.testEnv.basePath + '/backend/core/message');
        messageModule.get('message1', function(err, resp) {
          expect(err).to.be.ok;
          done();
        });
        this.findOneCb(null, {objectType: 'idontexist'});
      });

      it('should return the message instance using the init() method', function(done) {
        var throughInit = false;
        var messageModule = require(this.testEnv.basePath + '/backend/core/message');
        messageModule.get('message1', function(err, resp) {
          expect(err).to.be.not.ok;
          expect(resp.args).to.deep.equal({ objectType: 'whatsup' });
          expect(throughInit).to.be.true;
          done();
        });
        this.mongoose.model = function(name) {
          function ModelMock() {
            this.init = function(args) {
              throughInit = true;
              this.args = args;
            };
          }
          return ModelMock;
        };
        this.findOneCb(null, {objectType: 'whatsup'});
      });
    });

  });

  describe('getModel() method', function() {
    beforeEach(function() {
      this.mongoose = require(this.testEnv.fixtures + '/mongoose').mongoose();
      mockery.registerMock('mongoose', this.mongoose);
    });
    it('should throw if the model name is unknown', function(done) {
      var messageModule = require(this.testEnv.basePath + '/backend/core/message');
      try {
        messageModule.getModel('idontexist');
      }catch (e) {
        return done();
      }
      done(new Error('No game of thrown ?'));
    });
    it('should call mongoose.model() method with mongoose model name', function(done) {
      var messageModule = require(this.testEnv.basePath + '/backend/core/message');
      this.mongoose.model = function(name) {
        expect(name).to.equal('Whatsup');
        done();
      };
      messageModule.getModel('whatsup');
    });
  });

  describe('getInstance() method', function() {
    beforeEach(function() {
      this.mongoose = require(this.testEnv.fixtures + '/mongoose').mongoose();
      mockery.registerMock('mongoose', this.mongoose);
    });
    it('should throw if the model name is unknown', function(done) {
      var messageModule = require(this.testEnv.basePath + '/backend/core/message');
      try {
        messageModule.getinstance('idontexist');
      }catch (e) {
        return done();
      }
      done(new Error('No game of thrown ?'));
    });
    it('should return the new mongoose.model(modelname) call', function() {
      var messageModule = require(this.testEnv.basePath + '/backend/core/message');
      this.mongoose.model = function(name) {
        expect(name).to.equal('Whatsup');
        return function() {
          return {ok: true};
        };
      };
      var obj = messageModule.getInstance('whatsup');
      expect(obj).to.deep.equal({ok: true});
    });
  });

  describe('addNewComment() method', function() {
    beforeEach(function() {
      this.mongoose = require(this.testEnv.fixtures + '/mongoose').mongoose();
      mockery.registerMock('mongoose', this.mongoose);
    });
    it('should immediately return if get returns an error', function(done) {
      var messageModule = require(this.testEnv.basePath + '/backend/core/message');
      this.mongoose.model = function() {
        function ModelMock() {
          this.init = function() {
          };
          this.responses = [];
          this.save = function() {};
        }
        ModelMock.collection = {
          findOne: function(id, callback) {
            return callback(new Error('failed'), null);
          }
        };
        return ModelMock;
      };
      messageModule.addNewComment({}, {}, function(err, resp) {
        expect(err).to.be.ok;
        expect(err.message).to.equal('failed');
        done();
      });
    });
    it('should push the comment in parent.responses & call parent.save', function(done) {
      var messageModule = require(this.testEnv.basePath + '/backend/core/message');
      var responses = [];
      this.mongoose.model = function() {
        function ModelMock() {
          this.init = function() {
          };
          this.responses = responses;
          this.save = function() {
            expect(responses).to.have.length(1);
            done();
          };
        }
        ModelMock.collection = {
          findOne: function(id, callback) {
            return callback(null, {objectType: 'whatsup'});
          }
        };
        return ModelMock;
      };
      messageModule.addNewComment({}, {}, function(err, resp) { });
    });

    describe('parent.save() callback', function() {
      beforeEach(function(done) {
        var self = this;
        self.published = {};
        var core = require(this.testEnv.basePath + '/backend/core');
        core.pubsub.local = {
          topic: function(name) {
            return {
              publish: function(data) {
                self.published[name] = data;
              },
              subscribe: function() {}
            };
          }
        };
        var messageModule = require(this.testEnv.basePath + '/backend/core/message');

        var responses = [];
        this.mongoose.model = function() {
          function ModelMock() {
            this.init = function() {
            };
            this.responses = responses;
            this.save = function(callback) {
              self.saveCallback = callback;
              done();
            };
          }
          ModelMock.collection = {
            findOne: function(id, callback) {
              return callback(null, {objectType: 'whatsup'});
            }
          };
          return ModelMock;
        };
        messageModule.addNewComment({_id: 'comment1'}, {objectType: 'test', _id: 'parent1'}, function() { self.ancCallback.apply(this, arguments); });
      });

      it('should publish "message:comment" with the message as data', function(done) {
        var self = this;
        this.ancCallback = function(err, message, parent) {
          expect(err).to.be.not.ok;
          expect(self.published['message:comment']).to.be.ok;
          expect(self.published['message:comment']).to.deep.equal(
            {_id: 'comment1', inReplyTo: {objectType: 'test', _id: 'parent1'}}
          );
          done();
        };
        this.saveCallback(null, {_id: 'parent' });
      });

      it('should return the message and its parent', function(done) {
        this.ancCallback = function(err, message, parent) {
          expect(err).to.be.not.ok;
          expect(message).to.deep.equal({_id: 'comment1', inReplyTo: {objectType: 'test', _id: 'parent1'}});
          expect(parent).to.deep.equal({_id: 'parent', test: true });
          done();
        };
        this.saveCallback(null, {_id: 'parent', test: true });
      });

    });

  });


});
