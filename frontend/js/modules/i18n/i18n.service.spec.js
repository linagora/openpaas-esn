'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esnI18nArrayInterpolation service', function() {
  var esnI18nArrayInterpolation;

  beforeEach(function() {
    angular.mock.module('esn.i18n');
  });

  beforeEach(inject(function(_esnI18nArrayInterpolation_) {
    esnI18nArrayInterpolation = _esnI18nArrayInterpolation_;
  }));

  describe('The interpolate function', function() {
    it('should replace string that contains a variable', function() {
      var result = esnI18nArrayInterpolation.interpolate('Hello %s!', ['world']);

      expect(result).to.equal('Hello world!');
    });

    it('should replace string that contains multiple variables', function() {
      var result = esnI18nArrayInterpolation.interpolate('Greetings from %s %s', ['Hanoi', 'Linagorians']);

      expect(result).to.equal('Greetings from Hanoi Linagorians');
    });
  });
});
