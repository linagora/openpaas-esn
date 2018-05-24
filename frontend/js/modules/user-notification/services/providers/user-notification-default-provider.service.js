(function(angular) {
  'use strict';

  angular.module('esn.user-notification')
  .factory('esnUserNotificationDefaultProvider', esnUserNotificationDefaultProvider);

  function esnUserNotificationDefaultProvider(
    esnRestangular,
    EsnUserNotificationDefault
  ) {
    return {
      name: 'esnUserNotificationDefaultProvider',
      getUnreadCount: getUnreadCount,
      list: list,
      setAllRead: setAllRead,
      setRead: setRead
    };

    function getUnreadCount() {
      return esnRestangular
        .one('user')
        .one('notifications')
        .one('unread')
        .get()
        .then(function(response) {
          return response.data && response.data.unread_count;
        });
    }

    function list(options) {
      return esnRestangular
        .one('user')
        .all('notifications')
        .getList(options)
        .then(function(response) {
          var notifications = response.data.map(function(notification) {
            return new EsnUserNotificationDefault(notification);
          });

          return { data: notifications };
        });
    }

    function setAllRead(ids, read) {
      var request = esnRestangular
        .one('user')
        .one('notifications')
        .one('read');

      request.value = read;

      return request.put({ ids: ids });
    }

    function setRead(id, read) {
      return esnRestangular.one('user').one('notifications', id).one('read').customPUT({value: read});
    }
  }
})(angular);
