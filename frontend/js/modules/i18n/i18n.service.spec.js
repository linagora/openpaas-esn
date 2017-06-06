'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esnI18nService service', function() {
  var esnI18nService, EsnI18nString;

  beforeEach(function() {
    angular.mock.module('esn.i18n');
  });

  beforeEach(inject(function(_esnI18nService_, _EsnI18nString_) {
    esnI18nService = _esnI18nService_;
    EsnI18nString = _EsnI18nString_;
  }));

  describe('The translate function', function() {
    it('should create a esnI18nEsnI18nString instance', function() {
      var result = esnI18nService.translate('Foo Bar');

      expect(result).to.be.an.instanceof(EsnI18nString);
    });

    it('should create a EsnI18nString instance with multiple params', function() {
      var result = esnI18nService.translate('Foo', 'Bar', 'Feng');

      expect(result).to.have.property('text', 'Foo');
      expect(result.params).to.shallowDeepEqual(['Bar', 'Feng']);
    });

    it('should return the object if input text is an instantce of EsnI18nString', function() {
      var translated = new EsnI18nString('Foo Bar');
      var output = esnI18nService.translate(translated);

      expect(output).to.equal(translated);
    });

    it('should returnt an error if input object is neither string or EsnI18nString', function() {
      function test() {
        esnI18nService.translate({text: 'Invalid Obj'});
      }

      expect(test).to.throw(TypeError);
    });
  });
});
