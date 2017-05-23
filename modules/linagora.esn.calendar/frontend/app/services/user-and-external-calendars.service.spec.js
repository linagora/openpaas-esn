'use strict';

/* global chai: false */

var expect = chai.expect;

describe('the userAndExternalCalendars service', function() {
  var calendars, userAndExternalCalendars;

  beforeEach(function() {
    calendars = [{
      id: '1',
      href: 'href',
      name: 'name',
      color: 'color',
      description: 'description',
      rights: {
        getOwnerId: function() {
          return 'tata';
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
      },
      isSubscription: function() {
        return false;
      }
    }, {
      id: '2',
      href: 'href2',
      name: 'name2',
      color: 'color2',
      description: 'description2',
      rights: {
        getOwnerId: function() {
          return 'tata';
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
      },
      isSubscription: function() {
        return false;
      }
    }, {
      id: '3',
      href: 'href',
      name: 'name',
      color: 'color',
      description: 'description',
      rights: {
        getOwnerId: function() {
          return 'tata';
        }
      },
      isShared: function() {
        return true;
      },
      isPublic: function() {
        return false;
      },
      isOwner: function() {
        return true;
      },
      isSubscription: function() {
        return false;
      }
    }, {
      id: '4',
      href: 'href',
      name: 'name',
      color: 'color',
      description: 'description',
      rights: {
        getOwnerId: function() {
          return 'tata';
        }
      },
      isShared: function() {
        return false;
      },
      isPublic: function() {
        return true;
      },
      isOwner: function() {
        return false;
      },
      isSubscription: function() {
        return true;
      }
    }, {
      id: '5',
      href: 'href',
      name: 'name',
      color: 'color',
      description: 'description',
      rights: {
        getOwnerId: function() {
          return 'tata';
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
      },
      isSubscription: function() {
        return false;
      }
    }, {
      id: '6',
      href: 'href',
      name: 'name',
      color: 'color',
      description: 'description',
      rights: {
        getOwnerId: function() {
          return 'tata';
        }
      },
      isShared: function() {
        return true;
      },
      isPublic: function() {
        return true;
      },
      isOwner: function() {
        return false;
      },
      isSubscription: function() {
        return false;
      }
    }];

    angular.mock.module('esn.calendar');

    angular.mock.inject(function(_userAndExternalCalendars_) {
      userAndExternalCalendars = _userAndExternalCalendars_;
    });
  });

  beforeEach(function() {
    userAndExternalCalendars = userAndExternalCalendars(calendars);
  });

  it('should initialize userCalendars with calendars that have no rights', function() {
    expect(userAndExternalCalendars.userCalendars).to.contain(calendars[0]);
  });

  it('should initialize userCalendars with calendars that belong to the current user', function() {
    expect(userAndExternalCalendars.userCalendars).to.contain(calendars[1], calendars[2]);
  });

  it('should initialize userCalendars with calendars that belong to the current user even if they are shared', function() {
    expect(userAndExternalCalendars.userCalendars).to.deep.equal([calendars[0], calendars[1], calendars[2]]);
  });

  it('should initialize sharedCalendars with calendars that are shared and dont belong to the current user', function() {
    expect(userAndExternalCalendars.sharedCalendars).to.contain(calendars[4], calendars[5]);
  });

  it('should initialize publicCalendars with calendars that are from subscriptions and are not shared or belong to the current user', function() {
    expect(userAndExternalCalendars.publicCalendars).to.contain(calendars[3]);
  });
});
