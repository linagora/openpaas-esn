(function() {
  'use strict';

  angular.module('esn.calendar')
    .factory('CalendarRightShell', CalendarRightShell);

  CalendarRightShell.$inject = [
    'CALENDAR_RIGHT',
    'RightSet',
    '_',
    'calendarUtils'
  ];

  function CalendarRightShell(CALENDAR_RIGHT, RightSet, _, calendarUtils) {

    //the idea here is that there is a multitude of possible combinaison of webdav right and webdav sharing right
    //I will suppose that right are only settle by OpenPaas and that the only possible combinaison are the following
    //
    // admin: the user has the following WEBDAV right: share, read, write, write-properties, he could also have a shared instance
    // read_write: he have no WEBDAV right but one a shared instance with readwrite access
    // read: he have no WEBDAV right but one a shared intance with read access
    // free_busy: he own no shared instance and has only the WEBDAV right read-free-busy
    // none: he own no shared instance and no WEBDAV right BUT FOR THE MOMENT I do not know we can overwrite global read-free-busy
    var principalRegexp = new RegExp('principals/users/([^/]*)$');
    var matrix = initRightMatrix();

    CalendarRightShell.prototype.clone = clone;
    CalendarRightShell.prototype.equals = equals;
    CalendarRightShell.prototype.getAllUserRight = getAllUserRight;
    CalendarRightShell.prototype.getPublicRight = getPublicRight;
    CalendarRightShell.prototype.getUserRight = getUserRight;
    CalendarRightShell.prototype.update = update;
    CalendarRightShell.prototype.updatePublic = updatePublic;
    CalendarRightShell.prototype.removeUserRight = removeUserRight;
    CalendarRightShell.prototype.toDAVShareRightsUpdate = toDAVShareRightsUpdate;
    CalendarRightShell.prototype.toJson = toJson;

    CalendarRightShell.prototype._getUserSet = _getUserSet;

    return CalendarRightShell;

    /////////////////

    function CalendarRightShell(acl, invite) {
      this._userRight = {};
      this._userEmails = {};
      this._public = new RightSet();

      acl && acl.forEach(function(line) {
        var userRightSet, userId, match = line.principal && line.principal.match(principalRegexp);

        if (match) {
          userId = match[1];
          userRightSet = this._getUserSet(userId);
        } else if (line.principal === '{DAV:}authenticated') {
          userRightSet = this._public;
        }

        userRightSet && userRightSet.addPermission(RightSet.webdavStringToConstant(line.privilege));
      }, this);

      invite && invite.forEach(function(line) {
        var userId, match = line.principal && line.principal.match(principalRegexp);

        if (match) {
          userId = match[1];
          this._getUserSet(userId).addPermission(RightSet.calendarShareeIntToConstant(line.access));
          this._userEmails[userId] = calendarUtils.removeMailto(line.href);
        }
      }, this);
    }

    function setProfile(rightSet, newRole) {
      rightSet.addPermissions(matrix[newRole].shouldHave);
      rightSet.removePermissions(matrix[newRole].shouldNotHave);
    }

    function sumupRight(rightSet) {
      var result;

      _.forEach(matrix, function(matrix, right) {
        if (rightSet.hasAtLeastAllOfThosePermissions(matrix.shouldHave) && rightSet.hasNoneOfThosePermissions(matrix.shouldNotHave)) {
          result = right;

          return false;
        }
      });

      return result || CALENDAR_RIGHT.CUSTOM;
    }

    function _getUserSet(userId) {
      this._userRight[userId] = this._userRight[userId] || new RightSet();

      return this._userRight[userId];
    }

    function getUserRight(userId) {
      var rightSet = this._userRight[userId];

      return rightSet && sumupRight(rightSet);
    }

    function getAllUserRight() {
      return _.map(this._userRight, function(rightSet, userId) {
        return {
          userId: userId,
          right: sumupRight(rightSet)
        };
      });
    }

    function getPublicRight() {
      return sumupRight(this._public);
    }

    function update(userId, userEmail, newRole) {
      this._userEmails[userId] = this._userEmails[userId] || userEmail;
      setProfile(this._getUserSet(userId), newRole);
    }

    function updatePublic(newRole) {
      setProfile(this._public, newRole);
    }

    function toDAVShareRightsUpdate(oldCalendarRight) {
      var HREF_PREFIX = 'mailto:';
      var result = {
        share: {
          set: [],
          remove: []
        }
      };

      _.forEach(this._userRight, function(rightSet, userId) {
        if (rightSet.hasPermission(RightSet.SHAREE_READ)) {
          result.share.set.push({
            'dav:href': HREF_PREFIX + this._userEmails[userId],
            'dav:read': true
          });
        } else if (rightSet.hasPermission(RightSet.SHAREE_READWRITE)) {
          result.share.set.push({
            'dav:href': HREF_PREFIX + this._userEmails[userId],
            'dav:read-write': true
          });
        }
      }, this);

      _.forEach(oldCalendarRight._userRight, function(oldRightSet, userId) {
        var newRightSet = this._userRight[userId] || new RightSet();
        var SHAREE_PERMISSION = [RightSet.SHAREE_SHAREDOWNER, RightSet.SHAREE_READ, RightSet.SHAREE_READWRITE];

        if (newRightSet.hasNoneOfThosePermissions(SHAREE_PERMISSION) && oldRightSet.hasAtLeastOneOfThosePermissions(SHAREE_PERMISSION)) {
          result.share.remove.push({
            'dav:href': HREF_PREFIX + oldCalendarRight._userEmails[userId]
          });
        }
      }, this);

      return result;
    }

    function removeUserRight(id) {
      delete this._userEmails[id];
      delete this._userRight[id];
    }

    function toJson() {
      var result = {
        users: {},
        public: this._public.toJson()
      };

      _.forEach(this._userRight, function(set, userKey) {
        if (set.bitVector) {
          result.users[userKey] = set.toJson();
        }
      });

      return result;
    }

    function equals(otherShell) {
      if (otherShell === this) {
        return true;
      } else if (!otherShell || otherShell.constructor !== CalendarRightShell) {
        return false;
      }

      return _.isEqual(this.toJson(), otherShell.toJson());
    }

    function clone() {
      var clone = new CalendarRightShell();

      clone._userRight = _.mapValues(this._userRight, function(rightSet) {
        return rightSet.clone();
      });

      clone._userEmails = _.clone(this._userEmails);
      clone._public = this._public.clone();

      return clone;
    }

    function initRightMatrix() {
      var matrix = {};

      matrix[CALENDAR_RIGHT.ADMIN] = {
        shouldHave: [
          RightSet.SHARE,
          RightSet.READ,
          RightSet.WRITE,
          RightSet.WRITE_PROPERTIES
        ],
        shouldNotHave: []
      };

      matrix[CALENDAR_RIGHT.READ_WRITE] = {
        shouldHave: [
          RightSet.SHAREE_READWRITE
        ],
        shouldNotHave: [
          RightSet.SHARE,
          RightSet.WRITE_PROPERTIES,
          RightSet.SHAREE_READ
        ]
      };

      matrix[CALENDAR_RIGHT.READ] = {
        shouldHave: [
          RightSet.SHAREE_READ
        ],
        shouldNotHave: [
          RightSet.SHAREE_READWRITE,
          RightSet.SHARE,
          RightSet.WRITE_PROPERTIES,
          RightSet.WRITE
        ]
      };

      matrix[CALENDAR_RIGHT.FREE_BUSY] = {
        shouldHave: [
          RightSet.FREE_BUSY
        ],
        shouldNotHave: [
          RightSet.READ,
          RightSet.SHAREE_READ,
          RightSet.SHAREE_READWRITE,
          RightSet.SHARE,
          RightSet.WRITE_PROPERTIES,
          RightSet.WRITE
        ]
      };

      matrix[CALENDAR_RIGHT.NONE] = {
        shouldHave: [],
        shouldNotHave: [
          RightSet.FREE_BUSY,
          RightSet.READ,
          RightSet.SHAREE_READ,
          RightSet.SHAREE_READWRITE,
          RightSet.SHARE,
          RightSet.WRITE_PROPERTIES,
          RightSet.WRITE,
          RightSet.SHAREE_SHAREDOWNER
        ]
      };

      return matrix;
    }
  }
})();
