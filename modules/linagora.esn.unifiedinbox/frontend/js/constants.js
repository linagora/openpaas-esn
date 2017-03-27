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
  .constant('INBOX_DISPLAY_NAME_SIZE', 100)
  .constant('MAILBOX_LEVEL_SEPARATOR', ' / ')
  .constant('JMAP_GET_MESSAGES_LIST', ['id', 'threadId', 'headers', 'subject', 'from', 'to', 'cc', 'bcc', 'replyTo', 'preview', 'date', 'isUnread', 'isFlagged', 'isDraft', 'hasAttachment', 'mailboxIds'])
  .constant('JMAP_GET_MESSAGES_VIEW', ['id', 'threadId', 'headers', 'subject', 'from', 'to', 'cc', 'bcc', 'replyTo', 'preview', 'textBody', 'htmlBody', 'date', 'isUnread', 'isFlagged', 'isDraft', 'hasAttachment', 'attachments', 'mailboxIds'])
  .constant('JMAP_GET_MESSAGES_ATTACHMENTS_LIST', ['id', 'threadId', 'subject', 'date', 'hasAttachment', 'attachments', 'mailboxIds'])
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
  .constant('PROVIDER_TYPES', {
    JMAP: 'jmap',
    SOCIAL: 'social',
    TWITTER: 'twitter'
  })
  .constant('INBOX_EVENTS', {
    VACATION_STATUS: 'inbox:vacationStatusUpdated',
    FILTER_CHANGED: 'inbox:filterChanged',
    ITEM_SELECTION_CHANGED: 'inbox:itemSelectionChanged',
    ITEM_FLAG_CHANGED: 'inbox:itemFlagChanged',
    ITEM_MAILBOX_IDS_CHANGED: 'inbox:itemMailboxIdsChanged'
  })
  .constant('INBOX_SUMMERNOTE_OPTIONS', {
    focus: false,
    airMode: false,
    disableResizeEditor: true,
    toolbar: [
      ['style', ['style']],
      ['font', ['bold', 'italic', 'underline', 'strikethrough']],
      ['alignment', ['paragraph', 'ul', 'ol']]
    ]
  })
  .constant('INBOX_CONTROLLER_LOADING_STATES', {
    LOADING: 'LOADING',
    LOADED: 'LOADED',
    ERROR: 'ERROR'
  });
