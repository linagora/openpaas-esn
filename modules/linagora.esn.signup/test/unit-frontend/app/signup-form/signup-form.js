'use strict';

/* global chai: false, sinon: false */

var expect = chai.expect;

describe('The signup-form component', function() {

  var $compile, $rootScope, invitationAPI;

  beforeEach(module('linagora.esn.signup'));
  beforeEach(module('jadeTemplates'));

  beforeEach(module(function($provide) {
    $provide.value('invitationAPI', invitationAPI = {
      create: sinon.spy(function() {
        return $q.when();
      })
    });
  }));

  beforeEach(inject(function(_$compile_, _$rootScope_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
  }));

  describe('The controller', function() {

    var scope;

    beforeEach(function() {
      $compile('<signup-form></signup-form>')(scope = $rootScope.$new());
      $rootScope.$digest();
    });

    describe('signup()', function() {

      it('should call the invitationAPI.create() method', function() {
        scope.form = { $invalid: false };

        scope.signup();
        scope.$digest();

        expect(invitationAPI.create).to.have.been.calledWith();
      });

      it('should call the invitationAPI.create() method with scope settings', function() {
        scope.settings.firstname = 'Foo';
        scope.settings.lastname = 'Bar';
        scope.settings.email = 'foo@bar.com';
        scope.form = { $invalid: false };

        scope.signup();
        scope.$digest();

        expect(invitationAPI.create).to.have.been.calledWith({
          type: 'signup',
          data: {
            firstname: 'Foo',
            lastname: 'Bar',
            email: 'foo@bar.com'
          }
        });
      });

    });

  });

});
