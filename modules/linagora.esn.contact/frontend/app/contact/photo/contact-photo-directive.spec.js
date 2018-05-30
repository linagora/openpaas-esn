'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The contactPhoto directive', function() {

  var element, $compile, $scope;
  var DEFAULT_AVATAR;

  beforeEach(function() {
    module('esn.core');
    module('linagora.esn.contact');
    module('jadeTemplates');
  });

  beforeEach(inject(function(_$compile_, _$rootScope_) {
    $scope = _$rootScope_.$new();
    $compile = _$compile_;
    DEFAULT_AVATAR = '/contact/images/default_avatar.png';
  }));

  beforeEach(function() {
    $scope.contact = {};
    element = $compile('<contact-photo contact="contact"></contact-photo>')($scope);
  });

  it('should use the default avatar if contact.photo is not defined', function() {
    $scope.$digest();

    expect(element.find('img').attr('src')).to.equal(DEFAULT_AVATAR);
  });

  it('should use the contact photo if defined', function() {
    $scope.contact = {
      photo: 'data:image/png,base64;abcd='
    };
    $scope.$digest();

    expect(element.find('img').attr('src')).to.equal('data:image/png,base64;abcd=');
  });

  describe('with editable attribute', function() {

    beforeEach(inject(function($compile, $rootScope) {
      $scope = $rootScope.$new();
      $scope.contact = {};

      element = $compile('<contact-photo editable="true" contact="contact"></contact-photo>')($scope);
    }));

    it('should display the hint', function() {
      $scope.$digest();

      expect(element.find('i').css('display')).to.not.equal('none');
    });
  });
});
