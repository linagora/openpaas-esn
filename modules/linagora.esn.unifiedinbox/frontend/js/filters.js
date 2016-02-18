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
  })

  .filter('inlineImages', function(_) {
    return function(text, attachments) {
      if (!angular.isArray(attachments) || attachments.length === 0) {
        return text;
      }

      return text.replace(/src=["']cid:([^]+?)["']/gim, function(match, cid) {
        var attachment = _.find(attachments, { cid: cid });

        return attachment ? 'src="' + attachment.url + '"' : match;
      });
    };
  })

  .filter('loadImagesAsync', function() {
    return function(text) {
      return text.replace(/<img([^]*?)src=["']([^]+?)["']/gim, '<img$1src="/images/throbber-amber.svg" data-async-src="$2"');
    };
  });
