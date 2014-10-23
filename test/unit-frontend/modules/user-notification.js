'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.user-notification Angular module', function() {
  beforeEach(function() {
    angular.mock.module('esn.user-notification');
  });

  describe('userNotificationAPI service', function() {

    beforeEach(inject(function(userNotificationAPI, $httpBackend) {
      this.api = userNotificationAPI;
      this.$httpBackend = $httpBackend;
    }));

    describe('setRead method', function() {
      it('should exist', function() {
        expect(this.api).to.respondTo('setRead');
      });

      it('should send a request PUT /user/notifications/123456789/read', function() {
        this.$httpBackend.expectPUT('/user/notifications/123456789/read').respond([]);
        this.api.setRead(123456789, true);
        this.$httpBackend.flush();
      });
    });

    describe('setAcknowledged method', function() {
      it('should exist', function() {
        expect(this.api).to.respondTo('setAcknowledged');
      });

      it('should send a request PUT /user/notifications/123456789/acknowledged', function() {
        this.$httpBackend.expectPUT('/user/notifications/123456789/acknowledged').respond([]);
        this.api.setAcknowledged(123456789, true);
        this.$httpBackend.flush();
      });
    });

    describe('getUnreadCount method', function() {
      it('should exist', function() {
        expect(this.api).to.respondTo('getUnreadCount');
      });

      it('should send a request GET /user/notifications/unread', function() {
        this.$httpBackend.expectGET('/user/notifications/unread').respond([]);
        this.api.getUnreadCount();
        this.$httpBackend.flush();
      });
    });

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

    var userNotificationAPI = {
      list: function() {
        return {
          then: function() {
            return {
              finally: function() {}
            };
          }
        };
      }
    };

    beforeEach(function() {
      angular.mock.module(function($provide) {
        $provide.value('$window', $window);
        $provide.value('userNotificationAPI', userNotificationAPI);
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
      var html = '<div ng-controller="userNotificationPopoverController"><div id="test" user-notification-popover></div></div>';
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
      var html = '<div ng-controller="userNotificationPopoverController"><div id="test" user-notification-popover></div></div>';
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
      var html = '<div ng-controller="userNotificationPopoverController"><div id="test" user-notification-popover></div></div>';
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

  describe('The userNotificationPopoverController controller', function() {

    beforeEach(inject(function($rootScope, $controller, $q) {
      this.getItems = function() {};
      var self = this;
      this.userNotificationAPI = {};
      this.paginator = function() {
        return {
          getItems: self.getItems
        };
      };
      this.rootScope = $rootScope;
      this.$q = $q;
      this.scope = $rootScope.$new();

      $controller('userNotificationPopoverController', {
        $scope: this.scope,
        userNotificationAPI: this.userNotificationAPI,
        paginator: this.paginator
      });
    }));

    describe('nextPage()', function() {
      it('should call the pager', function(done) {
        this.getItems = done();
        this.scope.nextPage();
      });
    });

    describe('previousPage()', function() {
      it('should call the pager', function(done) {
        this.getItems = done();
        this.scope.previousPage();
      });
    });

    describe('initPager()', function() {
      beforeEach(inject(function($rootScope, $controller, $q, paginator) {
        this.userNotificationAPI = {};
        this.rootScope = $rootScope;
        this.$q = $q;
        this.scope = $rootScope.$new();
        this.paginator = paginator;

        $controller('userNotificationPopoverController', {
          $scope: this.scope,
          userNotificationAPI: this.userNotificationAPI,
          paginator: this.paginator
        });
      }));

      it('should update local notifications request success', function(done) {
        var array = [1, 2, 3];
        var size = 103;

        var defer = this.$q.defer();
        this.userNotificationAPI.list = function(options) {
          return defer.promise;
        };

        defer.resolve({data: array, headers: function() {
          return size;
        }});

        this.scope.initPager();
        this.scope.$digest();
        expect(this.scope.notifications).to.deep.equal(array);
        expect(this.scope.totalNotifications).to.equal(size);
        done();
      });

      it('should define the pagination page based on response data', function(done) {
        var array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        var size = 101;

        var defer = this.$q.defer();
        this.userNotificationAPI.list = function(options) {
          return defer.promise;
        };

        defer.resolve({data: array, headers: function() {
          return size;
        }});

        this.scope.initPager(10);
        this.scope.$digest();

        expect(this.scope.currentPageNb).to.equal(1);
        expect(this.scope.lastPageNb).to.equal(11);

        done();
      });

      it('should set error on request failure', function(done) {
        var defer = this.$q.defer();
        this.userNotificationAPI.list = function(options) {
          return defer.promise;
        };

        defer.reject(new Error());
        this.scope.initPager(1);
        this.scope.$digest();
        expect(this.scope.error).to.be.true;
        done();
      });
    });
  });

  describe('communityMembershipInvitationNotification directive', function() {

    beforeEach(function() {
      var communityAPI = {
        get: function() {},
        join: function() {}
      };

      var userAPI = {
        user: function() {}
      };

      var objectTypeResolver = {
        resolve: function() {},
        register: function() {}
      };

      angular.mock.module('esn.community');
      angular.mock.module('esn.user');
      angular.mock.module('esn.object-type');
      angular.mock.module(function($provide) {
        $provide.value('communityAPI', communityAPI);
        $provide.value('userAPI', userAPI);
        $provide.value('objectTypeResolver', objectTypeResolver);
      });
      module('jadeTemplates');
    });

    beforeEach(angular.mock.inject(function($rootScope, $compile, $q, communityAPI, userNotificationAPI, objectTypeResolver, userAPI) {
      this.$rootScope = $rootScope;
      this.$compile = $compile;
      this.$q = $q;
      this.scope = $rootScope.$new();
      this.communityAPI = communityAPI;
      this.userNotificationAPI = userNotificationAPI;
      this.objectTypeResolver = objectTypeResolver;
      this.userAPI = userAPI;
      this.scope.notification = {
        _id: '123',
        subject: {
          id: '1',
          objectType: 'user'
        },
        complement: {
          id: '2',
          objectType: 'community'
        }
      };
      this.html = '<community-membership-invitation-notification notification="notification"/>';
    }));

    describe('The controller', function() {
      it('should resolve notification data', function() {
        var userDefer = this.$q.defer();
        var communityDefer = this.$q.defer();
        this.objectTypeResolver.resolve = function(type) {
          if (type === 'user') {
            return userDefer.promise;
          }

          if (type === 'community') {
            return communityDefer.promise;
          }
        };
        userDefer.resolve({data: {_id: this.scope.notification.subject.id}});
        communityDefer.resolve({data: {_id: this.scope.notification.complement.id}});
        this.$compile(this.html)(this.scope);
        this.scope.$digest();

        var element = this.$compile(this.html)(this.scope);
        this.scope.$digest();
        var eltScope = element.isolateScope();

        expect(eltScope.invitationSender).to.exist;
        expect(eltScope.invitationSender._id).to.equal(this.scope.notification.subject.id);
        expect(eltScope.invitationCommunity).to.exist;
        expect(eltScope.invitationCommunity._id).to.equal(this.scope.notification.complement.id);
        expect(eltScope.error).to.be.false;
        expect(eltScope.loading).to.be.false;
      });

      it('should set scope.error if community fetch fails', function() {
        var userDefer = this.$q.defer();
        var communityDefer = this.$q.defer();
        this.objectTypeResolver.resolve = function(type) {
          if (type === 'user') {
            return userDefer.promise;
          }

          if (type === 'community') {
            return communityDefer.promise;
          }
        };
        userDefer.resolve({data: {_id: this.scope.notification.subject.id}});
        communityDefer.reject();
        this.$compile(this.html)(this.scope);
        this.scope.$digest();

        var element = this.$compile(this.html)(this.scope);
        this.scope.$digest();
        var eltScope = element.isolateScope();

        expect(eltScope.invitationSender).to.not.exist;
        expect(eltScope.invitationCommunity).to.not.exist;
        expect(eltScope.error).to.be.true;
        expect(eltScope.loading).to.be.false;
      });

      it('should set scope.error if user fetch fails', function() {
        var userDefer = this.$q.defer();
        var communityDefer = this.$q.defer();
        this.objectTypeResolver.resolve = function(type) {
          if (type === 'user') {
            return userDefer.promise;
          }

          if (type === 'community') {
            return communityDefer.promise;
          }
        };
        userDefer.reject({});
        communityDefer.resolve({data: {_id: this.scope.notification.complement.id}});
        this.$compile(this.html)(this.scope);
        this.scope.$digest();

        var element = this.$compile(this.html)(this.scope);
        this.scope.$digest();
        var eltScope = element.isolateScope();

        expect(eltScope.invitationSender).to.not.exist;
        expect(eltScope.invitationCommunity).to.not.exist;
        expect(eltScope.error).to.be.true;
        expect(eltScope.loading).to.be.false;
      });
    });
  });

  describe('communityInvitationAcceptButton directive', function() {

    beforeEach(function() {
      var communityAPI = {
        join: function() {
        }
      };

      var userNotificationAPI = {
        setAcknowledged: function() {
        }
      };

      var objectTypeResolver = {
        resolve: function() {},
        register: function() {}
      };

      angular.mock.module('esn.community');
      angular.mock.module('esn.user-notification');
      angular.mock.module('esn.object-type');
      angular.mock.module(function($provide) {
        $provide.value('communityAPI', communityAPI);
        $provide.value('userNotificationAPI', userNotificationAPI);
        $provide.value('objectTypeResolver', objectTypeResolver);
      });
      module('jadeTemplates');
    });

    beforeEach(angular.mock.inject(function($rootScope, $compile, $q, communityAPI, userNotificationAPI) {
      this.$rootScope = $rootScope;
      this.$compile = $compile;
      this.$q = $q;
      this.scope = $rootScope.$new();
      this.communityAPI = communityAPI;
      this.userNotificationAPI = userNotificationAPI;
      this.scope.invitedUser = {
        _id: '123'
      };
      this.scope.invitationCommunity = {
        _id: '456'
      };
      this.scope.notification = {
        _id: '789'
      };
      this.html = '<community-invitation-accept-button/>';
    }));

    it('should call communityAPI#join', function(done) {
      this.communityAPI.join = function(communityId, userId) {
        return done();
      };
      this.$compile(this.html)(this.scope);
      this.scope.$digest();
      this.scope.accept();
    });

    it('should call userNotificationAPI#setAck(true)', function(done) {
      var joinDefer = this.$q.defer();
      this.communityAPI.join = function() {
        joinDefer.resolve({data: {_id: 123}});
        return joinDefer.promise;
      };
      this.userNotificationAPI.setAcknowledged = function() {
        return done();
      };

      this.$compile(this.html)(this.scope);
      this.scope.$digest();
      this.scope.accept();
      this.scope.$digest();
    });

  });

  describe('communityInvitationDeclineButton directive', function() {
    beforeEach(function() {
      var communityAPI = {
        cancelRequestMembership: function() {
        }
      };

      var userNotificationAPI = {
        setAcknowledged: function() {
        }
      };

      var objectTypeResolver = {
        resolve: function() {},
        register: function() {}
      };

      angular.mock.module('esn.community');
      angular.mock.module('esn.user-notification');
      angular.mock.module('esn.object-type');
      angular.mock.module(function($provide) {
        $provide.value('communityAPI', communityAPI);
        $provide.value('userNotificationAPI', userNotificationAPI);
        $provide.value('objectTypeResolver', objectTypeResolver);
      });
      module('jadeTemplates');
    });

    beforeEach(angular.mock.inject(function($rootScope, $compile, $q, communityAPI, userNotificationAPI) {
      this.$rootScope = $rootScope;
      this.$compile = $compile;
      this.$q = $q;
      this.scope = $rootScope.$new();
      this.communityAPI = communityAPI;
      this.userNotificationAPI = userNotificationAPI;
      this.scope.invitedUser = {
        _id: '123'
      };
      this.scope.invitationCommunity = {
        _id: '456'
      };
      this.scope.notification = {
        _id: '789'
      };
      this.html = '<community-invitation-decline-button/>';
    }));

    it('should call communityAPI#cancelRequestMemberShip', function(done) {
      this.communityAPI.cancelRequestMembership = function() {
        return done();
      };
      this.$compile(this.html)(this.scope);
      this.scope.$digest();
      this.scope.decline();
    });

    it('should call userNotificationAPI#setAck(true)', function(done) {
      var cancelRequestMemberShipDefer = this.$q.defer();
      this.communityAPI.cancelRequestMembership = function() {
        cancelRequestMemberShipDefer.resolve();
        return cancelRequestMemberShipDefer.promise;
      };
      this.userNotificationAPI.setAcknowledged = function() {
        return done();
      };

      this.$compile(this.html)(this.scope);
      this.scope.$digest();
      this.scope.decline();
      this.scope.$digest();
    });

  });
});
