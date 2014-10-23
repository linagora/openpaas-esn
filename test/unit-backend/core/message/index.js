'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The message core module', function() {
  beforeEach(function() {
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/emailmessage');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/whatsup');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/community');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/domain');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/usernotification');
  });
  it('should expose get() method', function() {
    var messageModule = require(this.testEnv.basePath + '/backend/core/message');
    expect(messageModule).to.have.property('get');
    expect(messageModule.get).to.be.a('function');
  });
  it('should expose getModel() method', function() {
    var messageModule = require(this.testEnv.basePath + '/backend/core/message');
    expect(messageModule).to.have.property('getModel');
    expect(messageModule.getModel).to.be.a('function');
  });
  it('should expose getInstance() method', function() {
    var messageModule = require(this.testEnv.basePath + '/backend/core/message');
    expect(messageModule).to.have.property('getInstance');
    expect(messageModule.getInstance).to.be.a('function');
  });
  it('should expose addNewComment() method', function() {
    var messageModule = require(this.testEnv.basePath + '/backend/core/message');
    expect(messageModule).to.have.property('addNewComment');
    expect(messageModule.addNewComment).to.be.a('function');
  });
  it('should expose type.whatsup & type.email sub-modules', function() {
    var messageModule = require(this.testEnv.basePath + '/backend/core/message');
    expect(messageModule).to.have.property('type');
    expect(messageModule.type).to.be.a('object');
    expect(messageModule.type).to.have.property('whatsup');
    expect(messageModule.type).to.have.property('email');
  });
  it('should expose permission sub-module', function() {
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
          expect(resp).to.deep.equal({ objectType: 'whatsup' });
          expect(throughInit).to.be.true;
          done();
        });
        this.mongoose.model = function(name) {
          if (name === 'Whatsup') {
            return function ModelMock() {
              this.init = function(args) {
                throughInit = true;
                this.args = args;
              };
              this.toObject = function() {
                return this.args;
              };
            };
          } else if (name === 'User') {
            return {
              find: function(query) {
                return { exec: function(cb) { cb(null, []); } };
              }
            };
          }
        };
        this.findOneCb(null, {objectType: 'whatsup'});
      });

      it('should expand all authors', function(done) {
        var throughInit = false;
        var messageModule = require(this.testEnv.basePath + '/backend/core/message');
        this.mongoose.Types.ObjectId = function(name) { return name; };
        messageModule.get('message1', function(err, resp) {
          expect(err).to.be.not.ok;
          expect(resp).to.deep.equal({
            objectType: 'whatsup',
            author: { _id: 'user1' },
            responses: [
              { objectType: 'whatsup', author: { _id: 'user2' } },
              { objectType: 'whatsup', author: { _id: 'user1' } }
            ]
          });
          expect(throughInit).to.be.true;
          done();
        });
        this.mongoose.model = function(name) {
          if (name === 'Whatsup') {
            return function ModelMock() {
              this.init = function(args) {
                throughInit = true;
                this.args = args;
              };
              this.toObject = function() {
                return this.args;
              };
            };
          } else if (name === 'User') {
            return {
              find: function(query) {
                return { exec: function(cb) {
                  expect(query._id.$in).to.exist;
                  expect(query._id.$in.indexOf('user1')).to.equal(0);
                  expect(query._id.$in.indexOf('user2')).to.equal(1);
                  var users = [{ _id: 'user1' }, { _id: 'user2' }];
                  cb(null, users);
                } };
              }
            };
          }
        };
        this.findOneCb(null, {
            objectType: 'whatsup',
            author: 'user1',
            responses: [
              { objectType: 'whatsup', author: 'user2' },
              { objectType: 'whatsup', author: 'user1' }
            ]
        });
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

  describe('findByIds() method', function() {
    beforeEach(function() {
      this.mongoose = require(this.testEnv.fixtures + '/mongoose').mongoose();
      this.mongoose.Types.ObjectId = function(name) { return name; };
      mockery.registerMock('mongoose', this.mongoose);
    });

    it('should throw an error if the db search fails', function() {
      var messageModule = require(this.testEnv.basePath + '/backend/core/message');
      this.mongoose.model = function() {
        return {
          collection: {
            find: function() {
              return {
                toArray: function(callback) {
                  callback(new Error('error'));
                }
              };
            }
          }
        };
      };
      messageModule.findByIds([1, 2], function(err, result) {
        expect(err).to.exist;
        expect(result).to.not.exist;
      });
    });

    it('should search for messages authors', function(done) {
      var messageModule = require(this.testEnv.basePath + '/backend/core/message');
      this.mongoose.model = function(modelName) {
        if (modelName === 'User') {
          return {
            find: function(query) {
              expect(query._id.$in).to.exist;
              expect(query._id.$in.indexOf('3')).to.equal(0);
              expect(query._id.$in.indexOf('4')).to.equal(1);
              return {
                exec: function() {
                  done();
                }
              };
            }
          };
        }
        return {
          collection: {
            find: function() {
              return {
                toArray: function(callback) {
                  callback(null, [{_id: '1', author: '3'}, {_id: '2', author: '4'}]);
                }
              };
            }
          }
        };
      };
      messageModule.findByIds(['1', '2'], null);
    });

    it('should fail if message author search fails', function() {
      var messageModule = require(this.testEnv.basePath + '/backend/core/message');
      this.mongoose.model = function(modelName) {
        if (modelName === 'User') {
          return {
            find: function(query) {
              expect(query._id.$in).to.exist;
              expect(query._id.$in.indexOf('3')).to.equal(0);
              expect(query._id.$in.indexOf('4')).to.equal(1);
              return {
                exec: function(callback) {
                  callback(new Error('db search error'));
                }
              };
            }
          };
        }
        return {
          collection: {
            find: function() {
              return {
                toArray: function(callback) {
                  callback(null, [{_id: '1', author: '3'}, {_id: '2', author: '4'}]);
                }
              };
            }
          }
        };
      };
      messageModule.findByIds(['1', '2'], function(err, result) {
        expect(err).to.exist;
        expect(result).to.not.exist;
      });
    });


    it('should return messages populated with their authors', function() {
      var messageModule = require(this.testEnv.basePath + '/backend/core/message');
      var user3 = {
        _id: '3',
        name: 'user3'
      };
      var user4 = {
        _id: '4',
        name: 'user4'
      };
      this.mongoose.model = function(modelName) {
        if (modelName === 'User') {
          return {
            find: function(query) {
              expect(query._id.$in).to.exist;
              expect(query._id.$in.indexOf('3')).to.equal(0);
              expect(query._id.$in.indexOf('4')).to.equal(1);
              return {
                exec: function(callback) {
                  callback(null, [user3, user4]);
                }
              };
            }
          };
        }
        else {
          var messageModel = function() {
            return {
              init: function(message) {
                messageModel.value = message;
              },
              toObject: function() {
                return messageModel.value;
              }
            };
          };
          messageModel.collection = {
            find: function() {
              return {
                toArray: function(callback) {
                  callback(null, [{_id: '1', author: '3', objectType: 'whatsup', responses: [{_id: '5', author: '4'}]},
                    {_id: '2', author: '4', objectType: 'email'}]);
                }
              };
            }
          };
          return messageModel;
        }
      };
      messageModule.findByIds(['1', '2'], function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.exist;
        expect(result.length).to.equal(2);
        expect(result[0]._id).to.equal('1');
        expect(result[0].author).to.deep.equal(user3);
        expect(result[0].responses).to.exist;
        expect(result[0].responses.length).to.equal(1);
        expect(result[0].responses[0].author).to.exist;
        expect(result[0].responses[0].author).to.deep.equal(user4);
        expect(result[1]._id).to.equal('2');
        expect(result[1].author).to.deep.equal(user4);
      });
    });

  });

});
