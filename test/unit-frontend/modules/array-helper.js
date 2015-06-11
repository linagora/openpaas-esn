'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Array Helper module', function() {
  beforeEach(angular.mock.module('esn.array-helper'));

  describe('arrayHelper service', function() {

    beforeEach(angular.mock.inject(function(arrayHelper) {
      this.arrayHelperService = arrayHelper;
    }));

    describe('the sortHashArrayBy function', function() {

      it('should not order array when order is not given', function() {
        var data = [
          {firstName: 'DBC', lastName: 'DEF'},
          {firstName: 'aBC', lastName: 'DEF'},
          {firstName: 'EBC', lastName: 'DEF'},
          {firstName: 'zBC', lastName: 'DEF'}
        ];

        var result = this.arrayHelperService.sortHashArrayBy(data);
        expect(result).to.deep.equal(data);
      });

      it('should return empty array when input is null', function() {
        var result = this.arrayHelperService.sortHashArrayBy();
        expect(result).to.deep.equal([]);
      });

      it('should order array', function() {

        var d = {firstName: 'DBC', lastName: 'DEF'};
        var a = {firstName: 'aBC', lastName: 'DEF'};
        var e = {firstName: 'EBC', lastName: 'DEF'};
        var z = {firstName: 'zBC', lastName: 'DEF'};

        var data = [d, a, e, z];

        var result = this.arrayHelperService.sortHashArrayBy(data, 'firstName');
        expect(result).to.have.length(data.length);
        expect(result[0]).to.deep.equal(a);
        expect(result[1]).to.deep.equal(d);
        expect(result[2]).to.deep.equal(e);
        expect(result[3]).to.deep.equal(z);
      });
    });
  });
});
