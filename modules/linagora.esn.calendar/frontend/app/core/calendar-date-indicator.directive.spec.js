'use strict';

/* global chai: false */
/* global sinon: false */
var expect = chai.expect;

describe('The calendarDateIndicator directive', function() {
  beforeEach(function() {
    var self = this;

    this.calView = {title: 'calDate'};
    this.minicalView = {title: 'minicalView'};
    this.calendarCurrentView = {
      get: sinon.stub().returns(this.calView),
      set: sinon.spy(),
      getMiniCalendarView: sinon.stub().returns(this.minicalView),
      setMiniCalendarView: sinon.spy()
    };

    angular.mock.module('jadeTemplates', 'linagora.esn.graceperiod', 'esn.calendar', function($provide) {
      $provide.value('calendarCurrentView', self.calendarCurrentView);
    });
  });

  beforeEach(function() {
    angular.mock.inject(function(_$compile_, _$rootScope_) {
      this.$compile = _$compile_;
      this.$rootScope = _$rootScope_;
      this.$scope = this.$rootScope.$new();
    });

    this.initDirective = function(scope) {
      var element = this.$compile('<span calendar-date-indicator>{{vm.dateIndicator}}</span>')(scope);

      scope.$digest();
      this.eleScope = element.isolateScope();

      return element;
    };
  });

  it('should initialize the dateIndicator with the home calendar view title', function() {
    var element = this.initDirective(this.$scope);

    expect(this.calendarCurrentView.get).to.have.been.calledWith();
    expect(element.html()).to.equal(this.calView.title);
  });

  it('should change the dateIndicator on home calendar change', function() {
    var element = this.initDirective(this.$scope);

    this.$rootScope.$broadcast('calendar:homeViewChange', {title: 'newDate'});
    this.$scope.$digest();
    expect(this.calendarCurrentView.get).to.have.been.calledOnce;
    expect(element.html()).to.equal('newDate');
  });

  it('should change the dateIndicator on mini calendar change if it is shown', function() {
    var element = this.initDirective(this.$scope);

    this.$rootScope.$broadcast('calendar:mini:toggle');
    this.$scope.$digest();
    expect(element.html()).to.equal(this.minicalView.title);

    this.$rootScope.$broadcast('calendar:mini:viewchange', {title: 'newnewDate'});
    this.$scope.$digest();
    expect(element.html()).to.equal('newnewDate');
    expect(this.calendarCurrentView.get).to.have.been.calledOnce;
    expect(this.calendarCurrentView.getMiniCalendarView).to.have.been.calledOnce;
  });

  it('should change the dateIndicator on mini calendar toggle if it is shown', function() {
    this.$scope.miniCalendarIsShown = false;
    var element = this.initDirective(this.$scope);

    this.$rootScope.$broadcast('calendar:mini:toggle');
    this.$scope.$digest();

    expect(element.html()).to.equal(this.minicalView.title);
    expect(this.calendarCurrentView.get).to.have.been.calledOnce;
    expect(this.calendarCurrentView.getMiniCalendarView).to.have.been.calledOnce;
  });

  it('should change the dateIndicator on home calendar toggle if mini calendar is not shown', function() {
    this.$scope.miniCalendarIsShown = true;
    var element = this.initDirective(this.$scope);

    this.$rootScope.$broadcast('calendar:mini:toggle');
    this.$scope.$digest();
    expect(element.html()).to.equal(this.minicalView.title);

    this.$rootScope.$broadcast('calendar:mini:toggle');
    this.$scope.$digest();
    expect(element.html()).to.equal(this.calView.title);
    expect(this.calendarCurrentView.get).to.have.been.callCount(2);
  });
});
