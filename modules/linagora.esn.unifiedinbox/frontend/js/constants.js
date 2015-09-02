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
  .constant('MAILBOX_ROLE_ORDERING_WEIGHT', {
    inbox: 5,
    outbox: 10,
    drafts: 15,
    templates: 20,
    sent: 25,
    archive: 30,
    trash: 35,
    spam: 40,
    default: 45
  });
