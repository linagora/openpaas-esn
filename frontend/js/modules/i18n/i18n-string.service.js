(function() {
  'use strict';

  angular.module('esn.i18n')
    .factory('EsnI18nString', EsnI18nStringFactory);

    function EsnI18nStringFactory($translate) {
      function EsnI18nString(text, params) {
        this.text = text;
        this.params = params;

        return this;
      }

      EsnI18nString.prototype.toString = function() {
        if (!this.translated) {
          this.translated = $translate.instant(this.text, this.params);
        }

        return this.translated;
      };

      return EsnI18nString;
    }
})();
