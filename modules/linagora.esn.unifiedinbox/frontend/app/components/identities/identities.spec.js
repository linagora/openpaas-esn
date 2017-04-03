'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The inboxIdentities component', function() {

  var $compile, $rootScope, $scope, element;

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
        getAllIdentities: function() {
          return $q.when([{ id: 'default' }, { id: 'customIdentity1 '}]); // Two identities
        },
        getIdentity: function(id) {
          return $q.when({ id: id });
        }
      });
    });
  });

  beforeEach(inject(function(_$compile_, _$rootScope_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
  }));

  it('should add one child element per user identity', function() {
    compileDirective('<inbox-identities />');

    expect(element.find('inbox-identity')).to.have.length(2);
  });

});
