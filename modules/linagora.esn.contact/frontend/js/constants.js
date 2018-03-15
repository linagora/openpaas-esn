'use strict';

/* global ICAL */

angular.module('linagora.esn.contact')
  .constant('ICAL', ICAL)
  .constant('DEFAULT_ADDRESSBOOK_NAME', 'contacts')
  .constant('CONTACT_COLLECTED_ADDRESSBOOK_NAME', 'collected')
  .constant('DEFAULT_ADDRESSBOOK_AGGREGATOR_NAME', 'ABAggregator')
  .constant('CONTACT_DATE_FORMAT', 'MM/dd/yyyy')
  .constant('LETTER_DISPLAY_DURATION', 1500)
  .constant('REDIRECT_PAGE_TIMEOUT', 1500)
  .constant('SEARCH_INPUT_LIMIT', 200)
  .constant('CONTACT_LIST_DISPLAY', {
    list: 'list',
    cards: 'cards'
  })
  .constant('CONTACT_AVATAR_SIZE', {
    list: 35,
    cards: 96,
    bigger: 259
  })
  .constant('CONTACT_LIST_DISPLAY_MODES', {
    multiple: 'multiple',
    single: 'single',
    search: 'search'
  })
  .constant('CONTACT_LIST_DISPLAY_EVENTS', {
    toggle: 'contactlist:toggle'
  })
  .constant('CONTACT_ATTRIBUTES_ORDER', {
    email: ['Work', 'Home', 'Other'],
    address: ['Work', 'Home', 'Other'],
    phone: ['Work', 'Mobile', 'Home', 'Other'],
    social: ['Skype', 'Twitter', 'Other']
  })
  .constant('CONTACT_DEFAULT_AVATAR', '/contact/images/default_avatar.png')
  .constant('CONTACT_LIST_DEFAULT_SORT', 'fn')
  .constant('CONTACT_LIST_PAGE_SIZE', 20)
  .constant('DAV_PATH', '/dav/api')
  .constant('CONTACT_SCROLL_EVENTS', 'contact:scroll:update')
  .constant('CONTACT_WS', {
    room: '/contacts',
    events: {
      CREATED: 'contact:created',
      DELETED: 'contact:deleted',
      UPDATED: 'contact:updated'
    }
  })
  .constant('CONTACT_GLOBAL_SEARCH', {
    TYPE: 'contact',
    NAME: 'Contacts'
  })

  .constant('CONTACT_MODULE_METADATA', {
    id: 'linagora.esn.contact',
    title: 'Contact',
    icon: '/contact/images/contacts-icon.svg',
    homePage: 'contact'
  });
