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

  function initController(scope, user) {
    scope = scope || $rootScope.$new();

    var controller = $controller('profileEditController', scope, { user: user || { emails: [] } });

    controller.$onInit();
    $rootScope.$digest();

    return controller;
  }

  describe('The $onInit method', function() {
    var session;

    beforeEach(function() {
      inject(function(_session_) {
        session = _session_;
      });
    });

    it('should set canEditEmails to false if the modifier is not a domain administrator', function() {
      session.userIsDomainAdministrator = sinon.stub().returns(false);

      var controller = initController();

      expect(controller.canEditEmails).to.be.false;
    });

    it('should set canEditEmails to true if the modifier is a domain administrator', function() {
      session.userIsDomainAdministrator = sinon.stub().returns(true);

      var controller = initController();

      expect(controller.canEditEmails).to.be.true;
    });

    it('should clone user object to mutableUser object', function() {
      var user = { _id: 123, name: 'Alice', emails: [] };
      var controller = initController(null, user);

      expect(controller.mutableUser).to.deep.equal(user);

      controller.mutableUser.name = 'Bob';
      expect(controller.mutableUser).to.not.deep.equal(user);
    });
  });

  describe('The onSaveBtnClick method', function() {
    var $state;
    var session, profileAPI, userAPI;

    beforeEach(inject(function(
      _$state_,
      _session_,
      _profileAPI_,
      _userAPI_
    ) {
      $state = _$state_;
      session = _session_;
      profileAPI = _profileAPI_;
      userAPI = _userAPI_;
    }));

    it('should do nothing but just go back to profile state without reload if the mutableUser object is the same as the user object', function(done) {
      var user = { _id: 123, name: 'Alice', emails: [] };
      var controller = initController(null, user);

      $state.go = sinon.spy();
      profileAPI.updateProfile = sinon.stub().returns($q.when());
      userAPI.setUserEmails = sinon.stub().returns($q.when());
      session.user = user;

      controller.onSaveBtnClick().then(function() {
        expect(profileAPI.updateProfile).to.not.have.been.called;
        expect(userAPI.setUserEmails).to.not.have.been.called;
        expect($state.go).to.have.been.calledOnce;
        expect($state.go).to.have.been.calledWith('profile', { user_id: '' }, { location: 'replace', reload: false });
        done();
      });

      $rootScope.$digest();
    });

    describe('Update basic information', function() {
      it('should update profile of current user if the basic information of the user is modified', function(done) {
        var user = { _id: 123, firstname: 'Alice', emails: [] };
        var controller = initController(null, user);

        session.user = user;
        controller.mutableUser.firstname = 'Modified';
        profileAPI.updateProfile = sinon.stub().returns($q.when());

        controller.onSaveBtnClick().then(function() {
          expect(profileAPI.updateProfile).to.have.been.calledOnce;
          expect(profileAPI.updateProfile).to.have.been.calledWith(controller.mutableUser);
          done();
        });

        $rootScope.$digest();
      });

      it('should update profile of specific user if the basic information of the user is modified', function(done) {
        var user = { _id: 123, firstname: 'Alice', emails: [] };
        var controller = initController(null, user);

        controller.mutableUser.firstname = 'Modified';
        session.user = { _id: 456 };

        profileAPI.updateUserProfile = sinon.stub().returns($q.when());

        controller.onSaveBtnClick().then(function() {
          expect(profileAPI.updateUserProfile).to.have.been.calledOnce;
          expect(profileAPI.updateUserProfile).to.have.been.calledWith(controller.mutableUser, controller.mutableUser._id, session.domain._id);
          done();
        });

        $rootScope.$digest();
      });

      it('should update the session user on success', function(done) {
        var user = { _id: 123, firstname: 'Alice', emails: [] };
        var controller = initController(null, user);

        controller.mutableUser.firstname = 'Modified';
        session.user = user;
        session.setUser = sinon.stub();

        profileAPI.updateProfile = function() {
          return $q.when();
        };

        controller.onSaveBtnClick().then(function() {
          expect(session.setUser).to.have.been.calledOnce;
          expect(session.setUser).to.have.been.calledWith(controller.mutableUser);
          done();
        });

        $rootScope.$digest();
      });

      it('should go back and reload profile state on success update profile of the current user', function(done) {
        var user = { _id: 123, firstname: 'Alice', emails: [] };
        var controller = initController(null, user);

        controller.mutableUser.firstname = 'Modified';
        session.user = user;

        profileAPI.updateProfile = function() {
          return $q.when();
        };
        $state.go = sinon.spy();

        controller.onSaveBtnClick().then(function() {
          expect($state.go).to.have.been.calledOnce;
          expect($state.go).to.have.been.calledWith('profile', { user_id: '' }, { location: 'replace', reload: true });
          done();
        });

        $rootScope.$digest();
      });

      it('should go back and reload profile state on success update profile of specific user', function(done) {
        var user = { _id: 123, firstname: 'Alice', emails: [] };
        var controller = initController(null, user);

        controller.mutableUser.firstname = 'Modified';
        session.user = { _id: 456, name: 'Bob' };

        profileAPI.updateUserProfile = function() {
          return $q.when();
        };
        $state.go = sinon.spy();

        controller.onSaveBtnClick().then(function() {
          expect($state.go).to.have.been.calledOnce;
          expect($state.go).to.have.been.calledWith('profile', { user_id: controller.mutableUser._id }, { location: 'replace', reload: true });
          done();
        });

        $rootScope.$digest();
      });
    });

    describe('Update emails', function() {
      it('should update emails of specific user if the emails of the user is modified', function(done) {
        var user = { _id: 123, firstname: 'Alice', emails: ['alice@lng.com'] };
        var domainId = 'domainId';
        var controller = initController(null, user);

        controller.mutableUser.emails = ['alice@lng.com', 'foo@bar'];
        session.domain = {
          _id: domainId
        };

        userAPI.setUserEmails = sinon.stub().returns($q.when());

        controller.onSaveBtnClick().then(function() {
          expect(userAPI.setUserEmails).to.have.been.calledOnce;
          expect(userAPI.setUserEmails).to.have.been.calledWith(controller.mutableUser._id, controller.mutableUser.emails, domainId);
          done();
        });

        $rootScope.$digest();
      });

      it('should update the session user on success', function(done) {
        var user = { _id: 123, firstname: 'Alice', emails: ['alice@lng.com'] };
        var controller = initController(null, user);

        controller.mutableUser.emails = ['alice@lng.com', 'foo@bar'];
        session.user = user;
        session.setUser = sinon.stub();

        userAPI.setUserEmails = function() {
          return $q.when();
        };

        controller.onSaveBtnClick().then(function() {
          expect(session.setUser).to.have.been.calledOnce;
          expect(session.setUser).to.have.been.calledWith(controller.mutableUser);
          done();
        });

        $rootScope.$digest();
      });

      it('should go back and reload profile state on success update profile of the current user', function(done) {
        var user = { _id: 123, firstname: 'Alice', emails: ['alice@lng.com'] };
        var controller = initController(null, user);

        controller.mutableUser.emails = ['alice@lng.com', 'foo@bar'];
        session.user = user;

        userAPI.setUserEmails = function() {
          return $q.when();
        };
        $state.go = sinon.spy();

        controller.onSaveBtnClick().then(function() {
          expect($state.go).to.have.been.calledOnce;
          expect($state.go).to.have.been.calledWith('profile', { user_id: '' }, { location: 'replace', reload: true });
          done();
        });

        $rootScope.$digest();
      });

      it('should go back and reload profile state on success update profile of specific user', function(done) {
        var user = { _id: 123, firstname: 'Alice', emails: ['alice@lng.com'] };
        var controller = initController(null, user);

        controller.mutableUser.emails = ['alice@lng.com', 'foo@bar'];
        session.user = { _id: 456, name: 'Bob' };

        userAPI.setUserEmails = function() {
          return $q.when();
        };
        $state.go = sinon.spy();

        controller.onSaveBtnClick().then(function() {
          expect($state.go).to.have.been.calledOnce;
          expect($state.go).to.have.been.calledWith('profile', { user_id: controller.mutableUser._id }, { location: 'replace', reload: true });
          done();
        });

        $rootScope.$digest();
      });
    });
  });
});
