'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The ProfileEditEmailController', function() {
  var $rootScope, $controller;
  var userUtils, esnAvailabilityService;

  beforeEach(function() {
    angular.mock.module('linagora.esn.profile');

    inject(function(
      _$rootScope_,
      _$controller_,
      _userUtils_,
      _esnAvailabilityService_
    ) {
      $rootScope = _$rootScope_;
      $controller = _$controller_;
      userUtils = _userUtils_;
      esnAvailabilityService = _esnAvailabilityService_;
    });

    userUtils.displayNameOf = angular.noop;
  });

  function initController(scope, user) {
    scope = scope || $rootScope.$new();

    var controller = $controller('ProfileEditEmailController', scope, { user: user || { emails: [] } });

    controller.$onInit();
    $rootScope.$digest();

    return controller;
  }

  describe('The $onInit method', function() {
    it('should call #userUtils.displayNameOf method to get user display name', function() {
      var displayName = 'foo';
      var user = { _id: '123' };

      userUtils.displayNameOf = sinon.stub().returns(displayName);

      var controller = initController(null, user);

      expect(userUtils.displayNameOf).to.have.been.calledWith(user);
      expect(controller.user.displayName).to.equal(displayName);
    });
  });

  describe('The onAddBtnClick method', function() {
    it('should do nothing if there is no new email', function() {
      var controller = initController();

      controller.newEmail = '';
      controller.onAddBtnClick();

      expect(controller.user.emails).to.deep.equal([]);
    });

    it('should add new email to the list of user emails', function() {
      var controller = initController();

      controller.newEmail = 'foo@bar';
      controller.onAddBtnClick();

      expect(controller.user.emails).to.deep.equal(['foo@bar']);
      expect(controller.newEmail).to.deep.equal('');
    });
  });

  describe('The onDeleteBtnClick method', function() {
    it('should do nothing if the removing email is not in the emails list', function() {
      var user = {
        emails: ['foo@bar']
      };
      var form = {
        $setDirty: sinon.spy()
      };

      var controller = initController(null, user);

      controller.onDeleteBtnClick('fake@email', form);

      expect(controller.user.emails).to.deep.equal(user.emails);
      expect(form.$setDirty).to.not.have.been.called;
    });

    it('should remove the email from the emails list', function() {
      var user = {
        emails: ['foo@lng', 'bar@lng']
      };
      var form = {
        $setDirty: sinon.spy()
      };

      var controller = initController(null, user);

      controller.onDeleteBtnClick('foo@lng', form);

      expect(controller.user.emails).to.deep.equal(['bar@lng']);
      expect(form.$setDirty).to.have.been.calledOnce;
    });
  });

  describe('The checkEmailAvailability method', function() {
    it('should resolve if there is no email', function(done) {
      var controller = initController();

      controller.checkEmailAvailability()
        .then(done)
        .catch(done);

        $rootScope.$digest();
    });

    it('should reject if the email is taken by the current user', function(done) {
      var email = 'foo@bar';
      var user = {
        emails: [email]
      };

      var controller = initController(null, user);

      controller.checkEmailAvailability(email)
        .then(function() {
          done('Should not resolve');
        })
        .catch(function(err) {
          expect(err.message).to.equal('Email is already in use by this user');
          done();
        });

      $rootScope.$digest();
    });

    it('should reject if failed to check email availability', function(done) {
      var email = 'foo@bar';
      var controller = initController();

      esnAvailabilityService.checkEmailAvailability = sinon.stub().returns($q.reject(new Error('something wrong')));

      controller.checkEmailAvailability(email)
        .then(function() {
          done('Should not resolve');
        })
        .catch(function(err) {
          expect(err.message).to.equal('something wrong');
          expect(esnAvailabilityService.checkEmailAvailability).to.have.been.calledWith(email);
          done();
        });

      $rootScope.$digest();
    });

    it('should reject if the email is already in use by another user', function(done) {
      var email = 'foo@bar';
      var controller = initController();

      esnAvailabilityService.checkEmailAvailability = sinon.stub().returns($q.when({ available: false }));

      controller.checkEmailAvailability(email)
        .then(function() {
          done('Should not resolve');
        })
        .catch(function(err) {
          expect(err.message).to.equal('Email is already in use by another user');
          expect(esnAvailabilityService.checkEmailAvailability).to.have.been.calledWith(email);
          done();
        });

      $rootScope.$digest();
    });

    it('should resolve if the email is available', function(done) {
      var email = 'foo@bar';
      var controller = initController();

      esnAvailabilityService.checkEmailAvailability = sinon.stub().returns($q.when({ available: true }));

      controller.checkEmailAvailability(email)
        .then(function() {
          expect(esnAvailabilityService.checkEmailAvailability).to.have.been.calledWith(email);
          done();
        })
        .catch(done);

      $rootScope.$digest();
    });
  });
});
