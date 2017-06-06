(function() {
  'use strict';

  angular.module('esn.i18n')
    .factory('EsnI18nString', EsnI18nString);

    function EsnI18nString($translate) {
      function I18nString(text, params) {
        this.text = text;
        this.params = params;

        return this;
      }

      I18nString.prototype.toString = function() {
        if (!this.translated) {
          this.translated = $translate.instant(this.text, this.params);
        }

        return this.translated;
      };

      return I18nString;
    }
})();
