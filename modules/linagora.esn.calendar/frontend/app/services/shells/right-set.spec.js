'use strict';

/* global chai: false */
var expect = chai.expect;

describe('CalRightSet', function() {
  var CalRightSet;

  beforeEach(function() {
    angular.mock.module('esn.calendar');
  });

  beforeEach(function() {
    angular.mock.inject(function(_CalRightSet_) {
      CalRightSet = _CalRightSet_;
    });
  });

  describe('Constructor', function() {
    it('should init in a empty set if no given right', function() {
      expect((new CalRightSet()).isEmpty()).to.be.true;
    });

    it('should init in a set containing on the given rigth', function() {
      var set = new CalRightSet(CalRightSet.SHARE);

      expect(set.hasAtLeastAllOfThosePermissions([CalRightSet.SHARE])).to.be.true;
      expect(set.hasAtLeastAllOfThosePermissions([CalRightSet.WRITE])).to.be.false;
    });
  });

  describe('toString method', function() {
    it('should return no right for empty set', function() {
      expect((new CalRightSet()).toString()).to.equal('CalRightSet(no right)');
    });

    it('should return the list of given set', function() {
      var set = new CalRightSet();

      set.addPermission(CalRightSet.FREE_BUSY);
      set.addPermission(CalRightSet.WRITE);

      expect(set.toString()).to.equal('CalRightSet(FREE_BUSY, WRITE)');
    });
  });

  describe('The empty function', function() {
    it('should return true only for an empty set', function() {
      expect((new CalRightSet()).isEmpty()).to.be.true;
      expect((new CalRightSet(CalRightSet.SHARE)).isEmpty()).to.be.false;
    });
  });

  describe('addPermission', function() {
    it('should add correctly a permission to a set', function() {
      var set = new CalRightSet();

      set.addPermission(CalRightSet.WRITE);

      expect(set.hasAtLeastAllOfThosePermissions([CalRightSet.WRITE])).to.be.true;
      expect(set.hasAtLeastAllOfThosePermissions([CalRightSet.READ])).to.be.false;

      set.addPermission(CalRightSet.READ);

      expect(set.hasAtLeastAllOfThosePermissions([CalRightSet.WRITE])).to.be.true;
      expect(set.hasAtLeastAllOfThosePermissions([CalRightSet.READ])).to.be.true;
    });
  });

  describe('addPermissions', function() {
    it('should add correctly a permissions list to a set', function() {
      var set = new CalRightSet();

      set.addPermissions([CalRightSet.WRITE, CalRightSet.READ]);

      expect(set.hasAtLeastAllOfThosePermissions([CalRightSet.WRITE])).to.be.true;
      expect(set.hasAtLeastAllOfThosePermissions([CalRightSet.READ])).to.be.true;
      expect(set.hasAtLeastAllOfThosePermissions([CalRightSet.FREE_BUSY])).to.be.false;
    });

    it('should not change the set if a empty list is given', function() {
      var set = new CalRightSet(CalRightSet.FREE_BUSY);

      set.addPermissions([]);

      expect(set.bitVector).to.be.equal(CalRightSet.FREE_BUSY);
    });
  });

  describe('removePermissions', function() {
    it('should correctly remove the given permission', function() {
      var set = new CalRightSet();

      set.bitVector = -1; //it create a set will all permissions

      expect(set.hasAtLeastAllOfThosePermissions([CalRightSet.READ, CalRightSet.FREE_BUSY])).to.be.true;

      set.removePermissions([CalRightSet.FREE_BUSY, CalRightSet.READ]);

      expect(set.hasAtLeastAllOfThosePermissions([CalRightSet.READ])).to.be.false;
      expect(set.hasAtLeastAllOfThosePermissions([CalRightSet.FREE_BUSY])).to.be.false;
      expect(set.hasAtLeastAllOfThosePermissions([CalRightSet.WRITE])).to.be.true;
    });

    it('should not change the set if a empty list is given', function() {
      var set = new CalRightSet(CalRightSet.FREE_BUSY);

      set.bitVector = -1;

      expect(set.bitVector).to.be.equal(-1);
    });
  });

  describe('removePermission', function() {
    it('should correctly remove the given permission', function() {
      var set = new CalRightSet();

      set.addPermission(CalRightSet.READ);
      set.removePermission(CalRightSet.READ);

      expect(set.hasPermission(CalRightSet.READ)).to.be.false;
    });
  });

  describe('hasAtLeastAllOfThosePermissions', function() {
    it('should return true if and only if the set contain all given permission', function() {
      var set = new CalRightSet();

      expect(set.hasAtLeastAllOfThosePermissions([])).to.be.true;

      set.addPermission(CalRightSet.WRITE);
      set.addPermission(CalRightSet.READ);
      set.addPermission(CalRightSet.SHARE);

      expect(set.hasAtLeastAllOfThosePermissions([])).to.be.true;
      expect(set.hasAtLeastAllOfThosePermissions([CalRightSet.WRITE])).to.be.true;
      expect(set.hasAtLeastAllOfThosePermissions([CalRightSet.WRITE, CalRightSet.READ])).to.be.true;
      expect(set.hasAtLeastAllOfThosePermissions([CalRightSet.WRITE, CalRightSet.READ, CalRightSet.SHARE])).to.be.true;
      expect(set.hasAtLeastAllOfThosePermissions([CalRightSet.WRITE, CalRightSet.READ, CalRightSet.SHARE, CalRightSet.FREE_BUSY])).to.be.false;
      expect(set.hasAtLeastAllOfThosePermissions([CalRightSet.SHARE, CalRightSet.READ, CalRightSet.WRITE, CalRightSet.WRITE_PROPERTIES])).to.be.false;
    });
  });

  describe('hasOnlyThosePermissions', function() {
    it('should return true if and only the set contain all and only the given permission', function() {
      var set = new CalRightSet();

      expect(set.hasOnlyThosePermissions([])).to.be.true;
      expect(set.hasOnlyThosePermissions([CalRightSet.WRITE])).to.be.false;

      set.addPermission(CalRightSet.WRITE);

      expect(set.hasOnlyThosePermissions([CalRightSet.WRITE])).to.be.true;
      expect(set.hasOnlyThosePermissions([CalRightSet.WRITE, CalRightSet.READ])).to.be.false;

      set.addPermission(CalRightSet.READ);

      expect(set.hasOnlyThosePermissions([CalRightSet.WRITE, CalRightSet.READ])).to.be.true;
    });
  });

  describe('hasNoneOfThosePermissions', function() {
    it('should return true if and only if there is at least one given permission that it\'s on the set', function() {
      var set = new CalRightSet();

      expect(set.hasNoneOfThosePermissions([])).to.be.true;

      set.addPermission(CalRightSet.WRITE);
      set.addPermission(CalRightSet.SHARE);

      expect(set.hasNoneOfThosePermissions([CalRightSet.WRITE])).to.be.false;
      expect(set.hasNoneOfThosePermissions([CalRightSet.WRITE, CalRightSet.READ])).to.be.false;
      expect(set.hasNoneOfThosePermissions([CalRightSet.WRITE, CalRightSet.READ, CalRightSet.SHARE])).to.be.false;
      expect(set.hasNoneOfThosePermissions([CalRightSet.WRITE, CalRightSet.READ, CalRightSet.SHARE, CalRightSet.FREE_BUSY])).to.be.false;

      expect(set.hasNoneOfThosePermissions([CalRightSet.READ])).to.be.true;
      expect(set.hasNoneOfThosePermissions([CalRightSet.READ, CalRightSet.FREE_BUSY, CalRightSet.WRITE_PROPERTIES])).to.be.true;
    });
  });

  describe('hasAtLeastOneOfThosePermissions', function() {
    it('should return true if and only if there is at least one given permission that it\'s on the set', function() {
      var set = new CalRightSet();

      expect(set.hasAtLeastOneOfThosePermissions([])).to.be.false;

      set.addPermission(CalRightSet.WRITE);
      set.addPermission(CalRightSet.SHARE);

      expect(set.hasAtLeastOneOfThosePermissions([CalRightSet.WRITE])).to.be.true;
      expect(set.hasAtLeastOneOfThosePermissions([CalRightSet.WRITE, CalRightSet.READ])).to.be.true;
      expect(set.hasAtLeastOneOfThosePermissions([CalRightSet.WRITE, CalRightSet.READ, CalRightSet.SHARE])).to.be.true;
      expect(set.hasAtLeastOneOfThosePermissions([CalRightSet.WRITE, CalRightSet.READ, CalRightSet.SHARE, CalRightSet.FREE_BUSY])).to.be.true;

      expect(set.hasAtLeastOneOfThosePermissions([CalRightSet.READ])).to.be.false;
      expect(set.hasAtLeastOneOfThosePermissions([CalRightSet.READ, CalRightSet.FREE_BUSY, CalRightSet.WRITE_PROPERTIES])).to.be.false;
    });
  });

  describe('hasPermission', function() {
    it('should return false with empty set', function() {
      var set = new CalRightSet();

      expect(set.hasPermission(CalRightSet.WRITE)).to.be.false;
    });

    it('should return false if the set does not have corresponding write', function() {
      var set = new CalRightSet();

      set.addPermission(CalRightSet.READ);

      expect(set.hasPermission(CalRightSet.WRITE)).to.be.false;
    });

    it('should return true if the set has corresponding write', function() {
      var set = new CalRightSet();

      set.addPermission(CalRightSet.WRITE);

      expect(set.hasPermission(CalRightSet.WRITE)).to.be.true;
    });
  });

  describe('equals', function() {
    it('should not fail and return false for undefined method', function() {
      var set = new CalRightSet();

      [undefined, {}, {a: 2}].forEach(function(badData) {
        expect(set.equals(badData)).to.be.false;
      });
    });

    it('should work for empty set', function() {
      expect((new CalRightSet()).equals(new CalRightSet())).to.be.true;
    });

    it('should return true if and only if set are really equals', function() {
      var set1 = new CalRightSet(CalRightSet.WRITE);
      var set2 = new CalRightSet(CalRightSet.READ);
      var set3 = new CalRightSet(CalRightSet.READ);

      expect(set1.equals(set2)).to.be.false;
      expect(set2.equals(set1)).to.be.false;

      expect(set2.equals(set3)).to.be.true;
      expect(set3.equals(set2)).to.be.true;
    });
  });

  describe('clone', function() {
    it('should create a clone that is independant of the origin', function() {
      var set = new CalRightSet(CalRightSet.READ);
      var clone = set.clone();

      expect(set.equals(clone)).to.be.true;
      expect(set !== clone).to.be.true;

      set.addPermission(CalRightSet.WRITE);

      expect(set.equals(clone)).to.be.false;
    });
  });
});
