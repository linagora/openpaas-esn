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

  describe('addPermissions', function() {
    it('should add correctly a permissions list to a set', function() {
      var set = new RightSet();
      set.addPermissions([RightSet.WRITE, RightSet.READ]);

      expect(set.hasAtLeastAllOfThosePermissions([RightSet.WRITE])).to.be.true;
      expect(set.hasAtLeastAllOfThosePermissions([RightSet.READ])).to.be.true;
      expect(set.hasAtLeastAllOfThosePermissions([RightSet.FREE_BUSY])).to.be.false;
    });

    it('should not change the set if a empty list is given', function() {
      var set = new RightSet(RightSet.FREE_BUSY);

      set.addPermissions([]);
      expect(set.bitVector).to.be.equal(RightSet.FREE_BUSY);
    });
  });

  describe('removePermissions', function() {
    it('should correctly remove the given permission', function() {
      var set = new RightSet();

      set.bitVector = -1; //it create a set will all permissions

      expect(set.hasAtLeastAllOfThosePermissions([RightSet.READ, RightSet.FREE_BUSY])).to.be.true;
      set.removePermissions([RightSet.FREE_BUSY, RightSet.READ]);

      expect(set.hasAtLeastAllOfThosePermissions([RightSet.READ])).to.be.false;
      expect(set.hasAtLeastAllOfThosePermissions([RightSet.FREE_BUSY])).to.be.false;
      expect(set.hasAtLeastAllOfThosePermissions([RightSet.WRITE])).to.be.true;
    });

    it('should not change the set if a empty list is given', function() {
      var set = new RightSet(RightSet.FREE_BUSY);

      set.bitVector = -1;
      expect(set.bitVector).to.be.equal(-1);
    });
  });

  describe('removePermission', function() {
    it('should correctly remove the given permission', function() {
      var set = new RightSet();

      set.addPermission(RightSet.READ);
      set.removePermission(RightSet.READ);
      expect(set.hasPermission(RightSet.READ)).to.be.false;
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

  describe('hasAtLeastOneOfThosePermissions', function() {
    it('should return true if and only if there is at least one given permission that it\'s on the set', function() {
      var set = new RightSet();

      expect(set.hasAtLeastOneOfThosePermissions([])).to.be.false;

      set.addPermission(RightSet.WRITE);
      set.addPermission(RightSet.SHARE);

      expect(set.hasAtLeastOneOfThosePermissions([RightSet.WRITE])).to.be.true;
      expect(set.hasAtLeastOneOfThosePermissions([RightSet.WRITE, RightSet.READ])).to.be.true;
      expect(set.hasAtLeastOneOfThosePermissions([RightSet.WRITE, RightSet.READ, RightSet.SHARE])).to.be.true;
      expect(set.hasAtLeastOneOfThosePermissions([RightSet.WRITE, RightSet.READ, RightSet.SHARE, RightSet.FREE_BUSY])).to.be.true;

      expect(set.hasAtLeastOneOfThosePermissions([RightSet.READ])).to.be.false;
      expect(set.hasAtLeastOneOfThosePermissions([RightSet.READ, RightSet.FREE_BUSY, RightSet.WRITE_PROPERTIES])).to.be.false;
    });
  });

  describe('hasPermission', function() {
    it('should return false with empty set', function() {
      var set = new RightSet();
      expect(set.hasPermission(RightSet.WRITE)).to.be.false;
    });

    it('should return false if the set does not have corresponding write', function() {
      var set = new RightSet();
      set.addPermission(RightSet.READ);
      expect(set.hasPermission(RightSet.WRITE)).to.be.false;
    });

    it('should return true if the set has corresponding write', function() {
      var set = new RightSet();
      set.addPermission(RightSet.WRITE);
      expect(set.hasPermission(RightSet.WRITE)).to.be.true;
    });
  });

  describe('equals', function() {
    it('should not fail and return false for undefined method', function() {
      var set = new RightSet();

      [undefined, {}, {a:2}].forEach(function(badData) {
        expect(set.equals(badData)).to.be.false;
      });
    });

    it('should work for empty set', function() {
      expect((new RightSet()).equals(new RightSet())).to.be.true;
    });

    it('should return true if and only if set are really equals', function() {
      var set1 = new RightSet(RightSet.SHAREE_READWRITE);
      var set2 = new RightSet(RightSet.READ);
      var set3 = new RightSet(RightSet.READ);

      expect(set1.equals(set2)).to.be.false;
      expect(set2.equals(set1)).to.be.false;

      expect(set2.equals(set3)).to.be.true;
      expect(set3.equals(set2)).to.be.true;
    });
  });

  describe('clone', function() {
    it('should create a clone that is independant of the origin', function() {
      var set = new RightSet(RightSet.SHAREE_READWRITE);
      var clone = set.clone();
      expect(set.equals(clone)).to.be.true;
      expect(set !== clone).to.be.true;
      set.addPermission(RightSet.WRITE);
      expect(set.equals(clone)).to.be.false;
    });
  });
});
