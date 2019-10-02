(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .controller('ContactConfigDomainAddressbookController', ContactConfigDomainAddressbookController);

  function ContactConfigDomainAddressbookController(
    $stateParams,
    $q,
    contactAddressbookService,
    DEFAULT_DOMAIN_ADDRESSBOOK_NAME,
    CONTACT_ADDRESSBOOK_STATES
  ) {
    var self = this;
    var LOADING_STATE = {
      loading: 'loading',
      success: 'success',
      error: 'error'
    };
    var initialDomainAddressbookState;
    var domainAddressbook;

    self.$onInit = $onInit;
    self.reloadDomainAddressbook = reloadDomainAddressbook;

    function $onInit() {
      _loadDomainAddressbook();
    }

    function reloadDomainAddressbook() {
      _loadDomainAddressbook();
    }

    function _loadDomainAddressbook() {
      self.state = LOADING_STATE.loading;

      contactAddressbookService.getAddressbookByBookName(DEFAULT_DOMAIN_ADDRESSBOOK_NAME, $stateParams.domainId)
        .then(function(domainAB) {
          domainAddressbook = domainAB;
          self.state = LOADING_STATE.success;
        })
        .catch(function(error) {
          if (error.status === 404) { // domain address book is not exist. It will be created while domain admin do the enabling
            self.state = LOADING_STATE.success;
          } else {
            self.state = LOADING_STATE.error;
          }
        })
        .finally(function() {
          if (self.state === LOADING_STATE.success) {
            self.isDomainAddressbookEnabled = !!domainAddressbook && domainAddressbook.state !== CONTACT_ADDRESSBOOK_STATES.disabled;
            initialDomainAddressbookState = self.isDomainAddressbookEnabled;

            self.adminModulesDisplayerController.registerPostSaveHandler(updateDomainAddressbookConfigurations);
          }
        });
    }

    function updateDomainAddressbookConfigurations() {
      var doUpdate;

      if (domainAddressbook && self.isDomainAddressbookEnabled !== initialDomainAddressbookState) {
        domainAddressbook.state = self.isDomainAddressbookEnabled ? CONTACT_ADDRESSBOOK_STATES.enabled : CONTACT_ADDRESSBOOK_STATES.disabled;

        doUpdate = contactAddressbookService.updateAddressbook(domainAddressbook);
      } else if (!domainAddressbook) {
        doUpdate = contactAddressbookService.createGroupAddressbook({
          id: DEFAULT_DOMAIN_ADDRESSBOOK_NAME,
          name: 'Domain address book'
        }, $stateParams.domainId);
      }

      return doUpdate && doUpdate
        .then(function(res) {
          if (!domainAddressbook) {
            domainAddressbook = res;
          }

          initialDomainAddressbookState = self.isDomainAddressbookEnabled;
        })
        .catch(function(error) {
          self.isDomainAddressbookEnabled = initialDomainAddressbookState;
          if (domainAddressbook) {
            domainAddressbook.state = initialDomainAddressbookState ? CONTACT_ADDRESSBOOK_STATES.enabled : CONTACT_ADDRESSBOOK_STATES.disabled;
          }

          return $q.reject(error);
        });
    }
  }
})(angular);
