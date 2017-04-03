'use strict';

/* global chai: false, sinon: false */

var expect = chai.expect;

describe('The inboxIdentity component', function() {

  var $compile, $rootScope, $scope, inboxIdentitiesService, element;

  function compileDirective(html) {
    element = angular.element(html);

    $compile(element)($scope = $rootScope.$new());
    $scope.$digest();

    return element;
  }

  beforeEach(function() {
    module('jadeTemplates');
    module('linagora.esn.unifiedinbox', function($provide) {
      $provide.value('inboxIdentitiesService', {
        getIdentity: function(id) {
          return $q.when({ id: id, isDefault: id === 'default' });
        },
        removeIdentity: sinon.spy(function() {
          return $q.when();
        })
      });
    });
  });

  beforeEach(inject(function(_$compile_, _$rootScope_, _inboxIdentitiesService_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    inboxIdentitiesService = _inboxIdentitiesService_;
  }));

  it('should not provide a "Remove" button for the default identity', function() {
    compileDirective('<inbox-identity identity-id="default" />');

    expect(element.find('.inbox-identity-remove-button')).to.have.length(0);
  });

  it('should provide a "Remove" button for a custom identity', function() {
    compileDirective('<inbox-identity identity-id="custom" />');

    expect(element.find('.inbox-identity-remove-button')).to.have.length(1);
  });

  it('should allow removing an identity', function() {
    compileDirective('<inbox-identity identity-id="custom" />');

    element.find('.inbox-identity-remove-button').click();

    expect(inboxIdentitiesService.removeIdentity).to.have.been.calledWith({ id: 'custom', isDefault: false });
  });

});
