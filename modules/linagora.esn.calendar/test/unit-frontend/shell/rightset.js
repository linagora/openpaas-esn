'use strict';

/* global chai: false */
var expect = chai.expect;

describe('RightSet', function() {
  var RightSet;

  beforeEach(function() {
    angular.mock.module('esn.calendar');
  });

  beforeEach(function() {
    angular.mock.inject(function(_RightSet_) {
      RightSet = _RightSet_;
    });
  });

  describe('Constructor', function() {
    it('should init in a empty set if no given right', function() {
      expect((new RightSet()).isEmpty()).to.be.true;
    });

    it('should init in a set containing on the given rigth', function() {
      var set = new RightSet(RightSet.SHARE);

      expect(set.hasAtLeastAllOfThosePermissions([RightSet.SHARE])).to.be.true;
      expect(set.hasAtLeastAllOfThosePermissions([RightSet.WRITE])).to.be.false;
    });
  });

  describe('toString method', function() {
    it('should return no right for empty set', function() {
      expect((new RightSet()).toString()).to.equal('RightSet(no right)');
    });

    it('should return the list of given set', function() {
      var set = new RightSet();

      set.addPermission(RightSet.FREE_BUSY);
      set.addPermission(RightSet.WRITE);
      expect(set.toString()).to.equal('RightSet(FREE_BUSY, WRITE)');
    });
  });

  describe('The empty function', function() {
    it('should return true only for an empty set', function() {
      expect((new RightSet()).isEmpty()).to.be.true;
      expect((new RightSet(RightSet.SHARE)).isEmpty()).to.be.false;
    });
  });

  describe('addPermission', function() {
    it('should add correctly a permission to a set', function() {
      var set = new RightSet();

      set.addPermission(RightSet.WRITE);
      expect(set.hasAtLeastAllOfThosePermissions([RightSet.WRITE])).to.be.true;
      expect(set.hasAtLeastAllOfThosePermissions([RightSet.READ])).to.be.false;

      set.addPermission(RightSet.READ);
      expect(set.hasAtLeastAllOfThosePermissions([RightSet.WRITE])).to.be.true;
      expect(set.hasAtLeastAllOfThosePermissions([RightSet.READ])).to.be.true;
    });
  });

  describe('hasAtLeastAllOfThosePermissions', function() {
    it('should return true if and only if the set contain all given permission', function() {
      var set = new RightSet();

      expect(set.hasAtLeastAllOfThosePermissions([])).to.be.true;

      set.addPermission(RightSet.WRITE);
      set.addPermission(RightSet.READ);
      set.addPermission(RightSet.SHARE);

      expect(set.hasAtLeastAllOfThosePermissions([])).to.be.true;
      expect(set.hasAtLeastAllOfThosePermissions([RightSet.WRITE])).to.be.true;
      expect(set.hasAtLeastAllOfThosePermissions([RightSet.WRITE, RightSet.READ])).to.be.true;
      expect(set.hasAtLeastAllOfThosePermissions([RightSet.WRITE, RightSet.READ, RightSet.SHARE])).to.be.true;
      expect(set.hasAtLeastAllOfThosePermissions([RightSet.WRITE, RightSet.READ, RightSet.SHARE, RightSet.FREE_BUSY])).to.be.false;
      expect(set.hasAtLeastAllOfThosePermissions([RightSet.SHARE, RightSet.READ, RightSet.WRITE, RightSet.WRITE_PROPERTIES])).to.be.false;
    });
  });

  describe('hasOnlyThosePermissions', function() {
    it('should return true if and only the set contain all and only the given permission', function() {
      var set = new RightSet();

      expect(set.hasOnlyThosePermissions([])).to.be.true;
      expect(set.hasOnlyThosePermissions([RightSet.WRITE])).to.be.false;

      set.addPermission(RightSet.WRITE);
      expect(set.hasOnlyThosePermissions([RightSet.WRITE])).to.be.true;
      expect(set.hasOnlyThosePermissions([RightSet.WRITE, RightSet.READ])).to.be.false;

      set.addPermission(RightSet.READ);
      expect(set.hasOnlyThosePermissions([RightSet.WRITE, RightSet.READ])).to.be.true;
    });
  });

  describe('hasNoneOfThosePermissions', function() {
    it('should return true if and only if there is at least one given permission that it\'s on the set', function() {
      var set = new RightSet();

      expect(set.hasNoneOfThosePermissions([])).to.be.true;

      set.addPermission(RightSet.WRITE);
      set.addPermission(RightSet.SHARE);

      expect(set.hasNoneOfThosePermissions([RightSet.WRITE])).to.be.false;
      expect(set.hasNoneOfThosePermissions([RightSet.WRITE, RightSet.READ])).to.be.false;
      expect(set.hasNoneOfThosePermissions([RightSet.WRITE, RightSet.READ, RightSet.SHARE])).to.be.false;
      expect(set.hasNoneOfThosePermissions([RightSet.WRITE, RightSet.READ, RightSet.SHARE, RightSet.FREE_BUSY])).to.be.false;

      expect(set.hasNoneOfThosePermissions([RightSet.READ])).to.be.true;
      expect(set.hasNoneOfThosePermissions([RightSet.READ, RightSet.FREE_BUSY, RightSet.WRITE_PROPERTIES])).to.be.true;
    });
  });
});
