(function(angular) {
  'use strict';

  angular.module('esn.themes').factory('colorContrastService', colorContrastService);

  function colorContrastService() {
    return {
      computeTextColor: computeTextColor
    };

    /**
     * This returns a color between black or white according to the given color in input.
     * The returned color will be the one that as the highest contrast with the input input.
     *
     * This is usefull to decide which text color to use according to a background color.
     *
     * @param  {string} bgHexRepr Hex representation of the color. Ex: '#FB1' or '#50079F'
     * @returns {string} '#000' or '#FFF'
     */
    function computeTextColor(bgHexRepr) {
      if (bgHexRepr.toUpperCase() === '#FFF' || bgHexRepr.toUpperCase() === '#FFFFFF') {
        return '#000';
      }

      if (bgHexRepr.toUpperCase() === '#000' || bgHexRepr.toUpperCase() === '#000000') {
        return '#FFF';
      }

      var color = bgHexRepr.substring(1, bgHexRepr.length);
      var rgb = [0, 0, 0];

      if (color.length === 3) {
        var r = ''.concat(color[0], color[0]);
        var g = ''.concat(color[1], color[1]);
        var b = ''.concat(color[2], color[2]);

        rgb = [parseInt(r, 16), parseInt(g, 16), parseInt(b, 16)];
      } else {
        rgb = [
          parseInt(color.substring(0, 2), 16),
          parseInt(color.substring(2, 4), 16),
          parseInt(color.substring(4, 6), 16)
        ];
      }

      return _contrast([255, 255, 255], rgb) > _contrast([0, 0, 0], rgb) ? '#FFF' : '#000';
    }

    /**
     * Compute the contrast between 2 colors.
     * Formula is available here: https://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef
     * @param rgb1 Array of 3 integers representing the R, G and B values of the first color.
     * @param rgb2 Array of 3 integers representing the R, G and B values of the second color.
     * @returns {number} Contrast ratio between the two color.
     */
    function _contrast(rgb1, rgb2) {
      var relLum1 = _relativeLuminance(rgb1);
      var relLum2 = _relativeLuminance(rgb2);

      return (Math.max(relLum1, relLum2) + 0.05) / (Math.min(relLum1, relLum2) + 0.05);
    }

    /**
     * Computes relative luminance. Required to compute contrast.
     * See #_contrast.
     * @param rbg Array of 3 integers representing the R, G and B values of the input color.
     * @returns {number} Relative luminance
     */
    function _relativeLuminance(rbg) {
      var relrgb = rbg.map(function(value) {
        var result = value / 255;

        return result <= 0.03928 ? (result / 12.92) : Math.pow((result + 0.055) / 1.055, 2.4);
      });

      return relrgb[0] * 0.2126 + relrgb[1] * 0.7152 + relrgb[2] * 0.0722;
    }
  }
})(angular);
