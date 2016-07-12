'use strict';

angular.module('linagora.esn.unifiedinbox')

  .constant('INBOX_MODULE_NAME', 'linagora.esn.unifiedinbox')
  .constant('MAILBOX_ROLE_ICONS_MAPPING', {
    default: 'mdi mdi-email',
    inbox: 'mdi mdi-inbox',
    archive: 'mdi mdi-archive',
    drafts: 'mdi mdi-file-document',
    outbox: 'mdi mdi-outbox',
    sent: 'mdi mdi-send',
    trash: 'mdi mdi-delete',
    spam: 'mdi mdi-alert-octagon',
    templates: 'mdi mdi-clipboard-text',
    all: 'mdi mdi-folder-outline'
  })
  .constant('INBOX_AUTOCOMPLETE_LIMIT', 20)
  .constant('MAILBOX_LEVEL_SEPARATOR', ' / ')
  .constant('JMAP_GET_MESSAGES_LIST', ['id', 'threadId', 'subject', 'to', 'cc', 'bcc', 'from', 'preview', 'date', 'isUnread', 'isFlagged', 'isDraft', 'hasAttachment', 'mailboxIds'])
  .constant('JMAP_GET_MESSAGES_VIEW', ['id', 'threadId', 'subject', 'from', 'to', 'cc', 'bcc', 'replyTo', 'preview', 'textBody', 'htmlBody', 'date', 'isUnread', 'isFlagged', 'isDraft', 'hasAttachment', 'attachments', 'mailboxIds'])
  .constant('ATTACHMENTS_ATTRIBUTES', ['blobId', 'isInline', 'name', 'size', 'type'])
  .constant('DEFAULT_MAX_SIZE_UPLOAD', 20971520)
  .constant('DRAFT_SAVING_DEBOUNCE_DELAY', 1000)
  .constant('DEFAULT_VIEW', 'messages')
  .constant('IFRAME_MESSAGE_PREFIXES', {
    CHANGE_DOCUMENT: '[linagora.esn.unifiedinbox.changeDocument]',
    MAILTO: '[linagora.esn.unifiedinbox.mailtoClick]',
    INLINE_ATTACHMENT: '[linagora.esn.unifiedinbox.inlineAttachment]'
  })
  .constant('INBOX_SWIPE_DURATION', 500)
  .constant('INBOX_DEFAULT_AVATAR', '/images/user.png')
  .constant('PROVIDER_TYPES', {
    JMAP: 'JMAP',
    SOCIAL: 'SOCIAL'
  })
  .constant('INBOX_EVENTS', {
    VACATION_STATUS: 'inbox:vacationStatusUpdated',
    FILTER_CHANGED: 'inbox:filterChanged'
  })
  .constant('INBOX_EMPTY_MESSAGE_MAPPING', {
    default: '/unifiedinbox/views/partials/empty-messages/containers/default.html',
    inbox: '/unifiedinbox/views/partials/empty-messages/containers/inbox.html',
    twitter: '/unifiedinbox/views/partials/empty-messages/containers/twitter.html'
  })
  .constant('INBOX_LONG_TASK_DURATION', 1000)
  .constant('INBOX_SUMMERNOTE_OPTIONS', {
    focus: false,
    airMode: false,
    disableResizeEditor: true,
    toolbar: [
      ['style', ['bold', 'italic', 'underline', 'strikethrough']],
      ['textsize', ['fontsize']],
      ['alignment', ['paragraph', 'ul', 'ol']]
    ]
  });
