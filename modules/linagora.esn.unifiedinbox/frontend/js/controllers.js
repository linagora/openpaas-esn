'use strict';

angular.module('linagora.esn.unifiedinbox')

  .controller('unifiedInboxController', function($scope, inboxFilteringAwareInfiniteScroll, inboxProviders,
                                                 PageAggregatorService, _, ELEMENTS_PER_PAGE, inboxFilteringService) {
    var aggregator;

    function load() {
      return aggregator.loadNextItems().then(_.property('data'), _.constant([]));
    }

    inboxFilteringAwareInfiniteScroll($scope, function() {
      return inboxFilteringService.getFiltersForUnifiedInbox();
    }, function() {
      aggregator = null;

      return function() {
        if (aggregator) {
          return load();
        }

        return inboxProviders.getAll({
          acceptedTypes: inboxFilteringService.getAcceptedTypesFilter(),
          filterByType: { JMAP: inboxFilteringService.getJmapFilter() }
        }).then(function(providers) {
          aggregator = new PageAggregatorService('unifiedInboxControllerAggregator', providers, {
            compare: function(a, b) { return b.date - a.date; },
            results_per_page: ELEMENTS_PER_PAGE
          });

          return load();
        });
      };
    });
  })

  .controller('listController', function($state, inboxConfig, DEFAULT_VIEW) {
    inboxConfig('view', DEFAULT_VIEW).then(function(view) {
      $state.go('unifiedinbox.list.' + view);
    });
  })

  .controller('composerController', function($scope, $stateParams, notificationFactory,
                                            Composition, jmap, withJmapClient, fileUploadService, $filter,
                                            attachmentUploadService, _, inboxConfig,
                                            DEFAULT_FILE_TYPE, DEFAULT_MAX_SIZE_UPLOAD) {
    var disableImplicitSavesAsDraft = false,
        composition;

    this.getComposition = function() {
      return composition;
    };

    this.initCtrl = function(email, options) {
      this.initCtrlWithComposition(new Composition(email, options));
    };

    this.initCtrlWithComposition = function(comp) {
      composition = comp;
      $scope.email = composition.getEmail();
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

      attachment.startUpload = function() {
        var uploadTask = fileUploadService.get(attachmentUploadService).addFile(file, true);

        attachment.upload = {
          progress: 0,
          cancel: uploadTask.cancel
        };
        attachment.status = 'uploading';
        attachment.upload.promise = uploadTask.defer.promise.then(function(task) {
          attachment.status = 'uploaded';
          attachment.error = null;
          attachment.blobId = task.response.blobId;
          attachment.url = task.response.url;

          if (!disableImplicitSavesAsDraft) {
            composition.saveDraftSilently();
          }
        }, function(err) {
          attachment.status = 'error';
          attachment.error = err;
        }, function(uploadTask) {
          attachment.upload.progress = uploadTask.progress;
        });

        return attachment;
      };

      return attachment;
    }

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

            $scope.email.attachments.push(newAttachment(client, file).startUpload());
          });
        });
      });
    };

    this.removeAttachment = function(attachment) {
      attachment.upload && attachment.upload.cancel();
      _.pull($scope.email.attachments, attachment);

      composition.saveDraftSilently();
    };

    if ($stateParams.composition) {
      this.initCtrlWithComposition($stateParams.composition);
    } else if ($stateParams.email) {
      this.initCtrl($stateParams.email, $stateParams.compositionOptions);
    }

    $scope.isCollapsed = true;
    $scope.summernoteOptions = {
      focus: false,
      airMode: false,
      disableResizeEditor: true,
      toolbar: [
        ['style', ['bold', 'italic', 'underline', 'strikethrough']],
        ['textsize', ['fontsize']],
        ['alignment', ['paragraph', 'ul', 'ol']]
      ]
    };

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

      return composition.destroyDraft();
    };

  })

  .controller('viewEmailController', function($scope, $stateParams, withJmapClient, Email, inboxEmailService, JMAP_GET_MESSAGES_VIEW) {

    $scope.mailbox = $stateParams.mailbox;
    $scope.emailId = $stateParams.emailId;

    withJmapClient(function(client) {
      client.getMessages({
        ids: [$scope.emailId],
        properties: JMAP_GET_MESSAGES_VIEW
      }).then(function(messages) {
        $scope.email = Email(messages[0]); // We expect a single message here

        inboxEmailService.markAsRead($scope.email);
      });
    });

  })

  .controller('viewThreadController', function($scope, $stateParams, $state, withJmapClient, Email, Thread, inboxThreadService, JMAP_GET_MESSAGES_VIEW) {

    withJmapClient(function(client) {
      client
        .getThreads({ids: [$stateParams.threadId], fetchMessages: false})
        .then(function(threads) {
          $scope.thread = threads[0];

          return $scope.thread.getMessages({
            properties: JMAP_GET_MESSAGES_VIEW
          });
        })
        .then(function(messages) { return messages.map(Email); })
        .then(function(emails) {
          $scope.thread = new Thread($scope.thread, emails);
        })
        .then(function() {
          $scope.thread.emails.forEach(function(email, index, emails) {
            email.isCollapsed = !(email.isUnread || index === emails.length - 1);
          });
        })
        .then(function() {
          inboxThreadService.markAsRead($scope.thread);
        });
    });

    ['markAsRead', 'markAsFlagged', 'unmarkAsFlagged'].forEach(function(action) {
      this[action] = function() {
        inboxThreadService[action]($scope.thread);
      };
    }.bind(this));

    ['markAsUnread', 'moveToTrash'].forEach(function(action) {
      this[action] = function() {
        inboxThreadService[action]($scope.thread).then(function() {
          $state.go('^');
        });
      };
    }.bind(this));
  })

  .controller('inboxConfigurationFolderController', function($scope, mailboxesService) {
    mailboxesService.assignMailboxesList($scope, mailboxesService.filterSystemMailboxes);
  })

  .controller('addFolderController', function($scope, $state, mailboxesService, rejectWithErrorNotification, asyncJmapAction) {
    mailboxesService.assignMailboxesList($scope);

    $scope.mailbox = {};

    $scope.addFolder = function() {
      if (!$scope.mailbox.name) {
        return rejectWithErrorNotification('Please enter a valid folder name');
      }

      return asyncJmapAction('Creation of folder ' + $scope.mailbox.name, function(client) {
        return client.createMailbox($scope.mailbox.name, $scope.mailbox.parentId);
      }).then(function() {
        $state.go('unifiedinbox');
      });
    };
  })

  .controller('editFolderController', function($scope, $state, $stateParams, $modal, mailboxesService, _, rejectWithErrorNotification, asyncJmapAction) {
    mailboxesService
      .assignMailboxesList($scope)
      .then(function(mailboxes) {
        $scope.mailbox = _.find(mailboxes, { id: $stateParams.mailbox });
      });

    $scope.editFolder = function() {
      if (!$scope.mailbox.name) {
        return rejectWithErrorNotification('Please enter a valid folder name');
      }
      $state.go('unifiedinbox');

      return asyncJmapAction('Modification of folder ' + $scope.mailbox.name, function(client) {
        return client.updateMailbox($scope.mailbox.id, {
          name: $scope.mailbox.name,
          parentId: $scope.mailbox.parentId
        });
      });
    };

    $scope.confirmationDialog = function() {
      $modal({scope: $scope, templateUrl: '/unifiedinbox/views/configuration/folders/delete/index', backdrop: 'static', placement: 'center'});
    };

    $scope.deleteFolder = function() {
      $state.go('unifiedinbox');

      return asyncJmapAction('Deletion of folder ' + $scope.mailbox.name, function(client) {
        return client.destroyMailbox($scope.mailbox.id);
      });
    };
  })

  .controller('inboxConfigurationVacationController', function($rootScope, $scope, $state, $stateParams, $q, moment, jmap,
                                                               withJmapClient, rejectWithErrorNotification, asyncJmapAction, INBOX_EVENTS) {
    function _init() {
      $scope.vacation = $stateParams.vacation;

      if (!$scope.vacation) {
        $scope.vacation = {};

        withJmapClient(function(client) {
          client.getVacationResponse()
            .then(function(vacation) {
              $scope.vacation = vacation;
            })
            .then(function() {
              $scope.vacation.fromDate = $scope.vacation.fromDate || moment();

              if (angular.isDefined($scope.vacation.toDate)) {
                $scope.vacation.hasToDate = true;
              }
            });
        });
      }
    }

    _init();

    $scope.getMinDate = function() {
      return $scope.vacation.fromDate;
    };

    $scope.enableVacation = function(status) {
      $scope.vacation.isEnabled = status;
    };

    $scope.updateVacation = function() {
      return _validateVacationLogic()
        .then(function() {
          $state.go('unifiedinbox');

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
          $rootScope.$broadcast(INBOX_EVENTS.VACATION_STATUS, $scope.vacation.isEnabled);
        });
    };

    $scope.$on(INBOX_EVENTS.VACATION_STATUS, function(event, isEnabled) {
      $scope.vacation.isEnabled = isEnabled;
    });

    function _validateVacationLogic() {
      if ($scope.vacation.isEnabled) {
        if (!$scope.vacation.fromDate) {
          return rejectWithErrorNotification('Please enter a valid start date');
        }

        if (!!$scope.vacation.toDate && $scope.vacation.toDate < $scope.vacation.fromDate) {
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
      $state.go('^', { composition: $stateParams.composition });
    };
  })

  .controller('attachmentController', function($window) {
    this.download = function(attachment) {
      $window.open(attachment.url);
    };
  })

  .controller('listTwitterController', function($scope, $stateParams, infiniteScrollOnGroupsHelper, inboxTwitterProvider,
                                                inboxFilteringService, ByDateElementGroupingTool, session, _) {
    var account = _.find(session.getTwitterAccounts(), { username: $stateParams.username });

    inboxFilteringService.uncheckFilters();

    $scope.loadMoreElements = infiniteScrollOnGroupsHelper($scope, inboxTwitterProvider(account.id).fetch(), new ByDateElementGroupingTool());
    $scope.username = account.username;
  })

  .controller('inboxSidebarEmailController', function($scope, mailboxesService, inboxSpecialMailboxes) {
    mailboxesService.assignMailboxesList($scope);

    $scope.specialMailboxes = inboxSpecialMailboxes.list();
  })

  .controller('inboxSidebarTwitterController', function($scope, session, inboxConfig) {
    $scope.twitterAccounts = [];

    inboxConfig('twitter.tweets').then(function(twitterTweetsEnabled) {
      if (twitterTweetsEnabled) {
        $scope.twitterAccounts = session.getTwitterAccounts();
      }
    });
  })

  .controller('resolveEmailerController', function($scope) {
    $scope.$watch('emailer', function(emailer) {
      if (emailer) {
        emailer.resolve();
      }
    });
  });
