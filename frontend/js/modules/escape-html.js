'use strict';

angular.module('esn.escape-html', [])
  .factory('escapeHtmlUtils', function() {
      function escapeHTML(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
      }

      function unescapeHTML(str) {
        var div = document.createElement('div');
        div.innerHTML = str;
        var child = div.childNodes[0];
        return child ? child.nodeValue : '';
      }

      return {
        escapeHTML: escapeHTML,
        unescapeHTML: unescapeHTML
      };
    }
  );
