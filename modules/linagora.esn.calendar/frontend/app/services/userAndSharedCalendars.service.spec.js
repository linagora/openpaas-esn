'use strict';

/* global chai: false */

var expect = chai.expect;

describe('the userAndSharedCalendars service', function() {
  var calendars, userAndSharedCalendars, CALENDAR_RIGHT;

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
      }
    }, {
      id: '3',
      href: 'href',
      name: 'name',
      color: 'color',
      description: 'description',
      rights: {
        getUserRight: function() {
          return CALENDAR_RIGHT.SHAREE_READ;
        },
        getPublicRight: function() {
          return CALENDAR_RIGHT.NONE;
        }
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
          return CALENDAR_RIGHT.NONE;
        }
      }
    }];

    angular.mock.module('esn.calendar');

    angular.mock.inject(function(_userAndSharedCalendars_, _CALENDAR_RIGHT_) {
      userAndSharedCalendars = _userAndSharedCalendars_;
      CALENDAR_RIGHT = _CALENDAR_RIGHT_;
    });
  });

  beforeEach(function() {
    userAndSharedCalendars = userAndSharedCalendars(calendars);
  });

  it('should initialize userCalendars with calendars that have rights', function() {
    expect(userAndSharedCalendars.userCalendars).to.contain(calendars[0]);
  });

  it('should initialize userCalendars with calendars that have the admin right for the current user', function() {
    expect(userAndSharedCalendars.userCalendars).to.contain(calendars[1], calendars[3]);
  });

  it('should initialize userCalendars with calendars that have the rights and the calendars have the admin right for the current user', function() {
    expect(userAndSharedCalendars.userCalendars).to.deep.equal([calendars[0], calendars[1], calendars[3]]);
  });

  it('should initialize sharedCalendars with calendars have not the admin right for the current user', function() {
    expect(userAndSharedCalendars.sharedCalendars).to.contain(calendars[2]);
  });

  it('should initialize sharedCalendars with calendars that have the public right equals to PUBLIC_READ', function() {
    expect(userAndSharedCalendars.sharedCalendars).to.contain(calendars[1]);
  });

  it('should initialize sharedCalendars with the calendars that have the public right equals to PUBLIC_READ or the calendars have not the admin right for the current user', function() {
    expect(userAndSharedCalendars.sharedCalendars).to.deep.equal([calendars[1], calendars[2]]);
  });
});
