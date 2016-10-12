'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe.skip('The calendarEditionController controller', function() {
  var self;

  beforeEach(function() {
    self = this;
    this.uuid4 = {
      // This is a valid uuid4. Change this if you need other uuids generated.
      _uuid: '00000000-0000-4000-a000-000000000000',
      generate: function() {
        return this._uuid;
      }
    };

    this.getAllRemovedUsersIdResult = [];
    this.addUserGroup = sinon.spy();
    this.removeUserGroup = sinon.spy();
    this.getAllRemovedUsersId = sinon.stub().returns(this.getAllRemovedUsersIdResult);
    this.calendarRight = {
      getPublicRight: sinon.spy(),
      getUserRight: sinon.spy(),
      getAllUserRight: sinon.stub().returns([]),
      clone: sinon.spy(),
      removeUserRight: sinon.spy(),
      update: sinon.spy(),
      equals: sinon.stub().returns(true)
    };

    this.userUtilsMock = {
      displayNameOf: sinon.spy()
    };

    this.calendarService = {
      listCalendars: sinon.stub().returns([]),
      getRight: sinon.spy(function() {
        return $q.when(self.calendarRight);
      }),
      modifyCalendar: sinon.spy(function() {
        return $q.when();
      }),
      modifyRights: sinon.spy(function() {
        return $q.when();
      })
    };

    this.userAPIMock = {
      user: sinon.spy()
    };

    this.DelegationEditionHelperMock = sinon.spy(function() {
      this.addUserGroup = self.addUserGroup;
      this.removeUserGroup = self.removeUserGroup;
      this.getAllRemovedUsersId = self.getAllRemovedUsersId;
    });

    this.notificationFactoryMock = {
      weakInfo: sinon.spy()
    };

    this.stateMock = {
      go: sinon.spy()
    };
    this.calendarMock = null;
    this.screenSize = {};

    module('jadeTemplates');
    angular.mock.module('esn.calendar', 'linagora.esn.graceperiod');
    angular.mock.module(function($provide) {
      $provide.value('screenSize', self.screenSize);
      $provide.value('uuid4', self.uuid4);
      $provide.value('calendarService', self.calendarService);
      $provide.value('DelegationEditionHelper', self.DelegationEditionHelperMock);
      $provide.value('notificationFactory', self.notificationFactoryMock);
      $provide.value('$state', self.stateMock);
      $provide.value('calendar', self.calendarMock);
      $provide.value('userAPI', self.userAPIMock);
      $provide.value('userUtils', self.userUtilsMock);
    });
  });

  beforeEach(angular.mock.inject(function($rootScope, $controller, CalendarCollectionShell, $q, CALENDAR_RIGHT) {
    this.$rootScope = $rootScope;
    this.$scope = this.$rootScope.$new();
    this.CalendarCollectionShell = CalendarCollectionShell;
    this.$scope.calendarHomeId = '12345';
    this.CALENDAR_RIGHT = CALENDAR_RIGHT;
    this.$q = $q;

    this.initController = function() {
      $controller('calendarEditionController', {$scope: this.$scope});
    };
  }));

  it('should correctly initialize scope if newCalendar is true', function() {
    this.initController();
    this.$scope.$digest();
    expect(this.$scope.calendar.href).to.equal('/calendars/12345/00000000-0000-4000-a000-000000000000.json');
    expect(this.$scope.calendar.color).to.exist;
  });

  it('should select main tab when initializing', function() {
    this.initController();
    expect(this.$scope.selectedTab).to.equal('main');
  });

  it('should correcly initialize isAdmin if user is admin', function() {
    this.calendarRight.getUserRight = sinon.stub().returns(this.CALENDAR_RIGHT.ADMIN);

    this.$scope.calendar = {href: 'data/data.json'};
    this.initController();
    this.$rootScope.$digest();
    expect(this.$scope.isAdmin).to.be.true;
    expect(this.calendarRight.getUserRight).to.have.been.calledWith(this.$scope.calendarHomeId);
  });

  it('should correcly initialize isAdmin if user is not admin', function() {
    this.calendarRight.getUserRight = sinon.stub().returns(this.CALENDAR_RIGHT.READ);

    this.$scope.calendar = {href: 'data/data.json'};
    this.initController();
    this.$rootScope.$digest();
    expect(this.$scope.isAdmin).to.be.false;
    expect(this.calendarRight.getUserRight).to.have.been.calledWith(this.$scope.calendarHomeId);
  });

  it('should correctly initialize delegation', function() {
    var addUserGroupResult = {};

    this.addUserGroup = sinon.stub().returns(addUserGroupResult);
    this.calendarRight.getPublicRight = sinon.stub().returns('publicSelection');
    this.calendarRight.getAllUserRight = sinon.stub().returns([
      {userId: '12345', right: this.CALENDAR_RIGHT.ADMIN},
      {userId: 'userId', right: 'right'}
    ]);

    this.userUtilsMock.displayNameOf = sinon.stub().returns('displayNameOfResult');

    var user = {firstname: 'firstname', lastname: 'lastname'};

    this.userAPIMock.user = sinon.stub().returns($q.when({data: user}));

    this.$scope.calendar = {href: 'data/data.json'};
    this.initController();
    this.$rootScope.$digest();

    expect(this.userAPIMock.user).to.have.always.been.calledWith('userId');
    expect(this.$scope.publicSelection).to.equal('publicSelection');
    expect(this.addUserGroup).to.have.been.calledWith([{
      firstname: user.firstname,
      lastname: user.lastname,
      displayName: 'displayNameOfResult'
    }], 'right');
    expect(this.userUtilsMock.displayNameOf).to.have.been.calledWith(user);
    expect(this.$scope.delegations).to.equals(addUserGroupResult);
  });

  describe('scope.getMainView', function() {
    it('should select main tab', function() {
      this.initController();
      this.$scope.selectedTab = 'delegation';
      this.$scope.getMainView();
      expect(this.$scope.selectedTab).to.equal('main');
    });
  });

  describe('scope.getDelegationView', function() {
    it('should select delegation tab', function() {
      this.initController();
      this.$scope.selectedTab = 'main';
      this.$scope.getDelegationView();
      expect(this.$scope.selectedTab).to.equal('delegation');
    });
  });

  describe('scope.submit', function() {
    it('should do nothing if the calendar name is empty', function() {
      this.stateMock.go = sinon.spy();
      this.calendarService.modifyCalendar = sinon.spy();
      this.calendarService.createCalendar = sinon.spy();

      this.initController();
      this.$scope.submit();
      expect(this.stateMock.go).to.have.not.been.called;
      expect(this.calendarService.modifyCalendar).to.have.not.been.called;
      expect(this.calendarService.createCalendar).to.have.not.been.called;
    });

    it('should call createCalendar if newCalendar is true (with name having only one char)', function() {
      this.notificationFactoryMock.weakInfo = sinon.spy();
      this.stateMock.go = sinon.spy(function(path) {
        expect(path).to.equal('calendar.main');
      });
      this.calendarService.createCalendar = function(calendarHomeId, shell) {
        expect(calendarHomeId).to.equal('12345');
        expect(shell).to.shallowDeepEqual({
          href: '/calendars/12345/00000000-0000-4000-a000-000000000000.json',
          name: 'N',
          color: 'aColor'
        });

        return {
          then: function(callback) {
            callback();
          }
        };
      };
      this.initController();
      this.$scope.calendar.color = 'aColor';
      this.$scope.calendar.name = 'N';
      this.$scope.submit();
      expect(this.notificationFactoryMock.weakInfo).to.have.been.called;
      expect(this.stateMock.go).to.have.been.called;
    });

    describe('when newCalendar is false', function() {
      it('should return to calendar.list if the calendar and his right has not been modified and if screensize is xs or sm', function() {
        this.screenSize.is = sinon.stub().returns(true);

        this.stateMock.go = sinon.spy(function(path) {
          expect(path).to.equal('calendar.list');
        });
        this.calendarService.modifyCalendar = sinon.spy();

        this.initController();
        this.$scope.calendar.color = 'aColor';
        this.$scope.calendar.name = 'aName';
        this.$scope.oldCalendar.name = 'aName';
        this.$scope.oldCalendar.color = 'aColor';
        this.$scope.newCalendar = false;
        this.$scope.submit();
        this.$rootScope.$digest();

        expect(this.screenSize.is).to.have.been.calledWith('xs, sm');
        expect(this.stateMock.go).to.have.been.called;
        expect(this.calendarService.modifyCalendar).to.have.not.been.called;
      });

      it('should return to calendar.main if the calendar and his right has not been modified and if screensize is md', function() {
        this.screenSize.is = sinon.stub().returns(false);

        this.stateMock.go = sinon.spy(function(path) {
          expect(path).to.equal('calendar.main');
        });
        this.calendarService.modifyCalendar = sinon.spy();

        this.$scope.calendar = {
          href: 'blabla/id.json'
        };
        this.$scope.calendar.color = 'aColor';
        this.$scope.calendar.name = 'aName';
        this.initController();
        this.$scope.oldCalendar.name = 'aName';
        this.$scope.oldCalendar.color = 'aColor';
        this.$scope.newCalendar = false;
        this.$scope.submit();
        this.$rootScope.$digest();

        expect(this.screenSize.is).to.have.been.calledWith('xs, sm');
        expect(this.stateMock.go).to.have.been.called;
        expect(this.calendarService.modifyCalendar).to.have.not.been.called;
      });

      it('should call modifyCalendar if the calendar has been modified (with name having only one char) and directly return to the list if his right has not been changed', function() {
        var modifiedName = 'A';

        this.notificationFactoryMock.weakInfo = sinon.spy();
        this.stateMock.go = sinon.spy(function(path) {
          expect(path).to.equal('calendar.main');
        });

        this.$scope.calendar = {
          href: '/calendars/12345/00000000-0000-4000-a000-000000000000.json',
          color: 'aColor',
          name: 'aName'
        };
        this.calendarService.modifyCalendar = function(calendarHomeId, shell) {
          expect(calendarHomeId).to.equal('12345');
          expect(shell).to.shallowDeepEqual({
            href: '/calendars/12345/00000000-0000-4000-a000-000000000000.json',
            name: modifiedName
          });

          return {
            then: function(callback) {
              callback();
            }
          };
        };
        this.$scope.calendar.name = 'aName';
        this.initController();
        this.$scope.calendar.name = modifiedName;
        this.$scope.newCalendar = false;
        this.$scope.submit();
        this.$rootScope.$digest();

        expect(this.notificationFactoryMock.weakInfo).to.have.been.called;
        expect(this.stateMock.go).to.have.been.called;
        expect(this.calendarService.modifyRights).to.not.have.been.called;
        expect(this.calendarService.modifyCalendar).to.have.been.calledWith('12345', sinon.match({
          href: '/calendars/12345/00000000-0000-4000-a000-000000000000.json',
          name: modifiedName
        }));
      });

      it('should call modifyRight and not modifyCalendar if only right has been changed', function() {
        var clone = {};

        this.calendarRight.clone = sinon.stub().returns(clone);
        this.calendarRight.equals = sinon.stub().returns(false);
        this.getAllRemovedUsersId = sinon.stub().returns(['1']);
        this.notificationFactoryMock.weakInfo = sinon.spy();
        this.stateMock.go = sinon.spy(function(path) {
          expect(path).to.equal('calendar.main');
        });
        this.$scope.calendar = {
          href: '/calendars/12345/00000000-0000-4000-a000-000000000000.json',
          color: 'aColor',
          name: 'aName'
        };
        this.$scope.calendar.name = 'aName';
        this.initController();
        this.$rootScope.$digest();
        this.$scope.newCalendar = false;
        this.$scope.delegations = [{
          user: {_id: 'id', preferredEmail: 'preferredEmail'},
          selection: 'selection'
        }];
        this.$scope.submit();
        this.$rootScope.$digest();

        expect(this.notificationFactoryMock.weakInfo).to.have.been.called;
        expect(this.calendarRight.removeUserRight).to.have.been.calledWith('1');
        expect(this.calendarRight.update).to.have.been.calledWith('id', 'preferredEmail', 'selection');
        expect(this.stateMock.go).to.have.been.called;
        expect(this.calendarService.modifyRights).to.have.been.calledWith(this.$scope.calendarHomeId, sinon.match({href: '/calendars/12345/00000000-0000-4000-a000-000000000000.json'}), sinon.match.same(this.calendarRight), sinon.match.same(clone));
        expect(this.calendarService.modifyCalendar).to.not.have.been.calledWith;
      });

      it('should call both modifyRight and modifyCalendar if all right has been changed', function() {
        var clone = {};
        var modifiedName = 'A';

        this.calendarRight.clone = sinon.stub().returns(clone);
        this.calendarRight.equals = sinon.stub().returns(false);
        this.notificationFactoryMock.weakInfo = sinon.spy();
        this.stateMock.go = sinon.spy(function(path) {
          expect(path).to.equal('calendar.main');
        });
        this.$scope.calendar = {
          href: '/calendars/12345/00000000-0000-4000-a000-000000000000.json',
          color: 'aColor',
          name: 'aName'
        };
        this.$scope.calendar.name = 'aName';
        this.initController();
        this.$scope.calendar.name = modifiedName;
        this.$scope.newCalendar = false;
        this.$scope.submit();
        this.$rootScope.$digest();

        expect(this.notificationFactoryMock.weakInfo).to.have.been.called;
        expect(this.stateMock.go).to.have.been.called;
        expect(this.calendarService.modifyRights).to.have.been.calledWith(this.$scope.calendarHomeId, sinon.match({href: '/calendars/12345/00000000-0000-4000-a000-000000000000.json'}), sinon.match.same(this.calendarRight), sinon.match.same(clone));
        expect(this.calendarService.modifyCalendar).to.have.been.calledWith('12345', sinon.match({
          href: '/calendars/12345/00000000-0000-4000-a000-000000000000.json',
          name: modifiedName
        }));
      });
    });

    describe('scope.addUserGroup', function() {
      it('should add multiple users to the $scope.delegation if newUsersGroups.length>0', function() {
        this.$scope.calendar = {
          href: '/calendars/12345/00000000-0000-4000-a000-000000000000.json',
          color: 'aColor',
          name: 'aName'
        };
        this.initController();
        this.$scope.addUserGroup();
        expect(this.addUserGroup).to.have.been.calledOnce;
      });
    });

    describe('scope.removeUserGroup', function() {
      it('should call the removeUserGroup from delegationEditionHelper', function() {
        this.initController();
        this.$scope.removeUserGroup();
        expect(this.removeUserGroup).to.have.been.calledOnce;
      });
    });
  });

  describe('scope.goToEditDelegation', function() {
    it('should call $state.go to view add users', function() {
      this.initController();
      this.$scope.goToEditDelegation();
      expect(this.stateMock.go).to.have.been.calledWith('calendar.edit-delegation');
    });
  });

  describe('scope.goToCalendarEdit', function() {
    it('should call $state.go to go back view calendar.edit', function() {
      this.initController();
      this.$scope.goToCalendarEdit();
      expect(this.stateMock.go).to.have.been.calledWith('calendar.edit');
    });
  });
});
