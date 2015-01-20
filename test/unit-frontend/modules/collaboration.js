'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Collaboration Angular module', function() {
  beforeEach(angular.mock.module('esn.collaboration'));

  describe('The collaborationsEventListener directive', function() {

    var called = 0;

    beforeEach(function() {
      var self = this;

      this.livenotification = function(path) {
        if (path === '/collaboration') {
          called++;
        }
        return {
          on: function() {
          }
        };
      };

      angular.mock.module(function($provide) {
        $provide.value('livenotification', self.livenotification);
      });

    });

    beforeEach(inject(['$rootScope', '$compile', function($rootScope, $compile) {
      this.$rootScope = $rootScope;
      this.scope = $rootScope.$new();
      this.$compile = $compile;
    }]));

    afterEach(function() {
      called = 0;
    });

    it('should register listeners on /collaboration', function(done) {
      this.html = '<div collaborations-event-listener></div>';
      this.$compile(this.html)(this.scope);
      this.scope.$digest();
      expect(called).to.equal(2);
      done();
    });
  });

  describe('The collaborationMembersWidget directive', function() {

    beforeEach(function() {
      var self = this;
      this.collaborationAPI = {
        get: function() {}
      };
      angular.mock.module(function($provide) {
        $provide.value('collaborationAPI', self.collaborationAPI);
      });
      module('jadeTemplates');
      module('esn.core');
    });

    beforeEach(angular.mock.inject(function($rootScope, $compile, $q) {
      this.$rootScope = $rootScope;
      this.$compile = $compile;
      this.$q = $q;
      this.scope = $rootScope.$new();
      this.scope.collaboration = {
        _id: 'community1',
        creator: 'user1'
      };
      this.html = '<collaboration-members-widget object-type="community" collaboration="collaboration"/>';
    }));

    it('should call collaborationAPI#getMembers', function(done) {
      this.collaborationAPI.getMembers = function() {
        return done();
      };
      this.$compile(this.html)(this.scope);
      this.scope.$digest();
    });

    it('should set more to the difference between header and array size', function(done) {
      var defer = this.$q.defer();
      this.collaborationAPI.getMembers = function() {
        return defer.promise;
      };
      defer.resolve({
        headers: function() {
          return 3;
        },
        data: [{user: {firstname: 'john'}}]
      });

      var element = this.$compile(this.html)(this.scope);
      this.scope.$digest();

      var iscope = element.isolateScope();
      expect(iscope.more).to.exist;
      expect(iscope.more).to.equal(2);
      done();
    });

    it('should slice members', function(done) {
      var defer = this.$q.defer();
      this.collaborationAPI.getMembers = function() {
        return defer.promise;
      };
      defer.resolve({
        headers: function() {
          return 3;
        },
        data: [
          {user: {firstname: 'joe'}},
          {user: {firstname: 'jack'}},
          {user: {firstname: 'william'}},
          {user: {firstname: 'averell'}},
          {user: {firstname: 'calamity jane'}},
          {user: {firstname: 'billy the kid'}}
        ]
      });

      var element = this.$compile(this.html)(this.scope);
      this.scope.$digest();

      var iscope = element.isolateScope();
      expect(iscope.members).to.exist;
      expect(iscope.members).to.have.length(2);
      expect(iscope.members[0]).to.have.length(3);
      expect(iscope.members[1]).to.have.length(3);
      done();
    });

    it('should set error when call the API fails', function(done) {
      var defer = this.$q.defer();
      this.collaborationAPI.getMembers = function() {
        return defer.promise;
      };
      defer.reject();

      var element = this.$compile(this.html)(this.scope);
      this.scope.$digest();

      var iscope = element.isolateScope();
      expect(iscope.error).to.exist;
      expect(iscope.error).to.be.true;
      done();
    });

    it('should call the API when collaboration:join event is received', function() {
      var call = 0;
      this.collaborationAPI.getMembers = function() {
        call++;
        return {
          then: function() {}
        };
      };

      this.$compile(this.html)(this.scope);
      this.scope.$digest();
      expect(call).to.equal(1);
      this.$rootScope.$emit('collaboration:join', {data: 'fake'});
      expect(call).to.equal(2);
    });

    it('should call the API when collaboration:leave event is received', function() {
      var call = 0;
      this.collaborationAPI.getMembers = function() {
        call++;
        return {
          then: function() {}
        };
      };

      this.$compile(this.html)(this.scope);
      this.scope.$digest();
      expect(call).to.equal(1);
      this.$rootScope.$emit('collaboration:leave', {data: 'fake'});
      expect(call).to.equal(2);
    });

    describe('members slicing', function() {

      describe('when in-slices-of is not set', function() {
        it('should set scope.inSlicesOf to 3', function(done) {
          var defer = this.$q.defer();
          this.collaborationAPI.getMembers = function() {
            return defer.promise;
          };
          defer.resolve({
            headers: function() {
              return 6;
            },
            data: [
              {user: {firstname: 'joe'}},
              {user: {firstname: 'jack'}},
              {user: {firstname: 'william'}},
              {user: {firstname: 'averell'}},
              {user: {firstname: 'calamity jane'}},
              {user: {firstname: 'billy the kid'}}
            ]
          });
          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();

          var iscope = element.isolateScope();
          expect(iscope.inSlicesOf).to.equal(3);
          done();
        });

        it('should slice members by packs of 3', function(done) {
          var defer = this.$q.defer();
          this.collaborationAPI.getMembers = function() {
            return defer.promise;
          };
          defer.resolve({
            headers: function() {
              return 6;
            },
            data: [
              {user: {firstname: 'joe'}},
              {user: {firstname: 'jack'}},
              {user: {firstname: 'william'}},
              {user: {firstname: 'averell'}},
              {user: {firstname: 'calamity jane'}},
              {user: {firstname: 'billy the kid'}}
            ]
          });
          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();

          var iscope = element.isolateScope();
          expect(iscope.members).to.exist;
          expect(iscope.members).to.have.length(2);
          expect(iscope.members[0]).to.have.length(3);
          expect(iscope.members[1]).to.have.length(3);
          done();
        });
      });

      describe('when in-slices-of is set to 4', function() {
        it('should slice members by packs of 4', function(done) {
          var html = '<collaboration-members-widget collaboration="collaboration" in-slices-of="4" />';
          var defer = this.$q.defer();
          this.collaborationAPI.getMembers = function() {
            return defer.promise;
          };
          defer.resolve({
            headers: function() {
              return 6;
            },
            data: [
              {user: {firstname: 'joe'}},
              {user: {firstname: 'jack'}},
              {user: {firstname: 'william'}},
              {user: {firstname: 'averell'}},
              {user: {firstname: 'calamity jane'}},
              {user: {firstname: 'billy the kid'}}
            ]
          });
          var element = this.$compile(html)(this.scope);
          this.scope.$digest();

          var iscope = element.isolateScope();
          expect(iscope.members).to.exist;
          expect(iscope.members).to.have.length(2);
          expect(iscope.members[0]).to.have.length(4);
          expect(iscope.members[1]).to.have.length(2);
          done();
        });
      });

      describe('when in-slices-of is set to 6', function() {
        it('should slice members by packs of 6', function(done) {
          var html = '<collaboration-members-widget collaboration="collaboration" in-slices-of="6" />';
          var defer = this.$q.defer();
          this.collaborationAPI.getMembers = function() {
            return defer.promise;
          };
          defer.resolve({
            headers: function() {
              return 6;
            },
            data: [
              {user: {firstname: 'joe'}},
              {user: {firstname: 'jack'}},
              {user: {firstname: 'william'}},
              {user: {firstname: 'averell'}},
              {user: {firstname: 'calamity jane'}},
              {user: {firstname: 'billy the kid'}}
            ]
          });
          var element = this.$compile(html)(this.scope);
          this.scope.$digest();

          var iscope = element.isolateScope();
          expect(iscope.members).to.exist;
          expect(iscope.members).to.have.length(1);
          expect(iscope.members[0]).to.have.length(6);
          done();
        });
      });

    });

    describe('on scope destroy', function() {

      it('should remove collaboration:join event listener', function() {
        var call = 0;
        this.collaborationAPI.getMembers = function() {
          call++;
          return {
            then: function() {}
          };
        };

        var element = this.$compile(this.html)(this.scope);
        this.scope.$digest();
        expect(call).to.equal(1);
        this.$rootScope.$emit('collaboration:join', {data: 'fake'});
        expect(call).to.equal(2);
        element.remove();
        this.$rootScope.$digest();
        this.$rootScope.$emit('collaboration:join', {data: 'fake'});
        expect(call).to.equal(2);
      });

      it('should remove collaboration:leave event listener', function() {
        var call = 0;
        this.collaborationAPI.getMembers = function() {
          call++;
          return {
            then: function() {}
          };
        };

        var element = this.$compile(this.html)(this.scope);
        this.scope.$digest();
        expect(call).to.equal(1);
        this.$rootScope.$emit('collaboration:leave', {data: 'fake'});
        expect(call).to.equal(2);
        element.remove();
        this.$rootScope.$digest();
        this.$rootScope.$emit('collaboration:leave', {data: 'fake'});
        expect(call).to.equal(2);
      });
    });

  });

});
