'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The delegation service', function() {

  beforeEach(function() {
    angular.mock.module('esn.calendar');
  });

  beforeEach(angular.mock.inject(function(DelegationEditionHelper) {
    this.delegationEditionHelperInstance = new DelegationEditionHelper();
  }));

  describe('addUserGroup function', function() {
    it('should add multiple users to the delegation if newUsersGroups.length>0', function() {
      var newUsersGroups = [{_id: 'a', displayName: 'El toto'}, {_id:'b', displayName: 'El Mariachi'}];
      var selection = 'free/busy';

      expect(this.delegationEditionHelperInstance.addUserGroup(newUsersGroups, selection).length).to.be.equal(2);
    });

    it('should add a user to the delegation if it is not empy', function() {
      var newUsersGroups = [{_id: 'a', displayName: 'El toto'}, {_id: 'b', displayName: 'El Mariachi'}];
      var selection = 'free/busy';

      expect(this.delegationEditionHelperInstance.addUserGroup(newUsersGroups, selection).length).to.be.equal(2);
      newUsersGroups = [{_id: 'c', displayName: 'Anne Onime'}];
      selection = 'administration';

      expect(this.delegationEditionHelperInstance.addUserGroup(newUsersGroups, selection).length).to.be.equal(3);
    });

    it('should not add a user if the user already added', function() {
      var newUsersGroups = [{_id:'a', displayName: 'El toto'}, {_id: 'b', displayName: 'El Mariachi'}];
      var selection = 'free/busy';

      expect(this.delegationEditionHelperInstance.addUserGroup(newUsersGroups, selection).length).to.be.equal(2);

      newUsersGroups = [{_id: 'a', displayName: 'El toto'}];
      selection = 'free/busy';

      expect(this.delegationEditionHelperInstance.addUserGroup(newUsersGroups, selection).length).to.be.equal(2);
    });
  });

  describe('removeUserGroup function', function() {
    beforeEach(function() {
      var newUsersGroups = [{_id: 'a', displayName: 'El toto'}, {_id: 'b', displayName: 'El Mariachi'}];
      var selection = 'free/busy';

      this.delegations = this.delegationEditionHelperInstance.addUserGroup(newUsersGroups, selection);
    });

    it('should remove a user from the delegation', function() {
      var userToRemove = {user: {_id: 'a', displayName: 'El toto'}, selection: 'free/busy'};

      expect(this.delegations.length).to.be.equal(2);
      this.delegations = this.delegationEditionHelperInstance.removeUserGroup(userToRemove);
      expect(this.delegations.length).to.be.equal(1);
      expect(this.delegations).to.be.deep.equal([{user: {_id: 'b', displayName: 'El Mariachi'}, selection: 'free/busy'}]);
    });

    it('should not remove anyone if the user does not exist', function() {
      var userToRemove = {user: {_id: 'c', displayName: 'Don Diego de la Vega'}, selection: 'free/busy'};

      expect(this.delegations.length).to.be.equal(2);
      this.delegations = this.delegationEditionHelperInstance.removeUserGroup(userToRemove);
      expect(this.delegations.length).to.be.equal(2);
    });

    it('should keep track of removed user', function() {
      var userToRemove = {user: {_id: 'a', displayName: 'El toto'}, selection: 'free/busy'};

      this.delegationEditionHelperInstance.removeUserGroup(userToRemove);
      expect(this.delegationEditionHelperInstance.getAllRemovedUsersId()).to.deep.equals(['a']);
    });
  });
});
