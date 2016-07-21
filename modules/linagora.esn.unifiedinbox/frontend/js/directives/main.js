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
        function _isEmailDefinedByOpInboxCompose() {
          return attrs.opInboxCompose && attrs.opInboxCompose !== 'op-inbox-compose';
        }

        function _findRecipientEmails() {
          if (_.contains(attrs.ngHref, 'mailto:')) {
            return attrs.ngHref.replace(/^mailto:/, '').split(',');
          }
          if (_isEmailDefinedByOpInboxCompose()) {
            return [attrs.opInboxCompose];
          }
        }

        element.on('click', function(event) {
          var emails = _findRecipientEmails();

          if (emails) {
            event.preventDefault();
            event.stopPropagation();

            newComposerService.open({
              to: emails.map(function(email) {
                return {
                  email: email,
                  name: attrs.opInboxComposeDisplayName || email
                };
              })
            });
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

  .directive('mailboxDisplay', function(MAILBOX_ROLE_ICONS_MAPPING, inboxThreadService, inboxEmailService, mailboxesService) {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        mailbox: '='
      },
      templateUrl: '/unifiedinbox/views/sidebar/email/menu-item.html',
      link: function(scope, element) {
        scope.mailboxIcons = MAILBOX_ROLE_ICONS_MAPPING[scope.mailbox.role.value || 'default'];

        function isThread($dragData) {
          return $dragData.hasOwnProperty('messageIds');
        }

        scope.onDrop = function($dragData) {
          if (isThread($dragData)) {
            return inboxThreadService.moveToMailbox($dragData, scope.mailbox);
          } else {
            return inboxEmailService.moveToMailbox($dragData, scope.mailbox);
          }
        };

        scope.isDropZone = function($dragData) {
          return mailboxesService.canMoveMessage($dragData.email || $dragData, scope.mailbox);
        };
      }
    };
  })

  .directive('twitterDisplay', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        account: '='
      },
      templateUrl: '/unifiedinbox/views/sidebar/twitter/menu-item.html'
    };
  })

  .directive('inboxEmailer', function() {
    return {
      restrict: 'E',
      replace: true,
      controller: 'resolveEmailerController',
      scope: {
        emailer: '='
      },
      templateUrl: '/unifiedinbox/views/partials/emailer/inbox-emailer.html'
    };
  })

  .directive('inboxEmailerAvatar', function() {
    return {
      restrict: 'E',
      controller: 'resolveEmailerController',
      scope: {
        emailer: '='
      },
      templateUrl: '/unifiedinbox/views/partials/emailer/inbox-emailer-avatar.html'
    };
  })

  .directive('inboxEmailerGroup', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        group: '='
      },
      templateUrl: '/unifiedinbox/views/partials/emailer/inbox-emailer-group.html'
    };
  })

  .directive('inboxEmailerDisplay', function(_, session) {
    function link(scope) {
      _init();

      function _init() {
        var allRecipients = [].concat(scope.email.to || [], scope.email.cc || []);
        var myEmailer = _.find(allRecipients, { email: session.user.preferredEmail });

        if (myEmailer) {
          scope.previewEmailer = myEmailer;
          scope.me = true;
        } else {
          scope.previewEmailer = allRecipients[0];
          scope.me = false;
        }

        scope.numberOfHiddenEmailer = allRecipients.length - 1;
        scope.showMoreButton = scope.numberOfHiddenEmailer > 0;
      }
    }

    return {
      restrict: 'E',
      scope: {
        email: '='
      },
      templateUrl: '/unifiedinbox/views/partials/emailer/inbox-emailer-display.html',
      link: link
    };
  })

  .directive('htmlEmailBody', function($timeout, iFrameResize, loadImagesAsyncFilter, listenToPrefixedWindowMessage, _,
                                       IFRAME_MESSAGE_PREFIXES) {
    return {
      restrict: 'E',
      scope: {
        email: '='
      },
      templateUrl: '/unifiedinbox/views/partials/html-email-body.html',
      link: function(scope, element) {
        var iFrames, unregisterWindowListener = listenToPrefixedWindowMessage(IFRAME_MESSAGE_PREFIXES.INLINE_ATTACHMENT, function(cid) {
          scope.$emit('wm:' + IFRAME_MESSAGE_PREFIXES.INLINE_ATTACHMENT, cid);
        });

        element.find('iframe').load(function(event) {
          scope.$emit('iframe:loaded', event.target);
        });

        scope.$on('iframe:loaded', function(event, iFrame) {
          var iFrameContent = loadImagesAsyncFilter(scope.email.htmlBody, scope.email.attachments);

          iFrame.contentWindow.postMessage(IFRAME_MESSAGE_PREFIXES.CHANGE_DOCUMENT + iFrameContent, '*');

          iFrames = iFrameResize({
            checkOrigin: false,
            inPageLinks: true,
            heightCalculationMethod: 'grow',
            widthCalculationMethod: 'scroll',
            sizeWidth: true
          }, iFrame);
        });

        scope.$on('email:collapse', function(event, isCollapsed) {
          if (!isCollapsed) {
            $timeout(function() {
              iFrames[0].iFrameResizer.resize();
            }, 0);
          }
        });

        scope.$on('wm:' + IFRAME_MESSAGE_PREFIXES.INLINE_ATTACHMENT, function(event, cid) {
          var attachment = _.find(scope.email.attachments, { cid: cid });

          if (attachment) {
            attachment.getSignedDownloadUrl().then(function(url) {
              iFrames[0].contentWindow.postMessage(IFRAME_MESSAGE_PREFIXES.INLINE_ATTACHMENT + cid + ' ' + url, '*');
            });
          }
        });

        scope.$on('$destroy', unregisterWindowListener);
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

  .directive('composer', function($rootScope, $state, $timeout, $window, elementScrollService, emailBodyService, autosize, $stateParams) {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/composer/composer.html',
      controller: 'composerController',
      controllerAs: 'ctrl',
      link: function(scope, element, attrs, controller) {

        scope.isBoxed = function() {return false;};

        function backToLastLocation() {
          $state.go($stateParams.previousState.name, $stateParams.previousState.params);
        }

        function quit(action) {
          disableOnBackAutoSave();

          if (action) {
            action();
          }
        }

        function quitAsSaveDraft() {
          quit(controller.saveDraft);
        }

        var disableOnBackAutoSave = $rootScope.$on('$stateChangeSuccess', function(event, toState) {
          if (toState && toState.data && toState.data.ignoreSaveAsDraft) {
            return disableOnBackAutoSave();
          }

          quitAsSaveDraft();
        });

        scope.hide = quit.bind(null, backToLastLocation);
        scope.close = function() {
          quitAsSaveDraft();
          backToLastLocation();
        };

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

  .directive('composerDesktop', function($timeout, $compile, KEYCODES) {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/composer/composer-desktop.html',
      controller: 'composerController',
      controllerAs: 'ctrl',
      link: function(scope, element, attrs, controller) {
        scope.email && scope.$updateTitle(scope.email.subject);

        scope.isBoxed = function() {return true;};

        function focusOnRightField(email) {
          $timeout(function() {
            if (!email || !email.to || email.to.length === 0) {
              element.find('.recipients-to input').focus();
            } else {
              element.find('.summernote').summernote('focus');
            }
          }, 0);
        }

        function _getEventKey(event) {
          return event.which || event.keyCode;
        }

        scope.onInit = function() {
          focusOnRightField(scope.email);

          element
            .find('.note-editable')
            .keydown(function(event) {
              if (_getEventKey(event) === KEYCODES.TAB_KEY && event.shiftKey) {
                element.find('.compose-subject').focus();
                event.preventDefault();
              }
            })
            .after($compile('<composer-attachments></composer-attachments>')(scope));

          element
            .find('.compose-subject')
            .keydown(function(event) {
              if (_getEventKey(event) === KEYCODES.TAB_KEY && !event.shiftKey) {
                scope.focusEmailBody();
                event.preventDefault();
              }
            });
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
            controller.initCtrl(scope.email, scope.compositionOptions);
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

        scope.tags = scope.tags || [];
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

  .directive('email', function($state, inboxEmailService) {
    return {
      restrict: 'E',
      controller: function($scope) {
        ['reply', 'replyAll', 'forward', 'markAsRead', 'markAsFlagged', 'unmarkAsFlagged'].forEach(function(action) {
          this[action] = function() {
            inboxEmailService[action]($scope.email);
          };
        }.bind(this));

        ['markAsUnread', 'moveToTrash'].forEach(function(action) {
          this[action] = function() {
            inboxEmailService[action]($scope.email).then(function() {
              $state.go('^');
            });
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
      templateUrl: '/unifiedinbox/views/partials/inbox-indicators.html',
      scope: {
        item: '='
      }
    };
  })

  .directive('inboxEmailFooter', function(inboxEmailService) {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/partials/email-footer.html',
      scope: {
        email: '='
      },
      controller: function($scope) {
        ['reply', 'replyAll', 'forward'].forEach(function(action) {
          this[action] = function() {
            inboxEmailService[action]($scope.email);
          };
        }.bind(this));
      },
      controllerAs: 'ctrl'
    };
  })

  .directive('inboxFilterButton', function($rootScope, _, INBOX_EVENTS) {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/filter/filter-button.html',
      scope: {
        filters: '=',
        placeholder: '@'
      },
      controllerAs: 'ctrl',
      controller: function($scope) {
        var defaultPlaceholder = $scope.placeholder || 'Filters';

        function updateDropdownList() {
          var checkedItems = _.filter($scope.filters, { checked: true });

          if (checkedItems.length > 0) {
            $scope.dropdownList.filtered = true;
            $scope.dropdownList.placeholder = (checkedItems.length === 1) ? checkedItems[0].displayName : checkedItems.length + ' selected';
          } else {
            $scope.dropdownList.filtered = false;
            $scope.dropdownList.placeholder = defaultPlaceholder;
          }
        }

        $scope.dropdownList = {};
        $scope.$on(INBOX_EVENTS.FILTER_CHANGED, updateDropdownList);

        this.dropdownItemClicked = function() {
          updateDropdownList();

          $rootScope.$broadcast(INBOX_EVENTS.FILTER_CHANGED);
        };

        // Define proper initial state of the button
        updateDropdownList();
      }
    };
  })

  .directive('inboxVacationIndicator', function($rootScope, withJmapClient, asyncJmapAction, jmap, INBOX_EVENTS) {
    return {
      restrict: 'E',
      scope: {},
      controller: function($scope) {
        function _updateVacationStatus() {
          withJmapClient(function(client) {
            client.getVacationResponse().then(function(vacation) {
              $scope.vacationActivated = vacation.isActivated;
            });
          });
        }

        this.disableVacation = function() {
          $scope.vacationActivated = false;

          return asyncJmapAction('Modification of vacation settings', function(client) {
            return client.setVacationResponse(new jmap.VacationResponse(client, { isEnabled: false }))
              .then(function() {
                $rootScope.$broadcast(INBOX_EVENTS.VACATION_STATUS);
              });
          }).catch(function() {
            $scope.vacationActivated = true;
          });
        };

        $scope.$on(INBOX_EVENTS.VACATION_STATUS, _updateVacationStatus);

        _updateVacationStatus();
      },
      controllerAs: 'ctrl',
      templateUrl: '/unifiedinbox/views/partials/inbox-vacation-indicator.html'
    };
  })

  .directive('inboxEmptyContainerMessage', function(inboxFilteringService, jmap, INBOX_EMPTY_MESSAGE_MAPPING) {
    return {
      restrict: 'E',
      scope: {
        mailbox: '=?',
        role: '@?'
      },
      templateUrl: '/unifiedinbox/views/partials/empty-messages/index.html',
      link: function(scope) {
        var role = scope.role || (scope.mailbox && scope.mailbox.role && scope.mailbox.role.value);

        scope.isCustomMailbox = scope.mailbox && jmap.MailboxRole.UNKNOWN === scope.mailbox.role;
        scope.isFilteringActive = inboxFilteringService.isAnyFilterSelected;
        scope.containerTemplateUrl = (role && INBOX_EMPTY_MESSAGE_MAPPING[role]) || INBOX_EMPTY_MESSAGE_MAPPING.default;
      }
    };
  })

  .directive('inboxClearFiltersButton', function($rootScope, inboxFilteringService, INBOX_EVENTS) {
    return {
      restrict: 'E',
      scope: {},
      controller: function() {
        this.clearFilters = function() {
          inboxFilteringService.uncheckFilters();

          $rootScope.$broadcast(INBOX_EVENTS.FILTER_CHANGED);
        };
      },
      controllerAs: 'ctrl',
      templateUrl: '/unifiedinbox/views/filter/inbox-clear-filters-button.html'
    };
  });
