'use strict';

/* global chai*/

var expect = chai.expect;

describe('The profileMenu component', function() {
  var $httpBackend, element, $compile, $rootScope, session;

  beforeEach(function() {
    angular.mock.module('esn.profile-menu', 'jadeTemplates');
  });

  beforeEach(inject(function(
    _$compile_,
    _$rootScope_,
    _session_,
    _$httpBackend_
  ) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    session = _session_;
    $httpBackend = _$httpBackend_;

    // in the header we put a profileMenu component which use an icon provider that load this icon set
    // if this icon provider is moved somewhere else, this test will have to be moved as well probable.
    $httpBackend
        .whenGET('images/mdi/mdi.svg')
        .respond('');
  }));

  beforeEach(function() {
    compileProfileMenuComponent();
  });

  function compileProfileMenuComponent() {
    var html = '<profile-menu></profile-menu>';
    var scope = $rootScope.$new();

    element = $compile(html)(scope);

    scope.$digest();
  }

  it('should contain a md-menu', function() {
    expect(element.find('md-menu')).to.exist;
  });

  it('should contain a clickable avatar image', function() {
    expect(element.find('.header-avatar')).to.exist.and.attr('ng-click').to.equal('ctrl.openMenu($mdMenu, $event)');
  });

  it('should retrieve a coherent avatarUrl', function() {
    var regexpAvatarUrl = /^\/api\/user\/profile\/avatar\?cb=\d+$/;

    expect(element.find('.header-avatar')).and.attr('ng-src').to.match(regexpAvatarUrl);
  });

  it('should have menu closed', function() {
    expect(element.find('.header-avatar')).attr('aria-expanded').to.equal('false');
    expect(element.find('md-backdrop')).to.not.exist;
  });

  it('should update avatar url after updated avatar of current user', function() {
    var initalAvatarUrl = element.find('img.header-avatar').attr('src');
    var currentUser = { _id: '123' };

    session.user = currentUser;
    $rootScope.$broadcast('avatar:updated', currentUser);
    $rootScope.$digest();

    var newAvatarUrl = element.find('img.header-avatar').attr('src');

    expect(newAvatarUrl).to.not.equal(initalAvatarUrl);
  });

  it('should not update avatar url after updated avatar of other users', function() {
    var initalAvatarUrl = element.find('img.header-avatar').attr('src');

    session.user = { _id: '123' };
    $rootScope.$broadcast('avatar:updated', { _id: '456' });
    $rootScope.$digest();

    var newAvatarUrl = element.find('img.header-avatar').attr('src');

    expect(newAvatarUrl).to.equal(initalAvatarUrl);
  });
});
