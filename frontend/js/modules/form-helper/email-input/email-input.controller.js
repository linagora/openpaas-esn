(function(angular) {
  'use strict';

  angular.module('esn.form.helper')
    .controller('esnEmailInputController', esnEmailInputController);

  function esnEmailInputController($q, emailService) {
    var self = this;

    self.$onInit = $onInit;
    self.availabilityValidator = availabilityValidator;
    self.emailValidator = emailValidator;
    self.onChange = onChange;

    function $onInit() {
      if (self.email) {
        var emailLocalPart = self.email.split('@')[0];
        var emailDomainPart = self.email.split('@')[1];

        self.emailName = emailDomainPart === self.domainName ? emailLocalPart : self.email;
      }
    }

    function onChange() {
      self.email = buildEmail(self.emailName);
    }

    function availabilityValidator(emailName) {
      var email = buildEmail(emailName);
      var emailAvailability = self.availabilityChecker({ email: email });

      return emailAvailability.then(function(available) {
        if (!available) {
          return $q.reject(new Error('this email is already in use'));
        }
      });
    }

    function emailValidator(emailName) {
      return emailService.isValidEmail(buildEmail(emailName));
    }

    function buildEmail(emailName) {
      return [emailName, self.domainName].join('@');
    }
  }
})(angular);
