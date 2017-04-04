'use strict';

angular.module('linagora.esn.unifiedinbox')

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

  .filter('nl2br', function() {
    return function(text) {
      if (!angular.isDefined(text)) {
        return;
      }

      return text.trim().replace(/([^>\r\n]?)(\r\n|\r|\n)/gm, '$1<br/>');
    };
  })

  .filter('loadImagesAsync', function(absoluteUrl) {
    var throbberUrl = absoluteUrl('/images/throbber-amber.svg');

    return function(text) {
      return text.replace(/<img([^]*?)src=["']([^]+?)["']/gim, '<img$1src="' + throbberUrl + '" data-async-src="$2"');
    };
  })

  .filter('inboxFilterRestrictedMailboxes', function(inboxMailboxesService, _) {
    return function(mailboxes) {
      return _.filter(mailboxes, function(mailbox) {
        return !inboxMailboxesService.isRestrictedMailbox(mailbox);
      });
    };
  });
