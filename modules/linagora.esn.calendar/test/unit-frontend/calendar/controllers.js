'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The calendar module controllers', function() {
  var event;
  var liveNotification;
  var fullCalendarSpy;
  var createCalendarSpy;
  var self;

  beforeEach(function() {
    self = this;
    event = {};
    fullCalendarSpy = sinon.spy();
    createCalendarSpy = sinon.spy();

    var calendarUtilsMock = {
      getNewStartDate: function() {
        return moment('2013-02-08 09:30'); // jshint ignore:line
      },
      getNewEndDate: function() {
        return moment('2013-02-08 10:30'); // jshint ignore:line
      }
    };

    this.keepChangeDuringGraceperiodMock = {
      wrapEventSource: sinon.spy(function(id, eventSource) {
        return eventSource;
      })
    };

    this.CalendarShellConstMock = function(vcalendar, event) {
      this.etag = event.etag;
      this.path = event.path;
      this.end = self.fcMoment();
      this.clone = function() {
        return this;
      };
    };

    this.CalendarShellMock = function() {
      return self.CalendarShellConstMock.apply(this, arguments);
    };

    this.CalendarShellMock.from = sinon.spy(function(event, extendedProp) {
      return angular.extend({}, event, extendedProp);
    });

    this.CalendarShellMock.fromIncompleteShell = sinon.spy();

    this.calendarServiceMock = {
      calendarId: '1234',
      createEvent: function() {
        return $q.when({});
      },
      modifyEvent: function(path, e) {
        event = e;
        return $q.when();
      },
      listCalendars: function() {
        return $q.when([{
          href: 'href',
          id: 'id',
          color: 'color'
        }, {
          href: 'href2',
          id: 'id2',
          color: 'color2'
        }]);
      },
      createCalendar: function() {
        createCalendarSpy();
        return $q.when();
      }
    };

    this.calendarCurrentViewMock = {
      save: angular.noop,
      get: angular.identity.bind(null, {})
    };

    var liveNotificationMock = function(namespace) {
      if (liveNotification) {
        return liveNotification(namespace);
      }
      return {
        on: function() {},
        removeListener: function() {}
      };
    };

    this.uiCalendarConfig = {
      calendars: {
        calendarId: {
          fullCalendar: fullCalendarSpy,
          offset: function() {
            return {
              top: 1
            };
          }
        }
      }
    };

    this.gracePeriodService = {};
    this.headerServiceMock = {};
    this.userMock = {};
    this.eventUtilsMock = {
      applyReply: sinon.spy()
    };

    angular.mock.module('esn.calendar');
    angular.mock.module('ui.calendar', function($provide) {
      $provide.constant('uiCalendarConfig', self.uiCalendarConfig);
    });
    angular.mock.module(function($provide) {
      $provide.decorator('calendarUtils', function($delegate) {
        return angular.extend($delegate, calendarUtilsMock);
      });
      $provide.value('calendarService', self.calendarServiceMock);
      $provide.value('livenotification', liveNotificationMock);
      $provide.value('gracePeriodService', self.gracePeriodService);
      $provide.value('headerService', self.headerServiceMock);
      $provide.value('eventUtils', self.eventUtilsMock);
      $provide.value('user', self.userMock);
      $provide.value('keepChangeDuringGraceperiod', self.keepChangeDuringGraceperiodMock);
      $provide.value('calendarCurrentView', self.calendarCurrentViewMock);
      $provide.value('CalendarShell', self.CalendarShellMock);
      $provide.factory('calendarEventSource', function() {
        return function() {
          return [{
            title: 'RealTest',
            location: 'Paris',
            description: 'description!',
            allDay: false,
            start: new Date(),
            attendeesPerPartstat: {
              'NEEDS-ACTION': []
            }
          }];
        };
      });
      $provide.constant('MAX_CALENDAR_RESIZE_HEIGHT', 10);
    });
  });

  beforeEach(angular.mock.inject(function($controller, $rootScope, $compile, $timeout, $window, USER_UI_CONFIG, moment, CalendarShell, fcMoment, CALENDAR_EVENTS) {
    this.rootScope = $rootScope;
    this.scope = $rootScope.$new();
    this.controller = $controller;
    this.$compile = $compile;
    this.$timeout = $timeout;
    this.$window = $window;
    this.USER_UI_CONFIG = USER_UI_CONFIG;
    this.moment = moment;
    this.CalendarShell = CalendarShell;
    this.fcMoment = fcMoment;
    this.CALENDAR_EVENTS = CALENDAR_EVENTS;
  }));

  afterEach(function() {
    liveNotification = null;
  });

  describe('The userCalendarController controller', function() {
    it('should inject both header and subheader', function() {
      this.headerServiceMock.mainHeader = {
        addInjection: sinon.spy()
      };
      this.headerServiceMock.subHeader = {
        addInjection: sinon.spy()
      };
      this.controller('userCalendarController', {$scope: this.scope});
      expect(this.headerServiceMock.mainHeader.addInjection).to.have.been.calledOnce;
      expect(this.headerServiceMock.subHeader.addInjection).to.have.been.calledOnce;
    });

    it('should not modify constant UI_USER_CONFIG but clone it before modifying it', function() {
      this.headerServiceMock.mainHeader = {
        addInjection: function() {}
      };
      this.headerServiceMock.subHeader = {
        addInjection: function() {}
      };
      this.headerServiceMock.resetAllInjections = sinon.spy();
      this.controller('userCalendarController', {$scope: this.scope});
      expect(this.scope.uiConfig).to.be.defined;
      expect(this.scope.uiConfig).to.not.equals(this.USER_UI_CONFIG);
    });
  });

  describe('The calendarController controller', function() {

    beforeEach(function() {
      this.scope.uiConfig = this.USER_UI_CONFIG;
      this.scope.calendarHomeId = 'calendarId';
    });

    afterEach(function() {
      this.gracePeriodService.flushAllTasks = function() {};
      this.scope.$destroy();
    });

    it('should gracePeriodService.flushAllTasks $on(\'$destroy\')', function() {
      this.gracePeriodService.flushAllTasks = sinon.spy();
      this.controller('calendarController', {$scope: this.scope});
      this.scope.$destroy();
      expect(this.gracePeriodService.flushAllTasks).to.have.been.called;
    });

    it('should register gracePeriodService.flushAllTasks on(\'beforeunload\')', function() {
      this.gracePeriodService.flushAllTasks = 'aHandler';
      var event = null;
      var handler = null;
      this.$window.addEventListener = function(evt, hdlr) {
        event = evt;
        handler = hdlr;
      };
      this.controller('calendarController', {$scope: this.scope});
      expect(event).to.equal('beforeunload');
      expect(handler).to.equal('aHandler');
    });

    it('should be created and its scope initialized', function() {
      this.controller('calendarController', {$scope: this.scope});
      expect(this.scope.uiConfig.calendar.eventRender).to.equal(this.scope.eventRender);
      expect(this.scope.uiConfig.calendar.eventAfterAllRender).to.equal(this.scope.resizeCalendarHeight);
    });

    it('should register a listener on CALENDAR_EVENTS.ITEM_MODIFICATION that remove and create a new event if event.source is undefined', function() {
      var removeEventsFn = sinon.spy(function(id) {
        expect(id).to.equal('_id');
      });
      var renderEventsFn = sinon.spy(function(event) {
        expect(event).to.deep.equal({
          title: 'aTitle',
          allDay: '_allday',
          id: '_id',
          _allDay: '_allday',
          _end: '_end',
          _id: '_id',
          _start: '_start',
          backgroundColor: '#2196f3'
        });
      });

      this.controller('calendarController', {$scope: this.scope});

      this.uiCalendarConfig.calendars.calendarId.fullCalendar = function(event, data) {
        if (event === 'clientEvents') {
          return [{
            _allday: '_allday',
            _end: '_end',
            _id: '_id',
            _start: '_start'
          }];
        } else if (event === 'removeEvents') {
          removeEventsFn(data);
        } else if (event === 'renderEvent') {
          renderEventsFn(data);
        }
      };

      this.rootScope.$broadcast(this.CALENDAR_EVENTS.ITEM_MODIFICATION, {
        title: 'aTitle',
        allDay: '_allday',
        id: '_id'
      });

      this.scope.uiConfig.calendar.viewRender({});
      this.scope.$digest();
      expect(removeEventsFn).to.have.been.called;
      expect(renderEventsFn).to.have.been.called;
    });

    it('should register a listener on CALENDAR_EVENTS.ITEM_MODIFICATION that update an event if event.source is defined', function() {
      var removeEventsFn = sinon.spy();
      var renderEventsFn = sinon.spy();
      var updateEventsFn = sinon.spy(function(event) {
        expect(event).to.deep.equal({
          title: 'aTitle',
          allDay: '_allday',
          id: '_id',
          _allDay: '_allday',
          _end: '_end',
          _id: '_id',
          _start: '_start',
          source: 'iamasource',
          backgroundColor: '#2196f3'
        });
      });

      this.controller('calendarController', {$scope: this.scope});

      this.uiCalendarConfig.calendars.calendarId.fullCalendar = function(event, data) {
        if (event === 'clientEvents') {
          return [{
            _allday: '_allday',
            _end: '_end',
            _id: '_id',
            _start: '_start',
            source: 'iamasource'
          }];
        } else if (event === 'removeEvents') {
          removeEventsFn(data);
        } else if (event === 'renderEvent') {
          renderEventsFn(data);
        } else if (event === 'updateEvent') {
          updateEventsFn(data);
        }
      };

      this.rootScope.$broadcast(this.CALENDAR_EVENTS.ITEM_MODIFICATION, {
        title: 'aTitle',
        allDay: '_allday',
        id: '_id',
        source: 'iamasource'
      });

      this.scope.uiConfig.calendar.viewRender({});
      this.scope.$digest();
      expect(removeEventsFn).to.not.have.been.called;
      expect(renderEventsFn).to.not.have.been.called;
      expect(updateEventsFn).to.have.been.called;
    });

    it('should call fullCalendar next on swipeRight', function() {
      this.controller('calendarController', {$scope: this.scope});
      this.scope.uiConfig.calendar.viewRender({});
      this.scope.swipeRight();
      this.scope.$digest();
      expect(fullCalendarSpy).to.have.been.calledWith('prev');
    });

    it('should call fullCalendar next on swipeLeft', function() {
      this.controller('calendarController', {$scope: this.scope});
      this.scope.uiConfig.calendar.viewRender({});
      this.scope.swipeLeft();
      this.scope.$digest();
      expect(fullCalendarSpy).to.have.been.calledWith('next');
    });

    it('The list calendars and call addEventSource for each', function() {
      this.controller('calendarController', {$scope: this.scope});
      this.scope.uiConfig.calendar.viewRender({});
      this.scope.$digest();
      expect(this.scope.calendars.length).to.equal(2);
      expect(this.scope.calendars[0].href).to.equal('href');
      expect(this.scope.calendars[0].color).to.equal('color');
      expect(this.scope.calendars[1].href).to.equal('href2');
      expect(this.scope.calendars[1].color).to.equal('color2');
      expect(this.scope.eventSourcesMap.href.backgroundColor).to.equal('color');
      expect(this.scope.eventSourcesMap.href2.backgroundColor).to.equal('color2');
      expect(this.scope.eventSourcesMap.href.events).to.be.a('Array');
      expect(this.scope.eventSourcesMap.href2.events).to.be.a('Array');
      expect(fullCalendarSpy).to.have.been.calledTwice;
    });

    it('should have wrap each calendar with keepChangeDuringGraceperiod.wrapEventSource', function() {
      this.controller('calendarController', {$scope: this.scope});
      this.scope.uiConfig.calendar.viewRender({});
      this.scope.$digest();
      expect(this.keepChangeDuringGraceperiodMock.wrapEventSource).to.have.been.calledTwice;
      expect(this.keepChangeDuringGraceperiodMock.wrapEventSource).to.have.been.calledWithExactly('id', sinon.match.array);

      expect(this.keepChangeDuringGraceperiodMock.wrapEventSource).to.have.been.calledWithExactly('id2', sinon.match.array);
    });

    it('should emit addEventSource on CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW and eventData.hidden is false', function() {
      this.controller('calendarController', {$scope: this.scope});
      this.scope.uiConfig.calendar.viewRender({});
      this.scope.$digest();

      var called = 0;

      this.uiCalendarConfig.calendars.calendarId.fullCalendar = function(event) {
        if (event !== 'addEventSource') {
          return;
        }
        called++;
      };

      this.rootScope.$broadcast(this.CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW, {hidden: false, calendar:{}});
      this.scope.$digest();

      expect(called).to.equal(1);
    });

    it('should emit removeEventSource on CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW and eventData.hidden is true', function() {
      this.controller('calendarController', {$scope: this.scope});
      var called = 0;

      this.uiCalendarConfig.calendars.calendarId.fullCalendar = function(event) {
        if (event !== 'removeEventSource') {
          return;
        }
        called++;
      };
      this.scope.uiConfig.calendar.viewRender({});
      this.rootScope.$broadcast(this.CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW, {hidden: true, calendar: {}});
      this.scope.$digest();

      expect(called).to.equal(1);
    });

    it('should resize the calendar height twice when the controller is created', function() {
      this.controller('calendarController', {$scope: this.scope});
      var called = 0;

      var uiCalendarDiv = this.$compile(angular.element('<div ui-calendar="uiConfig.calendar" ng-model="eventSources"></div>'))(this.scope);
      this.uiCalendarConfig.calendars.calendarId.fullCalendar = function(event) {
        if (event === 'addEventSource') {
          return;
        }
        called++;
      };

      uiCalendarDiv.appendTo(document.body);
      this.$timeout.flush();
      try {
        this.$timeout.flush();
      } catch (exception) {
        // Depending on the context, the 'no defered tasks' exception can occur
      }
      expect(called).to.equal(2);
      uiCalendarDiv.remove();
    });

    it('should change view on VIEW_TRANSLATION only when mobile mini calendar is hidden', function() {
      this.controller('calendarController', {$scope: this.scope});

      this.scope.uiConfig.calendar.viewRender({});

      var fcMethodMock = {
      };

      this.uiCalendarConfig.calendars.calendarId.fullCalendar = function(action) {
        (fcMethodMock[action] || angular.noop)();
      };

      ['prev', 'next'].forEach(function(action) {
        fcMethodMock[action] = sinon.spy();
        this.rootScope.$broadcast(this.CALENDAR_EVENTS.VIEW_TRANSLATION, action);

        this.rootScope.$broadcast(this.CALENDAR_EVENTS.MINI_CALENDAR.TOGGLE);
        this.rootScope.$broadcast(this.CALENDAR_EVENTS.VIEW_TRANSLATION, action);

        this.rootScope.$broadcast(this.CALENDAR_EVENTS.MINI_CALENDAR.TOGGLE);
        this.rootScope.$broadcast(this.CALENDAR_EVENTS.VIEW_TRANSLATION, action);

        this.scope.$digest();
        expect(fcMethodMock[action]).to.have.been.calleTwice;
      }, this);
    });

    it('should resize the calendar height once when the window is resized', function() {
      this.controller('calendarController', {$scope: this.scope});
      this.scope.$digest();

      var uiCalendarDiv = this.$compile(angular.element('<div ui-calendar="uiConfig.calendar" ng-model="eventSources"></div>'))(this.scope);
      uiCalendarDiv.appendTo(document.body);
      this.$timeout.flush();
      try {
        this.$timeout.flush();
      } catch (exception) {
        // Depending on the context, the 'no defered tasks' exception can occur
      }

      this.scope.uiConfig.calendar.viewRender({});
      this.scope.$digest();

      var fullCalendarSpy = this.uiCalendarConfig.calendars.calendarId.fullCalendar = sinon.spy();

      angular.element(this.$window).resize();
      this.scope.$digest();
      expect(fullCalendarSpy).to.be.calledOnce;
      uiCalendarDiv.remove();
    });

    it('should resize the calendar height to a max value', function() {
      this.controller('calendarController', {$scope: this.scope});
      var called = 0;

      var uiCalendarDiv = this.$compile(angular.element('<div ui-calendar="uiConfig.calendar" ng-model="eventSources"></div>'))(this.scope);
      uiCalendarDiv.appendTo(document.body);
      this.$timeout.flush();
      try {
        this.$timeout.flush();
      } catch (exception) {
        // Depending on the context, the 'no defered tasks' exception can occur
      }

      this.uiCalendarConfig.calendars.calendarId.fullCalendar = function(arg1, arg2, height) {
        expect(height).to.equal(10);
        called++;
      };

      angular.element(this.$window).resize();
      this.scope.uiConfig.calendar.viewRender({});
      this.scope.$digest();
      expect(called).to.equal(1);
      uiCalendarDiv.remove();
    });

    it('should display an error if calendar events cannot be retrieved', function(done) {

      var calendarEventSourceMock = function(calendarId, errorCallback) {
        errorCallback(new Error(), 'Can not get calendar events');
      };

      var $alertMock = function(alertObject) {
        expect(alertObject.show).to.be.true;
        expect(alertObject.content).to.equal('Can not get calendar events');
        done();
      };

      this.controller('calendarController', {
        $scope: this.scope,
        $alert: $alertMock,
        calendarEventSource: calendarEventSourceMock
      });
      this.scope.$digest();
    });

    it('should initialize a listener on CALENDAR_EVENTS.WS.EVENT_CREATED ws event', function(done) {
      liveNotification = function(namespace) {
        expect(namespace).to.equal('/calendars');
        return {
          on: function(event, handler) {
            expect(event).to.equal(self.CALENDAR_EVENTS.WS.EVENT_CREATED);
            expect(handler).to.be.a('function');
            done();
          }
        };
      };

      this.scope.uiConfig = {
        calendar: {}
      };

      this.controller('calendarController', {
        $rootScope: this.rootScope,
        $scope: this.scope
      });
    });

    it('should restore view from calendarCurrentView during initialization', function() {
      var date = this.fcMoment('1953-03-16');
      this.calendarCurrentViewMock.get = sinon.spy(function() {
        return {
          name: 'agendaDay',
          start: date
        };
      });

      this.controller('calendarController', {
        $rootScope: this.rootScope,
        $scope: this.scope
      });

      expect(this.calendarCurrentViewMock.get).to.have.been.calledOnce;
      expect(this.scope.uiConfig.calendar.defaultView).to.equals('agendaDay');
      expect(this.scope.uiConfig.calendar.defaultDate).to.equals(date);
    });

    it('should save view with calendarCurrentView when view change', function() {
      var view = {};
      this.calendarCurrentViewMock.save = sinon.spy(function(_view) {
        expect(_view).to.equals(view);
      });

      this.controller('calendarController', {
        $rootScope: this.rootScope,
        $scope: this.scope
      });

      this.scope.uiConfig.calendar.viewRender(view);

      expect(this.calendarCurrentViewMock.save).to.have.been.calledOnce;
    });

    describe('the eventDropAndResize listener', function() {
      it('should call calendarService.modifyEvent with scope.event.path if it exists', function(done) {
        var event = {
          path: 'aPath',
          etag: 'anEtag',
          end: this.fcMoment()
        };
        this.scope.event = event;
        this.calendarServiceMock.modifyEvent = function(path, e, oldEvent, etag) {
          expect(path).to.equal(event.path);
          expect(etag).to.equal(event.etag);
          done();
        };
        this.controller('calendarController', {$scope: this.scope});
        this.scope.eventDropAndResize(false, event, this.fcMoment.duration(10));
      });

      it('should send a CALENDAR_EVENTS.REVERT_MODIFICATION with the event when the drap and drop if reverted ', function(done) {
        var event = {
          path: 'aPath',
          etag: 'anEtag',
          end: this.fcMoment()
        };

        this.scope.event = event;

        var oldEvent;
        this.rootScope.$on(this.CALENDAR_EVENTS.REVERT_MODIFICATION, function(angularEvent, event) {
          expect(event).to.equal(oldEvent);
          done();
        });

        this.calendarServiceMock.modifyEvent = function(path, e, _oldEvent, etag, revertFunc) {
          oldEvent = _oldEvent;
          revertFunc();
          return $q.when({});
        };

        this.controller('calendarController', {$scope: this.scope});
        this.scope.eventDropAndResize(false, event, this.fcMoment.duration(10));
      });

      it('should compute the event before the resize and pass it to calendarService.modifyEvent', function(done) {
        var origEnd = this.fcMoment('2016-01-10 12:00');
        var event = {
          path: 'aPath',
          etag: 'anEtag',
          end: this.fcMoment(origEnd)
        };

        this.scope.event = event;
        var delta = this.fcMoment.duration(1, 'hours');

        this.calendarServiceMock.modifyEvent = function(path, e, oldEvent, etag, revertFunc) {
          expect(oldEvent.end.add(delta).isSame(origEnd)).to.be.true;
          done();
        };

        this.controller('calendarController', {$scope: this.scope});
        this.scope.eventDropAndResize(false, event, delta);
      });

      it('should compute the event before the drop and pass it calendarService.modifyEvent', function(done) {
        var origEnd = this.fcMoment('1997-08-13 10:00');
        var origStart = this.fcMoment('1997-08-13 11:00');
        var event = {
          path: 'aPath',
          etag: 'anEtag',
          start: this.fcMoment(origStart),
          end: this.fcMoment(origEnd)
        };

        this.scope.event = event;
        var delta = this.fcMoment.duration(1, 'hours');

        this.calendarServiceMock.modifyEvent = function(path, e, oldEvent, etag, revertFunc) {
          expect(oldEvent.end.add(delta).isSame(origEnd)).to.be.true;
          expect(oldEvent.start.add(delta).isSame(origStart)).to.be.true;
          done();
        };

        this.controller('calendarController', {$scope: this.scope});
        this.scope.eventDropAndResize(true, event, delta);
      });

      it('should call calendarService.modifyEvent with a built path if scope.event.path does not exist', function(done) {
        var event = {
          etag: 'anEtag',
          end: this.fcMoment(),
          clone: function() {
            return event;
          }
        };
        var calendarHomeId = 'calendarHomeId';
        this.scope.calendarHomeId = calendarHomeId;
        this.scope.event = event;

        this.calendarServiceMock.modifyEvent = function(path, e, oldEvent, etag) {
          expect(path).to.equal('/calendars/' + calendarHomeId + '/events');
          expect(etag).to.equal(event.etag);
          done();
        };
        this.controller('calendarController', {$scope: this.scope});
        this.scope.eventDropAndResize(false, event, this.fcMoment.duration(10, 'seconds'));
      });

      it('should broadcast CALENDAR_EVENTS.HOME_CALENDAR_VIEW_CHANGE when the view change', function(done) {
        this.controller('calendarController', {$scope: this.scope});

        var event = this.CalendarShell.fromIncompleteShell({
          etag: 'anEtag'
        });

        this.rootScope.$on(this.CALENDAR_EVENTS.HOME_CALENDAR_VIEW_CHANGE, function(angularEvent, _event) {
          expect(_event).to.equals(event);
          done();
        });

        this.scope.uiConfig.calendar.viewRender(event);

      });

      it('should receive CALENDAR_EVENTS.MINI_CALENDAR.DATE_CHANGE and change view if needed', function(done) {
        this.controller('calendarController', {$scope: this.scope});
        var date = this.fcMoment('2015-01-13');
        var first = true;
        self = this;
        var spy = this.uiCalendarConfig.calendars.calendarId.fullCalendar = sinon.spy(function(name, newDate) {
          if (name === 'getView') {
            if (first) {
              first = false;
              self.rootScope.$broadcast(self.CALENDAR_EVENTS.MINI_CALENDAR.DATE_CHANGE, date);
            }
            return {
              start: self.fcMoment('2015-01-01'),
              end: self.fcMoment('2015-01-10')
            };
          }
          if (name === 'gotoDate') {
            expect(newDate.isSame(date, 'day')).to.be.true;
            expect(spy).to.be.calledTwice;
            done();
          }
        });

        this.rootScope.$broadcast(this.CALENDAR_EVENTS.MINI_CALENDAR.DATE_CHANGE, this.fcMoment('2015-01-13'));
        this.scope.uiConfig.calendar.viewRender({});
        this.scope.$digest();

      });

    });

    describe('the ws event listener', function() {

      var wsEventCreateListener, wsEventModifyListener, wsEventDeleteListener, wsEventRequestListener, wsEventReplyListener, wsEventCancelListener;

      beforeEach(function() {
        liveNotification = function(namespace) {
          expect(namespace).to.equal('/calendars');
          return {
            removeListener: sinon.spy(),
            on: function(event, handler) {
              switch (event) {
                case self.CALENDAR_EVENTS.WS.EVENT_CREATED:
                  wsEventCreateListener = handler;
                  break;
                case self.CALENDAR_EVENTS.WS.EVENT_UPDATED:
                  wsEventModifyListener = handler;
                  break;
                case self.CALENDAR_EVENTS.WS.EVENT_DELETED:
                  wsEventDeleteListener = handler;
                  break;
                case self.CALENDAR_EVENTS.WS.EVENT_REQUEST:
                  wsEventRequestListener = handler;
                  break;
                case self.CALENDAR_EVENTS.WS.EVENT_REPLY:
                  wsEventReplyListener = handler;
                  break;
                case self.CALENDAR_EVENTS.WS.EVENT_CANCEL:
                  wsEventCancelListener = handler;
                  break;
              }
            }
          };
        };

        this.scope.uiConfig = {
          calendar: {}
        };

        this.controller('calendarController', {
          $rootScope: this.rootScope,
          $scope: this.scope
        });
      });

      it('should add  the event on EVENT_CREATED', function() {
        var event = {id: 'anId'};
        var path = 'path';
        var etag = 'etag';
        fullCalendarSpy = this.uiCalendarConfig.calendars.calendarId.fullCalendar = sinon.spy();

        this.scope.uiConfig.calendar.viewRender({});
        wsEventCreateListener({event: event, eventPath: path, etag: etag});
        this.scope.$digest();
        expect(fullCalendarSpy).to.have.been.calledWith('clientEvents', event.id);
        expect(this.CalendarShellMock.from).to.have.been.calledWith(event, {path: path, etag: etag});
        expect(fullCalendarSpy).to.have.been.calledWith('renderEvent', sinon.match(event));
      });

      it('should add the event on EVENT_REQUEST if not already there', function() {
        var event = {id: 'anId'};
        var path = 'path';
        var etag = 'etag';
        fullCalendarSpy = this.uiCalendarConfig.calendars.calendarId.fullCalendar = sinon.spy();

        this.scope.uiConfig.calendar.viewRender({});
        wsEventRequestListener({event: event, eventPath: path, etag: etag});
        this.scope.$digest();
        expect(fullCalendarSpy).to.have.been.calledWith('clientEvents', event.id);
        expect(this.CalendarShellMock.from).to.have.been.calledWith(event, {path: path, etag: etag});
        expect(fullCalendarSpy).to.have.been.calledWith('renderEvent', sinon.match(event));
      });

      it('should replace the event on EVENT_REQUEST if already there', function() {
        var event = {id: 'anId'};
        var path = 'path';
        var etag = 'etag';
        fullCalendarSpy = this.uiCalendarConfig.calendars.calendarId.fullCalendar = sinon.stub();
        fullCalendarSpy.withArgs('clientEvents', event.id).returns([event]);

        this.scope.uiConfig.calendar.viewRender({});
        wsEventRequestListener({event: event, eventPath: path, etag: etag});
        this.scope.$digest();
        expect(this.CalendarShellMock.from).to.have.been.calledWith(event, {path: path, etag: etag});
        expect(fullCalendarSpy).to.have.been.calledWith('clientEvents', event.id);
        expect(fullCalendarSpy).to.have.been.calledWith('renderEvent', sinon.match(event));
        expect(fullCalendarSpy).to.have.been.calledWith('removeEvents', event.id);
      });

      it('should replace the event EVENT_UPDATED', function() {
        var event = {id: 'anId'};
        var path = 'path';
        var etag = 'etag';
        fullCalendarSpy = this.uiCalendarConfig.calendars.calendarId.fullCalendar = sinon.stub();
        fullCalendarSpy.withArgs('clientEvents', event.id).returns([event]);

        this.scope.uiConfig.calendar.viewRender({});
        wsEventModifyListener({event: event, eventPath: path, etag: etag});
        this.scope.$digest();
        expect(this.CalendarShellMock.from).to.have.been.calledWith(event, {path: path, etag: etag});
        expect(fullCalendarSpy).to.have.been.calledWith('clientEvents', event.id);
        expect(fullCalendarSpy).to.have.been.calledWith('removeEvents', event.id);
        expect(fullCalendarSpy).to.have.been.calledWith('renderEvent', sinon.match(event));
      });

      it('should replace the event EVENT_REPLY', function() {
        var event = {id: 'anId'};
        var reply = {id: 'anId', reply: true};
        var path = 'path';
        var etag = 'etag';
        this.CalendarShellMock.from = sinon.stub().returns(reply);
        fullCalendarSpy = this.uiCalendarConfig.calendars.calendarId.fullCalendar = sinon.stub();
        fullCalendarSpy.withArgs('clientEvents', event.id).returns([event]);

        this.scope.uiConfig.calendar.viewRender({});
        wsEventReplyListener({event: event, eventPath: path, etag: etag});
        this.scope.$digest();
        expect(this.CalendarShellMock.from).to.have.been.calledWith(event);
        expect(fullCalendarSpy).to.have.been.calledWith('clientEvents', event.id);
        expect(fullCalendarSpy).to.have.been.calledWith('removeEvents', event.id);
        expect(this.eventUtilsMock.applyReply).to.have.been.calledWith(event, reply);
        expect(fullCalendarSpy).to.have.been.calledWith('renderEvent', sinon.match(event));
      });

      it('should remove the event on EVENT_DELETED', function() {
        var event = {id: 'anId'};
        var path = 'path';
        var etag = 'etag';
        fullCalendarSpy = this.uiCalendarConfig.calendars.calendarId.fullCalendar = sinon.stub();
        fullCalendarSpy.withArgs('clientEvents', event.id).returns([event]);

        this.scope.uiConfig.calendar.viewRender({});
        wsEventDeleteListener({event: event, eventPath: path, etag: etag});
        this.scope.$digest();
        expect(this.CalendarShellMock.from).to.have.been.calledWith(event, {path: path, etag: etag});
        expect(fullCalendarSpy).to.have.been.calledWith('removeEvents', event.id);
      });

      it('should remove the event on EVENT_CANCEL', function() {
        var event = {id: 'anId'};
        var path = 'path';
        var etag = 'etag';
        fullCalendarSpy = this.uiCalendarConfig.calendars.calendarId.fullCalendar = sinon.stub();
        fullCalendarSpy.withArgs('clientEvents', event.id).returns([event]);

        this.scope.uiConfig.calendar.viewRender({});
        wsEventCancelListener({event: event, eventPath: path, etag: etag});
        this.scope.$digest();
        expect(this.CalendarShellMock.from).to.have.been.calledWith(event, {path: path, etag: etag});
        expect(fullCalendarSpy).to.have.been.calledWith('removeEvents', event.id);
      });

      it('should transform start and end date if allday is true when modified event', function() {
        var event = {id: 'anId', allDay: true};

        var fullCalendarSpy = this.uiCalendarConfig.calendars.calendarId.fullCalendar = sinon.stub();

        fullCalendarSpy.withArgs('clientEvents').returns([{
          _allDay: '_allDay',
          _end: '_end',
          _id: '_id', _start: '_start',
          start: self.fcMoment('2013-03-07T07:00:00-08:00'),
          end: self.fcMoment('2013-03-07T07:00:00-08:00')
        }]);

        this.scope.uiConfig.calendar.viewRender({});
        wsEventModifyListener({event: event});
        this.scope.$digest();
        expect(fullCalendarSpy).to.have.been.calledWith('clientEvents', event.id);
        expect(fullCalendarSpy).to.have.been.calledWith('removeEvents', event.id);
        expect(fullCalendarSpy).to.have.been.calledWith('renderEvent', sinon.match({
          _allDay: true,
          _end: '_end',
          _id: '_id',
          _start: '_start',
          id: 'anId',
          allDay: true
        }));
      });

    });
  });
});
