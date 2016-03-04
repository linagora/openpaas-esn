'use strict';

angular.module('linagora.esn.unifiedinbox')

  .directive('applicationMenuInbox', function(applicationMenuTemplateBuilder) {
    return {
      retrict: 'E',
      replace: true,
      template: applicationMenuTemplateBuilder('/#/unifiedinbox', 'mdi-email', 'Mail')
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

  .directive('opInboxCompose', function(newComposerService, _) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        var _isEmailDefinedByOpInboxCompose = function() {
          return attrs.opInboxCompose && attrs.opInboxCompose !== 'op-inbox-compose';
        };

        var _findRecipientEmail = function() {
          if (_.contains(attrs.ngHref, 'mailto:')) {
            return attrs.ngHref.replace(/^mailto:/, '');
          }
          if (_isEmailDefinedByOpInboxCompose()) {
            return attrs.opInboxCompose;
          }
        };

        element.on('click', function(event) {
          var email = _findRecipientEmail();
          if (email) {
            event.preventDefault();
            event.stopPropagation();

            newComposerService.openEmailCustomTitle(null, // To use the default title
              {
                to:[{
                  email: email,
                  name: attrs.opInboxComposeDisplayName || email
                }]
              }
            );
          }
        });
      }
    };
  })

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

  .directive('htmlEmailBody', function($timeout, createHtmlElement, iFrameResize, absoluteUrl) {
    return {
      restrict: 'E',
      scope: {
        email: '='
      },
      templateUrl: '/unifiedinbox/views/partials/html-email-body.html',
      link: function(scope, element) {
        var iFrames;

        element.find('iframe').load(function(event) {
          scope.$emit('iframe:loaded', event.target);
        });

        scope.$on('iframe:loaded', function(event, iFrame) {
          var iFrameDocument = iFrame.contentDocument;

          iFrameDocument.body.appendChild(createHtmlElement('script', { src: absoluteUrl('/components/iframe-resizer/js/iframeResizer.contentWindow.js') }));
          iFrameDocument.body.appendChild(createHtmlElement('script', { src: absoluteUrl('/unifiedinbox/js/helpers/load-images-async.js') }));
          iFrameDocument.head.appendChild(createHtmlElement('base', { target: '_blank' }));

          iFrames = iFrameResize({
            checkOrigin: false,
            scrolling: true,
            inPageLinks: true,
            heightCalculationMethod: 'documentElementOffset',
            resizedCallback: function() {
              scope.$emit('nicescroll:resize');
            }
          }, iFrame);
        });

        scope.$on('email:collapse', function(event, isCollapsed) {
          if (!isCollapsed) {
            $timeout(function() {
              iFrames[0].iFrameResizer.resize();
            }, 0);
          }
        });
      }
    };
  })

  .directive('attachmentDownloadAction', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl:'/unifiedinbox/views/attachment/attachment-download-action.html'
    };
  })

  .directive('inboxAttachment', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        attachment: '='
      },
      controller: 'attachmentController',
      controllerAs: 'ctrl',
      templateUrl: '/unifiedinbox/views/attachment/inbox-attachment.html'
    };
  })

  .directive('composer', function($state, $timeout, $window, elementScrollService, emailBodyService, autosize, $stateParams, headerService) {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/composer/composer.html',
      controller: 'composerController',
      controllerAs: 'ctrl',
      link: function(scope, element, attrs, controller) {

        scope.isBoxed = function() {return false;};

        headerService.subHeader.setVisibleMD();

        function backToLastLocation() {
          $state.go($stateParams.previousState.name, $stateParams.previousState.params);
        }

        function quit(action) {
          disableOnBackAutoSave();
          controller.hideMobileHeader();

          if (action) {
            action();
          }
        }

        function quitAsSaveDraft() {
          quit(controller.saveDraft);
        }

        var disableOnBackAutoSave = scope.$on('$stateChangeSuccess', quitAsSaveDraft);

        scope.hide = quit.bind(null, backToLastLocation);
        scope.close = function() {
          quitAsSaveDraft();
          backToLastLocation();
        };

        scope.disableSendButton = controller.hideMobileHeader;
        scope.enableSendButton = controller.showMobileHeader;

        scope.editQuotedMail = function() {
          var emailBody = element.find('.compose-body'),
              typedTextLength = (scope.email.textBody || '').length;

          return emailBodyService.quote(scope.email, scope.email.quoteTemplate)
            .then(function(body) {
              var needToBeSaved = controller.getComposition().draft.needToBeSaved(scope.email);

              scope.email.isQuoting = true;
              scope.email.textBody = body;

              if (!needToBeSaved) {
                controller.initCtrl(scope.email);
              }
            })
            .then(function() {
              $timeout(function() {
                emailBody.focusBegin(typedTextLength);
                autosize.update(emailBody.get(0));

                elementScrollService.scrollDownToElement(emailBody);
              }, 0);
            });
        };

        scope.focusEmailBody = function() {
          $timeout(function() {
            element.find('.compose-body').focusEnd();
          }, 0);
        };

        scope.openRecipients = function(recipientsType) {
          $state.go('.recipients', {
            recipientsType: recipientsType,
            composition: controller.getComposition()
          });
        };

        controller.showMobileHeader();
      }
    };
  })

  .directive('composerAttachments', function() {
    return {
      restrict: 'AE',
      scope: true,
      templateUrl: '/unifiedinbox/views/attachment/composer-attachments.html'
    };
  })

  .directive('composerDesktop', function($timeout, $compile) {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/composer/composer-desktop.html',
      controller: 'composerController',
      controllerAs: 'ctrl',
      link: function(scope, element, attrs, controller) {

        scope.isBoxed = function() {return true;};

        scope.disableSendButton = function() {
          element.find('.btn-primary').attr('disabled', 'disabled');
        };

        scope.enableSendButton = function() {
          element.find('.btn-primary').removeAttr('disabled');
        };

        scope.onInit = function() {
          element
            .find('.note-editable')
            .after($compile('<composer-attachments></composer-attachments>')(scope));
        };

        scope.focusEmailBody = function() {
          $timeout(function() {
            // `focusEnd` does not explicitely call `focus` so the contentEditable is not focused on Firefox
            // while it works fine on Chrome. thus the double `focus` call.
            element.find('.summernote').summernote('focus');
            element.find('.note-editable').focusEnd();
          }, 0);
        };

        // The onChange callback will be initially called by summernote when it is initialized
        // either with an empty body (compose from scratch) or with an existing body (reply, forward, etc.)
        // So we intercept this to initialize our Composition instance with the summernote representation of the body
        // which allows us to later compare it with the current body, to detect user changes.
        scope.onChange = function() {
          $timeout(function() {
            controller.initCtrl(scope.email);
          }, 0);

          scope.onChange = angular.noop;
        };

        scope.hide = scope.$hide;
        scope.$on('$destroy', function() {
          controller.saveDraft();
        });
      }
    };
  })

  .directive('recipientsAutoComplete', function($rootScope, emailSendingService, elementScrollService, searchService, _) {
    return {
      restrict: 'E',
      scope: {
        tags: '=ngModel'
      },
      templateUrl: function(elem, attr) {
        if (!attr.template) {
          throw new Error('This directive requires a template attribute');
        }

        return '/unifiedinbox/views/composer/' + attr.template + '.html';
      },
      link: function(scope, element) {

        function normalizeToEMailer(tag) {
          Object.keys(tag).forEach(function(key) {
            if (key !== 'email' && key !== 'name') {
              delete tag[key];
            }
          });

          if (!tag.email) {
            tag.email = tag.name;
          }
        }

        scope.search = searchService.searchRecipients;

        scope.onTagAdding = function($tag) {
          normalizeToEMailer($tag);

          return !_.find(scope.tags, { email: $tag.email });
        };
        scope.onTagAdded = function() {
          elementScrollService.autoScrollDown(element.find('div.tags'));
        };
      }
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
  })

  .directive('inboxStar', function(jmapEmailService) {
    return {
      restrict: 'E',
      controller: function($scope) {
        this.setIsFlagged = function(state) {
          jmapEmailService.setFlag($scope.item, 'isFlagged', state);
        };
      },
      controllerAs: 'ctrl',
      scope: {
        item: '='
      },
      templateUrl: '/unifiedinbox/views/partials/inbox-star.html'
    };
  })

  .directive('email', function(inboxEmailService) {
    return {
      restrict: 'E',
      controller: function($scope) {
        ['reply', 'replyAll', 'forward', 'markAsUnread', 'markAsRead', 'markAsFlagged', 'unmarkAsFlagged', 'moveToTrash'].forEach(function(action) {
          this[action] = function() {
            inboxEmailService[action]($scope.email);
          };
        }.bind(this));

        this.toggleIsCollapsed = function(email) {
          if (angular.isDefined(email.isCollapsed)) {
            email.isCollapsed = !email.isCollapsed;
            $scope.$broadcast('email:collapse', email.isCollapsed);
          }
        };
      },
      controllerAs: 'ctrl',
      scope: {
        email: '='
      },
      templateUrl: '/unifiedinbox/views/partials/email.html'
    };
  })

  .directive('inboxIndicators', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl:'/unifiedinbox/views/partials/inbox-indicators.html',
      scope: {
        item: '='
      }
    };
  });
