'use strict';

angular.module('linagora.esn.unifiedinbox')

  .constant('MAILBOX_ROLES', {
    inbox: 'inbox',
    archive: 'archive',
    drafts: 'drafts',
    outbox: 'outbox',
    sent: 'sent',
    trash: 'trash',
    spam: 'spam',
    templates: 'templates'
  })

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

  .constant('jmapAPIUrl', 'https://proxy.jmap.io/jmap/b6ed15b6-5611-11e5-b11b-0026b9fac7aa/')
  .constant('jmapAuthToken', 'b6ed15b6-5611-11e5-b11b-0026b9fac7aa');
