'use strict';

angular.module('linagora.esn.unifiedinbox')

  .constant('MAILBOX_ROLE_ICONS_MAPPING', {
    default: 'mdi mdi-email',
    inbox: 'mdi mdi-email',
    archive: 'mdi mdi-email',
    drafts: 'mdi mdi-file-document',
    outbox: 'mdi mdi-email',
    sent: 'mdi mdi-send',
    trash: 'mdi mdi-delete',
    spam: 'mdi mdi-email',
    templates: 'mdi mdi-email'
  })
  .constant('INBOX_AUTOCOMPLETE_LIMIT', 20)
  .constant('EMAIL_IS_UNREAD', 'isUnread')
  .constant('MAILBOX_LEVEL_SEPARATOR', ' / ');
