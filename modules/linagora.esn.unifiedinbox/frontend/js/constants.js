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

  .constant('jmapAPIUrl', 'https://demo.open-paas.org/jmap/jmap/606fb372-7f21-11e5-b8d9-06388bb09d1c/')
  .constant('jmapAuthToken', '606fb372-7f21-11e5-b8d9-06388bb09d1c');
