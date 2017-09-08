'use strict';

/* global chai: false, sinon: false */

var expect = chai.expect;

describe('The esnOauthApplicationList component', function() {

  var $rootScope, $compile;
  var ESNOauthApplicationClient, $modalMock;

  beforeEach(function() {
    module('esn.oauth-application', function($provide) {
      $provide.value('$modal', $modalMock);
    });
    module('jadeTemplates');

    inject(function(_$rootScope_, _ESNOauthApplicationClient_, _$compile_) {
      $rootScope = _$rootScope_;
      $compile = _$compile_;
      ESNOauthApplicationClient = _ESNOauthApplicationClient_;
    });
  });

  function compileComponent(html, scope) {
    scope = scope || $rootScope.$new();

    var element = $compile(html)(scope);

    scope.$digest();

    return element;
  }

  it('should only display loading indicator while loading applications', function() {
    var deferred = $q.defer();
    ESNOauthApplicationClient.created = sinon.spy(function() {
      return deferred.promise;
    });

    var element = compileComponent('<esn-oauth-application-list/>');

    expect(element.find('.loading-indicator').length).to.equal(1);
    deferred.resolve({data: []});
    $rootScope.$digest();
    expect(element.find('.loading-indicator').length).to.equal(0);
  });

  it('should not display any notify text while loading applications', function() {
    var deferred = $q.defer();

    ESNOauthApplicationClient.created = sinon.spy(function() {
      return deferred.promise;
    });

    var element = compileComponent('<esn-oauth-application-list/>', null);

    expect(ESNOauthApplicationClient.created).to.have.been.called;
    expect(element.find('.empty-text').length).to.equal(0);
    expect(element.find('.error-text').length).to.equal(0);
  });

  it('should display notify text if application list is empty', function() {
    ESNOauthApplicationClient.created = sinon.spy(function() {
      return $q.when({ data: [] });
    });

    var element = compileComponent('<esn-oauth-application-list/>', null);

    expect(ESNOauthApplicationClient.created).to.have.been.called;
    expect(element.find('.empty-text').html()).to.contain('No application, click %s to add a new one');
  });

  it('should display notify text if it fails to load applications', function() {
    ESNOauthApplicationClient.created = sinon.spy(function() {
      return $q.reject();
    });

    var element = compileComponent('<esn-oauth-application-list/>', null);

    expect(ESNOauthApplicationClient.created).to.have.been.called;
    expect(element.find('.error-text').html()).to.contain('Cannot get user applications, try again later!');
  });

  it('should display list of applications when it is loaded successfully', function() {
    ESNOauthApplicationClient.created = sinon.spy(function() {
      return $q.when({ data: [1] });
    });

    var element = compileComponent('<esn-oauth-application-list/>', null);
    var listElement = angular.element(element[0].querySelector('esn-oauth-application-card'));

    expect(ESNOauthApplicationClient.created).to.have.been.called;
    expect(listElement.length).to.equal(1);
  });
});
