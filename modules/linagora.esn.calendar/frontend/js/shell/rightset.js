'use strict';

angular.module('esn.calendar')
  .factory('RightSet', function() {

    /* eslint-disable no-bitwise */
    function checkIsPowerOfTwo(i) {
      if (typeof i !== 'number' || i & (i - 1)) {
        throw new Error('Given argument is not a correct Right Constant');
      }
    }

    function RightSet(initialPermission) {
      this.bitVector = 0;
      if (initialPermission || initialPermission === 0) {
        this.addPermission(initialPermission);
      }
    }

    RightSet.FREE_BUSY = 1;
    RightSet.READ = 2;
    RightSet.WRITE = 4;
    RightSet.WRITE_PROPERTIES = 8;
    RightSet.SHARE = 16;
    RightSet.SHAREE_READ = 32;
    RightSet.SHAREE_READWRITE = 64;
    RightSet.SHAREE_SHAREDOWNER = 128;

    var webdavStringToConstantDict = {
      '{DAV:}share': RightSet.SHARE,
      '{DAV:}read': RightSet.READ,
      '{DAV:}write': RightSet.WRITE,
      '{DAV:}write-properties': RightSet.WRITE_PROPERTIES,
      '{urn:ietf:params:xml:ns:caldav}read-free-busy': RightSet.FREE_BUSY
    };

    var calendarShareeRightConstantToRightConstantDict = {
      1: RightSet.SHAREE_SHAREDOWNER,
      2: RightSet.SHAREE_READ,
      3: RightSet.SHAREE_READWRITE
    };

    RightSet.webdavStringToConstant = function(string) {
      var result = webdavStringToConstantDict[string];

      if (!result) {
        throw new Error('Unknown webdavString : ' + string);
      }

      return result;
    };

    RightSet.calendarShareeIntToConstant = function(integer) {
      var result = calendarShareeRightConstantToRightConstantDict[integer];

      if (!result) {
        throw new Error('Unknow calendarSharee integer : ' + integer);
      }

      return result;
    };

    RightSet.prototype.toString = function() {
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
    };

    RightSet.prototype.addPermission = function(permission) {
      this.addPermissions([permission]);
    };

    RightSet.prototype.removePermission = function(permission) {
      this.removePermissions([permission]);
    };

    function combinePermission(permissions) {
      return permissions.reduce(function(prec, current) {
        checkIsPowerOfTwo(current);

        return prec | current;
      }, 0);
    }

    RightSet.prototype.hasAtLeastAllOfThosePermissions = function(permissions) {
      var maskOfAllPermission = combinePermission(permissions);

      return (this.bitVector & maskOfAllPermission) === maskOfAllPermission;
    };

    RightSet.prototype.hasNoneOfThosePermissions = function(permissions) {
      var maskOfAllPermission = combinePermission(permissions);

      return !(this.bitVector & maskOfAllPermission);
    };

    RightSet.prototype.hasPermission = function(permission) {
      return this.hasAtLeastAllOfThosePermissions([permission]);
    };

    RightSet.prototype.addPermissions = function(permissions) {
      var maskOfAllPermission = combinePermission(permissions);

      this.bitVector = this.bitVector | maskOfAllPermission;
    };

    RightSet.prototype.removePermissions = function(permissions) {
      var maskOfAllPermission = combinePermission(permissions);

      this.bitVector = this.bitVector & ~maskOfAllPermission;
    };

    RightSet.prototype.hasOnlyThosePermissions = function(permissions) {
      var maskOfAllPermission = combinePermission(permissions);

      return this.bitVector === maskOfAllPermission;
    };

    RightSet.prototype.isEmpty = function() {
      return this.bitVector === 0;
    };
    /* eslint-enable no-bitwise */

    RightSet.prototype.equals = function(otherSet) {
      return Boolean(otherSet && (otherSet.bitVector || otherSet.bitVector === 0) && otherSet.bitVector === this.bitVector);
    };

    return RightSet;
  });
