'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The esnCollaborationMembersWidget directive', function() {
  beforeEach(angular.mock.module('esn.collaboration'));

  beforeEach(function() {
    var self = this;

    this.esnCollaborationClientService = {
      get: function() {}
    };

    angular.mock.module(function($provide) {
      $provide.value('esnCollaborationClientService', self.esnCollaborationClientService);
      $provide.value('notificationFactory', {
        weakSuccess: sinon.spy(),
        weakError: sinon.spy()
      });
    });

    module('jadeTemplates');
    module('esn.core');
    module('esn.notification');
    module('esn.websocket');
  });

  beforeEach(angular.mock.inject(function($rootScope, $compile) {
    this.$rootScope = $rootScope;
    this.$compile = $compile;
    this.scope = $rootScope.$new();
    this.scope.collaboration = {
      _id: 'community1',
      creator: 'user1'
    };
    this.html = '<esn-collaboration-members-widget object-type="community" collaboration="collaboration"/>';
  }));

  it('should call esnCollaborationClientService#getMembers', function(done) {
    this.esnCollaborationClientService.getMembers = function() {
      return done();
    };
    this.$compile(this.html)(this.scope);
    this.scope.$digest();
  });

  it('should set more to the difference between header and array size', function(done) {
    this.esnCollaborationClientService.getMembers = function() {
      return $q.when({
        headers: function() {
          return 3;
        },
        data: [{ user: { firstname: 'john', preferredEmail: 'cha@open-paas.org' } }]
      });
    };

    var element = this.$compile(this.html)(this.scope);

    this.scope.$digest();

    var iscope = element.isolateScope();

    expect(iscope.more).to.exist;
    expect(iscope.more).to.equal(2);
    done();
  });

  it('should apply the object-type-filter', function(done) {
    this.html = '<esn-collaboration-members-widget object-type="community" collaboration="collaboration" object-type-filter="user"/>';
    this.esnCollaborationClientService.getMembers = function(objectType, cid, query) {
      expect(query.objectTypeFilter).to.equal('user');
      done();
    };

    this.$compile(this.html)(this.scope);
    this.scope.$digest();
  });
  it('should omit object-type-filter if not specified', function(done) {
    this.esnCollaborationClientService.getMembers = function(objectType, cid, query) {
      expect(query.objectTypeFilter).to.not.exist;
      done();
    };

    this.$compile(this.html)(this.scope);
    this.scope.$digest();
  });

  it('should set error when call the API fails', function(done) {
    this.esnCollaborationClientService.getMembers = function() {
      return $q.reject();
    };

    var element = this.$compile(this.html)(this.scope);

    this.scope.$digest();

    var iscope = element.isolateScope();

    expect(iscope.error).to.exist;
    expect(iscope.error).to.be.true;
    done();
  });

  it('should call the API when collaboration:join event is received', function() {
    var call = 0;

    this.esnCollaborationClientService.getMembers = function() {
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

    this.esnCollaborationClientService.getMembers = function() {
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

  describe('on scope destroy', function() {

    it('should remove collaboration:join event listener', function() {
      var call = 0;

      this.esnCollaborationClientService.getMembers = function() {
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

      this.esnCollaborationClientService.getMembers = function() {
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
