(function() {
  'use strict';

  angular.module('esn.calendar')
    .factory('RightSet', RightSet);

  RightSet.$inject = [];

  function RightSet() {
    var webdavStringToConstantDict, calendarShareeRightConstantToRightConstantDict;

    RightSet.FREE_BUSY = 1;
    RightSet.READ = 2;
    RightSet.WRITE = 4;
    RightSet.WRITE_PROPERTIES = 8;
    RightSet.SHARE = 16;
    RightSet.SHAREE_READ = 32;
    RightSet.SHAREE_READWRITE = 64;
    RightSet.SHAREE_SHAREDOWNER = 128;

    RightSet.calendarShareeIntToConstant = calendarShareeIntToConstant;
    RightSet.webdavStringToConstant = webdavStringToConstant;

    RightSet.prototype.addPermission = addPermission;
    RightSet.prototype.addPermissions = addPermissions;
    RightSet.prototype.clone = clone;
    RightSet.prototype.equals = equals;
    RightSet.prototype.hasAtLeastAllOfThosePermissions = hasAtLeastAllOfThosePermissions;
    RightSet.prototype.hasAtLeastOneOfThosePermissions = hasAtLeastOneOfThosePermissions;
    RightSet.prototype.hasNoneOfThosePermissions = hasNoneOfThosePermissions;
    RightSet.prototype.hasOnlyThosePermissions = hasOnlyThosePermissions;
    RightSet.prototype.hasPermission = hasPermission;
    RightSet.prototype.isEmpty = isEmpty;
    RightSet.prototype.removePermission = removePermission;
    RightSet.prototype.removePermissions = removePermissions;
    RightSet.prototype.toJson = toJson;
    RightSet.prototype.toString = toString;

    initConstant();

    return RightSet;

    /////////////////

    function initConstant() {
      webdavStringToConstantDict = {
        '{DAV:}share': RightSet.SHARE,
        '{DAV:}read': RightSet.READ,
        '{DAV:}write': RightSet.WRITE,
        '{DAV:}write-properties': RightSet.WRITE_PROPERTIES,
        '{urn:ietf:params:xml:ns:caldav}read-free-busy': RightSet.FREE_BUSY
      };

      calendarShareeRightConstantToRightConstantDict = {
        1: RightSet.SHAREE_SHAREDOWNER,
        2: RightSet.SHAREE_READ,
        3: RightSet.SHAREE_READWRITE
      };
    }

    /* eslint-disable no-bitwise */
    function RightSet(initialPermission) {
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
        console.log('string', string);
        console.log('webdavStringToConstantDict', webdavStringToConstantDict);
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

      constToString[RightSet.FREE_BUSY] = 'FREE_BUSY';
      constToString[RightSet.READ] = 'READ';
      constToString[RightSet.WRITE] = 'WRITE';
      constToString[RightSet.WRITE_PROPERTIES] = 'WRITE_PROPERTIES';
      constToString[RightSet.SHARE] = 'SHARE';
      constToString[RightSet.SHAREE_READ] = 'SHAREE_READ';
      constToString[RightSet.SHAREE_READWRITE] = 'SHAREE_READWRITE';
      constToString[RightSet.SHAREE_SHAREDOWNER] = 'SHAREE_SHAREDOWNER';

      angular.forEach(constToString, function(string, constant) {
        if (this.hasAtLeastAllOfThosePermissions([parseInt(constant, 10)])) {
          result.push(string);
        }
      }, this);

      return 'RightSet(' + (result.length ? result.join(', ') : 'no right') + ')';
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
      var clone = new RightSet();
      clone.bitVector = this.bitVector;

      return clone;
    }

    function toJson() {
      return this.bitVector;
    }
  }
})();
