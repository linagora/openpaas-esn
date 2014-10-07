'use strict';

/* global chai: false */

var expect = chai.expect;

describe.only('The esn.user-notification Angular module', function() {
  beforeEach(function() {
    angular.mock.module('esn.user-notification');
  });

  describe('userNotificationPopover directive', function() {
    var portraitWidth = 360;
    var landscapeWidth = 640;
    var portraitInnerHeight = 615;
    var portraitInnerHeightUrlBar = 559;
    var portraitScreenHeight = 640;
    //var landscapeInnerHeight = 335;
    var landscapeInnerHeightUrlBar = 279;
    var landscapeScreenHeight = 360;

    var $window = {
      innerWidth: portraitWidth,
      innerHeight: portraitInnerHeightUrlBar,
      outerWidth: portraitWidth,
      outerHeight: portraitInnerHeightUrlBar,
      screen: {
        availWidth: portraitWidth,
        availHeight: portraitScreenHeight
      }
    };

    beforeEach(function() {
      angular.mock.module(function($provide) {
        $provide.value('$window', $window);
      });
      angular.mock.inject(function($compile, $rootScope, $timeout) {
        this.$compile = $compile;
        this.$rootScope = $rootScope;
        this.$timeout = $timeout;
      });
    });

    it('should take all width in portrait format and landscape when resizing', function() {
      $window.innerWidth = portraitWidth;
      $window.innerHeight = portraitInnerHeightUrlBar;
      $window.outerWidth = portraitWidth;
      $window.outerHeight = portraitInnerHeightUrlBar;
      $window.screen.availWidth = portraitWidth;
      $window.screen.availHeight = portraitScreenHeight;
      var html = '<div ng-controller="userNotificationController"><div id="test" user-notification-popover></div></div>';
      var element = this.$compile(html)(this.$rootScope);
      this.$rootScope.$digest();
      var divElement = element.find('#test');
      expect(divElement.width()).to.equal(portraitWidth - 10);
      this.$timeout.flush();

      // Resize the screen
      $window.innerWidth = landscapeWidth;
      $window.innerHeight = landscapeInnerHeightUrlBar;
      $window.outerWidth = landscapeWidth;
      $window.outerHeight = landscapeInnerHeightUrlBar;
      $window.screen.availWidth = landscapeWidth;
      $window.screen.availHeight = landscapeScreenHeight;
      angular.element($window).resize();
      this.$rootScope.$digest();
      this.$timeout.flush();
      expect(divElement.width()).to.equal(landscapeWidth - 10);
    });

    it('should take all width in portrait format and landscape format ' +
      'even if $window.innerWidth return a value greater than the screen width but ' +
      '$window.outerWidth return the correct value', function() {
      $window.innerWidth = portraitWidth + 400;
      $window.innerHeight = portraitInnerHeightUrlBar;
      $window.outerWidth = portraitWidth;
      $window.outerHeight = portraitInnerHeightUrlBar;
      $window.screen.availWidth = portraitWidth;
      $window.screen.availHeight = portraitScreenHeight;
      var html = '<div ng-controller="userNotificationController"><div id="test" user-notification-popover></div></div>';
      var element = this.$compile(html)(this.$rootScope);
      this.$rootScope.$digest();
      var divElement = element.find('#test');
      expect(divElement.width()).to.equal(portraitWidth - 10);
      this.$timeout.flush();

      // Resize the screen
      $window.innerWidth = landscapeWidth + 400;
      $window.innerHeight = landscapeInnerHeightUrlBar;
      $window.outerWidth = landscapeWidth;
      $window.outerHeight = landscapeInnerHeightUrlBar;
      $window.screen.availWidth = landscapeWidth;
      $window.screen.availHeight = landscapeScreenHeight;
      angular.element($window).resize();
      this.$rootScope.$digest();
      this.$timeout.flush();
      expect(divElement.width()).to.equal(landscapeWidth - 10);
    });

    it('should not resize the height when the $window.innerHeight change', function() {
      $window.innerWidth = portraitWidth;
      $window.innerHeight = portraitInnerHeightUrlBar;
      $window.outerWidth = portraitWidth;
      $window.outerHeight = portraitInnerHeightUrlBar;
      $window.screen.availWidth = portraitWidth;
      $window.screen.availHeight = portraitScreenHeight;
      var html = '<div ng-controller="userNotificationController"><div id="test" user-notification-popover></div></div>';
      var element = this.$compile(html)(this.$rootScope);
      this.$rootScope.$digest();
      var divElement = element.find('#test');
      var elementHeight = divElement.height();
      this.$timeout.flush();

      // Resize the screen
      $window.innerWidth = portraitWidth;
      $window.innerHeight = portraitInnerHeight;
      $window.outerWidth = portraitWidth;
      $window.outerHeight = portraitInnerHeight;
      $window.screen.availWidth = portraitWidth;
      $window.screen.availHeight = portraitScreenHeight;
      angular.element($window).resize();
      this.$rootScope.$digest();
      this.$timeout.flush();
      expect(divElement.height()).to.equal(elementHeight);
    });
  });

  describe('The userNotificationAPI factory', function() {

    beforeEach(angular.mock.inject(function(userNotificationAPI, $httpBackend) {
      this.$httpBackend = $httpBackend;
      this.userNotificationAPI = userNotificationAPI;
    }));

    describe('list fn', function() {

      it('should send a request to /user/notifications', function() {
        this.$httpBackend.expectGET('/user/notifications').respond([]);
        this.userNotificationAPI.list();
        this.$httpBackend.flush();
      });

      it('should send a request to /user/notifications?limit=10&offset=2&read=false', function() {
        this.$httpBackend.expectGET('/user/notifications?limit=10&offset=2&read=false').respond([]);
        var options = {
          limit: 10,
          offset: 2,
          read: false
        };
        this.userNotificationAPI.list(options);
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.userNotificationAPI.list();
        expect(promise.then).to.be.a.function;
      });
    });
  });

  describe('The userNotificationController controller', function() {

    beforeEach(inject(function($rootScope, $controller, $q) {
      this.userNotificationAPI = {};
      this.rootScope = $rootScope;
      this.$q = $q;
      this.scope = $rootScope.$new();

      $controller('userNotificationController', {
        $scope: this.scope,
        userNotificationAPI: this.userNotificationAPI
      });
    }));

    describe('togglePopover()', function() {
      it('should call load when popoverObject is opened', function(done) {
        this.scope.popoverObject.open = false;
        this.userNotificationAPI.list = function() {
          done();
        };
        this.scope.togglePopover();
      });

      it('should reset notifications when popoverObject is closed', function(done) {
        this.scope.notifications = [1,2,3];
        this.scope.popoverObject.open = true;
        this.scope.togglePopover();
        expect(this.scope.notifications).to.be.empty;
        done();
      });
    });

    describe('nextPage()', function() {
      it('should not call load() when last page has been reached', function(done) {
        this.scope.pagination.current = 2;
        this.scope.pagination.last = 2;

        this.userNotificationAPI.list = function() {
          done(new Error());
        };
        this.scope.nextPage();
        done();
      });

      it('should call load() when last page has not been reached', function(done) {
        this.scope.pagination.current = 1;
        this.scope.pagination.last = 2;

        this.userNotificationAPI.list = function() {
          done();
        };
        this.scope.nextPage();
        done(new Error());
      });
    });

    describe('previousPage()', function() {
      it('should not call load() when first page has been reached', function(done) {
        this.scope.pagination.current = 1;

        this.userNotificationAPI.list = function() {
          done(new Error());
        };
        this.scope.previousPage();
        done();
      });

      it('should call load() when first page has not been reached', function(done) {
        this.scope.pagination.current = 2;

        this.userNotificationAPI.list = function() {
          done();
        };
        this.scope.previousPage();
        done(new Error());
      });
    });

    describe('load()', function() {
      it('should update local notifications and counter on request success', function(done) {
        var array = [1, 2, 3];
        var size = 103;

        var defer = this.$q.defer();
        this.userNotificationAPI.list = function(options) {
          return defer.promise;
        };

        defer.resolve({data: array, headers: function() {
          return size;
        }});

        this.scope.load();
        this.scope.$digest();
        expect(this.scope.notifications).to.deep.equal(array);
        expect(this.scope.totalNotifications).to.equal(size);
        done();
      });

      it('should set error on request failure', function(done) {
        var defer = this.$q.defer();
        this.userNotificationAPI.list = function(options) {
          return defer.promise;
        };

        defer.reject();
        this.scope.load();
        this.scope.$digest();
        expect(this.scope.error).to.be.true;
        done();
      });
    });
  });
});
