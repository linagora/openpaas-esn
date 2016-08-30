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
                                            DEFAULT_FILE_TYPE, DEFAULT_MAX_SIZE_UPLOAD, INBOX_SUMMERNOTE_OPTIONS) {
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
      this.initCtrlWithComposition(new Composition(email, options));
    };

    this.initCtrlWithComposition = function(comp) {
      composition = comp;
      $scope.email = composition.getEmail();

      _updateAttachmentStatus();
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

    $scope.isCollapsed = true;
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

  .controller('viewEmailController', function($scope, $stateParams, withJmapClient, Email, inboxEmailService, jmapEmailService) {
    $scope.email = $stateParams.item;

    jmapEmailService.getMessageById($stateParams.emailId).then(function(message) {
      if (!$scope.email) {
        $scope.email = Email(message);
      } else {
        ['isUnread', 'isFlagged', 'attachments', 'textBody', 'htmlBody'].forEach(function(property) {
          $scope.email[property] = message[property];
        });
      }

      inboxEmailService.markAsRead($scope.email);
    });
  })

  .controller('viewThreadController', function($scope, $stateParams, $state, withJmapClient, Email, Thread, inboxThreadService, _, JMAP_GET_MESSAGES_VIEW) {
    $scope.thread = $stateParams.item;

    withJmapClient(function(client) {
      client
        .getThreads({ ids: [$stateParams.threadId] })
        .then(_.head)
        .then(function(thread) {
          if (!$scope.thread) {
            $scope.thread = Thread(thread);
          }

          return thread.getMessages({ properties: JMAP_GET_MESSAGES_VIEW });
        })
        .then(function(messages) { return messages.map(Email); })
        .then(function(emails) {
          $scope.thread.setEmails(emails);
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

  .controller('inboxConfigurationIndexController', function($scope, $state, touchscreenDetectorService) {
    $scope.hasTouchscreen = touchscreenDetectorService.hasTouchscreen();
  })

  .controller('inboxConfigurationFolderController', function($scope, mailboxesService) {
    mailboxesService.assignMailboxesList($scope, mailboxesService.filterSystemMailboxes);
  })

  .controller('addFolderController', function($scope, $state, mailboxesService, Mailbox, rejectWithErrorNotification) {
    mailboxesService.assignMailboxesList($scope);

    $scope.mailbox = new Mailbox({});

    $scope.addFolder = function() {
      if (!$scope.mailbox.name) {
        return rejectWithErrorNotification('Please enter a valid folder name');
      }

      $state.go('unifiedinbox');

      return mailboxesService.createMailbox($scope.mailbox);
    };
  })

  .controller('editFolderController', function($scope, $state, $stateParams, mailboxesService, _, rejectWithErrorNotification) {
    var originalMailbox;

    mailboxesService
      .assignMailboxesList($scope)
      .then(function(mailboxes) {
        originalMailbox = _.find(mailboxes, { id: $stateParams.mailbox });
        $scope.mailbox =  _.clone(originalMailbox);
      });

    $scope.editFolder = function() {
      if (!$scope.mailbox.name) {
        return rejectWithErrorNotification('Please enter a valid folder name');
      }

      $state.go('unifiedinbox');

      return mailboxesService.updateMailbox(originalMailbox, $scope.mailbox);
    };
  })

  .controller('inboxDeleteFolderController', function($scope, $state, $stateParams, mailboxesService, _) {
    mailboxesService
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

      return mailboxesService.destroyMailbox($scope.mailbox);
    };
  })

  .controller('inboxConfigurationVacationController', function($rootScope, $scope, $state, $stateParams, $q, moment, jmap,
                                                               withJmapClient, rejectWithErrorNotification, asyncJmapAction, INBOX_EVENTS) {
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
      $state.go('^', { composition: $stateParams.composition });
    };

    $scope.goToRecipientsType = function(recipientsType) {
      $state.go('.', {
        recipientsType: recipientsType,
        composition:  $stateParams.composition
      });
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
