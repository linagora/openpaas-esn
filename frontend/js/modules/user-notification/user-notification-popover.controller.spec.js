'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The ESNUserNotificationPopoverController controller', function() {
  beforeEach(function() {
    angular.mock.module('esn.user-notification');
  });

  beforeEach(inject(function($rootScope, $controller) {
    var self = this;

    self.getItems = function() {};
    self.esnUserNotificationService = {};
    self.paginator = function() {
      return {
        getItems: self.getItems
      };
    };
    self.rootScope = $rootScope;
    self.scope = $rootScope.$new();

    $controller('ESNUserNotificationPopoverController', {
      $scope: this.scope,
      esnUserNotificationService: this.esnUserNotificationService,
      paginator: this.paginator
    });
  }));

  describe('The nextPage function', function() {
    it('should call the pager', function(done) {
      this.getItems = done();
      this.scope.nextPage();
    });
  });

  describe('The previousPage function', function() {
    it('should call the pager', function(done) {
      this.getItems = done();
      this.scope.previousPage();
    });
  });

  describe('The initPager function', function() {
    beforeEach(inject(function($rootScope, $controller, paginator) {
      this.esnUserNotificationService = {};
      this.rootScope = $rootScope;
      this.scope = $rootScope.$new();
      this.paginator = paginator;

      $controller('ESNUserNotificationPopoverController', {
        $scope: this.scope,
        esnUserNotificationService: this.esnUserNotificationService,
        paginator: this.paginator
      });
    }));

    it('should update local notifications request success', function(done) {
      var array = [{ a: 1 }, { a: 2 }, { a: 3 }];
      var size = 103;

      this.esnUserNotificationService.list = function() {
        return $q.when({ data: array, headers: function() {
          return size;
        }});
      };

      this.scope.initPager(3);
      this.scope.$digest();

      expect(this.scope.notifications).to.deep.equal(array);
      expect(this.scope.totalNotifications).to.equal(size);
      done();
    });

    it('should define the pagination page based on response data', function(done) {
      var array = [{ a: 1 }, { a: 2 }];
      var size = 101;

      this.esnUserNotificationService.list = function() {
        return $q.when({ data: array, headers: function() {
          return size;
        }});
      };

      this.scope.initPager(10);
      this.scope.$digest();

      expect(this.scope.currentPageNb).to.equal(1);
      expect(this.scope.lastPageNb).to.equal(11);

      done();
    });

    it('should set error on request failure', function(done) {
      this.esnUserNotificationService.list = function() {
        return $q.reject(new Error());
      };

      this.scope.initPager(1);
      this.scope.$digest();

      expect(this.scope.error).to.be.true;
      done();
    });
  });
});
