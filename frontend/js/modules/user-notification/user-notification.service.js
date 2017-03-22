(function() {
  'use strict';

  angular.module('esn.user-notification')
    .factory('esnUserNotificationService', esnUserNotificationService);

    function esnUserNotificationService(esnRestangular) {
      return {
        getUnreadCount: getUnreadCount,
        list: list,
        setAcknowledged: setAcknowledged,
        setAllRead: setAllRead,
        setRead: setRead
      };

      function getUnreadCount() {
        return esnRestangular.one('user').one('notifications').one('unread').get();
      }

      function list(options) {
        return esnRestangular.one('user').all('notifications').getList(options);
      }

      function setAcknowledged(id, acknowledged) {
        return esnRestangular.one('user').one('notifications', id).one('acknowledged').customPUT({value: acknowledged});
      }

      function setAllRead(ids, read) {
        var request = esnRestangular.one('user').one('notifications').one('read');

        request.value = read;

        return request.put({ ids: ids });
      }

      function setRead(id, read) {
        return esnRestangular.one('user').one('notifications', id).one('read').customPUT({value: read});
      }
    }
})();
