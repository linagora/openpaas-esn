'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The OAuth Angular Services', function() {

  var $window;

  beforeEach(function() {
    $window = {
      location: {}
    };
    module('ngRoute');
    module('esn.core');
    module('linagora.esn.oauth', function($provide) {
      $provide.value('$window', $window);
    });
  });

  describe('The oauthStrategyRegistry service', function() {
    beforeEach(angular.mock.inject(function(oauthStrategyRegistry) {
      this.oauthStrategyRegistry = oauthStrategyRegistry;
    }));

    it('should throw error when name is undefined', function(done) {
      try {
        this.oauthStrategyRegistry.register(null, function() {});
      } catch (err) {
        return done();
      }
      done(new Error());
    });

    it('should throw error when handler is undefined', function(done) {
      try {
        this.oauthStrategyRegistry.register('foo');
      } catch (err) {
        return done();
      }
      done(new Error());
    });

    it('should save the given strategy', function(done) {
      this.oauthStrategyRegistry.register('foo', done);
      this.oauthStrategyRegistry.get('foo')();
    });
  });

  describe('The oauthWorkflow service', function() {

    beforeEach(angular.mock.inject(function(oauthWorkflow) {
      this.oauthWorkflow = oauthWorkflow;
    }));

    describe('The redirect workflow', function() {
      it('should not redirect on empty path', function() {
        this.oauthWorkflow.redirect();
        expect($window.location.href).to.not.exist;
      });
      it('should redirect to the given path', function() {
        var url = '/foo/bar/baz';
        this.oauthWorkflow.redirect(url);
        expect($window.location.href).to.equal(url);
      });
    });
  });
});
