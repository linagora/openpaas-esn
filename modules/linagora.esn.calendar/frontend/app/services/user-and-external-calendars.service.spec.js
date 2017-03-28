'use strict';

/* global chai: false */

var expect = chai.expect;

describe('the userAndExternalCalendars service', function() {
  var calendars, userAndExternalCalendars, CALENDAR_RIGHT, CALENDAR_SHARED_RIGHT;

  beforeEach(function() {
    calendars = [{
      id: '1',
      href: 'href',
      name: 'name',
      color: 'color',
      description: 'description'
    }, {
      id: '2',
      href: 'href2',
      name: 'name2',
      color: 'color2',
      description: 'description2',
      rights: {
        getUserRight: function() {
          return CALENDAR_RIGHT.ADMIN;
        },
        getPublicRight: function() {
          return CALENDAR_RIGHT.PUBLIC_READ;
        }
      },
      isShared: function() {
        return false;
      },
      isPublic: function() {
        return true;
      },
      isOwner: function() {
        return true;
      }
    }, {
      id: '3',
      href: 'href',
      name: 'name',
      color: 'color',
      description: 'description',
      rights: {
        getUserRight: function() {
          return CALENDAR_SHARED_RIGHT.SHAREE_READ;
        },
        getPublicRight: function() {
          return CALENDAR_RIGHT.NONE;
        }
      },
      isShared: function() {
        return true;
      },
      isPublic: function() {
        return false;
      },
      isOwner: function() {
        return false;
      }
    }, {
      id: '4',
      href: 'href',
      name: 'name',
      color: 'color',
      description: 'description',
      rights: {
        getUserRight: function() {
          return CALENDAR_RIGHT.ADMIN;
        },
        getPublicRight: function() {
          return CALENDAR_RIGHT.WRITE;
        }
      },
      isShared: function() {
        return false;
      },
      isPublic: function() {
        return true;
      },
      isOwner: function() {
        return true;
      }
    }];

    angular.mock.module('esn.calendar');

    angular.mock.inject(function(_userAndExternalCalendars_, _CALENDAR_RIGHT_, _CALENDAR_SHARED_RIGHT_) {
      userAndExternalCalendars = _userAndExternalCalendars_;
      CALENDAR_RIGHT = _CALENDAR_RIGHT_;
      CALENDAR_SHARED_RIGHT = _CALENDAR_SHARED_RIGHT_;
    });
  });

  beforeEach(function() {
    userAndExternalCalendars = userAndExternalCalendars(calendars);
  });

  it('should initialize userCalendars with calendars that have rights', function() {
    expect(userAndExternalCalendars.userCalendars).to.contain(calendars[0]);
  });

  it('should initialize userCalendars with calendars that have the admin right for the current user', function() {
    expect(userAndExternalCalendars.userCalendars).to.contain(calendars[1], calendars[3]);
  });

  it('should initialize userCalendars with calendars that have the rights and the calendars have the admin right for the current user', function() {
    expect(userAndExternalCalendars.userCalendars).to.deep.equal([calendars[0], calendars[1], calendars[3]]);
  });

  it('should initialize sharedCalendars with calendars have not the admin right for the current user and it is not a public calendar', function() {
    expect(userAndExternalCalendars.sharedCalendars).to.contain(calendars[2]);
  });

  it('should initialize publicCalendars with calendars that have the public right equals to PUBLIC_READ', function() {
    expect(userAndExternalCalendars.publicCalendars).to.contain(calendars[1]);
  });

  it('should initialize publicCalendars with the calendars that have the public right equals to WRITE', function() {
    expect(userAndExternalCalendars.publicCalendars).to.contain(calendars[3]);
  });
});
