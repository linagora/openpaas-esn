'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The ObjectType Angular module', function() {

  beforeEach(angular.mock.module('esn.object-type'));

  describe('objectTypeResolver service', function() {

    beforeEach(angular.mock.inject(function(objectTypeResolver, $rootScope) {
      this.objectTypeResolver = objectTypeResolver;
      this.$rootScope = $rootScope;
    }));

    describe('register() function', function() {
      it('should send back error if inputs are not defined', function() {
        expect(this.objectTypeResolver.register).to.throw(Error);
      });

      it('should send back error if objectType is not defined', function(done) {
        try {
          this.objectTypeResolver.register(null, function() {});
        } catch (err) {
          return done();
        }
        done(new Error());
      });

      it('should send back error if resolver is not defined', function(done) {
        try {
          this.objectTypeResolver.register('user1', null);
        } catch (err) {
          return done();
        }
        done(new Error());
      });

      it('should send be ok when parameters are valid', function(done) {
        try {
          this.objectTypeResolver.register('user3', function() {});
        } catch (err) {
          return done(new Error());
        }
        return done();
      });
    });
  });

  describe('resolve fn', function() {

    it('should get a promise reject when objectType is not defined', function(done) {
      this.objectTypeResolver.resolve(null, 1).then(function() {
        return done(new Error());
      }, function(err) {
        expect(err).to.exist;
        return done();
      });
      this.$rootScope.$digest();
    });

    it('should get a promise reject when id is not defined', function(done) {
      this.objectTypeResolver.resolve('user4', null).then(function() {
        return done(new Error());
      }, function(err) {
        expect(err).to.exist;
        return done();
      });
      this.$rootScope.$digest();
    });

    it('should get a promise reject when resolver does not exist', function(done) {
      this.objectTypeResolver.resolve('user5', 1).then(function() {
        return done(new Error());
      }, function(err) {
        expect(err).to.exist;
        return done();
      });
      this.$rootScope.$digest();
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

      this.objectTypeResolver.register(objectType, resolver);
      this.objectTypeResolver.resolve(objectType, id).then(function(result) {

        expect(result).to.exist;
        expect(result).to.deep.equal(resolved);
        expect(call).to.equal(id);
        done();

      }, function(err) {
        return done(err);
      });
      this.$rootScope.$digest();
    });
  });
});

