'use strict';

/* global chai: false */
/* global sinon: true */

var expect = chai.expect;

describe('The profileEditController', function() {
  var $rootScope, $controller;

  beforeEach(function() {
    angular.mock.module('linagora.esn.profile');

    inject(function(_$rootScope_, _$controller_) {
      $rootScope = _$rootScope_;
      $controller = _$controller_;
    });
  });

  function initController(locals) {
    return $controller('profileEditController', locals || {});
  }

  describe('The $onInit fn', function() {
    it('should clone user object to mutableUser object', function() {
      var user = { _id: 123, name: 'Alice' };
      var controller = initController();

      controller.user = user;
      controller.$onInit();
      expect(controller.mutableUser).to.deep.equal(user);

      controller.mutableUser.name = 'Bob';
      expect(controller.mutableUser).to.not.deep.equal(user);
    });
  });

  describe('The updateProfile fn', function() {
    var $state;
    var session;
    var profileAPI;

    beforeEach(inject(function(_$state_, _session_, _profileAPI_) {
      $state = _$state_;
      session = _session_;
      profileAPI = _profileAPI_;

      $state.go = sinon.spy();
      session.setUser = sinon.stub();
      profileAPI.updateProfile = sinon.stub().returns($q.when());
    }));

    it('should do nothing but just go back to profile state if the mutableUser object is the same as the user object', function(done) {
      var user = { _id: 123, name: 'Alice' };
      var controller = initController();

      controller.user = user;
      controller.mutableUser = user;

      controller.updateProfile().then(function() {
        expect(profileAPI.updateProfile).to.not.have.been.called;
        expect($state.go).to.have.been.calledOnce;
        expect($state.go).to.have.been.calledWith('profile', { user_id: '' });
        done();
      });

      $rootScope.$digest();
    });

    it('should call profileAPI to update user profile', function(done) {
      var controller = initController();

      controller.user = { _id: 123, name: 'Alice' };
      controller.mutableUser = { _id: 123, name: 'Alice Rose' };

      controller.updateProfile().then(function() {
        expect(profileAPI.updateProfile).to.have.been.calledOnce;
        expect(profileAPI.updateProfile).to.have.been.calledWith(controller.mutableUser);
        done();
      });

      $rootScope.$digest();
    });

    it('should update the session user on success', function(done) {
      var controller = initController();

      controller.user = { _id: 123, name: 'Alice' };
      controller.mutableUser = { _id: 123, name: 'Alice Rose' };

      controller.updateProfile().then(function() {
        expect(session.setUser).to.have.been.calledOnce;
        expect(session.setUser).to.have.been.calledWith(controller.mutableUser);
        done();
      });

      $rootScope.$digest();
    });

    it('should go back to profile state on success', function(done) {
      var controller = initController();

      controller.user = { _id: 123, name: 'Alice' };
      controller.mutableUser = { _id: 123, name: 'Alice Rose' };

      controller.updateProfile().then(function() {
        expect($state.go).to.have.been.calledOnce;
        expect($state.go).to.have.been.calledWith('profile', { user_id: '' });
        done();
      });

      $rootScope.$digest();
    });
  });
});
