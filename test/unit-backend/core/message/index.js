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
          return {
            collection: {
              findOne: function(query, callback) {
                self.findOneCb = callback;
              }
            }
          };
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

      it('should return the message instance with the isNew property to false', function(done) {
        var messageModule = require(this.testEnv.basePath + '/backend/core/message');
        messageModule.get('message1', function(err, resp) {
          expect(err).to.be.not.ok;
          expect(resp).to.deep.equal({ args: { objectType: 'whatsup' }, isNew: false });
          console.log(resp);
          done();
        });
        this.mongoose.model = function() {
          return function(args) {
            this.args = args;
          };
        };
        this.findOneCb(null, {objectType: 'whatsup'});
      });
    });

  });

});
