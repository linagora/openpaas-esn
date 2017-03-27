'use strict';

angular.module('linagora.esn.unifiedinbox')

  .directive('inboxDraggableListItem', function(inboxSelectionService) {
    return {
      restrict: 'A',
      link: function(scope) {
        scope.getDragData = function() {
          if (inboxSelectionService.isSelecting()) {
            scope.$apply(function() {
              inboxSelectionService.toggleItemSelection(scope.item, true);
            });

            return inboxSelectionService.getSelectedItems();
          }

          return [scope.item];
        };

        scope.getDragMessage = function($dragData) {
          if ($dragData.length > 1) {
            return $dragData.length + ' items';
          }

          return $dragData[0].subject || '1 item';
        };
      }
    };
  })

  .directive('inboxSwipeableListItem', function(inboxConfig) {
    return {
      restrict: 'A',
      controller: function($scope, $element) {
        $scope.onSwipeLeft = function() {
          var unregisterActionListCloseListener = $scope.$on('action-list.hide', function() {
            $scope.swipeClose();
            unregisterActionListCloseListener();
          });

          $element.controller('actionList').open();
        };
      },
      link: function(scope) {
        inboxConfig('swipeRightAction', 'markAsRead').then(function(action) {
          scope.leftTemplate = '/unifiedinbox/views/partials/swipe/left-template-' + action + '.html';
        });
      }
    };
  })

  .directive('inboxMessageListItem', function($state, $stateParams, newComposerService, _, inboxJmapItemService,
                                              inboxSwipeHelper, infiniteListService, inboxSelectionService) {
    return {
      restrict: 'E',
      controller: function($scope) {
        var self = this;

        // need this scope value for action list
        $scope.email = $scope.item;

        self.select = function(item, $event) {
          $event.stopPropagation();
          $event.preventDefault();

          inboxSelectionService.toggleItemSelection(item);
        };

        self.openEmail = function(email) {
          if (email.isDraft) {
            newComposerService.openDraft(email.id);
          } else {
            // Used to fallback to the absolute state name if the transition to a relative state does not work
            // This allows us to plug '.message' states where we want and guarantee the email can still be opened
            // when coming from a state that does not get a .message child state (like search for instance)
            var unregisterStateNotFoundListener = $scope.$on('$stateNotFound', function(event, redirect) {
              redirect.to = 'unifiedinbox.inbox.message';
            });

            $state.go('.message', {
              mailbox: $stateParams.mailbox || ($scope.mailbox && $scope.mailbox.id) || _.first(email.mailboxIds),
              emailId: email.id,
              item: email
            }).finally(unregisterStateNotFoundListener);
          }
        };

        ['reply', 'replyAll', 'forward', 'markAsUnread', 'markAsRead', 'markAsFlagged', 'unmarkAsFlagged', 'moveToTrash'].forEach(function(action) {
          self[action] = function() {
            inboxJmapItemService[action]($scope.item);
          };
        });

        self.move = function() {
          $state.go('.move', { item: $scope.item });
        };

        $scope.onSwipeRight = inboxSwipeHelper.createSwipeRightHandler($scope, {
          markAsRead: self.markAsRead,
          moveToTrash: self.moveToTrash
        });
      },
      controllerAs: 'ctrl',
      templateUrl: '/unifiedinbox/views/email/list/list-item.html'
    };
  })

  .directive('inboxSearchMessageListItem', function($q, $state, $stateParams, newComposerService, _, inboxJmapItemService, inboxMailboxesService) {
    return {
      restrict: 'E',
      controller: function($scope) {
        var self = this;

        $scope.email = $scope.item;

        $q.all(_.map($scope.item.mailboxIds, function(mailboxId) {
          return inboxMailboxesService.assignMailbox(mailboxId, $scope, true);
        })).then(function(mailboxes) {
          $scope.item.mailboxes = mailboxes;
        });

        self.openEmail = function(email) {
          if (email.isDraft) {
            newComposerService.openDraft(email.id);
          } else {
            // Used to fallback to the absolute state name if the transition to a relative state does not work
            // This allows us to plug '.message' states where we want and guarantee the email can still be opened
            // when coming from a state that does not get a .message child state (like search for instance)
            var unregisterStateNotFoundListener = $scope.$on('$stateNotFound', function(event, redirect) {
              redirect.to = 'unifiedinbox.inbox.message';
            });

            $state.go('.message', {
              mailbox: $stateParams.mailbox || ($scope.mailbox && $scope.mailbox.id) || _.first(email.mailboxIds),
              emailId: email.id,
              item: email
            }).finally(unregisterStateNotFoundListener);
          }
        };
      },
      controllerAs: 'ctrl',
      templateUrl: '/unifiedinbox/views/email/list/search-list-item.html'
    };
  })

  .directive('inboxThreadListItem', function($state, $stateParams, newComposerService, _, inboxJmapItemService,
                                             inboxSwipeHelper, infiniteListService, inboxSelectionService) {
    return {
      restrict: 'E',
      controller: function($scope) {
        var self = this;

        // need this scope value for action list
        $scope.thread = $scope.item;

        self.select = function(item, $event) {
          $event.stopPropagation();
          $event.preventDefault();

          inboxSelectionService.toggleItemSelection(item);
        };

        self.openThread = function(thread) {
          if (thread.lastEmail.isDraft) {
            newComposerService.openDraft(thread.lastEmail.id);
          } else {
            $state.go('.thread', {
              mailbox: $stateParams.mailbox || ($scope.mailbox && $scope.mailbox.id) || _.first(thread.lastEmail.mailboxIds),
              threadId: thread.id,
              item: thread
            });
          }
        };

        ['markAsUnread', 'markAsRead', 'markAsFlagged', 'unmarkAsFlagged', 'moveToTrash'].forEach(function(action) {
          self[action] = function() {
            inboxJmapItemService[action]($scope.item);
          };
        });

        self.move = function() {
          $state.go('.move', { item: $scope.item });
        };

        $scope.onSwipeRight = inboxSwipeHelper.createSwipeRightHandler($scope, {
          markAsRead: self.markAsRead,
          moveToTrash: self.moveToTrash
        });
      },
      controllerAs: 'ctrl',
      templateUrl: '/unifiedinbox/views/thread/list/list-item.html'
    };
  })

  .directive('inboxTweetListItem', function() {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/twitter/list/list-item.html'
    };
  });
