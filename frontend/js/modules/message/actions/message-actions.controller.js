(function() {
  'use strict';

  angular.module('esn.message').controller('messageActionsController', messageActionsController);

  function messageActionsController(
    $log,
    $rootScope,
    activitystreamAPI,
    esnMessageService,
    notificationFactory,
    session
  ) {
    var self = this;

    self.remove = remove;
    self.$onInit = $onInit;

    function $onInit() {
      self.canRemove = esnMessageService.canRemove(self.message, self.activitystream, session.user);
      self.canUpdate = esnMessageService.canUpdate(self.message, self.activitystream, session.user);
      self.canShare = esnMessageService.canShare(self.message, self.activitystream, session.user);
      self.parentId = self.parent && self.parent._id;
    }

    function remove() {
      activitystreamAPI.deleteMessage(self.activitystream.activity_stream.uuid, self.message._id)
        .then(function() {
          notificationFactory.weakInfo('Success', 'The mesage has been removed');

          $rootScope.$emit(self.parentId ? 'message:comment:deleted' : 'message:deleted', {
            activitystreamUuid: self.activitystream.activity_stream.uuid,
            id: self.message._id,
            parentId: self.parentId
          });
        })
        .catch(function(err) {
          $log.error(err);
          notificationFactory.weakError('Error', 'Error while deleting message');
        });
    }
  }

})(angular);
