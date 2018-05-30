'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The relaxedDateForBsDatepicker directive', function() {

  var $compile, $rootScope, element, $scope, CONTACT_DATE_FORMAT, $browser;

  beforeEach(function() {
    module('esn.core');
    module('linagora.esn.contact');
    module('jadeTemplates');
  });

  beforeEach(inject(function(_$compile_, _$rootScope_, _CONTACT_DATE_FORMAT_, _$browser_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    CONTACT_DATE_FORMAT = _CONTACT_DATE_FORMAT_;
    $browser = _$browser_;
    $scope = $rootScope.$new();
  }));

  beforeEach(function() {
    element = $compile('<form name="form"><input type="text" name="date" relaxed-date-for-bs-datepicker ng-model="date" /></form>')($scope);
    $scope.contact = { birthday: 'not a birthday' };
    $browser.defer.flush();
  });

  it('should define the placeholder on the element', function() {
    expect(element.find('input').attr('placeholder')).to.equal(CONTACT_DATE_FORMAT);
  });

  it('should allow any string value', function() {
    $scope.form.date.$setViewValue('I am not a date');
    $scope.$digest();

    expect($scope.date).to.equal('I am not a date');
  });

  it('should display any string value if model is not a Date', function() {
    $scope.date = 'I am still not a date';
    $scope.$digest();

    expect($scope.form.date.$viewValue).to.equal('I am still not a date');
  });
});
