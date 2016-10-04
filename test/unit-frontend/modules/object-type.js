'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The ObjectType Angular module', function() {

  var self = this;

  beforeEach(angular.mock.module('esn.object-type'));

  describe('objectTypeResolver service', function() {

    beforeEach(angular.mock.inject(function(objectTypeResolver, $rootScope) {
      self.objectTypeResolver = objectTypeResolver;
      self.$rootScope = $rootScope;
    }));

    describe('register() function', function() {
      it('should send back error if inputs are not defined', function() {
        expect(self.objectTypeResolver.register).to.throw(Error);
      });

      it('should send back error if objectType is not defined', function(done) {
        try {
          self.objectTypeResolver.register(null, function() {});
        } catch (err) {
          return done();
        }
        done(new Error());
      });

      it('should send back error if resolver is not defined', function(done) {
        try {
          self.objectTypeResolver.register('user1', null);
        } catch (err) {
          return done();
        }
        done(new Error());
      });

      it('should send be ok when parameters are valid', function(done) {
        try {
          self.objectTypeResolver.register('user3', function() {});
        } catch (err) {
          return done(new Error());
        }
        return done();
      });
    });
  });

  describe('resolve fn', function() {

    it('should get a promise reject when objectType is not defined', function(done) {
      self.objectTypeResolver.resolve(null, 1).then(function() {
        return done(new Error());
      }, function(err) {
        expect(err).to.exist;
        return done();
      });
      self.$rootScope.$digest();
    });

    it('should get a promise reject when id is not defined', function(done) {
      self.objectTypeResolver.resolve('user4', null).then(function() {
        return done(new Error());
      }, function(err) {
        expect(err).to.exist;
        return done();
      });
      self.$rootScope.$digest();
    });

    it('should get a promise reject when resolver does not exist', function(done) {
      self.objectTypeResolver.resolve('user5', 1).then(function() {
        return done(new Error());
      }, function(err) {
        expect(err).to.exist;
        return done();
      });
      self.$rootScope.$digest();
    });
  });

  describe('register then resolve', function() {
    it('should call the registered resolver', function(done) {
      var call;
      var resolved = {
        _id: 123,
        name: 'foo'
      };

      var resolver = function(id) {
        call = id;
        return $q.when(resolved);
      };

      var objectType = 'user';
      var id = 123;

      self.objectTypeResolver.register(objectType, resolver);
      self.objectTypeResolver.resolve(objectType, id).then(function(result) {

        expect(result).to.exist;
        expect(result).to.deep.equal(resolved);
        expect(call).to.equal(id);
        done();

      }, function(err) {
        return done(err);
      });
      self.$rootScope.$digest();
    });

    it('should support multiple ids', function(done) {
      var resolver = function(id1, id2, id3) {
        return $q.when({id1: id1, id2: id2, id3: id3});
      };

      self.objectTypeResolver.register('user', resolver);
      self.objectTypeResolver.resolve('user', '1', '2', '3').then(function(result) {
        expect(result).to.deep.equal({id1: '1', id2: '2', id3: '3'});
        done();
      }, done);
      self.$rootScope.$digest();
    });
  });
});

