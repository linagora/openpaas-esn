'use strict';

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
chai.use(sinonChai);
var expect = chai.expect;

describe('The tuple core module', function() {
  beforeEach(function() {
    this.modPath = this.testEnv.basePath + '/backend/core/tuple';
  });
  it('should have a user method', function() {
    var mod = require(this.modPath);
    expect(mod.user).to.be.a('function');
  });
  it('should have a community method', function() {
    var mod = require(this.modPath);
    expect(mod.community).to.be.a('function');
  });
  it('should have a string method', function() {
    var mod = require(this.modPath);
    expect(mod.string).to.be.a('function');
  });
  it('should have a icon method', function() {
    var mod = require(this.modPath);
    expect(mod.icon).to.be.a('function');
  });
  it('should have a url method', function() {
    var mod = require(this.modPath);
    expect(mod.url).to.be.a('function');
  });
  it('should have a email method', function() {
    var mod = require(this.modPath);
    expect(mod.email).to.be.a('function');
  });

  describe('user method', function() {
    beforeEach(function() {
      this.mod = require(this.modPath);
    });
    it('should send back a user tuple', function() {
      var user = this.mod.user('54524754276624530a930692');
      expect(user.objectType).to.equal('user');
      expect(user.id + '').to.equal('54524754276624530a930692');
      expect(user.id).to.be.an('Object');
      expect(user.id).to.not.be.a('string');
    });
    it('should be able to take an ObjectID in argument and send back the same', function() {
      var ObjectID = require('bson').ObjectId;
      var o = new ObjectID('54524754276624530a930692');
      var user = this.mod.user(o);
      expect(user.objectType).to.equal('user');
      expect(user.id + '').to.equal('54524754276624530a930692');
      expect(user.id).to.be.an('Object');
      expect(user.id).to.not.be.a('string');
    });
    it('should be able to take an ObjectID in argument and send back the same', function() {
      var ObjectID = require('bson').ObjectId;
      var o = new ObjectID('54524754276624530a930692');
      var user = this.mod.user(o);
      expect(user.objectType).to.equal('user');
      expect(user.id + '').to.equal('54524754276624530a930692');
      expect(user.id).to.be.an('Object');
      expect(user.id).to.not.be.a('string');
    });
    it('should throw on a badly formatted ObjectID', function() {
      var spy = sinon.spy(this.mod, 'user');
      try {
        this.mod.user('bad');
      } catch (e) {}
      expect(spy).to.have.thrown();
    });
    it('should throw on an empty ObjectID', function() {
      var spy = sinon.spy(this.mod, 'user');
      try {
        this.mod.user('');
      } catch (e) {}
      expect(spy).to.have.thrown();
    });
  });

});
