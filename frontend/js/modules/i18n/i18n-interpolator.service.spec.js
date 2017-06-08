'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esnI18nInterpolator service', function() {
  var esnI18nInterpolator;

  beforeEach(function() {
    angular.mock.module('esn.i18n');
  });

  beforeEach(inject(function(_esnI18nInterpolator_) {
    esnI18nInterpolator = _esnI18nInterpolator_;
  }));

  describe('The interpolate function', function() {
    it('should replace string that contains a variable', function() {
      var result = esnI18nInterpolator.interpolate('Hello %s!', ['world']);

      expect(result).to.equal('Hello world!');
    });

    it('should replace string that contains multiple variables', function() {
      var result = esnI18nInterpolator.interpolate('Greetings from %s %s', ['Hanoi', 'Linagorians']);

      expect(result).to.equal('Greetings from Hanoi Linagorians');
    });
  });
});
