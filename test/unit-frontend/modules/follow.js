'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The esn.follow Angular module', function() {

  beforeEach(function() {
    module('jadeTemplates');
    module('esn.session');
    module('esn.follow');
  });

  describe('The followAPI factory', function() {
    var sessionMock, session, followAPI, $httpBackend;
    var userId = '1';

    beforeEach(function() {
      sessionMock = {
        user: {
          _id: userId
        },
        domain: {},
        ready: {
          then: function() {}
        }
      };

      module(function($provide) {
        $provide.value('session', sessionMock);
      });

      inject(function(_followAPI_, _session_, _$httpBackend_) {
        followAPI = _followAPI_;
        session = _session_;
        $httpBackend = _$httpBackend_;
      });
    });

    describe('The follow function', function() {
      it('should call the right endpoint', function() {
        var followUser = {
          _id: 123
        };

        $httpBackend.expectPUT('/api/users/' + session.user._id + '/followings/' + followUser._id).respond({});
        followAPI.follow(followUser);
        $httpBackend.flush();
      });
    });

    describe('The unfollow function', function() {
      it('should call the right endpoint', function() {

        var followUser = {
          _id: 123
        };

        $httpBackend.expectDELETE('/api/users/' + session.user._id + '/followings/' + followUser._id).respond(204, {});
        followAPI.unfollow(followUser);
        $httpBackend.flush();
      });
    });

    describe('The getFollowers function', function() {
      it('should call the right endpoint', function() {
        var options = {
          limit: 10,
          offset: 0
        };

        var user = {
          _id: 345
        };

        $httpBackend.expectGET('/api/users/' + user._id + '/followers?limit=' + options.limit + '&offset=' + options.offset).respond([]);
        followAPI.getFollowers(user, options);
        $httpBackend.flush();
      });
    });

    describe('The getFollowings function', function() {
      it('should call the right endpoint', function() {
        var options = {
          limit: 10,
          offset: 0
        };

        var user = {
          _id: 345
        };

        $httpBackend.expectGET('/api/users/' + user._id + '/followings?limit=' + options.limit + '&offset=' + options.offset).respond([]);
        followAPI.getFollowings(user, options);
        $httpBackend.flush();
      });
    });
  });

  describe('The followButton directive', function() {
    var $compile, $rootScope, $scope, followAPIMock;

    function compileDirective(html) {
      var element = $compile(html)($scope);
      $scope.$digest();
      return element;
    }

    beforeEach(function() {
      followAPIMock = {};
      module(function($provide) {
        $provide.value('followAPI', followAPIMock);
      });

      inject(function(_$compile_, _$rootScope_) {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        $scope = $rootScope.$new();
      });
    });

    describe('When following', function() {

      it('should not be able to follow', function() {
        $scope.following = true;
        $scope.spyFollow = sinon.spy();
        $scope.spyUnfollow = sinon.spy();
        $scope.user = {
          _id: '123'
        };
        followAPIMock.follow = sinon.spy();
        var element = compileDirective('<follow-button following="following", user="user", on-followed="spyFollow()", on-unfollowed="spyUnfollow()"/>');
        var scope = element.isolateScope();

        scope.follow();
        $rootScope.$digest();
        expect(followAPIMock.follow).to.not.have.been.called;
        expect($scope.spyFollow).to.not.have.been.called;
        expect($scope.spyUnfollow).to.not.have.been.called;
      });

      it('should unfollow the user on click', function() {
        $scope.following = true;
        $scope.spyFollow = sinon.spy();
        $scope.spyUnfollow = sinon.spy();
        $scope.user = {
          _id: '123'
        };

        followAPIMock.unfollow = function(_user) {
          expect(_user).to.deep.equal($scope.user);
          return $q.when(true);
        };

        var element = compileDirective('<follow-button following="following", user="user", on-followed="spyFollow()", on-unfollowed="spyUnfollow()"/>');
        var scope = element.isolateScope();
        scope.unfollow();
        $rootScope.$digest();
        expect($scope.spyFollow).to.not.have.been.called;
        expect($scope.spyUnfollow).to.have.been.called;
        expect(scope.following).to.be.false;
      });
    });

    describe('When not following', function() {

      it('should not be able to unfollow', function() {
        $scope.following = false;
        $scope.spyFollow = sinon.spy();
        $scope.spyUnfollow = sinon.spy();
        $scope.user = {
          _id: '123'
        };
        followAPIMock.unfollow = sinon.spy();
        var element = compileDirective('<follow-button following="following", user="user", on-followed="spyFollow()", on-unfollowed="spyUnfollow()"/>');
        var scope = element.isolateScope();

        scope.unfollow();
        $rootScope.$digest();
        expect(followAPIMock.unfollow).to.not.have.been.called;
        expect($scope.spyFollow).to.not.have.been.called;
        expect($scope.spyUnfollow).to.not.have.been.called;
      });

      it('should follow the user', function() {
        $scope.following = false;
        $scope.spyFollow = sinon.spy();
        $scope.spyUnfollow = sinon.spy();
        $scope.user = {
          _id: '123'
        };

        followAPIMock.follow = function(_user) {
          expect(_user).to.deep.equal($scope.user);
          return $q.when(true);
        };

        var element = compileDirective('<follow-button following="false", user="user", on-followed="spyFollow()", on-unfollowed="spyUnfollow()"/>');
        var scope = element.isolateScope();
        scope.follow();
        $rootScope.$digest();
        expect($scope.spyFollow).to.have.been.called;
        expect($scope.spyUnfollow).to.not.have.been.called;
        expect(scope.following).to.be.true;
      });
    });
  });

  describe('The FollowPaginationProvider factory', function() {

    var $q, $rootScope, FollowPaginationProvider;

    function generateData(size) {
      var result = [];
      for (var i = 0; i < size; i++) {
        result.push({link: {type: 'follow', actor: {objectType: 'user', _id: 1}, object: {objectType: 'user', _id: 2}}, user: {_id: 1}});
      }
      return result;
    }

    beforeEach(inject(function(_$controller_, _$q_, _$rootScope_) {
      $q = _$q_;
      $rootScope = _$rootScope_;
    }));

    beforeEach(function() {
      inject(function($injector) {
        FollowPaginationProvider = $injector.get('FollowPaginationProvider');
      });
    });

    describe('The loadNextItems function', function() {
      it('should send back data and lastPage flag to false when end is not reached', function(done) {
        var size = 10;
        var options = {limit: size};
        var user = {
          _id: 1
        };

        var paginable = function() {
          return $q.when({data: generateData(size)});
        };

        var service = new FollowPaginationProvider(paginable, options, user);
        service.loadNextItems().then(function(result) {
          expect(result.data.length).to.equal(size);
          expect(result.lastPage).to.be.false;
          expect(service.options.offset).to.equal(size);
          done();
        }, done);
        $rootScope.$digest();
      });

      it('should send back data and lastPage flag to true when end is reached', function(done) {
        var size = 10;
        var options = {limit: size};
        var user = {
          _id: 1
        };

        var paginable = function() {
          return $q.when({data: generateData(size / 2)});
        };

        var service = new FollowPaginationProvider(paginable, options, user);
        service.loadNextItems().then(function(result) {
          expect(result.data.length).to.equal(size / 2);
          expect(result.lastPage).to.be.true;
          done();
        }, done);
        $rootScope.$digest();
      });
    });
  });
});
