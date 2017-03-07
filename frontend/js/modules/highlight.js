'use strict';

angular.module('esn.highlight', [])

.filter('esnHighlight', function($sce, escapeHtmlUtils) {
    function escapeRegexChars(str) {
      return str && str.replace(/([.?*+^$[\]\\(){}|-])/g, ' ');
    }

    function replacer(match, text, tags) {
      return text ? '<span class="highlight">' + text + '</span>' : tags;
    }

    return function(text, phrase, options) {
      if (!text) {
        return text;
      }

      options = options || {};
      phrase = escapeHtmlUtils.escapeHTML(phrase);
      phrase = escapeRegexChars(phrase);

      if (!options.ignoreEscape) {
        text = escapeHtmlUtils.escapeHTML(text);
      }

      if (phrase) {
        var expression = new RegExp('(' + phrase + ')|(<[^>]*?' + phrase + '.*?>)', 'gi');

        text = text.replace(expression, replacer);
      }

      return $sce.trustAsHtml(text);
    };
  });
