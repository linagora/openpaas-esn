'use strict';

angular.module('esn.calendar')
  .factory('DelegationService', function() {

    function DelegationService() {
      this._delegations = [];
    }

    /**
     * Add a list User or a Group to the delegations list
     * @param [{Users | Group}] The list of users/groups
     * @param {String}          The right of the added list
     * @return [{delegation}]   The updated delegation list
     */
    DelegationService.prototype.addUserGroup = function(newUsersGroups, selection) {
      newUsersGroups.forEach(function(attendee) {
        var exists = this._delegations.some(function(delegation) {
          return attendee._id === delegation.attendee._id;
        });

        if (!exists) {
          this._delegations.push({
            attendee: attendee,
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
    DelegationService.prototype.removeUserGroup = function(delegationToRemove) {

      this._delegations = this._delegations.filter(function(delegation) {
        return delegation.attendee._id !== delegationToRemove.attendee._id;
      });

      return this._delegations;
    };

    return DelegationService;
  });
