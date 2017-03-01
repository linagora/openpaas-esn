'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The calendar configuration controller', function() {
  var $rootScope,
    $controller,
    $scope,
    uuid4,
    matchmedia,
    calendarConfigurationController,
    calendarHomeId,
    calendarRight,
    calendarService,
    getAllRemovedUsersIdResult,
    getAllRemovedUsersId,
    addUserGroup,
    addUserGroupResult,
    removeUserGroup,
    userUtilsMock,
    userAPIMock,
    calendarAPI,
    CalDelegationEditionHelperMock,
    notificationFactoryMock,
    stateMock,
    stateParamsMock,
    calendarMock,
    CalendarRightShellMock,
    calendarHomeServiceMock,
    calendar,
    SM_XS_MEDIA_QUERY,
    CALENDAR_RIGHT;

  function initController() {
    return $controller('calendarConfigurationController', { $scope: $scope });
  }

  beforeEach(function() {
    uuid4 = {
      // This is a valid uuid4. Change this if you need other uuids generated.
      _uuid: '00000000-0000-4000-a000-000000000000',
      generate: function() {
        return this._uuid;
      }
    };

    getAllRemovedUsersIdResult = [];

    addUserGroupResult = {};

    addUserGroup = sinon.spy(function() {
      return addUserGroupResult;
    });

    removeUserGroup = sinon.spy();

    getAllRemovedUsersId = sinon.spy(function() {
      return getAllRemovedUsersIdResult;
    });

    userUtilsMock = {
      displayNameOf: sinon.spy()
    };

    userAPIMock = {
      user: sinon.spy()
    };

    CalDelegationEditionHelperMock = sinon.spy(function() {
      this.addUserGroup = addUserGroup;
      this.removeUserGroup = removeUserGroup;
      this.getAllRemovedUsersId = getAllRemovedUsersId;
    });

    notificationFactoryMock = {
      weakInfo: sinon.spy()
    };

    stateMock = {
      go: sinon.spy()
    };

    calendarMock = null;

    matchmedia = {};

    calendarRight = {
      getPublicRight: sinon.spy(),
      getUserRight: sinon.spy(),
      getAllUserRight: sinon.stub().returns([]),
      clone: sinon.spy(),
      removeUserRight: sinon.spy(),
      update: sinon.spy(),
      equals: sinon.stub().returns(true)
    };

    calendarAPI = {
      modifyPublicRights: sinon.spy()
    };

    calendar = 'calendar';

    calendarService = {
      getRight: sinon.spy(function() {
        return $q.when(calendarRight);
      }),

      modifyRights: sinon.spy(function() {
        return $q.when();
      }),

      listCalendars: sinon.stub().returns(
        []
      ),

      createCalendar: sinon.spy(function() {
        return $q.when();
      }),

      modifyCalendar: sinon.spy(function() {
        return $q.when();
      }),

      removeCalendar: sinon.spy(function() {
        return $q.when();
      }),

      getCalendar: sinon.spy(function() {
        return $q.when(calendar);
      })
    };

    calendarHomeServiceMock = {
      getUserCalendarHomeId: sinon.spy(function() {
        return $q.when(calendarHomeId);
      })
    };

    stateParamsMock = {
      calendarId: '123'
    };

    calendarHomeId = '12345';

    CalendarRightShellMock = sinon.spy();
  });

  beforeEach(function() {
    angular.mock.module('esn.calendar', function($provide) {
      $provide.value('$state', stateMock);
      $provide.value('$stateParams', stateParamsMock);
      $provide.value('uuid4', uuid4);
      $provide.value('calendarAPI', calendarAPI);
      $provide.value('calendarService', calendarService);
      $provide.value('calendarHomeService', calendarHomeServiceMock);
      $provide.value('matchmedia', matchmedia);
      $provide.value('CalDelegationEditionHelper', CalDelegationEditionHelperMock);
      $provide.value('notificationFactory', notificationFactoryMock);
      $provide.value('calendar', calendarMock);
      $provide.value('userAPI', userAPIMock);
      $provide.value('userUtils', userUtilsMock);
      $provide.value('CalendarRightShell', CalendarRightShellMock);
    });
  });

  beforeEach(function() {
    angular.mock.inject(function(_$rootScope_, _$controller_, _CALENDAR_RIGHT_, _SM_XS_MEDIA_QUERY_) {
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $controller = _$controller_;
      CALENDAR_RIGHT = _CALENDAR_RIGHT_;
      SM_XS_MEDIA_QUERY = _SM_XS_MEDIA_QUERY_;
    });
  });

  beforeEach(function() {
    calendarConfigurationController = initController();

    calendarConfigurationController.calendarHomeId = calendarHomeId;
  });

  describe('the $onInit function', function() {

    beforeEach(function() {
      calendarConfigurationController.activate = sinon.spy();
    });

    it('should call calendarHomeService.getUserCalendarHomeId() to get the calendarHomeId', function() {
      calendarConfigurationController.$onInit();

      expect(calendarHomeServiceMock.getUserCalendarHomeId).to.be.called;
    });

    it('should initialize calendarHomeId', function() {
      delete calendarConfigurationController.calendarHomeId;

      calendarConfigurationController.$onInit();

      $rootScope.$digest();

      expect(calendarConfigurationController.calendarHomeId).to.be.equal(calendarHomeId);
    });

    it('should calendarService.getCalendar to get the calendar if calendarId is not null', function() {
      calendarConfigurationController.$onInit();

      $rootScope.$digest();

      expect(calendarService.getCalendar).to.be.calledWith(calendarHomeId, stateParamsMock.calendarId);
    });

    it('should not call calendarService.getCalendar if calendarId is null', function() {
      delete stateParamsMock.calendarId;

      calendarConfigurationController.$onInit();

      $rootScope.$digest();

      expect(calendarService.getCalendar).to.not.be.called;
    });

    it('should initialize calendar with the right calendar when we want configure a calendar', function() {
      calendarConfigurationController.$onInit();

      $rootScope.$digest();

      expect(calendarConfigurationController.calendar).to.be.equal(calendar);
    });

    it('should call the activate function', function() {
      calendarConfigurationController.activate = sinon.spy();

      calendarConfigurationController.$onInit();

      $rootScope.$digest();

      expect(calendarConfigurationController.activate).to.be.called;
    });

    describe('if $stateParams.addUsersFromDelegationState not null', function() {

      beforeEach(function() {
        stateParamsMock.addUsersFromDelegationState = {
          newUsersGroups: ['user'],
          selection: 'none'
        };
      });

      it('should initialize newUsersGroups', function() {
        calendarConfigurationController.addUserGroup = sinon.spy();

        calendarConfigurationController.$onInit();

        $rootScope.$digest();

        expect(calendarConfigurationController.newUsersGroups).to.deep.equal(stateParamsMock.addUsersFromDelegationState.newUsersGroups);
      });

      it('should initialize selection', function() {
        calendarConfigurationController.$onInit();

        $rootScope.$digest();

        expect(calendarConfigurationController.selection).to.deep.equal(stateParamsMock.addUsersFromDelegationState.selection);
      });

      it('should call addUserGroup', function() {
        calendarConfigurationController.addUserGroup = sinon.spy();

        calendarConfigurationController.$onInit();

        $rootScope.$digest();

        expect(calendarConfigurationController.addUserGroup).to.be.called;
      });

      it('should call getDelegationView', function() {
        calendarConfigurationController.getDelegationView = sinon.spy();

        calendarConfigurationController.$onInit();

        $rootScope.$digest();

        expect(calendarConfigurationController.getDelegationView).to.be.called;
      });
    });
  });

  describe('the activate function', function() {

    it('should initialize newCalendar with true it is a new calendar', function() {
      calendarConfigurationController.activate();

      expect(calendarConfigurationController.newCalendar).to.be.true;
    });

    it('should initialize newCalendar with false it is not a new calendar', function() {
      calendarConfigurationController.calendar = {
        id: '123456789'
      };

      calendarConfigurationController.activate();

      expect(calendarConfigurationController.newCalendar).to.be.false;
    });

    it('should initialize self.calendar with self.calendar if it is not a new calendar', function() {
      calendarConfigurationController.calendar = {
        id: '123456789'
      };

      calendarConfigurationController.activate();

      expect(calendarConfigurationController.calendar).to.have.been.deep.equal(calendarConfigurationController.calendar);
    });

    it('should initialize newUsersGroups with an empty array', function() {
      calendarConfigurationController.activate();

      expect(calendarConfigurationController.newUsersGroups).to.deep.equal;
    });

    it('should select main tab when initializing', function() {
      calendarConfigurationController.activate();

      expect(calendarConfigurationController.selectedTab).to.equal('main');
    });

    it('should initialize isDefaultCalendar to true if it is the default calendar', function() {
      calendarConfigurationController.calendar = {
        id: 'events'
      };

      calendarConfigurationController.activate();

      expect(calendarConfigurationController.isDefaultCalendar).to.be.true;
    });

    it('should initialize isDefaultCalendar to false if it is not the default calendar', function() {
      calendarConfigurationController.calendar = {
        id: '123456789'
      };

      calendarConfigurationController.activate();

      expect(calendarConfigurationController.isDefaultCalendar).to.be.false;
    });

    it('should initialize calendarRight with a new CalendarRightShell if newCalendar is true', function() {
      calendarConfigurationController.activate();

      expect(CalendarRightShellMock).to.be.calledWithNew;
    });

    it('should initialize calendarRight with an old CalendarRightShell if newCalendar is false', function() {
      calendarConfigurationController.calendar = {
        id: '123456789'
      };

      calendarConfigurationController.activate();

      expect(calendarService.getRight).to.be.calledWith(calendarHomeId, calendarConfigurationController.calendar);
    });

    it('should copy self.calendar in self.oldCalendar', function() {
      calendarConfigurationController.calendar = {
        id: '123456789'
      };

      calendarConfigurationController.activate();

      expect(calendarConfigurationController.oldCalendar).to.deep.equal(calendarConfigurationController.calendar);
    });

    it('should initialize self.selection with \'none\'', function() {
      calendarConfigurationController.activate();

      expect(calendarConfigurationController.selection).to.equal('none');
    });

    it('should initialize self.delegationTypes with an array contains the different rights', function() {
      var delegationTypesExpected = [{
        value: CALENDAR_RIGHT.NONE,
        name: 'None',
        access: 'all'
      }, {
        value: CALENDAR_RIGHT.READ_WRITE,
        name: 'Read and Write',
        access: 'users'
      }, {
        value: CALENDAR_RIGHT.READ,
        name: 'Read only',
        access: 'all'
      }];

      calendarConfigurationController.activate();

      expect(calendarConfigurationController.delegationTypes).to.deep.equal(delegationTypesExpected);
    });

    it('should initialize self.publicRights with an array contains the different rights', function() {
      var publicRightsExpected = [
        {
          value: CALENDAR_RIGHT.CUSTOM,
          name: 'Read'
        }, {
          value: CALENDAR_RIGHT.FREE_BUSY,
          name: 'Private'
        }
      ];

      calendarConfigurationController.activate();

      expect(calendarConfigurationController.publicRights).to.deep.equal(publicRightsExpected);
    });

    it('should correcly initialize isAdmin if user is admin', function() {
      calendarRight.getUserRight = sinon.stub().returns(CALENDAR_RIGHT.ADMIN);
      calendarConfigurationController.calendar = {
        href: 'data/data.json'
      };

      calendarConfigurationController.activate();
      $rootScope.$digest();

      expect(calendarConfigurationController.isAdmin).to.be.true;
      expect(calendarRight.getUserRight).to.have.been.calledWith(calendarConfigurationController.calendarHomeId);
    });

    it('should correcly initialize isAdmin if user is not admin', function() {
      calendarRight.getUserRight = sinon.stub().returns(CALENDAR_RIGHT.READ);
      calendarConfigurationController.calendar = {
        href: 'data/data.json'
      };

      calendarConfigurationController.activate();
      $rootScope.$digest();

      expect(calendarConfigurationController.isAdmin).to.be.false;
      expect(calendarRight.getUserRight).to.have.been.calledWith(calendarConfigurationController.calendarHomeId);
    });

    it('should correctly initialize delegation', function() {
      calendarRight.getPublicRight = sinon.stub().returns('publicSelection');
      calendarRight.getAllUserRight = sinon.stub().returns([
        {userId: '12345', right: CALENDAR_RIGHT.ADMIN},
        {userId: 'userId', right: 'right'}
      ]);

      userUtilsMock.displayNameOf = sinon.stub().returns('displayNameOfResult');

      var user = { firstname: 'firstname', lastname: 'lastname' };

      userAPIMock.user = sinon.stub().returns($q.when({ data: user }));

      calendarConfigurationController.calendar = {
        href: 'data/data.json'
      };

      calendarConfigurationController.activate();
      $rootScope.$digest();

      expect(userAPIMock.user).to.have.always.been.calledWith('userId');
      expect(calendarConfigurationController.publicSelection).to.equal('publicSelection');
      expect(addUserGroup).to.have.been.calledWith([{
        firstname: user.firstname,
        lastname: user.lastname,
        displayName: 'displayNameOfResult'
      }], 'right');
      expect(userUtilsMock.displayNameOf).to.have.been.calledWith(user);
      expect(calendarConfigurationController.delegations).to.equals(addUserGroupResult);
    });

    it('should correctly initialize self.calendar if newCalendar is true', function() {
      calendarConfigurationController.activate();

      expect(calendarConfigurationController.calendar.href).to.equal('/calendars/12345/00000000-0000-4000-a000-000000000000.json');
      expect(calendarConfigurationController.calendar.color).to.exist;
    });

    it('should correctly initialize self.calendar if newCalendar is false', function() {
      calendarConfigurationController.calendar = {
        id: '123456789'
      };

      calendarConfigurationController.activate();

      expect(calendarConfigurationController.calendar.href).to.not.equal('/calendars/12345/00000000-0000-4000-a000-000000000000.json');
      expect(calendarConfigurationController.calendar.color).to.not.exist;
    });
  });

  describe('the submit function', function() {
    it('should do nothing if the calendar name is empty', function() {
      calendarConfigurationController.activate();
      calendarConfigurationController.submit();

      expect(stateMock.go).to.not.have.been.called;
      expect(calendarService.modifyCalendar).to.not.have.been.called;
      expect(calendarService.createCalendar).to.not.have.been.calledWith();
    });

    it('should call createCalendar if newCalendar is true (with name having only one char)', function() {
      notificationFactoryMock.weakInfo = sinon.spy();
      stateMock.go = sinon.spy(function(path) {
        expect(path).to.equal('calendar.main');
      });
      calendarService.createCalendar = function(calendarHomeId, shell) {
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

      calendarConfigurationController.activate();

      calendarConfigurationController.calendar.color = 'aColor';
      calendarConfigurationController.calendar.name = 'N';

      calendarConfigurationController.submit();

      expect(notificationFactoryMock.weakInfo).to.have.been.called;
      expect(stateMock.go).to.have.been.called;
    });

    describe('when newCalendar is false', function() {
      it('should return to calendar.list if the calendar, his right and his public rights have not been modified and if screensize is xs or sm', function() {
        matchmedia.is = sinon.stub().returns(true);
        stateMock.go = sinon.spy(function(path) {
          expect(path).to.equal('calendar.list');
        });
        calendarService.modifyCalendar = sinon.spy();

        calendarConfigurationController.calendar = {
          id: '123456789',
          href: '/calendars/12345/00000000-0000-4000-a000-000000000000.json'
        };

        calendarConfigurationController.activate();

        calendarConfigurationController.calendar.color = 'aColor';
        calendarConfigurationController.calendar.name = 'aName';
        calendarConfigurationController.oldCalendar.name = 'aName';
        calendarConfigurationController.oldCalendar.color = 'aColor';
        calendarConfigurationController.newCalendar = false;

        calendarConfigurationController.submit();
        $rootScope.$digest();

        expect(matchmedia.is).to.have.been.calledWith(SM_XS_MEDIA_QUERY);
        expect(stateMock.go).to.have.been.called;
        expect(calendarService.modifyCalendar).to.have.not.been.called;
      });

      it('should return to calendar.main if the calendar, his right and his public rights have not been modified and if screensize is md', function() {
        calendarRight.getPublicRight = sinon.stub().returns('publicSelection');
        matchmedia.is = sinon.stub().returns(false);
        stateMock.go = sinon.spy(function(path) {
          expect(path).to.equal('calendar.main');
        });
        calendarService.modifyCalendar = sinon.spy();
        calendarConfigurationController.calendar = {
          href: 'blabla/id.json'
        };
        calendarConfigurationController.calendar.color = 'aColor';
        calendarConfigurationController.calendar.name = 'aName';

        calendarConfigurationController.activate();
        $rootScope.$digest();

        calendarConfigurationController.publicSelection = 'publicSelection';
        calendarConfigurationController.oldCalendar.name = 'aName';
        calendarConfigurationController.oldCalendar.color = 'aColor';
        calendarConfigurationController.newCalendar = false;

        calendarConfigurationController.submit();
        $rootScope.$digest();

        expect(matchmedia.is).to.have.been.calledWith(SM_XS_MEDIA_QUERY);
        expect(stateMock.go).to.have.been.called;
        expect(calendarService.modifyCalendar).to.have.not.been.called;
        expect(calendarAPI.modifyPublicRights).to.have.not.been.called;
      });

      it('should call modifyCalendar if the calendar has been modified (with name having only one char) and directly return to the list if his right and public right have not been changed', function() {
        var modifiedName = 'A';

        calendarRight.getPublicRight = sinon.stub().returns('publicSelection');
        notificationFactoryMock.weakInfo = sinon.spy();
        stateMock.go = sinon.spy(function(path) {
          expect(path).to.equal('calendar.main');
        });

        calendarConfigurationController.calendar = {
          href: '/calendars/12345/00000000-0000-4000-a000-000000000000.json',
          color: 'aColor',
          name: 'aName'
        };

        calendarService.modifyCalendar = sinon.spy(function(calendarHomeId, shell) {
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
        });
        calendarConfigurationController.calendar.name = 'aName';

        calendarConfigurationController.activate();
        $rootScope.$digest();

        calendarConfigurationController.publicSelection = 'publicSelection';
        calendarConfigurationController.calendar.name = modifiedName;
        calendarConfigurationController.newCalendar = false;

        calendarConfigurationController.submit();
        $rootScope.$digest();

        expect(notificationFactoryMock.weakInfo).to.have.been.called;
        expect(stateMock.go).to.have.been.called;
        expect(calendarService.modifyRights).to.not.have.been.called;
        expect(calendarAPI.modifyPublicRights).to.have.not.been.called;
        expect(calendarService.modifyCalendar).to.have.been.calledWith('12345', sinon.match({
          href: '/calendars/12345/00000000-0000-4000-a000-000000000000.json',
          name: modifiedName
        }));
      });

      it('should call modifyRight and not modifyCalendar nor modifyPublicRights if only right has been changed', function() {
        var clone = {};

        getAllRemovedUsersIdResult = ['1'];
        calendarRight.getPublicRight = sinon.stub().returns('publicSelection');
        calendarRight.clone = sinon.stub().returns(clone);
        calendarRight.equals = sinon.stub().returns(false);
        notificationFactoryMock.weakInfo = sinon.spy();
        stateMock.go = sinon.spy(function(path) {
          expect(path).to.equal('calendar.main');
        });
        calendarConfigurationController.calendar = {
          href: '/calendars/12345/00000000-0000-4000-a000-000000000000.json',
          color: 'aColor',
          name: 'aName'
        };
        calendarConfigurationController.calendar.name = 'aName';

        calendarConfigurationController.activate();
        $rootScope.$digest();

        calendarConfigurationController.publicSelection = 'publicSelection';
        calendarConfigurationController.newCalendar = false;
        calendarConfigurationController.delegations = [{
          user: { _id: 'id', preferredEmail: 'preferredEmail' },
          selection: 'selection'
        }];

        calendarConfigurationController.submit();
        $rootScope.$digest();

        expect(notificationFactoryMock.weakInfo).to.have.been.called;
        expect(calendarRight.removeUserRight).to.have.been.calledWith('1');
        expect(calendarRight.update).to.have.been.calledWith('id', 'preferredEmail', 'selection');
        expect(stateMock.go).to.have.been.called;
        expect(calendarService.modifyRights).to.have.been.calledWith(
          calendarConfigurationController.calendarHomeId,
          sinon.match({href: '/calendars/12345/00000000-0000-4000-a000-000000000000.json'}),
          sinon.match.same(calendarRight),
          sinon.match.same(clone)
        );
        expect(calendarService.modifyCalendar).to.not.have.been.calledWith;
        expect(calendarAPI.modifyPublicRights).to.have.not.been.called;
      });

      describe('when only public right have been changed', function() {
        beforeEach(function() {
          calendarRight.getPublicRight = sinon.stub().returns('publicSelection');
          calendarConfigurationController.calendar = {
            id: '123',
            href: 'blabla/id.json'
          };
          calendarConfigurationController.calendar.color = 'aColor';
          calendarConfigurationController.calendar.name = 'aName';

          calendarConfigurationController.activate();
          $rootScope.$digest();
        });

        it('should call modifyPublicRights with read argument when public right is changed to read', function() {
          calendarConfigurationController.publicSelection = CALENDAR_RIGHT.CUSTOM;

          calendarConfigurationController.submit();
          $rootScope.$digest();

          expect(notificationFactoryMock.weakInfo).to.have.been.called;
          expect(stateMock.go).to.have.been.called;
          expect(calendarAPI.modifyPublicRights).to.have.been.calledWith(
            calendarConfigurationController.calendarHomeId,
            calendarConfigurationController.calendar.id,
            { public_right: '{DAV:}read' }
          );
          expect(calendarService.modifyCalendar).to.not.have.been.calledWith;
          expect(calendarService.modifyRights).to.not.have.been.calledWith;
        });

        it('should call modifyPublicRights with free-busy argument when public right is changed to something other than none or read', function() {
          calendarConfigurationController.publicSelection = CALENDAR_RIGHT.FREE_BUSY;

          calendarConfigurationController.submit();
          $rootScope.$digest();

          expect(notificationFactoryMock.weakInfo).to.have.been.called;
          expect(stateMock.go).to.have.been.called;
          expect(calendarAPI.modifyPublicRights).to.have.been.calledWith(
            calendarConfigurationController.calendarHomeId,
            calendarConfigurationController.calendar.id,
            { public_right: '{urn:ietf:params:xml:ns:caldav}read-free-busy' }
          );
          expect(calendarService.modifyCalendar).to.not.have.been.calledWith;
          expect(calendarService.modifyRights).to.not.have.been.calledWith;
        });
      });

      it('should call modifyRight, modifyCalendar and modifyPublicRights if all right has been changed', function() {
        var clone = {};
        var modifiedName = 'A';

        calendarRight.getPublicRight = sinon.stub().returns('publicSelection');
        calendarRight.clone = sinon.stub().returns(clone);
        calendarRight.equals = sinon.stub().returns(false);
        notificationFactoryMock.weakInfo = sinon.spy();
        stateMock.go = sinon.spy(function(path) {
          expect(path).to.equal('calendar.main');
        });
        calendarConfigurationController.calendar = {
          id: '123',
          href: '/calendars/12345/00000000-0000-4000-a000-000000000000.json',
          color: 'aColor',
          name: 'aName'
        };
        calendarConfigurationController.calendar.name = 'aName';

        calendarConfigurationController.activate();
        $rootScope.$digest();

        calendarConfigurationController.publicSelection = CALENDAR_RIGHT.FREE_BUSY;
        calendarConfigurationController.calendar.name = modifiedName;
        calendarConfigurationController.newCalendar = false;

        calendarConfigurationController.submit();
        $rootScope.$digest();

        expect(notificationFactoryMock.weakInfo).to.have.been.called;
        expect(stateMock.go).to.have.been.called;
        expect(calendarService.modifyRights).to.have.been.calledWith(
          calendarConfigurationController.calendarHomeId,
          sinon.match({ href: '/calendars/12345/00000000-0000-4000-a000-000000000000.json' }),
          sinon.match.same(calendarRight),
          sinon.match.same(clone)
        );
        expect(calendarService.modifyCalendar).to.have.been.calledWith('12345', sinon.match({
          href: '/calendars/12345/00000000-0000-4000-a000-000000000000.json',
          name: modifiedName
        }));
        expect(calendarAPI.modifyPublicRights).to.have.been.calledWith(
          calendarConfigurationController.calendarHomeId,
          calendarConfigurationController.calendar.id,
          { public_right: '{urn:ietf:params:xml:ns:caldav}read-free-busy' }
        );
      });
    });
  });

  describe('the openDeleteConfirmationDialog function', function() {
    it('should initialize self.modal', function() {
      calendarConfigurationController.activate();

      expect(calendarConfigurationController.modal).to.be.undefined;

      calendarConfigurationController.openDeleteConfirmationDialog();

      expect(calendarConfigurationController.modal).to.not.be.undefined;
    });
  });

  describe('the addUserGroup function', function() {
    it('should add multiple users to the delegation if newUsersGroups.length > 0 and the calendar is not a new calendar', function() {
      calendarConfigurationController.calendar = {
        href: '/calendars/12345/00000000-0000-4000-a000-000000000000.json',
        color: 'aColor',
        name: 'aName'
      };

      calendarConfigurationController.activate();

      calendarConfigurationController.addUserGroup();

      expect(addUserGroup).to.have.been.calledOnce;
    });

    it('should throw an exception if the calendar is a new calendar', function() {
      var error;

      calendarConfigurationController.activate();

      try {
        calendarConfigurationController.addUserGroup();
      } catch (err) {
        error = err;
      }

      expect(error.message).to.equal('edition of right on new calendar are not implemented yet');
    });
  });

  describe('the removeUserGroup function', function() {
    it('should call the removeUserGroup from CalDelegationEditionHelper', function() {
      calendarConfigurationController.activate();
      calendarConfigurationController.removeUserGroup();

      expect(removeUserGroup).to.have.been.calledOnce;
    });
  });

  describe('the reset function', function() {
    it('should reset the values of newUsersGroups and selection', function() {
      calendarConfigurationController.calendar = {
        id: '123456789'
      };

      calendarConfigurationController.activate();

      calendarConfigurationController.addUserGroup();

      expect(calendarConfigurationController.newUsersGroups).to.deep.equal;
      expect(calendarConfigurationController.selection).to.deep.equal(CALENDAR_RIGHT.NONE);
    });
  });

  describe('the removeCalendar function', function() {
    it('should call calendarService.removeCalendar before $state to go back on the main view when deleting', function() {
      calendarConfigurationController.calendar = {
        id: '123456789'
      };

      calendarConfigurationController.activate();

      calendarConfigurationController.delete();

      expect(stateMock.go).to.have.not.been.called;

      $rootScope.$digest();

      expect(calendarService.removeCalendar).to.have.been.calledWith(calendarHomeId, calendarConfigurationController.calendar);
      expect(stateMock.go).to.have.been.calledWith('calendar.main');
    });
  });

  describe('the cancel function', function() {
    it('should call $state to go back on the main view when deleting', function() {
      calendarConfigurationController.calendar = {
        id: '123456789'
      };

      calendarConfigurationController.activate();

      calendarConfigurationController.cancel();

      expect(stateMock.go).to.have.been.calledWith('calendar.main');
    });
  });

  describe('the cancelMobile function', function() {
    it('should call $state to go back on the list view when deleting in mobile', function() {
      calendarConfigurationController.calendar = {
        id: '123456789'
      };

      calendarConfigurationController.activate();

      calendarConfigurationController.cancelMobile();

      expect(stateMock.go).to.have.been.calledWith('calendar.list');
    });
  });

  describe('the getMainView function', function() {
    it('should select main tab', function() {
      calendarConfigurationController.activate();

      calendarConfigurationController.selectedTab = 'delegation';

      calendarConfigurationController.getMainView();

      expect(calendarConfigurationController.selectedTab).to.equal('main');
    });
  });

  describe('the getDelegationView function', function() {
    it('should select delegation tab', function() {
      calendarConfigurationController.activate();

      calendarConfigurationController.selectedTab = 'main';

      calendarConfigurationController.getDelegationView();

      expect(calendarConfigurationController.selectedTab).to.equal('delegation');
    });
  });

  describe('the onAddingUser function', function() {
    it('should return false if the $tag do not contain the _id field', function() {
      var $tag = {};

      calendarConfigurationController.activate();

      expect(calendarConfigurationController.onAddingUser($tag)).to.be.false;
    });

    it('should return true if the $tag contain the _id field', function() {
      var $tag = {
        _id: '11111111'
      };

      calendarConfigurationController.activate();

      expect(calendarConfigurationController.onAddingUser($tag)).to.be.true;
    });

    it('should return true when the $tag is not already added in the delegations', function() {
      var $tag = {
        _id: '11111111'
      };

      calendarConfigurationController.activate();

      calendarConfigurationController.delegations = [
        {
          user: {
            _id: '123'
          }
        }
      ];

      expect(calendarConfigurationController.onAddingUser($tag)).to.be.true;
    });

    it('should return false when the $tag does already exist in the delegations', function() {
      var $tag = {
        _id: '123'
      };

      calendarConfigurationController.activate();

      calendarConfigurationController.delegations = [
        {
          user: {
            _id: '123'
          }
        }
      ];

      expect(calendarConfigurationController.onAddingUser($tag)).to.be.false;
    });
  });
});
