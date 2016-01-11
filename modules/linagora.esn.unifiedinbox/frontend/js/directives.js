'use strict';

angular.module('linagora.esn.unifiedinbox')

  .directive('applicationMenuInbox', function() {
    return {
      retrict: 'E',
      replace: true,
      template: '<div><a href="/#/unifiedinbox"><i class="mdi mdi-email"/><span class="label">Mail</span></a></div>'
    };
  })

  .directive('newComposer', function($timeout, newComposerService) {
    return {
      restrict: 'A',
      link: function(scope, element) {

        element.click(function() {
          newComposerService.open();
        });

      }
    };
  })

  .directive('inboxFab', function($timeout, $location, boxOverlayService) {
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

  .directive('sidebarMailboxesLoader', function(jmapClient) {
    return {
      restrict: 'A',
      link: function(scope) {
        if (!scope.mailboxes) {
          jmapClient.getMailboxes().then(function(mailboxes) {
            scope.mailboxes = mailboxes;
          });
        }
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
            inPageLinks: true,
            resizedCallback: function() {
              scope.$emit('nicescroll:resize');
            }
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

  .directive('composer', function($location, $stateParams, headerService) {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/composer/composer.html',
      controller: 'composerController',
      link: function(scope, element, attrs, controller) {
        function showMobileHeader() {
          headerService.subHeader.addInjection('composer-subheader', scope);
        }

        function hideMobileHeader() {
          headerService.subHeader.resetInjections();
        }

        function returnToMainLocation() {
          $location.path('/unifiedinbox');
        }

        function quit(action) {
          disableOnBackAutoSave();
          hideMobileHeader();

          if (action) {
            action();
          }
        }

        function quitAsSaveDraft() {
          quit(controller.saveDraft);
        }

        var disableOnBackAutoSave = scope.$on('$stateChangeSuccess', quitAsSaveDraft);

        scope.hide = quit.bind(null, returnToMainLocation);
        scope.close = function() {
          quitAsSaveDraft();
          returnToMainLocation();
        };

        scope.$on('fullscreenEditForm:show', hideMobileHeader);
        scope.$on('fullscreenEditForm:close', showMobileHeader);

        scope.disableSendButton = hideMobileHeader;
        scope.enableSendButton = showMobileHeader;
        showMobileHeader();

        controller.initCtrl($stateParams.email);
      }
    };
  })

  .directive('composerDesktop', function() {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/composer/composer-desktop.html',
      controller: 'composerController',
      link: function(scope, element, attrs, controller) {
        scope.disableSendButton = function() {
          element.find('.btn-primary').attr('disabled', 'disabled');
        };

        scope.enableSendButton = function() {
          element.find('.btn-primary').removeAttr('disabled');
        };

        scope.hide = scope.$hide;
        scope.$on('$destroy', function() {
          controller.saveDraft();
        });

        controller.initCtrl(scope.email);
      }
    };
  })

  .directive('recipientsAutoComplete', function($rootScope, emailSendingService, elementScrollDownService) {
    return {
      restrict: 'E',
      require: ['^?composer', '^?composerDesktop'],
      scope: {
        tags: '=ngModel'
      },
      templateUrl: function(elem, attr) {
        if (!attr.template) {
          throw new Error('This directive requires a template attribute');
        }

        return '/unifiedinbox/views/composer/' + attr.template + '.html';
      },
      link: function(scope, element, attrs, controllers) {
        scope.search = (controllers[0] || controllers[1]).search;
        scope.onTagAdded = function(tag) {
          emailSendingService.ensureEmailAndNameFields(tag);
          elementScrollDownService.autoScrollDown(element.find('div.tags'));

          // Scroll down element on full-screen form
          $rootScope.$broadcast('unifiedinbox:tags_added');
        };
      }
    };
  })

  .directive('composerSubheader', function() {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/composer/composer-subheader.html'
    };
  })

  .directive('emailBodyEditor', function(emailBodyService) {
    function template(name) {
      return '/unifiedinbox/views/composer/editor/' + name + '.html';
    }

    return {
      restrict: 'E',
      templateUrl: function() {
        return emailBodyService.supportsRichtext() ? template('richtext') : template('plaintext');
      }
    };
  });
