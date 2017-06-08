'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The EsnI18nString service', function() {
  var EsnI18nString, $translate;

  beforeEach(function() {
    angular.mock.module('esn.i18n', function($provide) {
      $translate = {
        instant: sinon.stub().returns('translated')
      };

      $provide.value('$translate', $translate);
    });
  });

  beforeEach(inject(function(_EsnI18nString_) {
    EsnI18nString = _EsnI18nString_;
  }));

  describe('The toString function', function() {
    it('should translate the text', function() {
      var translation = new EsnI18nString('foo bar');

      translation.toString();

      expect($translate.instant).to.be.calledWith('foo bar');
    });

    it('should translate the text with multiple params', function() {
      var translation = new EsnI18nString('foo %s %s', ['bar', 'bazz']);

      translation.toString();

      expect($translate.instant).to.be.calledWith('foo %s %s', ['bar', 'bazz']);
    });

    it('should not translate again if the text has been already translated', function() {
      var translation = new EsnI18nString('foo bar');

      translation.toString();
      translation.toString();

      expect($translate.instant).have.been.calledOnce;
    });
  });
});
