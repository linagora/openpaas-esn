'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esnEmailInput component', function() {
  var $rootScope, $compile;

  beforeEach(function() {
    module('jadeTemplates');
    module('esn.form.helper', function($provide) {
      $provide.value('emailService', {
        isValidEmail: function() {
          return true;
        }
      });
    });
  });

  beforeEach(inject(function(
    _$rootScope_,
    _$compile_
  ) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
  }));

  function initComponent(scope) {
    scope = scope || $rootScope.$new();
    scope.checker = function() { return $q.when(true); };
    var element = $compile(
      '<form name="form">' +
        '<esn-email-input form="form" domain-name="domainName" availability-checker="checker(email)" email="email"/>' +
      '</form>'
    )(scope);

    scope.$digest();

    return element;
  }

  it('should display current domain as domain part of email input', function() {
    var scope = $rootScope.$new();

    scope.domainName = 'linagora.com';

    var elementHtml = initComponent(scope).html();

    expect(elementHtml).to.contain('@linagora.com');
  });

  it('should set input field as local part of group email if domain of email is similar with given domain name', function() {
    var scope = $rootScope.$new();

    scope.email = 'testemail@linagora.com';
    scope.domainName = 'linagora.com';

    var element = initComponent(scope);

    expect(element.find('input[ng-model="$ctrl.emailName"]')[0].value).to.equal('testemail');
  });

  it('should set input field as entire email if domain of email is different with give domain name', function() {
    var scope = $rootScope.$new();

    scope.email = 'testemail@outside.domain';
    scope.domainName = 'linagora.com';
    var element = initComponent(scope);

    expect(element.find('input[ng-model="$ctrl.emailName"]')[0].value).to.equal(scope.email);
  });
});
