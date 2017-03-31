(function() {
  'use strict';

  angular.module('esn.calendar')
    .factory('CalendarRightShell', CalendarRightShell);

  function CalendarRightShell(CAL_CALENDAR_RIGHT, CAL_CALENDAR_SHARED_RIGHT, CalRightSet, _, calendarUtils) {

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
    CalendarRightShell.prototype.getOwnerId = getOwnerId;
    CalendarRightShell.prototype.getPublicRight = getPublicRight;
    CalendarRightShell.prototype.getUserRight = getUserRight;
    CalendarRightShell.prototype.getShareeRight = getShareeRight;
    CalendarRightShell.prototype.updateSharee = updateSharee;
    CalendarRightShell.prototype.getAllShareeRights = getAllShareeRights;
    CalendarRightShell.prototype.getUsersEmails = getUsersEmails;
    CalendarRightShell.prototype.updatePublic = updatePublic;
    CalendarRightShell.prototype.removeShareeRight = removeShareeRight;
    CalendarRightShell.prototype.toDAVShareRightsUpdate = toDAVShareRightsUpdate;
    CalendarRightShell.prototype.toJson = toJson;

    CalendarRightShell.prototype._getUserSet = _getUserSet;

    return CalendarRightShell;

    /////////////////

    /**
     * Initialize CalendarRightShell with ACL for owner rights and public right and inline for shared access
     * Note : Sabre sent a shared status for the owner "SHAREDOWNER" (even if the calendar is not shared).
     * This specific status is filtered out because it doesn't add info about sharing to other users.
     * @param acl used to initialize owner rights and public rights
     * @param invite used to initialize rights given to sharees (if any)
     * @constructor
     */
    function CalendarRightShell(acl, invite) {
      this._userRight = {};
      this._userEmails = {};
      this._public = new CalRightSet();
      this._sharee = {};
      this._ownerId;

      acl && acl.forEach(function(line) {
        var userCalRightSet, userId, match = line.principal && line.principal.match(principalRegexp);

        if (match) {
          userId = match[1];
          userCalRightSet = this._getUserSet(userId);
        } else if (line.principal === '{DAV:}authenticated') {
          userCalRightSet = this._public;
        }
        userCalRightSet && userCalRightSet.addPermission(CalRightSet.webdavStringToConstant(line.privilege));
      }, this);

      invite && invite.forEach(function(line) {
        var userId, match = line.principal && line.principal.match(principalRegexp);

        if (match) {
          userId = match[1];
          var access = '' + line.access;
          if (access !== CAL_CALENDAR_SHARED_RIGHT.SHAREE_OWNER) {
            this._sharee[userId] = access;
          } else {
            this._ownerId = userId;
          }
          this._userEmails[userId] = calendarUtils.removeMailto(line.href);
        }
      }, this);
    }

    /**
     * Returns calendar owner
     * @returns {String} userId of the calendar owner
     */
    function getOwnerId() {
      return this._ownerId;
    }

    /**
     * Modify ACL user rights
     * @param calRightSet
     * @param newRole
     */
    function setProfile(calRightSet, newRole) {
      calRightSet.addPermissions(matrix[newRole].shouldHave);
      calRightSet.removePermissions(matrix[newRole].shouldNotHave);
    }

    function _sumupRight(calRightSet) {
      var result;

      _.forEach(matrix, function(matrix, right) {
        if (calRightSet.hasAtLeastAllOfThosePermissions(matrix.shouldHave) && calRightSet.hasNoneOfThosePermissions(matrix.shouldNotHave)) {
          result = right;

          return false;
        }
      });

      return result || CAL_CALENDAR_RIGHT.CUSTOM;
    }

    function _getUserSet(userId) {
      this._userRight[userId] = this._userRight[userId] || new CalRightSet();

      return this._userRight[userId];
    }

    /**
     * Compute Right from ACL
     * @param userId
     * @returns {CAL_CALENDAR_RIGHT} role computed from ACL
     */
    function getUserRight(userId) {
      var calRightSet = this._userRight[userId];

      return calRightSet && _sumupRight(calRightSet);
    }

    function getUsersEmails() {
      return this._userEmails;
    }

    /**
     * Returns all sharees rights for a calendar
     * Does not return sharee right for the owner of the calendar
     * @return {Object} {'userId': '', 'right': ''} all shared rights except for userId
     */
    function getAllShareeRights() {
      return _.map(this._sharee, function(sharedRights, userId) {
        return {
          userId: userId,
          right: sharedRights
        };
      });
    }

    /**
     * Get sharee right for a specific user
     * @param userId
     * @returns {CAL_CALENDAR_SHARED_RIGHT}
     */
    function getShareeRight(userId) {
      return this._sharee[userId];
    }

    /**
     * Compute public Right from ACL
     * @returns {CAL_CALENDAR_RIGHT} public role computed from ACL
     */
    function getPublicRight() {
      return _sumupRight(this._public);
    }

    /**
     * Add or modify a sharee with role on a calendar
     * @param userId
     * @param userEmail
     * @param role
     */
    function updateSharee(userId, userEmail, role) {
      this._userEmails[userId] = this._userEmails[userId] || userEmail;
      this._sharee[userId] = role;
    }

    function updatePublic(newRole) {
      setProfile(this._public, newRole);
    }

    /**
     * Format SabreDAV request for shared right modification
     * @param oldCalendarRight previous version of calendarRight used to check right modification/removal
     * @returns {{share: {set: Array, remove: Array}}}
     */
    function toDAVShareRightsUpdate(oldCalendarRight) {
      var HREF_PREFIX = 'mailto:';
      var result = {
        share: {
          set: [],
          remove: []
        }
      };

      _.forEach(this._sharee, function(sharedRight, userId) {
        switch (sharedRight) {
          case CAL_CALENDAR_SHARED_RIGHT.SHAREE_READ:
            result.share.set.push({
              'dav:href': HREF_PREFIX + this._userEmails[userId],
              'dav:read': true
            });
            break;
          case CAL_CALENDAR_SHARED_RIGHT.SHAREE_READ_WRITE:
            result.share.set.push({
              'dav:href': HREF_PREFIX + this._userEmails[userId],
              'dav:read-write': true
            });
            break;
          case CAL_CALENDAR_SHARED_RIGHT.SHAREE_ADMIN:
            result.share.set.push({
              'dav:href': HREF_PREFIX + this._userEmails[userId],
              'dav:administration': true
            });
            break;
          case CAL_CALENDAR_SHARED_RIGHT.SHAREE_FREE_BUSY:
            result.share.set.push({
              'dav:href': HREF_PREFIX + this._userEmails[userId],
              'dav:freebusy': true
            });
            break;
        }
      }, this);

      _.forEach(oldCalendarRight._sharee, function(oldSharedRight, userId) {
        var newSharedRight = this._sharee[userId];

        if (!newSharedRight && oldSharedRight) {
          result.share.remove.push({
            'dav:href': HREF_PREFIX + oldCalendarRight._userEmails[userId]
          });
        }
      }, this);

      return result;
    }

    /**
     * Remove sharee right of userId
     * @param userId
     */
    function removeShareeRight(userId) {
      delete this._userEmails[userId];
      delete this._sharee[userId];
    }

    function toJson() {
      var result = {
        users: {},
        public: this._public.toJson(),
        sharee: this._sharee,
        ownerId: this._ownerId
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

      clone._userRight = _.mapValues(this._userRight, function(calRightSet) {
        return calRightSet.clone();
      });

      clone._userEmails = _.clone(this._userEmails);
      clone._public = this._public.clone();
      clone._sharee = _.clone(this._sharee);
      clone._ownerId = this._ownerId;

      return clone;
    }

    function initRightMatrix() {
      var matrix = {};

      matrix[CAL_CALENDAR_RIGHT.ADMIN] = {
        shouldHave: [
          CalRightSet.SHARE,
          CalRightSet.READ,
          CalRightSet.WRITE,
          CalRightSet.WRITE_PROPERTIES
        ],
        shouldNotHave: []
      };

      matrix[CAL_CALENDAR_RIGHT.PUBLIC_READ] = {
        shouldHave: [
          CalRightSet.READ
        ],
        shouldNotHave: [
          CalRightSet.SHARE,
          CalRightSet.WRITE
        ]
      };

      matrix[CAL_CALENDAR_RIGHT.WRITE] = {
        shouldHave: [
          CalRightSet.WRITE
        ],
        shouldNotHave: [
          CalRightSet.SHARE,
          CalRightSet.WRITE_PROPERTIES,
          CalRightSet.READ
        ]
      };

      matrix[CAL_CALENDAR_RIGHT.FREE_BUSY] = {
        shouldHave: [
          CalRightSet.FREE_BUSY
        ],
        shouldNotHave: [
          CalRightSet.READ,
          CalRightSet.SHARE,
          CalRightSet.WRITE_PROPERTIES,
          CalRightSet.WRITE
        ]
      };

      matrix[CAL_CALENDAR_RIGHT.NONE] = {
        shouldHave: [],
        shouldNotHave: [
          CalRightSet.FREE_BUSY,
          CalRightSet.READ,
          CalRightSet.SHARE,
          CalRightSet.WRITE_PROPERTIES,
          CalRightSet.WRITE
        ]
      };

      return matrix;
    }
  }
})();
