'use strict';

angular.module('esn.highlight', [])

.filter('esnHighlight', function($sce) {
    function escapeRegexChars(str) {
      return str && str.replace(/([.?*+^$[\]\\(){}|-])/g, ' ');
    }
    function escapeHTML(str) {
      return angular.isUndefined(str) || str === null ? '' : str.toString().trim()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
    return function(text, phrase) {
      phrase = escapeHTML(phrase);
      text = escapeHTML(text);
      var expression = new RegExp('(' + escapeRegexChars(phrase) + ')', 'gi');
      if (phrase) {
        text = text.replace(expression, '<span class="highlight">$1</span>');
      }
      return $sce.trustAsHtml(text);
    };
  });
