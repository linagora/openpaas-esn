'use strict';

angular.module('linagora.esn.unifiedinbox')

  .directive('inboxFab', function($timeout, boxOverlayService) {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/partials/inbox-fab.html',
      link: function(scope, element) {

        function findButton() {
          return element.children('button').first();
        }

        function disableFab() {
          var button = findButton();
          button.removeClass('btn-accent');
          scope.isDisabled = true;
        }

        function enableFab() {
          var button = findButton();
          button.addClass('btn-accent');
          scope.isDisabled = false;
        }

        scope.$on('box-overlay:no-space-left-on-screen', function() {
          disableFab();
        });

        scope.$on('box-overlay:space-left-on-screen', function() {
          enableFab();
        });

        $timeout(function() {
          if (!boxOverlayService.spaceLeftOnScreen()) {
            disableFab();
          } else {
            enableFab();
          }
        });
      }
    };
  })

  .directive('inboxMenu', function(session, jmapClient) {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/unifiedinbox/views/sidebar/sidebar-menu.html',
      link: function(scope) {
        scope.toggleOpen = function() {
          if (!scope.mailboxes) {
            jmapClient.getMailboxes().then(function(mailboxes) {
              scope.mailboxes = mailboxes;
            });
          }
        };

        scope.email = session.user.preferredEmail;
      }
    };
  })

  .directive('mailboxDisplay', function(MAILBOX_ROLE_ICONS_MAPPING) {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        mailbox: '='
      },
      templateUrl: '/unifiedinbox/views/sidebar/mailbox-display.html',
      link: function(scope) {
        scope.mailboxIcons = MAILBOX_ROLE_ICONS_MAPPING[scope.mailbox.role.value || 'default'];
      }
    };
  })

  .directive('emailer', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        emailer: '='
      },
      templateUrl: '/unifiedinbox/views/partials/emailer.html'
    };
  })

  .directive('emailerGroup', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        group: '='
      },
      templateUrl: '/unifiedinbox/views/partials/emailer-group.html'
    };
  })

  .directive('htmlEmailBody', function(createHtmlElement, iFrameResize) {
    return {
      restrict: 'E',
      scope: {
        email: '='
      },
      templateUrl: '/unifiedinbox/views/partials/html-email-body.html',
      link: function(scope, element) {
        element.find('iframe').load(function(event) {
          scope.$emit('iframe:loaded', event.target);
        });

        scope.$on('iframe:loaded', function(event, iFrame) {
          var iFrameDocument = iFrame.contentDocument;

          iFrameDocument.body.appendChild(createHtmlElement('script', {src: '/components/iframe-resizer/js/iframeResizer.contentWindow.js'}));
          iFrameDocument.head.appendChild(createHtmlElement('base', {target: '_blank'}));

          iFrameResize({
            checkOrigin: false,
            scrolling: true,
            inPageLinks: true
          }, iFrame);
        });
      }
    };
  })

  .directive('inboxAttachment', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        attachment: '='
      },
      templateUrl: '/unifiedinbox/views/partials/inbox-attachment.html'
    };
  })

  .directive('composer', function($q, $timeout, notificationFactory, draftService) {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/composer/composer.html',
      controller: 'composerController',
      link: function(scope, element) {
        // for test purposes: the send function which is supposed to be called to send messages via JMAP client
        if (!scope.sendViaJMAP) {
          scope.sendViaJMAP = function() {
            var defer = $q.defer();
            $timeout(function() {
              return defer.resolve();
            }, 3000);
            return defer.promise;
          };
        }

        function disableSend() {
          var sendButton = element.find('.btn-primary');
          sendButton.attr('disabled', 'disabled');
        }

        function enableSend() {
          var sendButton = element.find('.btn-primary');
          sendButton.removeAttr('disabled');
        }

        scope.send = function send() {
          disableSend();
          if (scope.validateEmailSending(scope.email.rcpt)) {

            scope.$hide();

            var notify = notificationFactory.notify('info', 'Info', 'Sending', { from: 'bottom', align: 'right'}, 0);
            scope.sendViaJMAP().then(
              function() {
                notify.close();
                notificationFactory.weakSuccess('Success', 'Your email has been sent');
              },
              function() {
                notify.close();
                notificationFactory.weakError('Error', 'An error has occurred while sending email');
              }
            );
          } else {
            enableSend();
          }
        };

        scope.isCollapsed = true;

        var draft = draftService.startDraft(scope.email);
        scope.$on('$destroy', function() {
          draft.save(scope.email);
        });

      }
    };
  })

  .directive('editorPlaceholder', function() {
    return {
      restrict: 'A',
      link: function(scope, element, attr) {
        if (!!attr.editorPlaceholder) {
          element.find('.note-editable[contenteditable="true"]').attr('placeholder', attr.editorPlaceholder);
        }
      }
    };
  })

  .directive('recipientsAutoComplete', function($rootScope, emailSendingService, elementScrollDownService) {
    return {
      restrict: 'E',
      require: '^composer',
      scope: {
        tags: '=ngModel'
      },
      templateUrl: function(elem, attr) {
        if (!attr.template) {
          throw new Error('This directive requires a template attribute');
        }
        return '/unifiedinbox/views/composer/' + attr.template + '.html';
      },
      link: function(scope, element, attrs, composer) {
        scope.search = composer.search;
        scope.onTagAdded = function(tag) {
          emailSendingService.ensureEmailAndNameFields(tag);
          elementScrollDownService.autoScrollDown(element.find('div.tags'));
          // Scroll down element on full-screen form
          $rootScope.$broadcast('unifiedinbox:tags_added');
        };
      }
    };
  });
