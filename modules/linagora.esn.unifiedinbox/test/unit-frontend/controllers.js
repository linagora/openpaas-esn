'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The linagora.esn.unifiedinbox module controllers', function() {

  var $stateParams, $rootScope, scope, $controller, $timeout, $interval,
      jmapClient, jmap, notificationFactory, draftService, Offline = {},
      Composition, newComposerService = {}, $state, $modal, navigateTo, inboxPlugins, inboxFilteredList,
      inboxMailboxesService, inboxJmapItemService, _, fileUploadMock, config, moment, inboxMailboxesCache,
      touchscreenDetectorService, esnPreviousPage, inboxFilterDescendantMailboxesFilter, inboxSelectionService;
  var JMAP_GET_MESSAGES_VIEW, INBOX_EVENTS, DEFAULT_FILE_TYPE, DEFAULT_MAX_SIZE_UPLOAD, INFINITE_LIST_POLLING_INTERVAL;

  beforeEach(function() {
    $stateParams = {
      mailbox: 'chosenMailbox',
      emailId: '4'
    };
    notificationFactory = {
      weakSuccess: sinon.spy(),
      weakError: sinon.spy(function() { return { setCancelAction: sinon.spy() }; }),
      strongInfo: sinon.spy(function() { return { close: sinon.spy() }; })
    };
    $state = {
      current: { name: 'state.attachment' },
      go: sinon.spy(),
      get: sinon.spy()
    };
    $modal = sinon.spy();

    angular.mock.module('esn.core');
    angular.mock.module('esn.notification');
    angular.mock.module('esn.previous-page');

    module('linagora.esn.unifiedinbox', function($provide) {
      jmapClient = {};
      config = {};
      inboxFilterDescendantMailboxesFilter = sinon.spy();
      config['linagora.esn.unifiedinbox.uploadUrl'] = 'http://jmap';
      config['linagora.esn.unifiedinbox.maxSizeUpload'] = DEFAULT_MAX_SIZE_UPLOAD;
      fileUploadMock = {
        addFile: function() {
          return {
            defer: $q.defer()
          };
        },
        start: sinon.spy()
      };

      $provide.value('withJmapClient', function(callback) {
        return callback(jmapClient);
      });
      $provide.value('$stateParams', $stateParams);
      $provide.value('notificationFactory', notificationFactory);
      $provide.value('Offline', Offline);
      $provide.value('$modal', $modal);
      $provide.value('draftService', draftService = {});
      $provide.value('newComposerService', newComposerService);
      $provide.value('$state', $state);
      $provide.constant('ELEMENTS_PER_PAGE', 2);
      $provide.value('fileUploadService', {
        get: function() {
          return fileUploadMock;
        }
      });
      $provide.value('esnConfig', function(key, defaultValue) {
        return $q.when().then(function() {
          return angular.isDefined(config[key]) ? config[key] : defaultValue;
        });
      });
      $provide.value('filter', { filter: 'condition' });
      $provide.value('searchService', { searchByEmail: function() { return $q.when(); }});
      $provide.value('navigateTo', navigateTo = sinon.spy());
      $provide.value('touchscreenDetectorService', touchscreenDetectorService = {});
      $provide.value('inboxFilterDescendantMailboxesFilter', inboxFilterDescendantMailboxesFilter);
      $provide.decorator('inboxFilteredList', function($delegate) {
        $delegate.addAll = sinon.spy($delegate.addAll);

        return $delegate;
      });
      $provide.value('inboxIdentitiesService', {
        getAllIdentities: function() {
          return $q.when([{ isDefault: true, id: 'default' }, { id: 'customIdentity', name: 'Name' }]);
        }
      });
    });
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _$controller_, _$timeout_, _$interval_, _jmap_, _inboxPlugins_, _inboxFilteredList_,
                                          _Composition_, _inboxMailboxesService_, ___, _JMAP_GET_MESSAGES_VIEW_,
                                          _DEFAULT_FILE_TYPE_, _moment_, _DEFAULT_MAX_SIZE_UPLOAD_, _inboxJmapItemService_,
                                          _INBOX_EVENTS_, _inboxMailboxesCache_, _esnPreviousPage_, _inboxSelectionService_,
                                          _INFINITE_LIST_POLLING_INTERVAL_) {
    $rootScope = _$rootScope_;
    $controller = _$controller_;
    $timeout = _$timeout_;
    $interval = _$interval_;
    jmap = _jmap_;
    Composition = _Composition_;
    inboxMailboxesService = _inboxMailboxesService_;
    inboxJmapItemService = _inboxJmapItemService_;
    inboxMailboxesCache = _inboxMailboxesCache_;
    _ = ___;
    JMAP_GET_MESSAGES_VIEW = _JMAP_GET_MESSAGES_VIEW_;
    DEFAULT_FILE_TYPE = _DEFAULT_FILE_TYPE_;
    DEFAULT_MAX_SIZE_UPLOAD = _DEFAULT_MAX_SIZE_UPLOAD_;
    INBOX_EVENTS = _INBOX_EVENTS_;
    moment = _moment_;
    esnPreviousPage = _esnPreviousPage_;
    inboxSelectionService = _inboxSelectionService_;
    inboxPlugins = _inboxPlugins_;
    INFINITE_LIST_POLLING_INTERVAL = _INFINITE_LIST_POLLING_INTERVAL_;
    inboxFilteredList = _inboxFilteredList_;

    scope = $rootScope.$new();
  }));

  beforeEach(function() {
    esnPreviousPage.back = sinon.spy();
  });

  function initController(ctrl) {
    var controller = $controller(ctrl, {
      $scope: scope
    });

    scope.$digest();

    return controller;
  }

  describe('The unifiedInboxController', function() {

    var INBOX_CONTROLLER_LOADING_STATES, inboxFilters, inboxFilteringService, inboxProviders;

    beforeEach(inject(function(_inboxProviders_, _inboxFilteringService_, _inboxFilters_, _INBOX_CONTROLLER_LOADING_STATES_) {
      inboxProviders = _inboxProviders_;
      inboxFilters = _inboxFilters_;
      inboxFilteringService = _inboxFilteringService_;
      INBOX_CONTROLLER_LOADING_STATES = _INBOX_CONTROLLER_LOADING_STATES_;
    }));

    afterEach(function() {
      inboxFilteringService.uncheckFilters();
    });

    it('should leverage inboxProviders.getAll with options', function() {
      inboxProviders.getAll = sinon.spy(inboxProviders.getAll);

      initController('unifiedInboxController');

      expect(inboxProviders.getAll).to.have.been.calledWith(inboxFilteringService.getAllProviderFilters());
    });

    it('should set state to ERROR when inboxProviders.getAll rejects', function() {
      inboxProviders.getAll = sinon.spy(function() {
        return $q.reject(new Error());
      });

      var ctrl = initController('unifiedInboxController');

      expect(ctrl.state).to.equal(INBOX_CONTROLLER_LOADING_STATES.ERROR);
    });

    it('should reset selection', function() {
      inboxSelectionService.toggleItemSelection({});

      initController('unifiedInboxController');

      expect(inboxSelectionService.isSelecting()).to.equal(false);
    });

    it('should call our inbox provider as expected', function() {
      jmapClient.getMailboxes = sinon.spy(function() {
        return $q.when([new jmap.Mailbox({}, 'id_inbox', 'name_inbox', { role: 'inbox' })]);
      });
      jmapClient.getMessageList = sinon.stub().returns($q.when(new jmap.MessageList(jmapClient, { messageIds: [1] })));
      jmapClient.getMessages = sinon.stub().returns($q.when([]));

      $rootScope.$digest();
      initController('unifiedInboxController');
      $timeout.flush();

      expect(jmapClient.getMailboxes).to.have.been.calledWith();
      expect(jmapClient.getMessageList).to.have.been.calledWith(sinon.match.has('filter', {
        inMailboxes: ['id_inbox'],
        before: null,
        after: null
      }));
      expect(jmapClient.getMessages).to.have.been.calledOnce;
    });

    it('should forward filters to our jmap provider', function() {
      _.find(inboxFilters, { id: 'isUnread' }).checked = true; // This simulated the selection of isUnread

      jmapClient.getMessageList = sinon.stub().returns($q.when(new jmap.MessageList(jmapClient, { messageIds: [1] })));
      jmapClient.getMessages = sinon.stub().returns($q.when([]));
      jmapClient.getMailboxes = function() {
        return $q.when([new jmap.Mailbox({}, 'id_inbox', 'name_inbox', { role: 'inbox' })]);
      };

      $rootScope.$digest();
      initController('unifiedInboxController');
      $timeout.flush();

      expect(jmapClient.getMessageList).to.have.been.calledWith(sinon.match.has('filter', {
        inMailboxes: ['id_inbox'],
        isUnread: true,
        before: null,
        after: null
      }));
      expect(jmapClient.getMessages).to.have.been.calledOnce;
    });

    it('should pass state parameters to inboxFilteringService', function() {
      $stateParams.type = 'myType';
      $stateParams.account = 'myAccount';
      $stateParams.context = 'myContext';

      initController('unifiedInboxController');

      expect(inboxFilteringService.getAllProviderFilters()).to.deep.equal({
        acceptedIds: null,
        acceptedTypes: ['myType'],
        acceptedAccounts: ['myAccount'],
        filterByType: {
          jmap: {},
          twitter: {},
          social: {}
        },
        context: 'myContext'
      });
    });

    it('should publish available filters as scope.filters', function() {
      initController('unifiedInboxController');

      expect(scope.filters).to.deep.equal(inboxFilteringService.getAvailableFilters());
    });

    it('should initialize the scope.loadMoreElements function, calling the passed-in builder', function() {
      initController('unifiedInboxController');

      expect(scope.loadMoreElements).to.be.a('function');
    });

    it('should initialize the scope.loadRecentItems function', function() {
      initController('unifiedInboxController');
      $rootScope.$digest();

      expect(scope.loadRecentItems).to.be.a('function');
    });

    it('should listen to "FILTER_CHANGED" event, resetting infinite scroll', function() {
      jmapClient.getMessageList = sinon.stub().returns($q.when(new jmap.MessageList(jmapClient, { messageIds: [1] })));
      jmapClient.getMessages = sinon.stub().returns($q.when([]));
      jmapClient.getMailboxes = function() {
        return $q.when([new jmap.Mailbox({}, 'id_inbox', 'name_inbox', { role: 'inbox' })]);
      };

      initController('unifiedInboxController');
      $rootScope.$digest();

      // Simulate end of initial infinite scroll
      scope.infiniteScrollCompleted = true;
      scope.infiniteScrollDisabled = true;

      scope.$emit(INBOX_EVENTS.FILTER_CHANGED);

      expect(scope.infiniteScrollCompleted).to.equal(false);

      $timeout.flush();

      expect(scope.infiniteScrollDisabled).to.equal(false);
      expect(scope.infiniteScrollCompleted).to.equal(true); // Because the infinite scroll is done as I'm returning one item
    });

    it('should schedule scope.loadRecentItems at a regular interval', function(done) {
      initController('unifiedInboxController');
      scope.loadRecentItems = done;

      $interval.flush(INFINITE_LIST_POLLING_INTERVAL);
    });

    it('should append new elements to the list', function() {
      initController('unifiedInboxController');

      $interval.flush(INFINITE_LIST_POLLING_INTERVAL);

      expect(inboxFilteredList.addAll).to.have.been.calledWith([]);
    });

    it('should destroy the interval when scope is destroyed', function() {
      initController('unifiedInboxController');
      scope.loadRecentItems = sinon.spy();

      scope.$emit('$destroy');
      $interval.flush(INFINITE_LIST_POLLING_INTERVAL + 1);

      expect(scope.loadRecentItems).to.have.not.been.calledWith();
    });

    it('should call loadRecentItems initially', function() {
      initController('unifiedInboxController');

      scope.loadRecentItems = sinon.spy(scope.loadRecentItems);
      $timeout.flush();

      expect(scope.loadRecentItems).to.have.been.calledWith();
    });

  });

  describe('The composerController', function() {

    beforeEach(inject(function() {
      draftService.startDraft = sinon.spy();

      scope.hide = sinon.spy();
      scope.email = { to: [] };
    }));

    function initCtrl(email) {
      var ctrl = initController('composerController');

      ctrl.initCtrl(email);

      return ctrl;
    }

    it('should start the draft at init time', function() {
      initCtrl({obj: 'expected'});
      expect(draftService.startDraft).to.have.been.calledOnce;
    });

    it('should save the draft when saveDraft is called', function() {
      Composition.prototype.saveDraft = sinon.spy();

      initCtrl({obj: 'expected'}).saveDraft();

      expect(Composition.prototype.saveDraft).to.have.been.calledOnce;
    });

    it('should not send an email when canBeSentOrNotify returns false', function() {
      Composition.prototype.canBeSentOrNotify = sinon.stub().returns(false);
      initCtrl({
        to: [],
        cc: [],
        bcc: []
      });

      scope.send();

      expect(scope.hide).to.have.not.been.called;
    });

    it('should send an email when canBeSentOrNotify returns true', function() {
      Composition.prototype.canBeSentOrNotify = sinon.stub().returns(true);
      Composition.prototype.send = sinon.spy();
      initCtrl({
        to: [{displayName: '1', email: '1@linagora.com'}],
        cc: [],
        bcc: []
      });

      scope.send();

      expect(scope.hide).to.have.been.calledOnce;
      expect(Composition.prototype.send).to.have.been.calledOnce;
    });

    it('should initialize the controller when a Composition instance is given in state params', function() {
      $stateParams.composition = { getEmail: function() { return {}; } };

      var ctrl = initController('composerController');

      expect(ctrl.getComposition()).to.deep.equal($stateParams.composition);

      expect(ctrl.identities).to.have.length(2);
      expect(scope.email.identity).to.deep.equal({ id: 'default', isDefault: true });
    });

    it('should initialize the controller when an email is given in state params', function() {
      $stateParams.email = { to: [] };
      $stateParams.compositionOptions = { fromDraft: 'expected value' };

      var ctrl = initController('composerController');

      expect(ctrl.getComposition()).to.be.an.instanceof(Composition);
      expect(ctrl.getComposition().draft).to.equal('expected value');
      expect(scope.email).to.be.a('object');

      expect(ctrl.identities).to.have.length(2);
      expect(scope.email.identity).to.deep.equal({ id: 'default', isDefault: true });
    });

    it('should remembers the selected identity', function() {
      $stateParams.composition = {
        getEmail: function() {
          return {
            identity: {
              id: 'customIdentity'
            }
          };
        }
      };

      var ctrl = initController('composerController');

      expect(ctrl.getComposition()).to.deep.equal($stateParams.composition);

      expect(scope.email.identity).to.deep.equal({ id: 'customIdentity', name: 'Name' });
    });

    it('should call scope.updateIdentity after intialization', function() {
      scope.updateIdentity = sinon.spy();
      $stateParams.email = { to: [] };

      initController('composerController');

      expect(scope.updateIdentity).to.have.been.calledWith();
    });

    describe('The getIdentitySignature function', function() {

      it('should prefix the signature', function() {
        var controller = initController('composerController');

        expect(controller.getIdentitySignature({ textSignature: 'My Signature' })).to.equal('-- \nMy Signature');
      });

    });

    describe('The getIdentityLabel function', function() {

      it('should format the identity', function() {
        var controller = initController('composerController');

        expect(controller.getIdentityLabel({ name: 'Name', email: 'a@a.com' })).to.equal('Name <a@a.com>');
      });

    });

    describe('The "destroyDraft" function', function() {

      it('should hide the composer then destroy the draft when called', function() {
        var ctrl = initCtrl({subject: 'a subject'});

        ctrl.getComposition().destroyDraft = sinon.spy();

        scope.destroyDraft();

        expect(scope.hide).to.have.been.calledOnce;
        expect(ctrl.getComposition().destroyDraft).to.have.been.calledOnce;
      });

    });

    describe('The onAttachmentsSelect function', function() {

      var ctrl;

      beforeEach(function() {
        fileUploadMock.addFile = function() {
          var defer = $q.defer();

          defer.resolve({
            response: {
              blobId: '1234',
              url: 'http://jmap/1234'
            }
          });

          return {
            defer: defer
          };
        };

        ctrl = initController('composerController');

        ctrl.initCtrlWithComposition({
          canBeSentOrNotify: function() { return true; },
          saveDraft: sinon.spy(),
          send: sinon.spy(),
          getEmail: sinon.stub().returns({}),
          saveDraftSilently: sinon.stub().returns($q.when(new jmap.CreateMessageAck({destroyMessage: sinon.spy()}, {
            id: 'expected id',
            blobId: 'any',
            size: 5
          })))
        });
      });

      it('should do nothing if no files are given', function() {
        ctrl.onAttachmentsSelect();

        expect(scope.email.attachments).to.equal(undefined);
      });

      it('should do nothing if files is zerolength', function() {
        ctrl.onAttachmentsSelect([]);

        expect(scope.email.attachments).to.equal(undefined);
      });

      it('should put the attachment in the scope, with a default file type', function(done) {
        ctrl.onAttachmentsSelect([{ name: 'name', size: 1 }]).then(function() {
          expect(scope.email.attachments[0]).to.shallowDeepEqual({
            blobId: '1234',
            name: 'name',
            size: 1,
            type: DEFAULT_FILE_TYPE
          });

          done();
        });

        $rootScope.$digest();
      });

      it('should put the attachment in the scope, if the file size is exactly the limit', function() {
        ctrl.onAttachmentsSelect([{ name: 'name', size: DEFAULT_MAX_SIZE_UPLOAD }]).then(function() {
          expect(scope.email.attachments.length).to.equal(1);
        });

        $rootScope.$digest();
      });

      it('should set the blobId and the url when upload succeeds', function() {
        ctrl.onAttachmentsSelect([{ name: 'name', size: 1 }]);
        $rootScope.$digest();

        expect(scope.email.attachments[0]).to.shallowDeepEqual({
          blobId: '1234',
          url: 'http://jmap/1234',
          name: 'name',
          size: 1,
          type: DEFAULT_FILE_TYPE,
          status: 'uploaded'
        });
      });

      it('should save the composition each time that and upload succeeds', function() {
        config['linagora.esn.unifiedinbox.drafts'] = true;
        ctrl.onAttachmentsSelect([{ name: 'name', size: 1 }]);
        ctrl.onAttachmentsSelect([{ name: 'name', size: 1 }]);
        $rootScope.$digest();

        expect(ctrl.getComposition().saveDraftSilently).to.have.been.calledTwice;
      });

      it('should not save intermediate drafts when saveDraft has been called', function() {
        ctrl.saveDraft();
        ctrl.onAttachmentsSelect([{ name: 'name', size: 1 }]);
        ctrl.onAttachmentsSelect([{ name: 'name', size: 1 }]);
        $rootScope.$digest();

        expect(ctrl.getComposition().saveDraftSilently).to.have.not.been.called;
      });

      it('should not save intermediate drafts when send has been called', function() {
        scope.send();
        ctrl.onAttachmentsSelect([{ name: 'name', size: 1 }]);
        ctrl.onAttachmentsSelect([{ name: 'name', size: 1 }]);
        $rootScope.$digest();

        expect(ctrl.getComposition().saveDraftSilently).to.have.not.been.called;
      });

      it('should set attachment.status to "error" if upload fails', function() {
        fileUploadMock.addFile = function() {
          var defer = $q.defer();

          defer.reject('WTF');

          return {
            defer: defer
          };
        };

        ctrl.onAttachmentsSelect([{ name: 'name', size: 1 }]);
        $rootScope.$digest();

        expect(scope.email.attachments[0]).to.shallowDeepEqual({ status: 'error' });
      });

      it('should resolve the upload promise with nothing when upload succeeds', function(done) {
        ctrl.onAttachmentsSelect([{ name: 'name', size: 1 }]).then(function() {
          scope.email.attachments[0].upload.promise.then(done);
        });

        $rootScope.$digest();
      });

      it('should resolve the upload promise with nothing when upload fails', function(done) {
        fileUploadMock.addFile = function() {
          var defer = $q.defer();

          defer.reject('WTF');

          return {
            defer: defer
          };
        };

        ctrl.onAttachmentsSelect([{ name: 'name', size: 1 }]).then(function() {
          scope.email.attachments[0].upload.promise.then(done);
        });

        $rootScope.$digest();
      });

      it('should notify and not add the attachment if file is larger that the default limit', function() {
        initController('composerController').onAttachmentsSelect([{ name: 'name', size: DEFAULT_MAX_SIZE_UPLOAD + 1 }]).then(function() {
          expect(notificationFactory.weakError).to.have.been.calledWith('', 'File name ignored as its size exceeds the 20MB limit');
          expect(scope.email.attachments).to.deep.equal([]);
        });

        $rootScope.$digest();
      });

      it('should notify and not add the attachment if file is larger that a configured limit', function() {
        config['linagora.esn.unifiedinbox.maxSizeUpload'] = 1024 * 1024; // 1MB
        initController('composerController').onAttachmentsSelect([{ name: 'name', size: 1024 * 1024 * 2 }]).then(function() {
          expect(notificationFactory.weakError).to.have.been.calledWith('', 'File name ignored as its size exceeds the 1MB limit');
          expect(scope.email.attachments).to.deep.equal([]);
        });

        $rootScope.$digest();
      });

    });

    describe('The upload function', function() {

      it('should restore upload and status properties of the attachment', function() {
        var attachment = {
          name: 'name',
          getFile: function() {
            return { size: 0 };
          }
        };

        initController('composerController').upload(attachment);

        expect(attachment.upload.progress).to.equal(0);
        expect(attachment.status).to.equal('uploading');
      });

      it('should start the upload', function() {
        var attachment = {
          name: 'name',
          getFile: function() {
            return { size: 0 };
          }
        };

        initController('composerController').upload(attachment);

        expect(fileUploadMock.start).to.have.been.calledWith();
      });

    });

    describe('The removeAttachment function', function() {

      var ctrl;

      beforeEach(function() {
        ctrl = initController('composerController');
        ctrl.initCtrl({});
        ctrl.getComposition().saveDraftSilently = sinon.spy();
      });

      it('should cancel an ongoing upload', function(done) {
        var attachment = { upload: { cancel: done } };

        scope.email.attachments = [attachment];

        ctrl.removeAttachment(attachment);
      });

      it('should remove the attachment from the email', function() {
        var attachment = { blobId: 'willBeRemoved', upload: { cancel: angular.noop } };

        scope.email.attachments = [attachment, { blobId: '1' }];

        ctrl.removeAttachment(attachment);

        expect(scope.email.attachments).to.deep.equal([{ blobId: '1' }]);
      });

      it('should remove attachments that do not have upload attributes', function() {
        var attachment = { blobId: 'willBeRemoved'};

        scope.email.attachments = [attachment, { blobId: '1' }];

        ctrl.removeAttachment(attachment);

        expect(scope.email.attachments).to.deep.equal([{ blobId: '1' }]);
      });

      it('should save the draft silently', function() {
        var attachment = { blobId: 'willBeRemoved'};

        scope.email.attachments = [attachment];

        ctrl.removeAttachment(attachment);

        expect(ctrl.getComposition().saveDraftSilently).to.have.been.calledWith();
      });

    });

    describe('the attachmentStatus functionality', function() {
      var expectedAttachmentStatus;

      beforeEach(function() {
        expectedAttachmentStatus = {
          number: 0,
          uploading: false,
          error: false
        };
        fileUploadMock.addFile = function() {
          var defer = $q.defer();

          defer.resolve({
            response: {
              blobId: '1234'
            }
          });

          return {
            defer: defer
          };
        };
      });

      it('should not update attachmentStatus if email is empty', function() {
        initCtrl({});

        expect(scope.attachmentStatus).to.deep.equal(expectedAttachmentStatus);
      });

      it('should not update attachmentStatus if email has no attachments', function() {
        initCtrl({ to: [], subject: '' });

        expect(scope.attachmentStatus).to.deep.equal(expectedAttachmentStatus);
      });

      it('should update attachmentStatus once the controller is initialized with an email that has attachments', function() {
        expectedAttachmentStatus.number = 2;

        initCtrl({
          attachments: [
            { isInline: false },
            { isInline: false },
            { isInline: true }
          ]
        });

        expect(scope.attachmentStatus).to.deep.equal(expectedAttachmentStatus);
      });

      it('should update attachmentStatus after starting an attachment upload', function(done) {
        expectedAttachmentStatus.number = 1;
        expectedAttachmentStatus.uploading = true;

        initCtrl({}).onAttachmentsSelect([{ name: 'name', size: 1 }]).then(function() {
          expect(scope.attachmentStatus).to.deep.equal(expectedAttachmentStatus);

          done();
        });

        $rootScope.$digest();
      });

      it('should update attachmentStatus when the attachment upload is successfully uploaded', function() {
        expectedAttachmentStatus.number = 1;

        initCtrl({}).onAttachmentsSelect([{ name: 'name', size: 1 }]);
        $rootScope.$digest();

        expect(scope.attachmentStatus).to.deep.equal(expectedAttachmentStatus);
      });

      it('should update attachmentStatus when there is an error in attachment upload', function() {
        fileUploadMock.addFile = function() {
          var defer = $q.defer();

          defer.reject('reject');

          return {
            defer: defer
          };
        };
        expectedAttachmentStatus.number = 1;
        expectedAttachmentStatus.error = true;

        initCtrl({}).onAttachmentsSelect([{ name: 'name', size: 1 }]);
        $rootScope.$digest();

        expect(scope.attachmentStatus).to.deep.equal(expectedAttachmentStatus);
      });

      it('should update attachmentStatus when an attachment is removed', function() {
        var attachment = { isInline: false },
            ctrl = initCtrl({
              attachments: [attachment]
            });

        expectedAttachmentStatus = {
          number: 0,
          uploading: false,
          error: false
        };

        ctrl.removeAttachment(attachment);

        expect(scope.attachmentStatus).to.deep.equal(expectedAttachmentStatus);
      });
    });

  });

  describe('The viewEmailController', function() {

    var jmapMessage;

    beforeEach(function() {
      jmapMessage = new jmap.Message(jmapClient, 'messageId1', 'threadId1', [$stateParams.mailbox], {
        isUnread: false
      });

      jmapClient.getMessages = function() { return $q.when([jmapMessage]); };
      jmapClient.setMessages = function() { return $q.when(new jmap.SetResponse()); };
      jmapClient.updateMessage = function() { return $q.when(); };
    });

    it('should call jmapClient.getMessages with correct arguments', function(done) {
      jmapClient.getMessages = function(options) {
        expect(options).to.deep.equal({
          ids: ['4'],
          properties: JMAP_GET_MESSAGES_VIEW
        });

        done();
      };

      initController('viewEmailController');
    });

    it('should assign the returned message to $scope.email', function(done) {
      jmapClient.getMessages = function() {
        return $q.when([{ isUnread: false, property: 'property', mailboxIds: [] }]);
      };

      initController('viewEmailController');

      scope.$watch('email', function(before, after) {
        expect(after).to.shallowDeepEqual({ isUnread: false, property: 'property', mailboxIds: [], loaded: true });

        done();
      });

      scope.$digest();
    });

    it('should update $scope.email if it exists (opening an item from the list)', function(done) {
      $stateParams.item = new jmap.Message(jmapClient, 'messageId1', 'threadId1', [$stateParams.mailbox], {
        id: 'id',
        isFlagged: false
      });
      jmapClient.getMessages = function() {
        return $q.when([{ isFlagged: true, textBody: 'textBody', htmlBody: 'htmlBody', attachments: [] }]);
      };

      initController('viewEmailController');

      scope.$watch('email', function(before, after) {
        expect(after).to.shallowDeepEqual({ id: 'messageId1', isUnread: false, isFlagged: true, textBody: 'textBody', htmlBody: 'htmlBody', attachments: [], loaded: true });

        done();
      });

      scope.$digest();
    });

    it('should stop throbber when JMAP request has failed', function(done) {
      $stateParams.item = new jmap.Message(jmapClient, 'messageId1', 'threadId1', [$stateParams.mailbox], {
        id: 'id',
        isFlagged: false
      });
      jmapClient.getMessages = function() {
        return $q.reject(new Error('JMAP request did fail!'));
      };

      initController('viewEmailController');

      scope.$watch('email.loaded', function(before, after) {
        expect(after).to.equal(true);
        done();
      });

      scope.$digest();
    });

    it('should mark the email as read once it\'s loaded', function() {
      jmapMessage.isUnread = true;

      initController('viewEmailController');

      expect(jmapMessage.isUnread).to.equal(false);
    });

    it('should expose move to the controller', function() {
      var email = { to: [] };
      var controller = initController('viewEmailController');
      scope.email = email;

      controller.move();

      expect($state.go).to.have.been.calledWith('.move', { item: email });
    });

    describe('The markAsUnread function', function() {
      it('should update location to parent state, then mark email as unread', inject(function($state) {
        scope.email = {};
        $state.go = sinon.spy();
        var controller = initController('viewEmailController');

        controller.markAsUnread();

        expect($state.go).to.have.been.calledWith('^');
        scope.$digest();
        expect(scope.email.isUnread).to.equal(true);
      }));
    });

    describe('The moveToTrash function', function() {
      it('should update location to parent state, then move the email to trash', function() {
        inboxJmapItemService.moveToTrash = sinon.spy(function() {
          return $q.when({});
        });
        var controller = initController('viewEmailController');

        controller.moveToTrash();

        expect($state.go).to.have.been.calledWith('^');
        scope.$digest();
        expect(inboxJmapItemService.moveToTrash).to.have.been.called;
      });
    });

    describe('The previous function', function() {

      it('should do nothing if current message has no "previous" message', function() {
        initController('viewEmailController').previous();

        expect($state.go).to.have.not.been.calledWith();
      });

      it('should transition to previous message', function() {
        var controller = initController('viewEmailController');

        scope.email.previous = function() {
          return { id: 'newId' };
        };
        controller.previous();

        expect($state.go).to.have.been.calledWith('.', {
          emailId: 'newId',
          item: { id: 'newId' }
        }, {
          location: 'replace'
        });
      });

    });

    describe('The next function', function() {

      it('should do nothing if current message has no "next" message', function() {
        initController('viewEmailController').next();

        expect($state.go).to.have.not.been.calledWith();
      });

      it('should transition to next message', function() {
        var controller = initController('viewEmailController');

        scope.email.next = function() {
          return { id: 'newId' };
        };
        controller.next();

        expect($state.go).to.have.been.calledWith('.', {
          emailId: 'newId',
          item: { id: 'newId' }
        }, {
          location: 'replace'
        });
      });

    });

  });

  describe('The inboxMoveItemController controller', function() {
    var mailbox;

    beforeEach(function() {
      mailbox = {
        mailboxId: 'id'
      };
      $stateParams.mailbox = '$stateParams mailbox';
      $stateParams.item = {
        id: 'myId',
        provider: {
          itemMatches: _.constant($q.when())
        }
      };

      inboxMailboxesService.assignMailboxesList = sinon.spy();

      inboxJmapItemService.moveMultipleItems = sinon.spy(function() {
        return $q.when();
      });
    });

    it('should call inboxMailboxesService.assignMailboxesList', function() {
      initController('inboxMoveItemController');

      expect(inboxMailboxesService.assignMailboxesList).to.have.been.calledWith(scope);
    });

    describe('The moveTo function', function() {

      it('should call esnPreviousPage.back', function() {
        initController('inboxMoveItemController').moveTo(mailbox);

        expect(esnPreviousPage.back).to.have.been.calledWith();
      });

      it('should delegate to inboxJmapItemService.moveMultipleItems with the selection if selection=true', function() {
        var item = { id: 1 };

        $stateParams.selection = true;
        inboxSelectionService.toggleItemSelection(item);

        initController('inboxMoveItemController').moveTo(mailbox);

        expect(inboxJmapItemService.moveMultipleItems).to.have.been.calledWith([item], mailbox);
      });

      it('should delegate to inboxJmapItemService.moveMultipleItems with the item if selection=false', function() {
        inboxFilteredList.addAll([$stateParams.item]);
        $rootScope.$digest();

        initController('inboxMoveItemController').moveTo(mailbox);

        expect(inboxJmapItemService.moveMultipleItems).to.have.been.calledWith(sinon.match({ id: 'myId' }), mailbox);
      });

    });

  });

  describe('The viewThreadController', function() {

    var jmapThread,
        threadId = 'thread1';

    function mockGetThreadAndMessages(messages) {
      jmapThread.getMessages = function() {
        return $q.when(messages);
      };
    }

    beforeEach(function() {
      jmapThread = new jmap.Thread(jmapClient, threadId);

      mockGetThreadAndMessages([{
        id: 'email1',
        mailboxIds: [threadId],
        subject: 'email subject 1',
        isUnread: false
      }, {
        id: 'email2',
        mailboxIds: [threadId],
        subject: 'email subject 2',
        isUnread: true
      }]);

      jmapClient.getThreads = function() {
        return $q.when([jmapThread]);
      };
      jmapClient.setMessages = function() {
        return $q.when(new jmap.SetResponse());
      };
    });

    it('should search for message ids of the given thread id', function(done) {
      $stateParams.threadId = 'expectedThreadId';
      jmapClient.getThreads = function(options) {
        expect(options).to.deep.equal({ids: ['expectedThreadId'] });

        done();
      };

      initController('viewThreadController');
    });

    it('should search messages of the getThreads reply', function(done) {
      jmapClient.getThreads = function() {
        return $q.when([{
          getMessages: function(data) {
            expect(data).to.shallowDeepEqual({
              properties: JMAP_GET_MESSAGES_VIEW
            });

            done();
          }
        }]);
      };

      initController('viewThreadController');
    });

    it('should assign thread.emails from the getMessages reply', function() {
      jmapClient.getThreads = function() {
        return $q.when([{
          getMessages: function() {
            return [{ mailboxIds: ['inbox'], id: 'email1', subject: 'thread subject' }];
          }
        }]);
      };

      initController('viewThreadController');

      expect(scope.thread.emails).to.shallowDeepEqual([
        { mailboxIds: ['inbox'], id: 'email1', subject: 'thread subject', loaded: true }
      ]);
    });

    it('should update $scope.thread if it exists (opening an item from the list)', function() {
      $stateParams.item = jmapThread;

      jmapClient.getThreads = function() {
        return $q.when([{
          getMessages: function() {
            return [{ mailboxIds: ['inbox'], id: 'email1', subject: 'thread subject' }, { mailboxIds: ['inbox'], id: 'email2', subject: 'thread subject' }];
          }
        }]);
      };

      initController('viewThreadController');

      expect(scope.thread.emails).to.shallowDeepEqual([
        { mailboxIds: ['inbox'], id: 'email1', subject: 'thread subject', loaded: true },
        { mailboxIds: ['inbox'], id: 'email2', subject: 'thread subject', loaded: true }
      ]);
    });

    it('should assign thread.subject from the last message', function() {
      jmapClient.getThreads = function() {
        return $q.when([new jmap.Thread({
          getMessages: function() {
            return [
              { mailboxIds: ['inbox'], id: 'email1', subject: 'thread subject1' },
              { mailboxIds: ['inbox'], id: 'email2', subject: 'thread subject2' },
              { mailboxIds: ['inbox'], id: 'email3', subject: 'thread subject3' }
            ];
          }
        }, 'threadId', ['email1', 'email2', 'email3'])]);
      };

      initController('viewThreadController');

      expect(scope.thread.subject).to.equal('thread subject3');
    });

    it('should mark the thread as read once it\'s loaded', function() {
      initController('viewThreadController');

      expect(scope.thread.isUnread).to.equal(false);
      expect(scope.thread.emails).to.shallowDeepEqual([{
        id: 'email1',
        mailboxIds: [threadId],
        subject: 'email subject 1',
        isUnread: false
      }, {
        id: 'email2',
        mailboxIds: [threadId],
        subject: 'email subject 2',
        isUnread: false
      }]);
    });

    it('should set isCollapsed=false for the only one email in a thread', function() {
      mockGetThreadAndMessages([
        { id: 'email1', mailboxIds: [threadId], subject: 'thread subject1'}
      ]);

      initController('viewThreadController');

      expect(_.pluck(scope.thread.emails, 'isCollapsed')).to.deep.equal([false]);
    });

    it('should set isCollapsed=false for unread emails along with the last email', function() {
      mockGetThreadAndMessages([
        {id: 'email1', mailboxIds: [threadId], subject: 'thread subject1', isUnread: false },
        {id: 'email2', mailboxIds: [threadId], subject: 'thread subject2', isUnread: true },
        {id: 'email3', mailboxIds: [threadId], subject: 'thread subject3', isUnread: false }
      ]);

      initController('viewThreadController');

      expect(_.pluck(scope.thread.emails, 'isCollapsed')).to.deep.equal([true, false, false]);
    });

    it('should set isCollapsed=true for all read emails except the last one', function() {
      mockGetThreadAndMessages([
        {id: 'email1', mailboxIds: [threadId], subject: 'thread subject1', isUnread: false },
        {id: 'email2', mailboxIds: [threadId], subject: 'thread subject2', isUnread: false },
        {id: 'email3', mailboxIds: [threadId], subject: 'thread subject3', isUnread: false }
      ]);

      initController('viewThreadController');

      expect(_.pluck(scope.thread.emails, 'isCollapsed')).to.deep.equal([true, true, false]);
    });

    it('should set isCollapsed=false for all emails except, when all emails are unread', function() {
      mockGetThreadAndMessages([
        {id: 'email1', mailboxIds: [threadId], subject: 'thread subject1', isUnread: true },
        {id: 'email2', mailboxIds: [threadId], subject: 'thread subject2', isUnread: true },
        {id: 'email3', mailboxIds: [threadId], subject: 'thread subject3', isUnread: true }
      ]);

      initController('viewThreadController');

      expect(_.pluck(scope.thread.emails, 'isCollapsed')).to.deep.equal([false, false, false]);
    });

    describe('The markAsUnread fn', function() {
      it('should update location to parent state, then mark thread as unread', function() {
        var controller = initController('viewThreadController');

        controller.markAsUnread();

        expect($state.go).to.have.been.calledWith('^');
        scope.$digest();
        expect(scope.thread.isUnread).to.equal(true);
      });
    });

    describe('The moveToTrash fn', function() {
      it('should update location to parent state, then delete the thread', function() {
        inboxJmapItemService.moveToTrash = sinon.spy(function() {
          return $q.when({});
        });
        var controller = initController('viewThreadController');

        controller.moveToTrash();

        expect($state.go).to.have.been.calledWith('^');
        scope.$digest();
        expect(inboxJmapItemService.moveToTrash).to.have.been.called;
      });
    });

    it('should expose move to the controller', function() {
      var thread = { mailboxIds: [] };
      var controller = initController('viewThreadController');
      scope.thread = thread;

      controller.move();

      expect($state.go).to.have.been.calledWith('.move', { item: thread });
    });

  });

  describe('The inboxConfigurationIndexController', function() {

    it('should initiate hasTouchscreen to true if service responds true', function() {
      touchscreenDetectorService.hasTouchscreen = sinon.stub().returns(true);
      initController('inboxConfigurationIndexController');

      expect(scope.hasTouchscreen).to.be.true;
    });

    it('should initiate hasTouchscreen to false if service responds false', function() {
      touchscreenDetectorService.hasTouchscreen = sinon.stub().returns(false);
      initController('inboxConfigurationIndexController');

      expect(scope.hasTouchscreen).to.be.false;
    });
  });

  describe('The inboxConfigurationFolderController', function() {

    it('should set $scope.mailboxes to the qualified list of non-system mailboxes', function() {
      jmapClient.getMailboxes = function() {
        return $q.when([
          { id: 1, name: '1', role: { value: 'inbox' } },
          { id: 2, name: '2', role: {} }
        ]);
      };

      initController('inboxConfigurationFolderController');

      expect(scope.mailboxes).to.deep.equal([{ id: 2, name: '2', qualifiedName: '2', level: 1, role: {} }]);
    });

  });

  describe('The addFolderController', function() {

    it('should set $scope.mailboxes to the qualified list of mailboxes', function() {
      jmapClient.getMailboxes = function() {
        return $q.when([
          { id: 1, name: '1', role: { value: 'inbox' } },
          { id: 2, name: '2', role: {} }
        ]);
      };

      initController('addFolderController');

      expect(scope.mailboxes).to.deep.equal([
        { id: 1, name: '1', qualifiedName: '1', level: 1, role: { value: 'inbox' } },
        { id: 2, name: '2', qualifiedName: '2', level: 1, role: {} }
      ]);
    });

    it('should set $scope.mailbox to an object', function() {
      jmapClient.getMailboxes = function() {
        return $q.when([]);
      };
      $stateParams.mailbox = null;

      initController('addFolderController');

      expect(scope.mailbox).to.deep.equal({});
    });

    it('should get mailbox.name and mailbox.parentId', function() {
      jmapClient.getMailboxes = function() { return $q.when([]); };
      $stateParams.mailbox = { name: 'Name', parentId: 123 };

      initController('addFolderController');

      expect(scope.mailbox).to.deep.equal({ name: 'Name', parentId: 123 });
    });

    describe('The addFolder method', function() {

      it('should go to previous eligible state', function() {
        jmapClient.getMailboxes = function() { return $q.when([]); };
        jmapClient.createMailbox = function() { return $q.when([]); };

        initController('addFolderController');

        scope.mailbox = { name: 'Name' };
        scope.addFolder();
        scope.$digest();

        expect(esnPreviousPage.back).to.have.been.calledWith('unifiedinbox');
      });

      it('should do nothing and reject promise if mailbox.name is not defined', function(done) {
        jmapClient.getMailboxes = function() { return $q.when([]); };
        jmapClient.createMailbox = sinon.spy();

        initController('addFolderController');

        scope.addFolder().then(done.bind(null, 'should reject'), function(err) {
          expect(err.message).to.equal('Please enter a valid folder name');
          expect(esnPreviousPage.back).to.not.have.been.called;
          expect(jmapClient.createMailbox).to.not.have.been.called;

          done();
        });
        scope.$digest();
      });

      it('should display an error notification with a "Reopen" link', function(done) {
        $state.go = sinon.spy();
        jmapClient.getMailboxes = function() { return $q.when([]); };
        inboxMailboxesService.createMailbox = function(success, failure) { return $q.reject(failure); };

        initController('addFolderController');

        scope.mailbox = { name: 'Name', parentId: 123 };
        scope.addFolder().then(done.bind(null, 'should reject'), function(err) {
          err.action();
          expect(err.linkText).to.be.equal('Reopen');
          expect($state.go).to.have.been.calledWith('unifiedinbox.inbox.folders.add', { mailbox: { name: 'Name', parentId: 123 } });

          done();
        });
        scope.$digest();
        expect(esnPreviousPage.back).to.have.been.calledWith('unifiedinbox');
      });

    });

  });

  describe('The editFolderController', function() {
    var chosenMailbox;

    beforeEach(function() {
      jmapClient.getMailboxes = function() {
        return $q.when([
          { id: 'chosenMailbox', name: '1', role: { value: 'inbox' } },
          { id: 2, name: '2', role: {} }
        ]);
      };

      initController('editFolderController');

      chosenMailbox = _.find(scope.mailboxes, { id: $stateParams.mailbox });
    });

    it('should set $scope.mailboxes to the qualified list of mailboxes', function() {
      expect(scope.mailboxes).to.deep.equal([
        { id: 'chosenMailbox', name: '1', qualifiedName: '1', level: 1, role: { value: 'inbox' } },
        { id: 2, name: '2', qualifiedName: '2', level: 1, role: {} }
      ]);
    });

    it('should set $scope.mailbox to the found mailbox', function() {
      expect(scope.mailbox).to.deep.equal(chosenMailbox);
    });

    it('should clone $scope.mailbox from the matched mailbox of $scope.mailboxes', function() {
      expect(scope.mailbox).to.not.equal(chosenMailbox);
    });

    describe('The editFolder method', function() {

      it('should support the adaptive user interface concept: it goes to previous state if updateMailbox is resolved', function() {
        jmapClient.getMailboxes = function() { return $q.when([]); };
        jmapClient.updateMailbox = function() { return $q.when([]); };

        initController('editFolderController');

        scope.mailbox = { name: 'Name' };
        scope.editFolder();
        scope.$digest();

        expect(esnPreviousPage.back).to.have.been.calledWith('unifiedinbox');
      });

      it('should support the adaptive user interface concept: it goes to previous state if updateMailbox is rejected', function() {
        jmapClient.getMailboxes = function() { return $q.when([]); };
        jmapClient.updateMailbox = function() { return $q.reject([]); };

        initController('editFolderController');

        scope.mailbox = { name: 'Name' };
        scope.editFolder();
        scope.$digest();

        expect(esnPreviousPage.back).to.have.been.calledWith('unifiedinbox');
      });

      it('should do nothing and reject promise if mailbox.name is not defined', function(done) {
        jmapClient.getMailboxes = function() { return $q.when([]); };
        jmapClient.updateMailbox = sinon.spy();

        initController('editFolderController');

        scope.mailbox = {};
        scope.editFolder().then(done.bind(null, 'should reject'), function(err) {
          expect(err.message).to.equal('Please enter a valid folder name');
          expect(esnPreviousPage.back).to.not.have.been.called;
          expect(jmapClient.updateMailbox).to.not.have.been.called;
          done();
        });
        scope.$digest();
      });

    });

  });

  describe('The inboxDeleteFolderController', function() {

    function newMailbox(id, parentId) {
      return new jmap.Mailbox(null, id, id, { parentId: parentId });
    }

    it('should initialize $scope.message containing to-be-deleted mailboxes', function() {
      inboxMailboxesCache.push(newMailbox('1'));
      inboxMailboxesCache.push(newMailbox('2', '1'));
      inboxMailboxesCache.push(newMailbox('3', '2'));
      inboxMailboxesCache.push(newMailbox('4', '2'));
      inboxMailboxesCache.push(newMailbox('5', '2'));
      jmapClient.setMailboxes = sinon.spy(function() { return $q.when(new jmap.SetResponse()); });
      $stateParams.mailbox = '1';

      initController('inboxDeleteFolderController');
      scope.$digest();

      expect(scope.message).to.equal('You are about to remove folder 1 and its descendants including 2, 3, 4 and 5');
    });

    it('should initialize $scope.message with "and x more" when more than 4 mailbox descendants are going to be deleted', function() {
      inboxMailboxesCache.push(newMailbox('1'));
      inboxMailboxesCache.push(newMailbox('2', '1'));
      inboxMailboxesCache.push(newMailbox('3', '2'));
      inboxMailboxesCache.push(newMailbox('4', '2'));
      inboxMailboxesCache.push(newMailbox('5', '2'));
      inboxMailboxesCache.push(newMailbox('6', '2'));
      jmapClient.setMailboxes = sinon.spy(function() { return $q.when(new jmap.SetResponse()); });
      $stateParams.mailbox = '1';

      initController('inboxDeleteFolderController');
      scope.$digest();

      expect(scope.message).to.equal('You are about to remove folder 1 and its descendants including 2, 3, 4 and 2 more');
    });

    it('should initialize $scope.message properly when the mailbox has no descendant', function() {
      inboxMailboxesCache.push(newMailbox('1'));
      jmapClient.setMailboxes = sinon.spy(function() { return $q.when(new jmap.SetResponse()); });
      $stateParams.mailbox = '1';

      initController('inboxDeleteFolderController');
      scope.$digest();

      expect(scope.message).to.equal('You are about to remove folder 1');
    });

    describe('The deleteFolder method', function() {

      it('should call client.setMailboxes with an array of mailbox descendant IDs as the "destroy" option', function() {
        inboxMailboxesCache.push(newMailbox('1'));
        inboxMailboxesCache.push(newMailbox('2', '1'));
        inboxMailboxesCache.push(newMailbox('3', '2'));
        jmapClient.setMailboxes = sinon.spy(function() { return $q.when(new jmap.SetResponse()); });
        $stateParams.mailbox = '1';

        var ctrl = initController('inboxDeleteFolderController');

        ctrl.deleteFolder();
        scope.$digest();

        expect(jmapClient.setMailboxes).to.have.been.calledWith({ destroy: ['3', '2', '1'] });
      });

      it('should support the adaptive user interface concept: it goes to unifiedinbox if destroyMailbox is resolved', function() {
        inboxMailboxesCache.push(newMailbox('3'));
        jmapClient.setMailboxes = sinon.spy(function() { return $q.when(new jmap.SetResponse()); });
        $stateParams.mailbox = '3';

        var ctrl = initController('inboxDeleteFolderController');

        ctrl.deleteFolder();
        scope.$digest();

        expect($state.go).to.have.been.calledWith('unifiedinbox');
      });

      it('should support the adaptive user interface concept: it goes to unifiedinbox if destroyMailbox is rejected', function() {
        inboxMailboxesCache.push(newMailbox('3'));
        jmapClient.setMailboxes = sinon.spy(function() { return $q.reject(); });
        $stateParams.mailbox = '3';

        var ctrl = initController('inboxDeleteFolderController');

        ctrl.deleteFolder();
        scope.$digest();

        expect($state.go).to.have.been.calledWith('unifiedinbox');
      });

    });

  });

  describe('The inboxConfigurationVacationController', function() {
    var vacation, ctrl;

    beforeEach(function() {
      vacation = ctrl = {};

      jmapClient.getVacationResponse = sinon.spy(function() {
        return $q.when(vacation);
      });
    });

    it('should listen on vacation status update so as to update vacation.isEnabled correspondingly', function() {
      vacation.isEnabled = true;
      initController('inboxConfigurationVacationController');

      expect(jmapClient.getVacationResponse).to.have.been.calledOnce;
      scope.$broadcast(INBOX_EVENTS.VACATION_STATUS);

      expect(jmapClient.getVacationResponse).to.have.been.calledTwice;
      expect(scope.vacation.isEnabled).to.equal(vacation.isEnabled);
    });

    it('should use Vacation instance from state parameters if defined', function() {
      $stateParams.vacation = { a: 'b' };

      initController('inboxConfigurationVacationController');

      expect(scope.vacation).to.deep.equal({ a: 'b' });
    });

    it('should init to a default vacation textBody if none has been specified and vacation disabled', function(done) {
      vacation = {
        isEnabled: false,
        textBody: null
      };
      scope.defaultTextBody = 'defaultTextBody';

      initController('inboxConfigurationVacationController');
      jmapClient.getVacationResponse().then(function() {
        expect(scope.vacation.textBody).to.equal(scope.defaultTextBody);

        done();
      });
      scope.$digest();
    });

    it('should init to an empty textBody if none has been specified and vacation enabled', function(done) {
      vacation = {
        isEnabled: true,
        textBody: ''
      };

      initController('inboxConfigurationVacationController');
      jmapClient.getVacationResponse().then(function() {
        expect(scope.vacation.textBody).to.equal('');

        done();
      });
      scope.$digest();
    });

    it('should init to the existing textBody if set and vacation enabled', function(done) {
      vacation = {
        isEnabled: true,
        textBody: 'existing textBody'
      };

      initController('inboxConfigurationVacationController');
      jmapClient.getVacationResponse().then(function() {
        expect(scope.vacation.textBody).to.equal('existing textBody');

        done();
      });
      scope.$digest();
    });

    it('should init to the existing textBody if set and vacation disabled', function(done) {
      vacation = {
        isEnabled: false,
        textBody: 'existing textBody'
      };

      initController('inboxConfigurationVacationController');
      jmapClient.getVacationResponse().then(function() {
        expect(scope.vacation.textBody).to.equal('existing textBody');

        done();
      });
      scope.$digest();
    });

    describe('the toDateIsInvalid function', function() {
      it('should return true if vacation.fromDate > vacation.toDate', function() {
        vacation = {
          fromDate: new Date(2016, 9, 23),
          toDate: new Date(2016, 9, 22)
        };
        ctrl = initController('inboxConfigurationVacationController');

        expect(ctrl.toDateIsInvalid()).to.be.true;
      });

      it('should return undefined if vacation.toDate is undefined', function() {
        vacation = {
          fromDate: new Date(2016, 9, 23),
          toDate: undefined
        };
        ctrl = initController('inboxConfigurationVacationController');

        expect(ctrl.toDateIsInvalid()).to.be.undefined;
      });

      it('should return undefined if vacation.toDate is null', function() {
        vacation = {
          fromDate: new Date(2016, 9, 23),
          toDate: null
        };
        ctrl = initController('inboxConfigurationVacationController');

        expect(ctrl.toDateIsInvalid()).to.be.undefined;
      });

      it('should return false if vacation.fromDate < vacation.toDate', function() {
        vacation = {
          fromDate: new Date(2016, 9, 22),
          toDate: new Date(2016, 9, 23)
        };
        ctrl = initController('inboxConfigurationVacationController');

        expect(ctrl.toDateIsInvalid()).to.be.false;
      });

      it('should return false if vacation.fromDate = vacation.toDate', function() {
        vacation = {
          fromDate: new Date(2016, 9, 22),
          toDate: new Date(2016, 9, 22)
        };
        ctrl = initController('inboxConfigurationVacationController');

        expect(ctrl.toDateIsInvalid()).to.be.false;
      });

      it('should return false if vacation.hasToDate is false', function() {
        vacation = {
          fromDate: new Date(2016, 9, 22),
          toDate: new Date(2016, 9, 20)
        };
        ctrl = initController('inboxConfigurationVacationController');
        scope.vacation.hasToDate = false;

        expect(ctrl.toDateIsInvalid()).to.be.false;
      });
    });

    describe('the enableVacation function', function() {
      it('should set vacation.isEnabled attribute', function() {
        ctrl = initController('inboxConfigurationVacationController');
        ctrl.enableVacation(true);

        expect(scope.vacation.isEnabled).to.be.true;
        ctrl.enableVacation(false);

        expect(scope.vacation.isEnabled).to.be.false;
      });
    });

    describe('the updateVacation function', function() {
      beforeEach(function() {
        jmapClient.setVacationResponse = sinon.spy(function() {
          return $q.when();
        });
      });

      it('should not create vacation if fromDate is not set', function(done) {
        vacation = {
          isEnabled: true
        };
        ctrl = initController('inboxConfigurationVacationController');
        scope.vacation.fromDate = null;
        ctrl.updateVacation().then(done.bind(null, 'should reject'), function(err) {
          expect(err.message).to.equal('Please enter a valid start date');
          expect(esnPreviousPage.back).to.not.have.been.called;
          expect(jmapClient.setVacationResponse).to.not.have.been.called;

          done();
        });
        scope.$digest();
      });

      it('should not create vacation if toDate < fromDate', function(done) {
        vacation = {
          isEnabled: true,
          fromDate: new Date(2016, 9, 22),
          toDate: new Date(2016, 9, 21)
        };
        ctrl = initController('inboxConfigurationVacationController');
        ctrl.updateVacation().then(done.bind(null, 'should reject'), function(err) {
          expect(err.message).to.equal('End date must be greater than start date');
          expect(esnPreviousPage.back).to.not.have.been.called;
          expect(jmapClient.setVacationResponse).to.not.have.been.called;

          done();
        });
        scope.$digest();
      });

      it('should create vacation if it passes the logic verification', function() {
        vacation = {
          isEnabled: true,
          fromDate: new Date(2016, 9, 22),
          toDate: new Date(2016, 9, 24)
        };
        ctrl = initController('inboxConfigurationVacationController');
        ctrl.updateVacation();
        scope.$digest();

        expect(esnPreviousPage.back).to.have.been.calledWith('unifiedinbox');
        expect(jmapClient.setVacationResponse).to.have.been.calledWith();
        expect(notificationFactory.weakSuccess).to.have.been.calledWith('', 'Modification of vacation settings succeeded');
      });

      it('should unset toDate while creating vacation message if hasToDate is false', function() {
        vacation = {
          isEnabled: true,
          fromDate: new Date(2016, 9, 22),
          toDate: new Date(2016, 9, 24)
        };
        ctrl = initController('inboxConfigurationVacationController');
        scope.vacation.hasToDate = false;
        ctrl.updateVacation();
        scope.$digest();

        expect(esnPreviousPage.back).to.have.been.calledWith('unifiedinbox');
        expect(scope.vacation.toDate).to.be.null;
        expect(jmapClient.setVacationResponse).to.have.been.calledWith();
      });

      it('should $broadcast the vacation.isEnabled attribute if the corresponding vacation is created successfully', function(done) {
        vacation = {
          isEnabled: true,
          fromDate: new Date(2016, 9, 22),
          toDate: new Date(2016, 9, 24)
        };
        ctrl = initController('inboxConfigurationVacationController');
        scope.$on(INBOX_EVENTS.VACATION_STATUS, done.bind(this, null));
        ctrl.updateVacation();
        scope.$digest();
      });

      it('should not $broadcast the vacation.isEnabled attribute if the corresponding vacation is not created', function() {
        var listener = sinon.spy();

        vacation = {
          isEnabled: true,
          fromDate: new Date(2016, 9, 22),
          toDate: new Date(2016, 9, 24)
        };
        jmapClient.setVacationResponse = sinon.spy(function() {
          return $q.reject();
        });

        ctrl = initController('inboxConfigurationVacationController');
        scope.$on(INBOX_EVENTS.VACATION_STATUS, listener);
        ctrl.updateVacation();
        scope.$digest();

        expect(jmapClient.setVacationResponse).to.have.been.calledWith();
        expect(listener).to.not.have.been.called;
        expect(notificationFactory.weakError).to.have.been.calledWith('Error', 'Modification of vacation settings failed');
      });

      it('should set vacation.loadedSuccessfully to false when an error occurs', function(done) {
        jmapClient.setVacationResponse = sinon.spy(function() {
          return $q.reject();
        });

        initController('inboxConfigurationVacationController')
          .updateVacation()
          .then(done.bind(null, 'should reject'), function() {
            expect(scope.vacation.loadedSuccessfully).to.be.false;

            done();
          });
        scope.$digest();
      });
    });

    describe('the initialization block', function() {
      it('should initialize scope.vacation', function() {
        initController('inboxConfigurationVacationController');

        expect(jmapClient.getVacationResponse).to.have.been.calledWith();
        expect(scope.vacation).to.deep.equal(vacation);
      });

      it('should set vacation.fromDate from the object returned by getVacationResponse()', function() {
        vacation.fromDate = new Date(2016, 9, 22);
        ctrl = initController('inboxConfigurationVacationController');

        expect(moment.isMoment(scope.vacation.fromDate)).to.be.true;
        expect(scope.vacation.fromDate.isSame(vacation.fromDate)).to.be.true;
        expect(ctrl.momentTimes.fromDate.fixed).to.be.true;
      });

      it('should set vacation.fromDate to today if the object returned by getVacationResponse() does not have a fromDate attribute', function() {
        var expectedDate = moment().set({
          hour: 0,
          minute: 0,
          second: 0
        });

        ctrl = initController('inboxConfigurationVacationController');

        expect(moment.isMoment(scope.vacation.fromDate)).to.be.true;
        expect(scope.vacation.fromDate.isSame(expectedDate, 'second')).to.be.true;
        expect(ctrl.momentTimes.fromDate.fixed).to.be.false;
      });

      it('should set vacation.toDate to true if the object returned by getVacationResponse() has a toDate attribute', function() {
        vacation.toDate = new Date(2016, 9, 22);
        ctrl = initController('inboxConfigurationVacationController');

        expect(scope.vacation.hasToDate).to.be.true;
        expect(moment.isMoment(scope.vacation.toDate)).to.be.true;
        expect(scope.vacation.toDate.isSame(vacation.toDate)).to.be.true;
        expect(ctrl.momentTimes.toDate.fixed).to.be.true;
      });

      it('should set vacation.loadedSuccessfully to true when getVacationResponse is resolved', function() {
        ctrl = initController('inboxConfigurationVacationController');

        expect(scope.vacation.loadedSuccessfully).to.be.true;
      });
    });

    describe('the updateDateAndTime function', function() {
      it('should do nothing if corresponding date is falsy', function() {
        ctrl = initController('inboxConfigurationVacationController');
        ctrl.updateDateAndTime('toDate');

        expect(scope.vacation.toDate).to.be.undefined;
      });

      it('should moment the given date', function() {
        vacation.fromDate = new Date(2016, 9, 22);
        ctrl = initController('inboxConfigurationVacationController');
        ctrl.updateDateAndTime('fromDate');

        expect(moment.isMoment(scope.vacation.fromDate)).to.be.true;
        expect(scope.vacation.fromDate.isSame(moment(new Date(2016, 9, 22)))).to.be.true;
      });

      it('should set time to default if it is not fixed', function() {
        vacation.toDate = new Date(2016, 9, 22);
        ctrl = initController('inboxConfigurationVacationController');
        ctrl.momentTimes.toDate.fixed = false;
        ctrl.updateDateAndTime('toDate');

        expect(moment.isMoment(scope.vacation.toDate)).to.be.true;
        expect(scope.vacation.toDate.isSame(new Date(2016, 9, 22, 23, 59, 59))).to.be.true;
      });
    });

    describe('the fixTime function', function() {
      it('should fix the given time', function() {
        ctrl = initController('inboxConfigurationVacationController');

        expect(ctrl.momentTimes.toDate.fixed).to.be.false;
        ctrl.fixTime('toDate');

        expect(ctrl.momentTimes.toDate.fixed).to.be.true;
      });
    });
  });

  describe('The recipientsFullscreenEditFormController', function() {

    beforeEach(function() {
      $state.go = sinon.spy();
      $stateParams.recipientsType = 'to';
      $stateParams.composition = {
        email: {
          to: 'to email'
        }
      };
    });

    it('should go to unifiedinbox.compose if $stateParams.recipientsType is not defined', function() {
      $stateParams.recipientsType = undefined;

      initController('recipientsFullscreenEditFormController');

      expect($state.go).to.have.been.calledWith('unifiedinbox.compose');
    });

    it('should go to unifiedinbox.compose if $stateParams.composition is not defined', function() {
      $stateParams.composition = undefined;

      initController('recipientsFullscreenEditFormController');

      expect($state.go).to.have.been.calledWith('unifiedinbox.compose');
    });

    it('should go to unifiedinbox.compose if $stateParams.composition.email is not defined', function() {
      $stateParams.composition = {};

      initController('recipientsFullscreenEditFormController');

      expect($state.go).to.have.been.calledWith('unifiedinbox.compose');
    });

    it('should expose $stateParams.recipientsType and $stateParams.composition in the scope', function() {
      initController('recipientsFullscreenEditFormController');

      expect(scope.recipients).to.equal('to email');
      expect(scope.recipientsType).to.equal('to');
    });

    it('should go to parent with stateParams.composition when backToComposition is called', function() {
      initController('recipientsFullscreenEditFormController');

      scope.backToComposition();

      expect($state.go).to.have.been.calledWith('^', { composition: $stateParams.composition }, { location: 'replace' });
    });

    it('should go to the selected recipientsType when goToRecipientsType is called', function() {
      initController('recipientsFullscreenEditFormController');

      scope.goToRecipientsType('recipientsType');

      expect($state.go).to.have.been.calledWith('.', { recipientsType: 'recipientsType', composition: $stateParams.composition }, { location: 'replace' });
    });
  });

  describe('The attachmentController', function() {

    describe('The download function', function() {

      it('should notify if the attachment cannot be downloaded', function() {
        initController('attachmentController').download({
          getSignedDownloadUrl: function() {
            return $q.reject();
          }
        });

        $rootScope.$digest();
        expect(notificationFactory.weakError).to.have.been.calledWith();
      });

      it('should navigate to signed URL once it is known', function() {
        initController('attachmentController').download({
          getSignedDownloadUrl: function() {
            return $q.when('signedUrl');
          }
        });
        $rootScope.$digest();

        expect(navigateTo).to.have.been.calledWith('signedUrl');
      });

    });

  });

  describe('The inboxSidebarEmailController', function() {

    var inboxSpecialMailboxes;
    var session;

    beforeEach(inject(function(_inboxSpecialMailboxes_, _session_) {
      inboxSpecialMailboxes = _inboxSpecialMailboxes_;
      session = _session_;

      inboxMailboxesService.assignMailboxesList = sinon.spy(function() { return $q.when(); });

    }));
    it('should call the inboxMailboxesService.assignMailboxesList function', function() {
      initController('inboxSidebarEmailController');

      expect(inboxMailboxesService.assignMailboxesList).to.have.been.calledWith(scope);
    });

    it('should assign specialMailboxes from inboxSpecialMailboxes service', function() {
      var specialMailboxes = [{ id: 'all' }, { id: 'unread' }];

      inboxSpecialMailboxes.list = sinon.stub().returns(specialMailboxes);

      initController('inboxSidebarEmailController');

      expect(inboxSpecialMailboxes.list).to.have.been.calledWith();
      expect(scope.specialMailboxes).to.deep.equal(specialMailboxes);
    });

    it('should set session.user.preferredEmail to the correct value', function() {
      session.user.preferredEmail = 'admin@open-paas.org';

      initController('inboxSidebarEmailController');

      expect(session.user.preferredEmail).to.equal('admin@open-paas.org');
    });

  });

  describe('The inboxSidebarTwitterController controller', function() {

    var session;

    beforeEach(inject(function(_session_) {
      session = _session_;
    }));

    it('should assign twitterAccounts to $scope if the feature is enabled', function() {
      var twitterAccounts = [{ id: 1 }, { id: 2 }];

      config['linagora.esn.unifiedinbox.twitter.tweets'] = true;
      session.getProviderAccounts = function() {
        return twitterAccounts;
      };

      initController('inboxSidebarTwitterController');

      expect(scope.twitterAccounts).to.deep.equal(twitterAccounts);
    });

    it('should not assign twitterAccounts to $scope if the feature is disabled', function() {
      var twitterAccounts = [{ id: 1 }, { id: 2 }];

      config['linagora.esn.unifiedinbox.twitter.tweets'] = false;
      session.getProviderAccounts = function() {
        return twitterAccounts;
      };

      initController('inboxSidebarTwitterController');

      expect(scope.twitterAccounts).to.deep.equal([]);
    });

  });

  describe('The inboxListSubheaderController controller', function() {

    var controller, inboxJmapItemService, item1, item2;

    function initController() {
      controller = $controller('inboxListSubheaderController', {
        inboxJmapItemService: inboxJmapItemService = {
          markAsUnread: sinon.spy(),
          markAsRead: sinon.spy(),
          unmarkAsFlagged: sinon.spy(),
          markAsFlagged: sinon.spy(),
          moveMultipleItems: sinon.spy(),
          moveToTrash: sinon.spy()
        }
      });
      $rootScope.$digest();
    }

    beforeEach(function() {
      item1 = { id: 1 };
      item2 = { id: 2 };

      initController();
    });

    it('should expose some utility functions from inboxSelectionService', function() {
      ['isSelecting', 'getSelectedItems', 'unselectAllItems'].forEach(function(method) {
        expect(controller[method]).to.be.a('Function');
      });
    });

    describe('The markAsUnread function', function() {

      it('should call inboxJmapItemService.markAsUnread for selected items', function() {
        inboxSelectionService.toggleItemSelection(item1);
        inboxSelectionService.toggleItemSelection(item2);
        controller.markAsUnread();

        expect(inboxJmapItemService.markAsUnread).to.have.been.calledWith([item1, item2]);
      });

      it('should unselect all items', function() {
        inboxSelectionService.toggleItemSelection(item1);
        inboxSelectionService.toggleItemSelection(item2);
        controller.markAsUnread();

        expect(item1.selected).to.equal(false);
        expect(item2.selected).to.equal(false);
      });

    });

    describe('The markAsRead function', function() {

      it('should call inboxJmapItemService.markAsRead for all selected items', function() {
        inboxSelectionService.toggleItemSelection(item1);
        inboxSelectionService.toggleItemSelection(item2);
        controller.markAsRead();

        expect(inboxJmapItemService.markAsRead).to.have.been.calledWith([item1, item2]);
      });

      it('should unselect all items', function() {
        inboxSelectionService.toggleItemSelection(item1);
        inboxSelectionService.toggleItemSelection(item2);
        controller.markAsRead();

        expect(item1.selected).to.equal(false);
        expect(item2.selected).to.equal(false);
      });

    });

    describe('The markAsFlagged function', function() {

      it('should call inboxJmapItemService.markAsFlagged for all selected items', function() {
        inboxSelectionService.toggleItemSelection(item1);
        inboxSelectionService.toggleItemSelection(item2);
        controller.markAsFlagged();

        expect(inboxJmapItemService.markAsFlagged).to.have.been.calledWith([item1, item2]);
      });

      it('should unselect all items', function() {
        inboxSelectionService.toggleItemSelection(item1);
        inboxSelectionService.toggleItemSelection(item2);
        controller.markAsFlagged();

        expect(item1.selected).to.equal(false);
        expect(item2.selected).to.equal(false);
      });

    });

    describe('The unmarkAsFlagged function', function() {

      it('should call inboxJmapItemService.unmarkAsFlagged for all selected items', function() {
        inboxSelectionService.toggleItemSelection(item1);
        inboxSelectionService.toggleItemSelection(item2);
        controller.unmarkAsFlagged();

        expect(inboxJmapItemService.unmarkAsFlagged).to.have.been.calledWith([item1, item2]);
      });

      it('should unselect all items', function() {
        inboxSelectionService.toggleItemSelection(item1);
        inboxSelectionService.toggleItemSelection(item2);
        controller.unmarkAsFlagged();

        expect(item1.selected).to.equal(false);
        expect(item2.selected).to.equal(false);
      });

    });

    describe('The moveToTrash function', function() {

      it('should call inboxJmapItemService.moveToTrash for all selected items', function() {
        inboxSelectionService.toggleItemSelection(item1);
        inboxSelectionService.toggleItemSelection(item2);
        controller.moveToTrash();

        expect(inboxJmapItemService.moveToTrash).to.have.been.calledWith([item1, item2]);
      });

      it('should unselect all items', function() {
        inboxSelectionService.toggleItemSelection(item1);
        inboxSelectionService.toggleItemSelection(item2);
        controller.moveToTrash();

        expect(item1.selected).to.equal(false);
        expect(item2.selected).to.equal(false);
      });

    });

    describe('The move function', function() {

      it('should call $state.go', function() {
        controller.move();

        expect($state.go).to.have.been.calledWith('.move', { selection: true });
      });

    });

    it('should default contextSupportsAttachments to true if there\'s no type selected', function() {
      expect(controller.contextSupportsAttachments).to.equal(true);
    });

    it('should default contextSupportsAttachments to true if there\'s no plugin for the selected type', function() {
      $stateParams.type = 'myType';

      initController();

      expect(controller.contextSupportsAttachments).to.equal(true);
    });

    it('should ask plugin for resolved context name and contextSupportsAttachments', function() {
      $stateParams.type = 'myType';
      inboxPlugins.add({
        type: 'myType',
        contextSupportsAttachments: function() {
          return $q.when(false);
        },
        resolveContextName: function() {
          return $q.when('-Context-');
        }
      });

      initController();

      expect(controller.contextSupportsAttachments).to.equal(false);
      expect(controller.resolvedContextName).to.equal('-Context-');
    });

  });

});
