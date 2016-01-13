'use strict';

angular.module('linagora.esn.unifiedinbox')

  .filter('trustAsHtml', function($sce) {
    return function(text) {
      return $sce.trustAsHtml(text);
    };
  })

  .filter('emailer', function(emailBodyService) {
    return function(recipient) {
      if (!recipient) {
        return;
      }

      if (recipient.name) {
        return recipient.name.concat(emailBodyService.supportsRichtext() ? ' &lt;' : ' <', recipient.email, emailBodyService.supportsRichtext() ? '&gt;' : '>');
      }

      return recipient.email;
    };
  })

  .filter('emailerList', function($filter) {

    return function(array, prefix) {
      array = array || [];

      if (array.length === 0) {
        return;
      }

      var result = array.map($filter('emailer')).join(', ');

      if (prefix) {
        result = prefix + result;
      }
      return result;
    };
  });
