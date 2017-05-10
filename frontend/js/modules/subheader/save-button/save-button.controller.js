(function(angular) {
  'use strict';

  angular.module('esn.subheader')
    .controller('esnSubheaderSaveButtonController', esnSubheaderSaveButtonController);

  function esnSubheaderSaveButtonController(rejectWithErrorNotification) {
    var self = this;

    self.checkValidThenSubmit = checkValidThenSubmit;

    function checkValidThenSubmit() {
      if (self.form.$valid) {
        return self.onClick().then(function() {
          self.form.$setPristine();
          self.form.$setUntouched();
        });
      }

      self.form.$setSubmitted();

      return rejectWithErrorNotification('Form is invalid!');
    }
  }
})(angular);
