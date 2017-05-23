'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The calendar configuration controller', function() {
  var $controller,
    $rootScope,
    $scope,
    CalDelegationEditionHelperMock,
    calendarAPI,
    CalendarCollectionShell,
    calendarConfigurationController,
    calendarHomeServiceMock,
    calendarRight,
    CalendarRightShellMock,
    calendarService,
    matchmedia,
    notificationFactoryMock,
    stateMock,
    stateParamsMock,
    userUtilsMock,
    userAPIMock,
    uuid4,
    SM_XS_MEDIA_QUERY,
    CAL_CALENDAR_PUBLIC_RIGHT,
    CAL_CALENDAR_SHARED_RIGHT;

  var addUserGroup,
    addUserGroupResult,
    calendar,
    calendarHomeId,
    getAllRemovedUsersIdResult,
    getAllRemovedUsersId,
    removeUserGroup;

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

    matchmedia = {};

    calendarRight = {
      getPublicRight: sinon.spy(),
      getShareeRight: sinon.spy(),
      getAllUserRight: sinon.stub().returns([]),
      getAllShareeRights: sinon.stub().returns([]),
      getOwnerId: sinon.spy(),
      clone: sinon.spy(),
      removeShareeRight: sinon.spy(),
      update: sinon.spy(),
      updateSharee: sinon.spy(),
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
      calendarUniqueId: '/calendars/calendarHomeId/123.json'
    };

    calendarHomeId = '12345';

    CalendarRightShellMock = sinon.spy(function() {
      return {
        getOwnerId: angular.noop,
        getPublicRight: angular.noop,
        getAllShareeRights: angular.noop
      };
    });
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
      $provide.value('userAPI', userAPIMock);
      $provide.value('userUtils', userUtilsMock);
      $provide.value('CalendarRightShell', CalendarRightShellMock);
    });
  });

  beforeEach(function() {
    angular.mock.inject(function(_$rootScope_, _$controller_, _CalendarCollectionShell_, _CAL_CALENDAR_PUBLIC_RIGHT_, _CAL_CALENDAR_SHARED_RIGHT_, _SM_XS_MEDIA_QUERY_) {
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $controller = _$controller_;
      CalendarCollectionShell = _CalendarCollectionShell_;
      CAL_CALENDAR_PUBLIC_RIGHT = _CAL_CALENDAR_PUBLIC_RIGHT_;
      CAL_CALENDAR_SHARED_RIGHT = _CAL_CALENDAR_SHARED_RIGHT_;
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

    it('should calendarService.getCalendar to get the calendar if calendarUniqueId is not null', function() {
      sinon.spy(CalendarCollectionShell, 'splitUniqueId');

      calendarConfigurationController.$onInit();

      $rootScope.$digest();

      expect(CalendarCollectionShell.splitUniqueId).to.have.been.calledWith(stateParamsMock.calendarUniqueId);
      expect(calendarService.getCalendar).to.be.calledWith(calendarHomeId, '123');
    });

    it('should not call calendarService.getCalendar if calendarUniqueId is null', function() {
      delete stateParamsMock.calendarUniqueId;

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
          selectedShareeRight: CAL_CALENDAR_SHARED_RIGHT.SHAREE_READ
        };
      });

      it('should initialize newUsersGroups', function() {
        calendarConfigurationController.addUserGroup = sinon.spy();

        calendarConfigurationController.$onInit();

        $rootScope.$digest();

        expect(calendarConfigurationController.newUsersGroups).to.deep.equal(stateParamsMock.addUsersFromDelegationState.newUsersGroups);
      });

      it('should initialize selectedShareeRight', function() {
        calendarConfigurationController.$onInit();

        $rootScope.$digest();

        expect(calendarConfigurationController.selectedShareeRight).to.deep.equal(stateParamsMock.addUsersFromDelegationState.selectedShareeRight);
      });

      it('should call addUserGroup', function() {
        calendarConfigurationController.addUserGroup = sinon.spy();

        calendarConfigurationController.$onInit();

        $rootScope.$digest();

        expect(calendarConfigurationController.addUserGroup).to.be.called;
      });

      it('should call set selectedTab to "delegation"', function() {
        calendarConfigurationController.getDelegationView = sinon.spy();

        calendarConfigurationController.$onInit();

        $rootScope.$digest();

        expect(calendarConfigurationController.selectedTab).to.equal('delegation');
      });
    });
  });

  describe('the activate function', function() {

    it('should initialize newCalendar with true it is a new calendar', function() {
      calendarConfigurationController.activate();

      expect(calendarConfigurationController.newCalendar).to.be.true;
      expect(CalendarRightShellMock).to.have.been.calledWith;
    });

    it('should initialize newCalendar with false it is not a new calendar', function() {
      calendarConfigurationController.calendar = {
        id: '123456789',
        rights: calendarRight
      };

      calendarConfigurationController.activate();

      expect(calendarConfigurationController.newCalendar).to.be.false;
    });

    it('should initialize self.calendar with self.calendar if it is not a new calendar', function() {
      calendarConfigurationController.calendar = {
        id: '123456789',
        rights: calendarRight
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

    it('should initialize calendarRight with a new CalendarRightShell if newCalendar is true', function() {
      calendarConfigurationController.activate();

      expect(CalendarRightShellMock).to.be.calledWithNew;
    });

    it('should copy self.calendar in self.oldCalendar', function() {
      calendarConfigurationController.calendar = {
        id: '123456789',
        rights: calendarRight
      };

      calendarConfigurationController.activate();

      expect(calendarConfigurationController.oldCalendar).to.deep.equal(calendarConfigurationController.calendar);
    });

    it('should initialize self.selectedShareeRight with CAL_CALENDAR_SHARED_RIGHT.SHAREE_READ', function() {
      calendarConfigurationController.activate();

      expect(calendarConfigurationController.selectedShareeRight).to.equal(CAL_CALENDAR_SHARED_RIGHT.SHAREE_READ);
    });

    it('should correctly initialize delegation', function() {
      calendarRight.getPublicRight = sinon.stub().returns('publicSelection');
      calendarRight.getAllShareeRights = sinon.stub().returns([
        {userId: 'userId', right: 'right'}
      ]);

      userUtilsMock.displayNameOf = sinon.stub().returns('displayNameOfResult');

      var user = { firstname: 'firstname', lastname: 'lastname' };

      userAPIMock.user = sinon.stub().returns($q.when({ data: user }));

      calendarConfigurationController.calendar = {
        href: 'data/data.json',
        rights: calendarRight
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
        id: '123456789',
        rights: calendarRight
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

    describe('when newCalendar is true (with name having only one char)', function() {
      beforeEach(function() {
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

              return {
                then: function(callback) {
                  callback();
                }
              };
            }
          };
        };
      });

      it('should call createCalendar', function() {
        calendarConfigurationController.activate();

        calendarConfigurationController.calendar.color = 'aColor';
        calendarConfigurationController.calendar.name = 'N';
        calendarConfigurationController.publicSelection = undefined;

        calendarConfigurationController.submit();

        expect(notificationFactoryMock.weakInfo).to.have.been.called;
        expect(stateMock.go).to.have.been.called;
        expect(calendarAPI.modifyPublicRights).to.not.have.been.called;
      });

      it('should call createCalendar and calendarAPI.modifyPublicRights when providing a publicSelection', function() {
        calendarConfigurationController.activate();

        calendarConfigurationController.calendar.color = 'aColor';
        calendarConfigurationController.calendar.name = 'N';
        calendarConfigurationController.publicSelection = CAL_CALENDAR_PUBLIC_RIGHT.READ;

        calendarConfigurationController.submit();

        expect(notificationFactoryMock.weakInfo).to.have.been.called;
        expect(stateMock.go).to.have.been.called;
        expect(calendarAPI.modifyPublicRights).to.have.been.calledWith(
          calendarConfigurationController.calendarHomeId,
          calendarConfigurationController.calendar.id,
          { public_right: calendarConfigurationController.publicSelection }
          );
      });
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
          href: '/calendars/12345/00000000-0000-4000-a000-000000000000.json',
          rights: calendarRight
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
          href: 'blabla/id.json',
          rights: calendarRight
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
          name: 'aName',
          rights: calendarRight
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
        getAllRemovedUsersIdResult = ['1'];
        calendarRight.getPublicRight = sinon.stub().returns('publicSelection');
        calendarRight.equals = sinon.stub().returns(false);
        notificationFactoryMock.weakInfo = sinon.spy();
        stateMock.go = sinon.spy(function(path) {
          expect(path).to.equal('calendar.main');
        });
        calendarConfigurationController.calendar = {
          href: '/calendars/12345/00000000-0000-4000-a000-000000000000.json',
          color: 'aColor',
          name: 'aName',
          rights: calendarRight
        };
        calendarConfigurationController.calendar.name = 'aName';

        calendarConfigurationController.activate();
        $rootScope.$digest();

        calendarConfigurationController.publicSelection = 'publicSelection';
        calendarConfigurationController.newCalendar = false;
        calendarConfigurationController.delegations = [{
          user: { _id: 'id', preferredEmail: 'preferredEmail' },
          selection: 'selectedShareeRight'
        }];

        calendarConfigurationController.submit();
        $rootScope.$digest();

        expect(notificationFactoryMock.weakInfo).to.have.been.called;
        expect(calendarRight.removeShareeRight).to.have.been.calledWith('1');
        expect(calendarRight.updateSharee).to.have.been.calledWith('id', 'preferredEmail', 'selectedShareeRight');
        expect(stateMock.go).to.have.been.called;
        expect(calendarService.modifyRights).to.have.been.calledWith(
          calendarConfigurationController.calendarHomeId,
          sinon.match({href: '/calendars/12345/00000000-0000-4000-a000-000000000000.json'}),
          sinon.match.same(calendarRight),
          sinon.match(calendarRight)
        );
        expect(calendarService.modifyCalendar).to.not.have.been.calledWith;
        expect(calendarAPI.modifyPublicRights).to.have.not.been.called;
      });

      describe('when only public right have been changed', function() {
        beforeEach(function() {
          calendarRight.getPublicRight = sinon.stub().returns('publicSelection');
          calendarConfigurationController.calendar = {
            id: '123',
            href: 'blabla/id.json',
            rights: calendarRight
          };
          calendarConfigurationController.calendar.color = 'aColor';
          calendarConfigurationController.calendar.name = 'aName';

          calendarConfigurationController.activate();
          $rootScope.$digest();
        });

        it('should call modifyPublicRights with read argument when public right is changed to read', function() {
          calendarConfigurationController.publicSelection = CAL_CALENDAR_PUBLIC_RIGHT.READ;

          calendarConfigurationController.submit();
          $rootScope.$digest();

          expect(notificationFactoryMock.weakInfo).to.have.been.called;
          expect(stateMock.go).to.have.been.called;
          expect(calendarAPI.modifyPublicRights).to.have.been.calledWith(
            calendarConfigurationController.calendarHomeId,
            calendarConfigurationController.calendar.id,
            { public_right: CAL_CALENDAR_PUBLIC_RIGHT.READ }
          );
          expect(calendarService.modifyCalendar).to.not.have.been.calledWith;
          expect(calendarService.modifyRights).to.not.have.been.calledWith;
        });

        //This test must be changed when we affect the correct right to none option.
        it('should call modifyPublicRights with write argument when public right is changed to none', function() {
          calendarConfigurationController.publicSelection = CAL_CALENDAR_PUBLIC_RIGHT.READ_WRITE;

          calendarConfigurationController.submit();
          $rootScope.$digest();

          expect(notificationFactoryMock.weakInfo).to.have.been.called;
          expect(stateMock.go).to.have.been.called;
          expect(calendarAPI.modifyPublicRights).to.have.been.calledWith(
            calendarConfigurationController.calendarHomeId,
            calendarConfigurationController.calendar.id,
            { public_right: CAL_CALENDAR_PUBLIC_RIGHT.READ_WRITE }
          );
          expect(calendarService.modifyCalendar).to.not.have.been.calledWith;
          expect(calendarService.modifyRights).to.not.have.been.calledWith;
        });

        it('should call modifyPublicRights with free-busy argument when public right is changed to something other than none or read', function() {
          calendarConfigurationController.publicSelection = CAL_CALENDAR_PUBLIC_RIGHT.FREE_BUSY;

          calendarConfigurationController.submit();
          $rootScope.$digest();

          expect(notificationFactoryMock.weakInfo).to.have.been.called;
          expect(stateMock.go).to.have.been.called;
          expect(calendarAPI.modifyPublicRights).to.have.been.calledWith(
            calendarConfigurationController.calendarHomeId,
            calendarConfigurationController.calendar.id,
            { public_right: CAL_CALENDAR_PUBLIC_RIGHT.FREE_BUSY }
          );
          expect(calendarService.modifyCalendar).to.not.have.been.calledWith;
          expect(calendarService.modifyRights).to.not.have.been.calledWith;
        });
      });

      it('should call modifyRight, modifyCalendar and modifyPublicRights if all right has been changed', function() {
        var modifiedName = 'A';

        calendarRight.getPublicRight = sinon.stub().returns('publicSelection');
        calendarRight.equals = sinon.stub().returns(false);
        notificationFactoryMock.weakInfo = sinon.spy();
        stateMock.go = sinon.spy(function(path) {
          expect(path).to.equal('calendar.main');
        });
        calendarConfigurationController.calendar = {
          id: '123',
          href: '/calendars/12345/00000000-0000-4000-a000-000000000000.json',
          color: 'aColor',
          name: 'aName',
          rights: calendarRight
        };
        calendarConfigurationController.calendar.name = 'aName';

        calendarConfigurationController.activate();
        $rootScope.$digest();

        calendarConfigurationController.publicSelection = CAL_CALENDAR_PUBLIC_RIGHT.FREE_BUSY;
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
          sinon.match(calendarRight)
        );
        expect(calendarService.modifyCalendar).to.have.been.calledWith('12345', sinon.match({
          href: '/calendars/12345/00000000-0000-4000-a000-000000000000.json',
          name: modifiedName
        }));
        expect(calendarAPI.modifyPublicRights).to.have.been.calledWith(
          calendarConfigurationController.calendarHomeId,
          calendarConfigurationController.calendar.id,
          { public_right: CAL_CALENDAR_PUBLIC_RIGHT.FREE_BUSY }
        );
      });
    });
  });

  describe('the addUserGroup function', function() {
    it('should add multiple users to the delegation if newUsersGroups.length > 0 and the calendar is not a new calendar', function() {
      calendarConfigurationController.calendar = {
        href: '/calendars/12345/00000000-0000-4000-a000-000000000000.json',
        color: 'aColor',
        name: 'aName',
        rights: calendarRight
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
    it('should reset the values of newUsersGroups and selectedShareeRight', function() {
      calendarConfigurationController.calendar = {
        id: '123456789',
        rights: calendarRight
      };

      calendarConfigurationController.activate();

      calendarConfigurationController.addUserGroup();

      expect(calendarConfigurationController.newUsersGroups).to.deep.equal;
      expect(calendarConfigurationController.selectedShareeRight).to.deep.equal(CAL_CALENDAR_SHARED_RIGHT.SHAREE_READ);
    });
  });
});
