'use strict';

/* global chai: false, sinon: false */

var expect = chai.expect;

describe('The signup-finalize-form component', function() {

  var $componentController, $rootScope, invitationAPI;

  beforeEach(module('linagora.esn.signup'));
  beforeEach(module('jadeTemplates'));

  beforeEach(inject(function(_$componentController_, _$rootScope_) {
    $componentController = _$componentController_;
    $rootScope = _$rootScope_;
  }));

  describe('The controller', function() {

    var scope;

    beforeEach(function() {
      $componentController('signupFinalizeForm', {
        $scope: scope = $rootScope.$new(),
        invitationAPI: invitationAPI = {
          finalize: sinon.spy(function() {
            return $q.when();
          }),
          get: function() {
            return $q.when({
              data: {
                uuid: '123456789',
                status: 'ok',
                type: 'signup',
                data: {
                  email: 'foo@bar.com'
                }
              }
            });
          }
        },
        loginAPI: {
          login: function() {
            return $q.reject();
          }
        },
        $route: {
          current: {
            params: {
              id: '123456789'
            }
          }
        }
      });
      scope.$digest();
    });

    it('should initialize the editCompany scope variable', function() {
      expect(scope.editCompany).to.equal(true);
    });

    describe('finalize()', function() {

      it('should call the invitationAPI.finalize() method', function() {
        scope.finalize();
        scope.$digest();

        expect(invitationAPI.finalize).to.have.been.calledWith();
      });

      it('should call the invitationAPI.finalize() method with scope settings and invitation UUID', function() {
        scope.invitationId = '123456789';
        scope.settings.firstname = 'Foo';
        scope.settings.lastname = 'Bar';
        scope.settings.email = 'foo@bar.com';
        scope.settings.company = 'company';
        scope.settings.domain = 'domain';
        scope.settings.password = 'secret';
        scope.settings.confirmpassword = 'secret';

        scope.finalize();
        scope.$digest();

        expect(invitationAPI.finalize).to.have.been.calledWith('123456789', {
          type: 'signup',
          data: {
            firstname: 'Foo',
            lastname: 'Bar',
            email: 'foo@bar.com',
            company: 'company',
            domain: 'domain',
            password: 'secret',
            confirmpassword: 'secret'
          }
        });
      });

    });

  });

});
