'use strict';

/* global chai: false, moment: false */

var expect = chai.expect;

describe('The inboxListGroupToggleSelection component', function() {

  var $compile, $rootScope, $timeout, $scope, inboxFilteringService, element, nowDate = new Date('2017-04-20T12:00:00Z');

  function compileDirective(html) {
    element = angular.element(html);

    $compile(element)($scope = $rootScope.$new());
    $scope.$digest();

    return element;
  }

  beforeEach(function() {
    module('jadeTemplates', 'linagora.esn.unifiedinbox', function($provide) {
      $provide.constant('moment', function(argument) {
        return moment.tz(argument || nowDate, 'UTC');
      });
    });
  });

  beforeEach(inject(function(_$compile_, _$rootScope_, _$timeout_, _inboxFilteringService_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $timeout = _$timeout_;
    inboxFilteringService = _inboxFilteringService_;
  }));

  it('should not display group name if no item given', function() {
    compileDirective('<inbox-list-header />');

    expect(element.find('.inbox-list-header-group').text()).to.equal('');
  });

  it('should remove group name when item becomes null', function() {
    $rootScope.item = {
      id: 'id',
      date: new Date('2017-04-20T10:00:00Z') // Same day
    };

    compileDirective('<inbox-list-header item="item" />');

    expect(element.find('.inbox-list-header-group').text()).to.equal('Today');

    $rootScope.item = null;
    $rootScope.$digest();

    expect(element.find('.inbox-list-header-group').text()).to.equal('');
  });

  it('should display "Today" name if item is today', function() {
    $rootScope.item = {
      id: 'id',
      date: new Date('2017-04-20T10:00:00Z') // Same day
    };

    compileDirective('<inbox-list-header item="item" />');

    expect(element.find('.inbox-list-header-group').text()).to.equal('Today');
  });

  it('should display "Yesterday" name if item is yesterday', function() {
    $rootScope.item = {
      id: 'id',
      date: new Date('2017-04-19T10:00:00Z') // Wednesday, same week
    };

    compileDirective('<inbox-list-header item="item" />');

    expect(element.find('.inbox-list-header-group').text()).to.equal('Yesterday');
  });

  it('should display "This week" name if item is this week', function() {
    $rootScope.item = {
      id: 'id',
      date: new Date('2017-04-18T10:00:00Z') // Tuesday
    };

    compileDirective('<inbox-list-header item="item" />');

    expect(element.find('.inbox-list-header-group').text()).to.equal('This week');
  });

  it('should display "Last week" name if item is last week', function() {
    $rootScope.item = {
      id: 'id',
      date: new Date('2017-04-11T10:00:00Z') // Tuesday, the week before
    };

    compileDirective('<inbox-list-header item="item" />');

    expect(element.find('.inbox-list-header-group').text()).to.equal('Last week');
  });

  it('should display "This month" name if item is this month', function() {
    $rootScope.item = {
      id: 'id',
      date: new Date('2017-04-07T10:00:00Z') // Friday, two weeks before
    };

    compileDirective('<inbox-list-header item="item" />');

    expect(element.find('.inbox-list-header-group').text()).to.equal('This month');
  });

  it('should display "Last month" name if item is this year', function() {
    $rootScope.item = {
      id: 'id',
      date: new Date('2017-03-20T10:00:00Z') // One month before
    };

    compileDirective('<inbox-list-header item="item" />');

    expect(element.find('.inbox-list-header-group').text()).to.equal('Last month');
  });

  it('should display "This year" name if item is this year', function() {
    $rootScope.item = {
      id: 'id',
      date: new Date('2017-02-20T10:00:00Z') // Two months before
    };

    compileDirective('<inbox-list-header item="item" />');

    expect(element.find('.inbox-list-header-group').text()).to.equal('This year');
  });

  it('should display "Old messages" name if item is older', function() {
    $rootScope.item = {
      id: 'id',
      date: new Date('2016-03-11T10:00:00Z') // the year before
    };

    compileDirective('<inbox-list-header item="item" />');

    expect(element.find('.inbox-list-header-group').text()).to.equal('Old messages');
  });

  it('should not display filters if no filters given', function() {
    compileDirective('<inbox-list-header />');

    expect(element.find('.inbox-filter-button')).to.have.length(0);
  });

  it('should not display filters if filters are empty', function() {
    $rootScope.filters = [];

    compileDirective('<inbox-list-header />');

    expect(element.find('.inbox-filter-button')).to.have.length(0);
  });

  it('should display filters if at least one filter is available', function() {
    $rootScope.filters = [{ id: 'filter1' }];

    compileDirective('<inbox-list-header filters="filters"/>');

    expect(element.find('.inbox-filter-button')).to.have.length(2);
  });

  it('should update quick filter when user searches for some text', function() {
    compileDirective('<inbox-list-header />');

    element.find('.inbox-list-header-quick-filter input').val('filter').trigger('input');
    $timeout.flush(); // Because of the 'debounce' option

    expect(inboxFilteringService.getAllProviderFilters().quickFilter).to.equal('filter');
  });

});
