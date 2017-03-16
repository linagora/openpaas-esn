(function() {
  'use strict';

  angular.module('esn.calendar')
    .factory('CalRightSet', CalRightSetFactory);

  function CalRightSetFactory() {
    var webdavStringToConstantDict, calendarShareeRightConstantToRightConstantDict;

    CalRightSet.FREE_BUSY = 1;
    CalRightSet.READ = 2;
    CalRightSet.WRITE = 4;
    CalRightSet.WRITE_PROPERTIES = 8;
    CalRightSet.SHARE = 16;
    CalRightSet.READ_ACL = 32;
    CalRightSet.WRITE_ACL = 64;
    CalRightSet.SHAREE_READ = 128;
    CalRightSet.SHAREE_READWRITE = 256;
    CalRightSet.SHAREE_SHAREDOWNER = 512;
    CalRightSet.SHAREE_ADMIN = 1024;
    CalRightSet.SHAREE_FREE_BUSY = 2048;

    CalRightSet.SHAREE_BITMASK = CalRightSet.SHAREE_READ + CalRightSet.SHAREE_READWRITE + CalRightSet.SHAREE_SHAREDOWNER + CalRightSet.SHAREE_ADMIN + CalRightSet.SHAREE_FREE_BUSY;

    CalRightSet.calendarShareeIntToConstant = calendarShareeIntToConstant;
    CalRightSet.webdavStringToConstant = webdavStringToConstant;

    CalRightSet.prototype.addPermission = addPermission;
    CalRightSet.prototype.addPermissions = addPermissions;
    CalRightSet.prototype.clone = clone;
    CalRightSet.prototype.equals = equals;
    CalRightSet.prototype.hasAtLeastAllOfThosePermissions = hasAtLeastAllOfThosePermissions;
    CalRightSet.prototype.hasAtLeastOneOfThosePermissions = hasAtLeastOneOfThosePermissions;
    CalRightSet.prototype.hasNoneOfThosePermissions = hasNoneOfThosePermissions;
    CalRightSet.prototype.hasOnlyThosePermissions = hasOnlyThosePermissions;
    CalRightSet.prototype.hasPermission = hasPermission;
    CalRightSet.prototype.isEmpty = isEmpty;
    CalRightSet.prototype.removePermission = removePermission;
    CalRightSet.prototype.removePermissions = removePermissions;
    CalRightSet.prototype.toJson = toJson;
    CalRightSet.prototype.toString = toString;

    initConstant();

    return CalRightSet;

    /////////////////

    function initConstant() {
      webdavStringToConstantDict = {
        '{DAV:}share': CalRightSet.SHARE,
        '{DAV:}read': CalRightSet.READ,
        '{DAV:}write': CalRightSet.WRITE,
        '{DAV:}write-properties': CalRightSet.WRITE_PROPERTIES,
        '{DAV:}read-acl': CalRightSet.READ_ACL,
        '{DAV:}write-acl': CalRightSet.WRITE_ACL,
        '{urn:ietf:params:xml:ns:caldav}read-free-busy': CalRightSet.FREE_BUSY
      };

      calendarShareeRightConstantToRightConstantDict = {
        1: CalRightSet.SHAREE_SHAREDOWNER,
        2: CalRightSet.SHAREE_READ,
        3: CalRightSet.SHAREE_READWRITE,
        5: CalRightSet.SHAREE_ADMIN,
        6: CalRightSet.SHAREE_FREE_BUSY
      };
    }

    /* eslint-disable no-bitwise */
    function CalRightSet(initialPermission) {
      this.bitVector = 0;
      if (initialPermission || initialPermission === 0) {
        this.addPermission(initialPermission);
      }
    }

    function checkIsPowerOfTwo(i) {
      if (typeof i !== 'number' || i & (i - 1)) {
        throw new Error('Given argument is not a correct Right Constant');
      }
    }

    function webdavStringToConstant(string) {
      var result = webdavStringToConstantDict[string];

      if (!result) {
        throw new Error('Unknown webdavString : ' + string);
      }

      return result;
    }

    function calendarShareeIntToConstant(integer) {
      var result = calendarShareeRightConstantToRightConstantDict[integer];

      if (!result) {
        throw new Error('Unknow calendarSharee integer : ' + integer);
      }

      return result;
    }

    function toString() {
      var result = [];
      var constToString = {};

      constToString[CalRightSet.FREE_BUSY] = 'FREE_BUSY';
      constToString[CalRightSet.READ] = 'READ';
      constToString[CalRightSet.WRITE] = 'WRITE';
      constToString[CalRightSet.WRITE_PROPERTIES] = 'WRITE_PROPERTIES';
      constToString[CalRightSet.SHARE] = 'SHARE';
      constToString[CalRightSet.READ_ACL] = 'READ_ACL';
      constToString[CalRightSet.WRITE_ACL] = 'WRITE_ACL';
      constToString[CalRightSet.SHAREE_READ] = 'SHAREE_READ';
      constToString[CalRightSet.SHAREE_READWRITE] = 'SHAREE_READWRITE';
      constToString[CalRightSet.SHAREE_SHAREDOWNER] = 'SHAREE_SHAREDOWNER';

      angular.forEach(constToString, function(string, constant) {
        if (this.hasAtLeastAllOfThosePermissions([parseInt(constant, 10)])) {
          result.push(string);
        }
      }, this);

      return 'CalRightSet(' + (result.length ? result.join(', ') : 'no right') + ')';
    }

    function addPermission(permission) {
      this.addPermissions([permission]);
    }

    function removePermission(permission) {
      this.removePermissions([permission]);
    }

    function combinePermission(permissions) {
      return permissions.reduce(function(prec, current) {
        checkIsPowerOfTwo(current);

        return prec | current;
      }, 0);
    }

    function hasAtLeastAllOfThosePermissions(permissions) {
      var maskOfAllPermission = combinePermission(permissions);

      return (this.bitVector & maskOfAllPermission) === maskOfAllPermission;
    }

    function hasNoneOfThosePermissions(permissions) {
      var maskOfAllPermission = combinePermission(permissions);

      return !(this.bitVector & maskOfAllPermission);
    }

    function hasPermission(permission) {
      return this.hasAtLeastAllOfThosePermissions([permission]);
    }

    function addPermissions(permissions) {
      var maskOfAllPermission = combinePermission(permissions);

      if (maskOfAllPermission & CalRightSet.SHAREE_BITMASK) {
        this.bitVector = this.bitVector & ~CalRightSet.SHAREE_BITMASK;
      }

      this.bitVector = this.bitVector | maskOfAllPermission;
    }

    function removePermissions(permissions) {
      var maskOfAllPermission = combinePermission(permissions);

      this.bitVector = this.bitVector & ~maskOfAllPermission;
    }

    function hasAtLeastOneOfThosePermissions(permissions) {
      return !this.hasNoneOfThosePermissions(permissions);
    }

    function hasOnlyThosePermissions(permissions) {
      var maskOfAllPermission = combinePermission(permissions);

      return this.bitVector === maskOfAllPermission;
    }

    function isEmpty() {
      return this.bitVector === 0;
    }
    /* eslint-enable no-bitwise */

    function equals(otherSet) {
      return Boolean(otherSet && (otherSet.bitVector || otherSet.bitVector === 0) && otherSet.bitVector === this.bitVector);
    }

    function clone() {
      var clone = new CalRightSet();
      clone.bitVector = this.bitVector;

      return clone;
    }

    function toJson() {
      return this.bitVector;
    }
  }
})();
