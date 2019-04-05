'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The colorContrast service', function() {
  var colorContrastService;

  beforeEach(function() {
    module('esn.themes');
  });

  beforeEach(inject(function(_colorContrastService_) {
    colorContrastService = _colorContrastService_;
  }));

  describe('computeTextColor', function() {
    it('should return white when given color is black', function() {
      expect(colorContrastService.computeTextColor('#000')).to.eq('#FFF');
      expect(colorContrastService.computeTextColor('#000000')).to.eq('#FFF');
    });

    it('should return black when given color is white', function() {
      expect(colorContrastService.computeTextColor('#FFF')).to.eq('#000');
      expect(colorContrastService.computeTextColor('#FFFFFF')).to.eq('#000');
      expect(colorContrastService.computeTextColor('#fff')).to.eq('#000');
      expect(colorContrastService.computeTextColor('#ffffff')).to.eq('#000');
    });

    it('should return between black and white, the color that contrasts the more when the provided color', function() {
      expect(colorContrastService.computeTextColor('#FB1')).to.eq('#000');
      expect(colorContrastService.computeTextColor('#50079F')).to.eq('#FFF');
      expect(colorContrastService.computeTextColor('#8F474F')).to.eq('#FFF');
      expect(colorContrastService.computeTextColor('#3A0915')).to.eq('#FFF');
      expect(colorContrastService.computeTextColor('#16DA5A')).to.eq('#000');
      expect(colorContrastService.computeTextColor('#60063E')).to.eq('#FFF');
      expect(colorContrastService.computeTextColor('#8FF2BE')).to.eq('#000');
    });
  });
});
