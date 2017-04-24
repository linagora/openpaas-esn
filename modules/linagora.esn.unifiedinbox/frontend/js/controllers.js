'use strict';

angular.module('linagora.esn.unifiedinbox')

  .controller('unifiedInboxController', function($timeout, $interval, $scope, $stateParams, infiniteScrollHelperBuilder, inboxProviders, inboxSelectionService, infiniteListService,
                                                 PageAggregatorService, _, sortByDateInDescendingOrder, inboxFilteringService, inboxAsyncHostedMailControllerHelper,
                                                 inboxFilteredList, ELEMENTS_PER_PAGE, INFINITE_LIST_EVENTS, INBOX_EVENTS, INFINITE_LIST_POLLING_INTERVAL) {
    setupPolling();

    inboxSelectionService.unselectAllItems();

    inboxFilteringService.setProviderFilters({
      types: $stateParams.type ? [$stateParams.type] : null,
      accounts: $stateParams.account ? [$stateParams.account] : null,
      context: $stateParams.context
    });

    $scope.filters = inboxFilteringService.getAvailableFilters();
    $scope.loadMoreElements = infiniteScrollHelperBuilder($scope, function() { return $scope.loadNextItems(); }, inboxFilteredList.addAll);
    $scope.inboxList = inboxFilteredList.list();
    $scope.inboxListModel = inboxFilteredList.asMdVirtualRepeatModel($scope.loadMoreElements);

    $scope.$on(INBOX_EVENTS.FILTER_CHANGED, updateFetchersInScope);

    inboxAsyncHostedMailControllerHelper(this, updateFetchersInScope);

    /////

    function setupPolling() {
      if (INFINITE_LIST_POLLING_INTERVAL > 0) {
        var poller = $interval(function() {
          $scope.loadRecentItems();
        }, INFINITE_LIST_POLLING_INTERVAL);

        $scope.$on('$destroy', function() {
          $interval.cancel(poller);
        });
      }
    }

    function updateFetchersInScope() {
      $scope.infiniteScrollDisabled = false;
      $scope.infiniteScrollCompleted = false;

      return buildFetcher().then(function(fetcher) {
        $scope.loadNextItems = fetcher;
        $scope.loadRecentItems = function() {
          fetcher.loadRecentItems().then(inboxFilteredList.addAll);
        };

        $timeout(function() {
          $scope.loadRecentItems();
          $scope.loadMoreElements();
        }, 0);
      });
    }

    function buildFetcher() {
      return inboxProviders.getAll(inboxFilteringService.getAllProviderFilters()).then(function(providers) {
        return new PageAggregatorService('unifiedInboxControllerAggregator', providers, {
          compare: sortByDateInDescendingOrder,
          results_per_page: ELEMENTS_PER_PAGE
        }).bidirectionalFetcher();
      });
    }
  })

  .controller('composerController', function($scope, $stateParams, notificationFactory,
                                            Composition, jmap, withJmapClient, fileUploadService, $filter,
                                            attachmentUploadService, _, inboxConfig, inboxIdentitiesService,
                                            DEFAULT_FILE_TYPE, DEFAULT_MAX_SIZE_UPLOAD, INBOX_SUMMERNOTE_OPTIONS, INBOX_SIGNATURE_SEPARATOR) {
    var self = this,
        disableImplicitSavesAsDraft = false,
        composition;

    function _updateAttachmentStatus() {
      $scope.attachmentStatus = {
        number: _.filter($scope.email.attachments, { isInline: false }).length,
        uploading: _.some($scope.email.attachments, { status: 'uploading' }),
        error: _.some($scope.email.attachments, { status: 'error' })
      };
    }

    this.getComposition = function() {
      return composition;
    };

    this.initCtrl = function(email, options) {
      return this.initCtrlWithComposition(new Composition(email, options));
    };

    this.initCtrlWithComposition = function(comp) {
      composition = comp;
      $scope.email = composition.getEmail();

      _updateAttachmentStatus();

      return inboxIdentitiesService.getAllIdentities()
        .then(function(identities) {
          self.identities = identities;

          // This will be improved in the future if we support a "preferred" identity (which might not be the default one)
          // For now we always pre-select the default identity
          $scope.email.identity = _.find(identities, $scope.email.identity ? { id: $scope.email.identity.id } : { isDefault: true });
        })
        .then(function() {
          if ($scope.updateIdentity) {
            $scope.updateIdentity();
          }
        });
    };

    this.getIdentityLabel = function(identity) {
      return identity.name + ' <' + identity.email + '>';
    };

    this.getIdentitySignature = function(identity) {
      return INBOX_SIGNATURE_SEPARATOR + identity.textSignature;
    };

    this.saveDraft = function() {
      disableImplicitSavesAsDraft = true;

      return composition.saveDraft();
    };

    function newAttachment(client, file) {
      var attachment = new jmap.Attachment(client, '', {
        name: file.name,
        size: file.size,
        type: file.type || DEFAULT_FILE_TYPE
      });

      attachment.getFile = function() {
        return file;
      };

      return attachment;
    }

    this.upload = function(attachment) {
      var uploader = fileUploadService.get(attachmentUploadService),
          uploadTask = uploader.addFile(attachment.getFile()); // Do not start the upload immediately

      attachment.status = 'uploading';
      attachment.upload = {
        progress: 0,
        cancel: uploadTask.cancel
      };
      attachment.upload.promise = uploadTask.defer.promise.then(function(task) {
        attachment.status = 'uploaded';
        attachment.blobId = task.response.blobId;
        attachment.url = task.response.url;

        if (!disableImplicitSavesAsDraft) {
          composition.saveDraftSilently();
        }
      }, function() {
        attachment.status = 'error';
      }, function(uploadTask) {
        attachment.upload.progress = uploadTask.progress;
      }).finally(_updateAttachmentStatus);

      _updateAttachmentStatus();
      uploader.start(); // Start transferring data
    };

    this.onAttachmentsSelect = function($files) {
      if (!$files || $files.length === 0) {
        return;
      }

      $scope.email.attachments = $scope.email.attachments || [];

      return withJmapClient(function(client) {
        return inboxConfig('maxSizeUpload', DEFAULT_MAX_SIZE_UPLOAD).then(function(maxSizeUpload) {
          var humanReadableMaxSizeUpload = $filter('bytes')(maxSizeUpload);

          $files.forEach(function(file) {
            if (file.size > maxSizeUpload) {
              return notificationFactory.weakError('', 'File ' + file.name + ' ignored as its size exceeds the ' + humanReadableMaxSizeUpload + ' limit');
            }

            var attachment = newAttachment(client, file);

            $scope.email.attachments.push(attachment);
            self.upload(attachment);
          });
        });
      });
    };

    function _cancelAttachment(attachment) {
      attachment.upload && attachment.upload.cancel();
      _updateAttachmentStatus();
    }

    this.removeAttachment = function(attachment) {
      _.pull($scope.email.attachments, attachment);
      _cancelAttachment(attachment);

      composition.saveDraftSilently();
    };

    if ($stateParams.composition) {
      this.initCtrlWithComposition($stateParams.composition);
    } else if ($stateParams.email) {
      this.initCtrl($stateParams.email, $stateParams.compositionOptions);
    }

    $scope.isCollapsed = !$scope.email || (_.isEmpty($scope.email.cc) && _.isEmpty($scope.email.bcc));

    $scope.summernoteOptions = INBOX_SUMMERNOTE_OPTIONS;

    $scope.send = function() {
      $scope.isSendingMessage = true;

      if (composition.canBeSentOrNotify()) {
        disableImplicitSavesAsDraft = true;

        $scope.hide();
        composition.send();
      } else {
        $scope.isSendingMessage = false;
      }
    };

    $scope.destroyDraft = function() {
      $scope.hide();

      // This will put all uploading attachments in a 'canceled' state, so that if the user reopens the composer he can retry
      _.forEach($scope.email.attachments, _cancelAttachment);

      return composition.destroyDraft();
    };

  })

  .controller('viewEmailController', function($scope, $state, $stateParams, inboxJmapItemService, inboxJmapHelper, inboxAsyncHostedMailControllerHelper) {
    $scope.email = $stateParams.item;

    inboxAsyncHostedMailControllerHelper(this, function() {
      return inboxJmapHelper
        .getMessageById($stateParams.emailId)
        .then(function(message) {
          if (!$scope.email) {
            $scope.email = message;
          } else {
            ['isUnread', 'isFlagged', 'attachments', 'textBody', 'htmlBody'].forEach(function(property) {
              $scope.email[property] = message[property];
            });
          }

          inboxJmapItemService.markAsRead($scope.email);
        })
        .finally(function() {
          $scope.email.loaded = true;
        })
        ;
    });

    ['markAsRead', 'markAsFlagged', 'unmarkAsFlagged'].forEach(function(action) {
      this[action] = function() {
        inboxJmapItemService[action]($scope.email);
      };
    }.bind(this));

    ['markAsUnread', 'moveToTrash'].forEach(function(action) {
      this[action] = function() {
        $state.go('^');
        inboxJmapItemService[action]($scope.email);
      };
    }.bind(this));

    this.move = function() {
      $state.go('.move', { item: $scope.email });
    };

    function openAdjacentMessage(direction) {
      var getAdjacentMessage = $scope.email[direction];

      if (getAdjacentMessage) {
        var message = getAdjacentMessage();

        return $state.go('.', {
          emailId: message.id,
          item: message
        }, {
          location: 'replace' // So that moving next/previous does not mess with the "Back" button
        });
      }
    }

    this.next = function() {
      return openAdjacentMessage('next');
    };

    this.previous = function() {
      return openAdjacentMessage('previous');
    };
  })

  .controller('viewThreadController', function($scope, $stateParams, $state, withJmapClient, inboxJmapItemService, _, JMAP_GET_MESSAGES_VIEW) {
    $scope.thread = $stateParams.item;

    withJmapClient(function(client) {
      client
        .getThreads({ ids: [$stateParams.threadId] })
        .then(_.head)
        .then(function(thread) {
          if (!$scope.thread) {
            $scope.thread = thread;
          }

          return thread.getMessages({ properties: JMAP_GET_MESSAGES_VIEW });
        })
        .then(function(messages) {
          return messages.map(function(message) {
            message.loaded = true;

            return message;
          });
        })
        .then(function(emails) {
          $scope.thread.emails = emails;
        })
        .then(function() {
          $scope.thread.emails.forEach(function(email, index, emails) {
            email.isCollapsed = !(email.isUnread || index === emails.length - 1);
          });
        })
        .then(function() {
          inboxJmapItemService.markAsRead($scope.thread);
        });
    });

    ['markAsRead', 'markAsFlagged', 'unmarkAsFlagged'].forEach(function(action) {
      this[action] = function() {
        inboxJmapItemService[action]($scope.thread);
      };
    }.bind(this));

    ['markAsUnread', 'moveToTrash'].forEach(function(action) {
      this[action] = function() {
        $state.go('^');
        inboxJmapItemService[action]($scope.thread);
      };
    }.bind(this));

    this.move = function() {
      $state.go('.move', { item: $scope.thread });
    };
  })

  .controller('inboxMoveItemController', function($scope, $stateParams, inboxMailboxesService, inboxJmapItemService,
                                                  esnPreviousPage, inboxSelectionService, inboxFilteredList) {
    inboxMailboxesService.assignMailboxesList($scope);

    this.moveTo = function(mailbox) {
      esnPreviousPage.back();

      return inboxJmapItemService.moveMultipleItems(
        $stateParams.selection ? inboxSelectionService.getSelectedItems() : inboxFilteredList.getById($stateParams.item.id), mailbox
      );
    };
  })

  .controller('inboxConfigurationIndexController', function($scope, touchscreenDetectorService) {
    $scope.hasTouchscreen = touchscreenDetectorService.hasTouchscreen();
  })

  .controller('inboxConfigurationFolderController', function($scope, inboxMailboxesService) {
    inboxMailboxesService.assignMailboxesList($scope, inboxMailboxesService.filterSystemMailboxes);
  })

  .controller('addFolderController', function($scope, $state, $stateParams, jmap, inboxMailboxesService, rejectWithErrorNotification, esnPreviousPage) {
    inboxMailboxesService.assignMailboxesList($scope);

    $scope.mailbox = $stateParams.mailbox ? $stateParams.mailbox : {};
    $scope.addFolder = function() {
      if (!$scope.mailbox.name) {
        return rejectWithErrorNotification('Please enter a valid folder name');
      }

      esnPreviousPage.back('unifiedinbox');

      return inboxMailboxesService.createMailbox($scope.mailbox, {
        linkText: 'Reopen',
        action: function() {
          $state.go('unifiedinbox.inbox.folders.add', { mailbox: $scope.mailbox });
        }
      });
    };
  })

  .controller('editFolderController', function($scope, $stateParams, inboxMailboxesService, _,
                                               rejectWithErrorNotification, esnPreviousPage) {
    var originalMailbox;

    inboxMailboxesService
      .assignMailboxesList($scope)
      .then(function(mailboxes) {
        originalMailbox = _.find(mailboxes, { id: $stateParams.mailbox });
        $scope.mailbox = _.clone(originalMailbox);
      });

    $scope.editFolder = function() {
      if (!$scope.mailbox.name) {
        return rejectWithErrorNotification('Please enter a valid folder name');
      }

      esnPreviousPage.back('unifiedinbox');

      return inboxMailboxesService.updateMailbox(originalMailbox, $scope.mailbox);
    };
  })

  .controller('inboxDeleteFolderController', function($scope, $state, $stateParams, inboxMailboxesService, _) {
    inboxMailboxesService
      .assignMailbox($stateParams.mailbox, $scope, true)
      .then(function(mailbox) {
        var descendants = mailbox.descendants,
            numberOfDescendants = descendants.length,
            numberOfMailboxesToDisplay = 3,
            more = numberOfDescendants - numberOfMailboxesToDisplay;

        $scope.message = 'You are about to remove folder ' + mailbox.displayName;

        if (numberOfDescendants > 0) {
          $scope.message += ' and its descendants including ' + descendants.slice(0, numberOfMailboxesToDisplay).map(_.property('displayName')).join(', ');
        }

        if (more === 1) {
          $scope.message += ' and ' + descendants[numberOfMailboxesToDisplay].displayName;
        } else if (more > 1) {
          $scope.message += ' and ' + more + ' more';
        }
      });

    this.deleteFolder = function() {
      $state.go('unifiedinbox');

      return inboxMailboxesService.destroyMailbox($scope.mailbox);
    };
  })

  .controller('inboxConfigurationVacationController', function($rootScope, $scope, $state, $stateParams, $q,
                                                               moment, jmap, withJmapClient, rejectWithErrorNotification,
                                                               asyncJmapAction, esnPreviousPage, INBOX_EVENTS) {
    var self = this;

    this.momentTimes = {
      fromDate: {
        fixed: false,
        default: {
          hour: 0,
          minute: 0,
          second: 0
        }
      },
      toDate: {
        fixed: false,
        default: {
          hour: 23,
          minute: 59,
          second: 59
        }
      }
    };

    function _init() {
      $scope.vacation = $stateParams.vacation;

      if (!$scope.vacation) {
        $scope.vacation = {};

        withJmapClient(function(client) {
          client.getVacationResponse()
            .then(function(vacation) {
              $scope.vacation = vacation;

              // defaultTextBody is being initialised in vacation/index.jade
              if (!$scope.vacation.isEnabled && !$scope.vacation.textBody) {
                $scope.vacation.textBody = $scope.defaultTextBody;
              }
            })
            .then(function() {
              if (!$scope.vacation.fromDate) {
                $scope.vacation.fromDate = moment();
              } else {
                self.fixTime('fromDate');
              }
              self.updateDateAndTime('fromDate');

              if ($scope.vacation.toDate) {
                $scope.vacation.hasToDate = true;
                self.fixTime('toDate');
                self.updateDateAndTime('toDate');
              }
            })
            .then(function() {
              $scope.vacation.loadedSuccessfully = true;
            });
        });
      }
    }

    _init();

    this.updateDateAndTime = function(date) {
      if ($scope.vacation[date]) {
        $scope.vacation[date] = moment($scope.vacation[date]);

        if (!self.momentTimes[date].fixed) {
          $scope.vacation[date].set(self.momentTimes[date].default);
        }
      }
    };

    this.fixTime = function(date) {
      !self.momentTimes[date].fixed && (self.momentTimes[date].fixed = true);
    };

    this.toDateIsInvalid = function() {
      return $scope.vacation.hasToDate && $scope.vacation.toDate && $scope.vacation.toDate.isBefore($scope.vacation.fromDate);
    };

    this.enableVacation = function(status) {
      $scope.vacation.isEnabled = status;
    };

    this.updateVacation = function() {
      return _validateVacationLogic()
        .then(function() {
          esnPreviousPage.back('unifiedinbox');

          if (!$scope.vacation.hasToDate) {
            $scope.vacation.toDate = null;
          }

          return asyncJmapAction('Modification of vacation settings', function(client) {
            return client.setVacationResponse(new jmap.VacationResponse(client, $scope.vacation));
          }, {
            onFailure: {
              linkText: 'Go Back',
              action: function() {
                $state.go('unifiedinbox.configuration.vacation', { vacation: $scope.vacation });
              }
            }
          });
        })
        .then(function() {
          $rootScope.$broadcast(INBOX_EVENTS.VACATION_STATUS);
        })
        .catch(function(err) {
          $scope.vacation.loadedSuccessfully = false;

          return $q.reject(err);
        });
    };

    $scope.$on(INBOX_EVENTS.VACATION_STATUS, function() {
      withJmapClient(function(client) {
        client.getVacationResponse().then(function(vacation) {
          $scope.vacation.isEnabled = vacation.isEnabled;
        });
      });
    });

    function _validateVacationLogic() {
      if ($scope.vacation.isEnabled) {
        if (!$scope.vacation.fromDate) {
          return rejectWithErrorNotification('Please enter a valid start date');
        }

        if (self.toDateIsInvalid()) {
          return rejectWithErrorNotification('End date must be greater than start date');
        }
      }

      return $q.when();
    }
  })

  .controller('recipientsFullscreenEditFormController', function($scope, $state, $stateParams) {
    if (!$stateParams.recipientsType || !$stateParams.composition || !$stateParams.composition.email) {
      return $state.go('unifiedinbox.compose');
    }

    $scope.recipientsType = $stateParams.recipientsType;
    $scope.recipients = $stateParams.composition.email[$stateParams.recipientsType];

    $scope.backToComposition = function() {
      $state.go('^', { composition: $stateParams.composition }, { location: 'replace' });
    };

    $scope.goToRecipientsType = function(recipientsType) {
      $state.go('.', {
        recipientsType: recipientsType,
        composition: $stateParams.composition
      }, { location: 'replace' });
    };
  })

  .controller('attachmentController', function(navigateTo, asyncAction) {
    this.download = function(attachment) {
      return asyncAction({
        progressing: 'Please wait while your download is being prepared',
        success: 'Your download has started',
        failure: 'Unable to download attachment ' + attachment.name
      }, function() {
        return attachment.getSignedDownloadUrl().then(navigateTo);
      });
    };
  })

  .controller('inboxSidebarEmailController', function($scope, inboxMailboxesService, inboxSpecialMailboxes, inboxAsyncHostedMailControllerHelper, session) {
    $scope.specialMailboxes = inboxSpecialMailboxes.list();
    $scope.emailAddress = session.user.preferredEmail;

    inboxAsyncHostedMailControllerHelper(this, function() {
      return inboxMailboxesService.assignMailboxesList($scope);
    });
  })

  .controller('inboxSidebarTwitterController', function($scope, session, inboxConfig) {
    $scope.twitterAccounts = [];

    inboxConfig('twitter.tweets').then(function(twitterTweetsEnabled) {
      if (twitterTweetsEnabled) {
        $scope.twitterAccounts = session.getProviderAccounts('twitter');
      }
    });
  })

  .controller('resolveEmailerController', function($scope) {
    $scope.$watch('emailer', function(emailer) {
      if (emailer) {
        emailer.resolve();
      }
    });
  })

  .controller('inboxListSubheaderController', function($state, $stateParams, inboxSelectionService, inboxJmapItemService, inboxPlugins) {
    var self = this,
        account = $stateParams.account,
        context = $stateParams.context,
        plugin = inboxPlugins.get($stateParams.type);

    if (plugin) {
      plugin.resolveContextName(account, context).then(function(name) {
        self.resolvedContextName = name;
      });
      plugin.contextSupportsAttachments(account, context).then(function(value) {
        self.contextSupportsAttachments = value;
      });
    } else {
      self.contextSupportsAttachments = true;
    }

    self.isSelecting = inboxSelectionService.isSelecting;
    self.getSelectedItems = inboxSelectionService.getSelectedItems;
    self.unselectAllItems = inboxSelectionService.unselectAllItems;

    ['markAsUnread', 'markAsRead', 'unmarkAsFlagged', 'markAsFlagged', 'moveToTrash'].forEach(function(action) {
      self[action] = function() {
        inboxJmapItemService[action](inboxSelectionService.getSelectedItems());
        inboxSelectionService.unselectAllItems();
      };
    });

    self.move = function() {
      $state.go('.move', { selection: true });
    };
  });
