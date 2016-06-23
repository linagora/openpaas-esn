'use strict';

angular.module('esn.calendar')
  .factory('DelegationEditionHelper', function() {

    function DelegationEditionHelper() {
      this._delegations = [];
      this.removedId = {};
    }

    /**
     * Add a list User or a Group to the delegations list
     * @param [{Users | Group}] The list of users/groups
     * @param {String}          The right of the added list
     * @return [{delegation}]   The updated delegation list
     */
    DelegationEditionHelper.prototype.addUserGroup = function(newUsersGroups, selection) {
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
    };

    /**
     * Remove a User or a Group from the delegations list
     * @param {Delegation}      The delegation to remove
     * @return [{Delegation}]   The updated delegation list
     */
    DelegationEditionHelper.prototype.removeUserGroup = function(delegationToRemove) {
      this.removedId[delegationToRemove.user._id] = true;
      this._delegations = this._delegations.filter(function(delegation) {
        return delegation.user._id !== delegationToRemove.user._id;
      });

      return this._delegations;
    };

    DelegationEditionHelper.prototype.getAllRemovedUsersId = function() {
      return Object.keys(this.removedId);
    };

    return DelegationEditionHelper;
  });
