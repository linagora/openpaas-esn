(function() {
  'use strict';

  angular.module('esn.calendar')
    .factory('CalDelegationEditionHelper', CalDelegationEditionHelper);

  function CalDelegationEditionHelper() {

    CalDelegationEditionHelper.prototype.getAllRemovedUsersId = getAllRemovedUsersId;
    CalDelegationEditionHelper.prototype.addUserGroup = addUserGroup;
    CalDelegationEditionHelper.prototype.removeUserGroup = removeUserGroup;

    return CalDelegationEditionHelper;

    //////////////////////////////

    function CalDelegationEditionHelper() {
      this._delegations = [];
      this.removedId = {};
    }

    /**
     * Add a list User or a Group to the delegations list
     * @param [{Users | Group}] The list of users/groups
     * @param {String}          The right of the added list
     * @return [{delegation}]   The updated delegation list
     */
    function addUserGroup(newUsersGroups, selection) {
      newUsersGroups.forEach(function(user) {
        var exists = this._delegations.some(function(delegation) {
          return user._id === delegation.user._id;
        });

        if (!exists) {
          this._delegations.push({
            user: user,
            selection: selection
          });
        }
      }, this);

      return this._delegations;
    }

    /**
     * Remove a User or a Group from the delegations list
     * @param {Delegation}      The delegation to remove
     * @return [{Delegation}]   The updated delegation list
     */
    function removeUserGroup(delegationToRemove) {
      this.removedId[delegationToRemove.user._id] = true;
      this._delegations = this._delegations.filter(function(delegation) {
        return delegation.user._id !== delegationToRemove.user._id;
      });

      return this._delegations;
    }

    function getAllRemovedUsersId() {
      return Object.keys(this.removedId);
    }
  }
})();
