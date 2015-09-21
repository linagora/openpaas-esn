'use strict';

/* global ICAL */

angular.module('linagora.esn.contact')
  .constant('ICAL', ICAL)
  .constant('CONTACT_DATE_FORMAT', 'MM/dd/yyyy')
  .constant('CONTACT_LIST_DISPLAY', {
    list: 'list',
    cards: 'cards'
  })
  .constant('CONTACT_DEFAULT_AVATAR', '/images/user.png')
  .constant('CONTACT_LIST_DEFAULT_SORT', 'fn')
  .constant('CONTACT_LIST_PAGE_SIZE', 20)
  .constant('DAV_PATH', '/dav/api')
  .constant('CONTACT_EVENTS', {
    CREATED: 'contact:created',
    UPDATED: 'contact:updated',
    DELETED: 'contact:deleted',
    CANCEL_DELETE: 'contact:cancel:delete'
  })
  .constant('CONTACT_SIO_EVENTS', {
    CREATED: 'contact:created',
    DELETED: 'contact:deleted',
    UPDATED: 'contact:updated'
  });
