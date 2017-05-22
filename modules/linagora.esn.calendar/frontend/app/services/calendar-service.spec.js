'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The calendarService service', function() {
  var CalendarCollectionShellMock,
    CalendarCollectionShellFuncMock,
    CalendarRightShellMock,
    self,
    CalendarRightShellResult,
    calendarApiOptions;

  beforeEach(function() {
    self = this;

    calendarApiOptions = {
      withRights: true
    };

    CalendarCollectionShellMock = function() {
      return CalendarCollectionShellFuncMock.apply(this, arguments);
    };

    CalendarRightShellResult = {};
    CalendarRightShellMock = sinon.stub().returns(CalendarRightShellResult);

    angular.mock.module('esn.calendar');
    angular.mock.module(function($provide) {
      $provide.value('CalendarCollectionShell', CalendarCollectionShellMock);
      $provide.value('CalendarRightShell', CalendarRightShellMock);
    });
  });

  beforeEach(angular.mock.inject(function(calendarService, $httpBackend, $rootScope, calendarAPI, calCalendarSubscriptionApiService, CAL_EVENTS, CAL_DEFAULT_CALENDAR_ID) {
    this.$httpBackend = $httpBackend;
    this.$rootScope = $rootScope;
    this.calendarService = calendarService;
    this.calendarAPI = calendarAPI;
    this.calCalendarSubscriptionApiService = calCalendarSubscriptionApiService;
    this.CAL_EVENTS = CAL_EVENTS;
    this.CAL_DEFAULT_CALENDAR_ID = CAL_DEFAULT_CALENDAR_ID;
  }));

  describe('The removeAndEmit function', function() {
    it('should broadcast a CALENDARS.REMOVE event when the calendar has been created', function() {
      CalendarCollectionShellMock.buildUniqueId = sinon.stub().returns('calUniqueId');

      var calendar = {id: 'calId'};

      this.$rootScope.$broadcast = sinon.stub().returns({});
      this.calendarService.removeAndEmit('homeId', calendar);
      this.$rootScope.$digest();

      expect(self.$rootScope.$broadcast).to.have.been.calledWith(this.CAL_EVENTS.CALENDARS.REMOVE, {uniqueId: 'calUniqueId'});
      expect(CalendarCollectionShellMock.buildUniqueId).to.have.been.calledWith('homeId', calendar.id);
    });
  });

  describe('The addAndEmit function', function() {
    it('should broadcast a CALENDARS.ADD event when the calendar has been created', function() {
      var calendar = {id: 'calId'};

      this.$rootScope.$broadcast = sinon.stub().returns({});
      this.calendarService.addAndEmit('homeId', calendar);
      this.$rootScope.$digest();

      expect(self.$rootScope.$broadcast).to.have.been.calledWith(this.CAL_EVENTS.CALENDARS.ADD, calendar);
    });
  });

  describe('The updateAndEmit function', function() {
    it('should broadcast a CALENDARS.UPDATE event when the calendar has been created', function() {
      var calendar = {id: 'calId'};

      this.$rootScope.$broadcast = sinon.stub().returns({});
      this.calendarService.updateAndEmit('homeId', calendar);
      this.$rootScope.$digest();

      expect(self.$rootScope.$broadcast).to.have.been.calledWith(this.CAL_EVENTS.CALENDARS.UPDATE, calendar);
    });
  });

  describe('The listCalendars fn', function() {
    var response;

    beforeEach(function() {
      response = {
        _links: {
          self: {
            href: '/calendars/56698ca29e4cf21f66800def.json'
          }
        },
        _embedded: {
          'dav:calendar': [
            {
              _links: {
                self: {
                  href: '/calendars/56698ca29e4cf21f66800def/events.json'
                }
              },
              'dav:name': null,
              'caldav:description': null,
              'calendarserver:ctag': 'http://sabre.io/ns/sync/3',
              'apple:color': null,
              'apple:order': null
            }
          ]
        }
      };
    });

    it('should always call calendarService.listCalendars with withRights options', function() {
      this.calendarAPI.listCalendars = sinon.spy(function() {
        return $q.when();
      });

      this.calendarService.listCalendars('homeId');

      expect(self.calendarAPI.listCalendars).to.be.calledWith('homeId', calendarApiOptions);
    });

    it('should cache the calls calendarService.listCalendars', function() {
      this.calendarAPI.listCalendars = sinon.spy(function() {
        return $q.when([]);
      });

      this.calendarService.listCalendars('homeId').then(function() {
        self.calendarService.listCalendars('homeId').then(function() {
          expect(self.calendarAPI.listCalendars).to.have.been.called.once;
        });
      });
      this.$rootScope.$digest();
    });

    it('should wrap each received dav:calendar in a CalendarCollectionShell', function(done) {
      var calendarCollection = {id: this.CAL_DEFAULT_CALENDAR_ID};

      CalendarCollectionShellFuncMock = sinon.spy(function(davCal) {
        expect(davCal).to.deep.equal(response._embedded['dav:calendar'][0]);

        return calendarCollection;
      });

      this.$httpBackend.expectGET('/dav/api/calendars/homeId.json?withRights=true').respond(response);

      this.calendarService.listCalendars('homeId').then(function(calendars) {
        expect(calendars).to.have.length(1);
        expect(calendars[0]).to.equal(calendarCollection);
        expect(CalendarCollectionShellFuncMock).to.have.been.called;
        done();
      });

      this.$httpBackend.flush();
    });

    it('should cache calendars', function() {
      CalendarCollectionShellFuncMock = angular.identity;

      this.$httpBackend.expectGET('/dav/api/calendars/homeId.json?withRights=true').respond(response);

      this.calendarService.listCalendars('homeId').then(function(calendars) {
        self.calendarService.listCalendars('homeId').then(function(calendars2) {
          expect(calendars).to.equal(calendars2);
        });
      });

      this.$httpBackend.flush();
    });
  });

  describe('listAllCalendarsForUser', function() {
    var allCalendars;

    beforeEach(function() {
      sinon.stub(this.calendarAPI, 'listAllCalendars', function() {
        return allCalendars;
      });
    });

    it('should leverage calendarAPI.listAllCalendars', function(done) {
      allCalendars = $q.when([]);

      this.calendarService.listAllCalendarsForUser().then(function() {
        expect(self.calendarAPI.listAllCalendars).to.have.been.calledWith(calendarApiOptions);

        done();
      });

      this.$rootScope.$digest();
    });

    it('should filter user calendars and returns only their _embedded["dav:calendar"]', function(done) {
      var userId = 'userId';
      var calendars = [
        {
          _links: {
            self: {
              href: '/calendars/' + userId + '.json'
            }
          },
          _embedded: {
            'dav:calendar': [
              {
                _links: {
                  self: {
                    href: '/calendars/' + userId + '/events.json'
                  }
                },
                'caldav:description': 'userId'
              },
              {
                _links: {
                  self: {
                    href: '/calendars/' + userId + '/events.json'
                  }
                },
                'caldav:description2': 'userId'
              }
            ]
          }
        },
        {
          _links: {
            self: {
              href: '/calendars/56698ca29e4cf21f66800def.json'
            }
          },
          _embedded: {
            'dav:calendar': [
              {
                _links: {
                  self: {
                    href: '/calendars/56698ca29e4cf21f66800def/events.json'
                  }
                },
                'caldav:description': '56698ca29e4cf21f66800def'
              }
            ]
          }
        }
      ];
      allCalendars = $q.when(calendars);

      CalendarCollectionShellFuncMock = sinon.spy();

      this.calendarService.listAllCalendarsForUser(userId)
        .then(function() {
          expect(self.calendarAPI.listAllCalendars).to.have.been.calledWith(calendarApiOptions);
          expect(CalendarCollectionShellFuncMock.firstCall).to.have.been.calledWith(calendars[0]._embedded['dav:calendar'][0]);
          expect(CalendarCollectionShellFuncMock.secondCall).to.have.been.calledWith(calendars[0]._embedded['dav:calendar'][1]);

          done();
        });

      this.$rootScope.$digest();
    });
  });

  describe('The get calendar fn', function() {
    it('should wrap the received dav:calendar in a CalendarCollectionShell', function(done) {
      var response = {
        _links: {
          self: {
            href: '/calendars/56698ca29e4cf21f66800def/events.json'
          }
        },
        'dav:name': null,
        'caldav:description': null,
        'calendarserver:ctag': 'http://sabre.io/ns/sync/3',
        'apple:color': null,
        'apple:order': null
      };

      var calendarCollection = {};

      CalendarCollectionShellFuncMock = sinon.spy(function(davCal) {
        expect(davCal).to.deep.equal(response);

        return calendarCollection;
      });

      this.$httpBackend.expectGET('/dav/api/calendars/homeId/id.json?withRights=true').respond(response);

      this.calendarService.getCalendar('homeId', 'id').then(function(calendar) {
        expect(calendar).to.equal(calendarCollection);
        expect(CalendarCollectionShellFuncMock).to.have.been.called;
        done();
      });

      this.$httpBackend.flush();
    });

    it('should call the calendarAPI.removeCalendar with right params', function() {
      this.calendarAPI.getCalendar = sinon.spy(function() {
        return $q.when();
      });

      this.calendarService.getCalendar('homeId', 'id');

      expect(this.calendarAPI.getCalendar).to.be.calledWith('homeId', 'id', calendarApiOptions);
    });
  });

  describe('The get right calendar fn', function() {
    it('should wrap the returning server response in  a CalendarRightShell', function() {
      var calendar = {id: 'calId'};

      var body = {
        acl: 'acl',
        invite: 'invite'
      };

      this.$httpBackend.expect('PROPFIND', '/dav/api/calendars/homeId/calId.json', {
        prop: ['cs:invite', 'acl']
      }).respond(200, body);

      var thenSpy = sinon.spy();

      this.calendarService.getRight('homeId', calendar).then(thenSpy);
      this.$httpBackend.flush();
      expect(thenSpy).to.have.been.calledWith(sinon.match.same(CalendarRightShellResult));
      expect(CalendarRightShellMock).to.have.been.calledWith(body.acl, body.invite);
    });
  });

  describe('The remove calendar fn', function() {
    beforeEach(function() {
      CalendarCollectionShellMock.buildUniqueId = sinon.stub().returns('calUniqueId');
    });

    it('should send a delete request to the correct URL', function() {
      this.$httpBackend.expectDELETE('/dav/api/calendars/homeId/cal.json').respond(204, 'response');

      var promiseSpy = sinon.spy();

      this.calendarService.removeCalendar('homeId', {id: 'cal'}).then(promiseSpy);

      this.$httpBackend.flush();
      this.$rootScope.$digest();

      expect(promiseSpy).to.have.been.calledWith(sinon.match({data: 'response'}));
    });

    it('should sync cache of list calendars', function() {
      CalendarCollectionShellFuncMock = angular.identity;

      this.$httpBackend.expectGET('/dav/api/calendars/homeId.json?withRights=true').respond({_embedded: {
        'dav:calendar': [{id: 1}, {id: 2}]
      }});

      this.$httpBackend.expectDELETE('/dav/api/calendars/homeId/2.json').respond(204, 'response');

      var thenSpy = sinon.spy();
      this.calendarService.listCalendars('homeId').then(function() {
        self.calendarService.removeCalendar('homeId', {id: 2}).then(function() {
          self.calendarService.listCalendars('homeId').then(thenSpy);
        });
      });

      this.$httpBackend.flush();
      this.$rootScope.$digest();
      expect(thenSpy).to.have.been.calledWith(sinon.match({
        length: 1,
        0: {id: 1}
      }));
    });

    it('should broadcast a CALENDARS.REMOVE event when the calendar has been created', function() {
      var calendar = {id: 'calId'};

      this.$httpBackend.expectDELETE('/dav/api/calendars/homeId/calId.json').respond(204, 'response');
      this.$rootScope.$broadcast = sinon.stub().returns({});
      this.calendarService.removeCalendar('homeId', calendar);

      this.$httpBackend.flush();
      this.$rootScope.$digest();

      expect(self.$rootScope.$broadcast).to.have.been.calledWith(this.CAL_EVENTS.CALENDARS.REMOVE, {uniqueId: 'calUniqueId'});
    });
  });

  describe('The create calendar fn', function() {
    it('should send a post request to the correct URL', function() {
      var calendar = {id: 'calId'};

      CalendarCollectionShellMock.toDavCalendar = sinon.spy(angular.identity);

      this.$httpBackend.expectPOST('/dav/api/calendars/homeId.json').respond(201, {});

      var promiseSpy = sinon.spy();

      this.calendarService.createCalendar('homeId', calendar).then(promiseSpy);

      this.$httpBackend.flush();
      this.$rootScope.$digest();

      expect(promiseSpy).to.have.been.calledWith(calendar);
      expect(CalendarCollectionShellMock.toDavCalendar).to.have.been.calledWith(calendar);
    });

    it('should sync cache of list calendars', function(done) {
      CalendarCollectionShellFuncMock = angular.identity;

      this.$httpBackend.expectGET('/dav/api/calendars/homeId.json?withRights=true').respond({_embedded: {
        'dav:calendar': [{id: 1}, {id: 2}]
      }});
      this.$httpBackend.expectPOST('/dav/api/calendars/homeId.json').respond(201, {});

      this.calendarService.listCalendars('homeId').then(function() {
        var calendar = {id: 'calId'};

        CalendarCollectionShellMock.toDavCalendar = angular.identity;
        self.calendarService.createCalendar('homeId', calendar).then(function() {
          self.calendarService.listCalendars('homeId').then(function(calendar) {
            expect(calendar).to.shallowDeepEqual({
              length: 3,
              2: {id: 'calId'}
            });
            done();
          });
        });
      });

      this.$httpBackend.flush();
      this.$rootScope.$digest();
    });

    it('should broadcast a CALENDARS.ADD event when the calendar has been created', function() {
      var calendar = {id: 'calId'};

      CalendarCollectionShellMock.toDavCalendar = sinon.spy(angular.identity);

      this.$httpBackend.expectPOST('/dav/api/calendars/homeId.json').respond(201, {});

      this.$rootScope.$broadcast = sinon.spy(angular.identity);

      this.calendarService.createCalendar('homeId', calendar).then(function() {});

      this.$httpBackend.flush();
      this.$rootScope.$digest();

      expect(self.$rootScope.$broadcast).to.have.been.calledWith(this.CAL_EVENTS.CALENDARS.ADD, calendar);
    });
  });

  describe('The modify calendar fn', function() {
    it('should send a put request to the correct URL and return resulting calendar', function() {
      var calendar = {id: 'calId'};

      CalendarCollectionShellMock.toDavCalendar = sinon.spy(angular.identity);

      this.$httpBackend.expect('PROPPATCH', '/dav/api/calendars/homeId/calId.json').respond(204, {});

      var promiseSpy = sinon.spy();

      this.calendarService.modifyCalendar('homeId', calendar).then(promiseSpy);

      this.$httpBackend.flush();
      this.$rootScope.$digest();

      expect(promiseSpy).to.have.been.calledWith(calendar);
      expect(CalendarCollectionShellMock.toDavCalendar).to.have.been.calledWith(calendar);
    });

    it('should sync cache of list calendars', function(done) {
      CalendarCollectionShellFuncMock = angular.identity;

      this.$httpBackend.expectGET('/dav/api/calendars/homeId.json?withRights=true').respond({_embedded: {
        'dav:calendar': [{id: 1}, {id: 'events', selected: true}]
      }});
      this.$httpBackend.expect('PROPPATCH', '/dav/api/calendars/homeId/events.json').respond(204, {});

      this.calendarService.listCalendars('homeId').then(function() {
        var calendar = {id: 'events', name: 'modified cal'};

        CalendarCollectionShellMock.toDavCalendar = angular.identity;
        self.calendarService.modifyCalendar('homeId', calendar).then(function() {
          self.calendarService.listCalendars('homeId').then(function(calendar) {
            expect(calendar).to.shallowDeepEqual({
              length: 2,
              1: {id: 'events', name: 'modified cal', selected: true}
            });
            done();
          });
        });
      });

      this.$httpBackend.flush();
      this.$rootScope.$digest();
    });
  });

  describe('The modify rights fn', function() {
    it('should compute sharee dav diff and send it to sabre', function() {
      var davDiff = 'davDiff';
      var newCalendarShell = {
        toDAVShareRightsUpdate: sinon.stub().returns(davDiff)
      };
      var oldCalendarShell = {};

      this.calendarService.modifyRights('homeId', {id: 'calId'}, newCalendarShell, oldCalendarShell);

      expect(newCalendarShell.toDAVShareRightsUpdate).to.have.been.calledWith(sinon.match.same(oldCalendarShell));
      this.$httpBackend.expect('POST', '/dav/api/calendars/homeId/calId.json', davDiff).respond(200, {});
      this.$httpBackend.flush();
    });
  });

  describe('The subscription functions', function() {
    var calendarHomeId, subscription;

    beforeEach(function() {
      calendarHomeId = '1';
      subscription = {};
    });

    describe('The subscribe function', function() {
      it('should call subscription api service with right parameters', function(done) {
        var subscribeStub = sinon.stub(this.calCalendarSubscriptionApiService, 'subscribe', function() {
          return $q.when(subscription);
        });

        this.$rootScope.$broadcast = sinon.stub().returns({});
        CalendarCollectionShellMock.toDavCalendar = sinon.spy(angular.identity);

        this.calendarService.subscribe(calendarHomeId, subscription)
          .then(function() {
            expect(CalendarCollectionShellMock.toDavCalendar).to.have.been.calledWith(subscription);
            expect(subscribeStub).to.have.been.calledOnce;
            expect(self.$rootScope.$broadcast).to.have.been.calledWith(self.CAL_EVENTS.CALENDARS.ADD, subscription);
            done();
          }, done);

        this.$rootScope.$digest();
      });

      it('should reject when subscription api rejects', function(done) {
        var error = new Error('I failed');
        var subscribeStub = sinon.stub(this.calCalendarSubscriptionApiService, 'subscribe', function() {
          return $q.reject(error);
        });

        this.$rootScope.$broadcast = sinon.stub().returns({});
        CalendarCollectionShellMock.toDavCalendar = sinon.spy(angular.identity);

        this.calendarService.subscribe(calendarHomeId, subscription)
        .then(done, function(err) {
          expect(err.message).to.equal(error.message);
          expect(CalendarCollectionShellMock.toDavCalendar).to.have.been.calledWith(subscription);
          expect(subscribeStub).to.have.been.calledOnce;
          expect(self.$rootScope.$broadcast).to.not.have.been.called;
          done();
        });

        this.$rootScope.$digest();
      });
    });

    describe('The unsubscribe function', function() {
      it('should call subscription api service with right parameters', function(done) {
        var unsubscribeStub = sinon.stub(this.calCalendarSubscriptionApiService, 'unsubscribe', function() {
          return $q.when(subscription);
        });

        this.$rootScope.$broadcast = sinon.stub().returns({});
        this.calendarService.unsubscribe(calendarHomeId, subscription)
        .then(function(result) {
          expect(result).to.equal(subscription);
          expect(unsubscribeStub).to.have.been.calledWith(calendarHomeId, subscription.id);
          expect(self.$rootScope.$broadcast).to.have.been.calledWith(self.CAL_EVENTS.CALENDARS.REMOVE, subscription);
          done();
        }, done);

        this.$rootScope.$digest();
      });

      it('should reject when subscription api rejects', function(done) {
        var error = new Error('I failed');
        var unsubscribeStub = sinon.stub(this.calCalendarSubscriptionApiService, 'unsubscribe', function() {
          return $q.reject(error);
        });

        this.$rootScope.$broadcast = sinon.stub().returns({});
        this.calendarService.unsubscribe(calendarHomeId, subscription)
        .then(done, function(err) {
          expect(err.message).to.equal(error.message);
          expect(unsubscribeStub).to.have.been.calledWith(calendarHomeId, subscription.id);
          expect(self.$rootScope.$broadcast).to.not.have.been.called;
          done();
        }, done);

        this.$rootScope.$digest();
      });
    });

    describe('The updateSubscription function', function() {
      it('should call subscription api service with right parameters', function(done) {
        var updateStub = sinon.stub(this.calCalendarSubscriptionApiService, 'update', function() {
          return $q.when();
        });

        this.$rootScope.$broadcast = sinon.stub().returns({});
        CalendarCollectionShellMock.toDavCalendar = sinon.spy(angular.identity);

        this.calendarService.updateSubscription(calendarHomeId, subscription)
        .then(function() {
          expect(CalendarCollectionShellMock.toDavCalendar).to.have.been.calledWith(subscription);
          expect(updateStub).to.have.been.calledOnce;
          expect(self.$rootScope.$broadcast).to.have.been.calledWith(self.CAL_EVENTS.CALENDARS.UPDATE, subscription);
          done();
        }, done);

        this.$rootScope.$digest();
      });

      it('should reject when subscription api rejects', function(done) {
        var error = new Error('I failed');
        var updateStub = sinon.stub(this.calCalendarSubscriptionApiService, 'update', function() {
          return $q.reject(error);
        });

        this.$rootScope.$broadcast = sinon.stub().returns({});
        CalendarCollectionShellMock.toDavCalendar = sinon.spy(angular.identity);

        this.calendarService.updateSubscription(calendarHomeId, subscription)
        .then(done, function(err) {
          expect(err.message).to.equal(error.message);
          expect(CalendarCollectionShellMock.toDavCalendar).to.have.been.calledWith(subscription);
          expect(updateStub).to.have.been.calledOnce;
          expect(self.$rootScope.$broadcast).to.not.have.been.called;
          done();
        }, done);

        this.$rootScope.$digest();
      });
    });
  });
});
