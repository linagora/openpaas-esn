'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The contactAddressbookACLHelper service', function() {
  var session, contactAddressbookACLHelper;
  var DEFAULT_ADDRESSBOOK_NAME, CONTACT_ADDRESSBOOK_AUTHENTICATED_PRINCIPAL;
  var userId;

  beforeEach(function() {
    module('linagora.esn.contact');
    userId = '1234';

    inject(function(
      _session_,
      _contactAddressbookACLHelper_,
      _DEFAULT_ADDRESSBOOK_NAME_,
      _CONTACT_ADDRESSBOOK_AUTHENTICATED_PRINCIPAL_
    ) {
      session = _session_;
      contactAddressbookACLHelper = _contactAddressbookACLHelper_;
      DEFAULT_ADDRESSBOOK_NAME = _DEFAULT_ADDRESSBOOK_NAME_;
      CONTACT_ADDRESSBOOK_AUTHENTICATED_PRINCIPAL = _CONTACT_ADDRESSBOOK_AUTHENTICATED_PRINCIPAL_;
    });
  });

  describe('The canEditAddressbook function', function() {
    it('should return false if user has no privilege', function() {
      var addressbookShell = {};

      expect(contactAddressbookACLHelper.canEditAddressbook(addressbookShell, userId)).to.equal(false);
    });

    it('should return false if user has only "{DAV:}read" privilege', function() {
      var addressbookShell = {
        acl: [{
          principal: 'principals/users/' + userId,
          privilege: '{DAV:}read'
        }]
      };

      expect(contactAddressbookACLHelper.canEditAddressbook(addressbookShell, userId)).to.equal(false);
    });

    it('should return false if address book is a default address book', function() {
      var addressbookShell = {
        bookName: DEFAULT_ADDRESSBOOK_NAME
      };

      expect(contactAddressbookACLHelper.canEditAddressbook(addressbookShell, userId)).to.equal(false);
    });

    it('should return true if user has "{DAV:}write" privilege', function() {
      var addressbookShell = {
        acl: [{
          principal: 'principals/users/' + userId,
          privilege: '{DAV:}write'
        }]
      };

      expect(contactAddressbookACLHelper.canEditAddressbook(addressbookShell, userId)).to.equal(true);
    });

    it('should return true if user has "{DAV:}write-properties" privilege', function() {
      var addressbookShell = {
        acl: [{
          principal: 'principals/users/' + userId,
          privilege: '{DAV:}write-properties'
        }]
      };

      expect(contactAddressbookACLHelper.canEditAddressbook(addressbookShell, userId)).to.equal(true);
    });

    it('should return true if user has "{DAV:}all" privilege', function() {
      var addressbookShell = {
        acl: [{
          principal: 'principals/users/' + userId,
          privilege: '{DAV:}all'
        }]
      };

      expect(contactAddressbookACLHelper.canEditAddressbook(addressbookShell, userId)).to.equal(true);
    });

    it('should check the logged in user if there is no userId is given', function() {
      session.user = {
        _id: userId
      };
      var addressbookShell = {
        acl: [{
          principal: 'principals/users/' + userId,
          privilege: '{DAV:}all'
        }]
      };

      expect(contactAddressbookACLHelper.canEditAddressbook(addressbookShell)).to.equal(true);
    });

    it('should return true if user belongs to a group which has "{DAV:}write" privilege', function() {
      var domainId = 'domainId';
      var addressbookShell = {
        acl: [{
          principal: 'principals/domains/' + domainId,
          privilege: '{DAV:}write'
        }],
        group: {
          type: 'domains',
          id: domainId
        }
      };

      expect(contactAddressbookACLHelper.canEditAddressbook(addressbookShell, userId)).to.be.true;
    });
  });

  describe('The canDeleteAddressbook function', function() {
    it('should return false if user has no privilege', function() {
      var addressbookShell = {};

      expect(contactAddressbookACLHelper.canDeleteAddressbook(addressbookShell, userId)).to.equal(false);
    });

    it('should return false if user has only "{DAV:}read" privilege', function() {
      var addressbookShell = {
        acl: [{
          principal: 'principals/users/' + userId,
          privilege: '{DAV:}read'
        }]
      };

      expect(contactAddressbookACLHelper.canDeleteAddressbook(addressbookShell, userId)).to.equal(false);
    });

    it('should return false if address book is a default address book', function() {
      var addressbookShell = {
        bookName: DEFAULT_ADDRESSBOOK_NAME
      };

      expect(contactAddressbookACLHelper.canDeleteAddressbook(addressbookShell, userId)).to.equal(false);
    });

    it('should return true if user has "{DAV:}write" privilege', function() {
      var addressbookShell = {
        acl: [{
          principal: 'principals/users/' + userId,
          privilege: '{DAV:}write'
        }]
      };

      expect(contactAddressbookACLHelper.canDeleteAddressbook(addressbookShell, userId)).to.equal(true);
    });

    it('should return true if user has "{DAV:}all" privilege', function() {
      var addressbookShell = {
        acl: [{
          principal: 'principals/users/' + userId,
          privilege: '{DAV:}all'
        }]
      };

      expect(contactAddressbookACLHelper.canDeleteAddressbook(addressbookShell, userId)).to.equal(true);
    });

    it('should check the logged in user if there is no userId is given', function() {
      session.user = {
        _id: userId
      };
      var addressbookShell = {
        acl: [{
          principal: 'principals/users/' + userId,
          privilege: '{DAV:}all'
        }]
      };

      expect(contactAddressbookACLHelper.canDeleteAddressbook(addressbookShell)).to.equal(true);
    });

    it('should return true if user belongs to a group which has "{DAV:}write" privilege', function() {
      var domainId = 'domainId';
      var addressbookShell = {
        acl: [{
          principal: 'principals/domains/' + domainId,
          privilege: '{DAV:}write'
        }],
        group: {
          type: 'domains',
          id: domainId
        }
      };

      expect(contactAddressbookACLHelper.canDeleteAddressbook(addressbookShell, userId)).to.be.true;
    });
  });

  describe('The canShareAddressbook function', function() {
    it('should return false if user has no privilege', function() {
      var addressbookShell = {};

      expect(contactAddressbookACLHelper.canShareAddressbook(addressbookShell, userId)).to.equal(false);
    });

    it('should return true if user has "{DAV:}share" privilege', function() {
      var addressbookShell = {
        acl: [{
          principal: 'principals/users/' + userId,
          privilege: '{DAV:}share'
        }]
      };

      expect(contactAddressbookACLHelper.canShareAddressbook(addressbookShell, userId)).to.equal(true);
    });

    it('should return true if user has "{DAV:}all" privilege', function() {
      var addressbookShell = {
        acl: [{
          principal: 'principals/users/' + userId,
          privilege: '{DAV:}all'
        }]
      };

      expect(contactAddressbookACLHelper.canShareAddressbook(addressbookShell, userId)).to.equal(true);
    });

    it('should check the logged in user if there is no userId is given', function() {
      session.user = {
        _id: userId
      };
      var addressbookShell = {
        acl: [{
          principal: 'principals/users/' + userId,
          privilege: '{DAV:}all'
        }]
      };

      expect(contactAddressbookACLHelper.canShareAddressbook(addressbookShell)).to.equal(true);
    });

    it('should return true if user belongs to a group which has "{DAV:}share" privilege', function() {
      var domainId = 'domainId';
      var addressbookShell = {
        acl: [{
          principal: 'principals/domains/' + domainId,
          privilege: '{DAV:}share'
        }],
        group: {
          type: 'domains',
          id: domainId
        }
      };

      expect(contactAddressbookACLHelper.canShareAddressbook(addressbookShell, userId)).to.be.true;
    });
  });

  describe('The canCreateContact function', function() {
    describe('Personal address book', function() {
      it('should return false if user has no privilege', function() {
        var addressbookShell = {};

        expect(contactAddressbookACLHelper.canCreateContact(addressbookShell, userId)).to.equal(false);
      });

      it('should return false if user has only "{DAV:}read" privilege', function() {
        var addressbookShell = {
          acl: [{
            principal: 'principals/users/' + userId,
            privilege: '{DAV:}read'
          }]
        };

        expect(contactAddressbookACLHelper.canCreateContact(addressbookShell, userId)).to.equal(false);
      });

      it('should return true if user has "{DAV:}write" privilege', function() {
        var addressbookShell = {
          acl: [{
            principal: 'principals/users/' + userId,
            privilege: '{DAV:}write'
          }]
        };

        expect(contactAddressbookACLHelper.canCreateContact(addressbookShell, userId)).to.equal(true);
      });

      it('should return true if user has "{DAV:}bind" privilege', function() {
        var addressbookShell = {
          acl: [{
            principal: 'principals/users/' + userId,
            privilege: '{DAV:}bind'
          }]
        };

        expect(contactAddressbookACLHelper.canCreateContact(addressbookShell, userId)).to.equal(true);
      });

      it('should return true if user has "{DAV:}all" privilege', function() {
        var addressbookShell = {
          acl: [{
            principal: 'principals/users/' + userId,
            privilege: '{DAV:}all'
          }]
        };

        expect(contactAddressbookACLHelper.canCreateContact(addressbookShell, userId)).to.equal(true);
      });

      it('should check the logged in user if there is no userId is given', function() {
        session.user = {
          _id: userId
        };
        var addressbookShell = {
          acl: [{
            principal: 'principals/users/' + userId,
            privilege: '{DAV:}all'
          }]
        };

        expect(contactAddressbookACLHelper.canCreateContact(addressbookShell)).to.equal(true);
      });

      it('should return true if user belongs to a group which has "{DAV:}bind" privilege', function() {
        var domainId = 'domainId';
        var addressbookShell = {
          acl: [{
            principal: 'principals/domains/' + domainId,
            privilege: '{DAV:}bind'
          }],
          group: {
            type: 'domains',
            id: domainId
          }
        };

        expect(contactAddressbookACLHelper.canCreateContact(addressbookShell, userId)).to.be.true;
      });
    });

    describe('Subscription address book', function() {
      it('should return false if authenticated user has no privilege on source address book', function() {
        var addressbookShell = {
          acl: [{
            principal: 'principals/users/' + userId,
            privilege: '{DAV:}all'
          }],
          isSubscription: true,
          source: {}
        };

        expect(contactAddressbookACLHelper.canCreateContact(addressbookShell, userId)).to.equal(false);
      });

      it('should return false if authenticated user has has only "{DAV:}read" privilege on source address book', function() {
        var addressbookShell = {
          acl: [{
            principal: 'principals/users/' + userId,
            privilege: '{DAV:}all'
          }],
          isSubscription: true,
          source: {
            acl: [{
              principal: CONTACT_ADDRESSBOOK_AUTHENTICATED_PRINCIPAL,
              privilege: '{DAV:}read'
            }]
          }
        };

        expect(contactAddressbookACLHelper.canCreateContact(addressbookShell, userId)).to.equal(false);
      });

      it('should return true if authenticated user has has only "{DAV:}write" privilege on source address book', function() {
        var addressbookShell = {
          isSubscription: true,
          source: {
            acl: [{
              principal: CONTACT_ADDRESSBOOK_AUTHENTICATED_PRINCIPAL,
              privilege: '{DAV:}write'
            }]
          }
        };

        expect(contactAddressbookACLHelper.canCreateContact(addressbookShell, userId)).to.equal(true);
      });

      it('should return true if authenticated user has has only "{DAV:}bind" privilege on source address book', function() {
        var addressbookShell = {
          isSubscription: true,
          source: {
            acl: [{
              principal: CONTACT_ADDRESSBOOK_AUTHENTICATED_PRINCIPAL,
              privilege: '{DAV:}bind'
            }]
          }
        };

        expect(contactAddressbookACLHelper.canCreateContact(addressbookShell, userId)).to.equal(true);
      });

      it('should return true if authenticated user has has only "{DAV:}all" privilege on source address book', function() {
        var addressbookShell = {
          isSubscription: true,
          source: {
            acl: [{
              principal: CONTACT_ADDRESSBOOK_AUTHENTICATED_PRINCIPAL,
              privilege: '{DAV:}all'
            }]
          }
        };

        expect(contactAddressbookACLHelper.canCreateContact(addressbookShell, userId)).to.equal(true);
      });
    });
  });

  describe('The canEditContact function', function() {
    describe('Personal address book', function() {
      it('should return false if user has no privilege', function() {
        var addressbookShell = {};

        expect(contactAddressbookACLHelper.canEditContact(addressbookShell, userId)).to.equal(false);
      });

      it('should return false if user has only "{DAV:}read" privilege', function() {
        var addressbookShell = {
          acl: [{
            principal: 'principals/users/' + userId,
            privilege: '{DAV:}read'
          }]
        };

        expect(contactAddressbookACLHelper.canEditContact(addressbookShell, userId)).to.equal(false);
      });

      it('should return true if user has "{DAV:}write" privilege', function() {
        var addressbookShell = {
          acl: [{
            principal: 'principals/users/' + userId,
            privilege: '{DAV:}write'
          }]
        };

        expect(contactAddressbookACLHelper.canEditContact(addressbookShell, userId)).to.equal(true);
      });

      it('should return true if user has "{DAV:}write-content" privilege', function() {
        var addressbookShell = {
          acl: [{
            principal: 'principals/users/' + userId,
            privilege: '{DAV:}write-content'
          }]
        };

        expect(contactAddressbookACLHelper.canEditContact(addressbookShell, userId)).to.equal(true);
      });

      it('should return true if user has "{DAV:}all" privilege', function() {
        var addressbookShell = {
          acl: [{
            principal: 'principals/users/' + userId,
            privilege: '{DAV:}all'
          }]
        };

        expect(contactAddressbookACLHelper.canEditContact(addressbookShell, userId)).to.equal(true);
      });

      it('should check the logged in user if there is no userId is given', function() {
        session.user = {
          _id: userId
        };
        var addressbookShell = {
          acl: [{
            principal: 'principals/users/' + userId,
            privilege: '{DAV:}all'
          }]
        };

        expect(contactAddressbookACLHelper.canEditContact(addressbookShell)).to.equal(true);
      });

      it('should return true if user belongs to a group which has "{DAV:}write-content" privilege', function() {
        var domainId = 'domainId';
        var addressbookShell = {
          acl: [{
            principal: 'principals/domains/' + domainId,
            privilege: '{DAV:}write-content'
          }],
          group: {
            type: 'domains',
            id: domainId
          }
        };

        expect(contactAddressbookACLHelper.canEditContact(addressbookShell, userId)).to.be.true;
      });
    });

    describe('Subscription address book', function() {
      it('should return false if authenticated user has no privilege on source address book', function() {
        var addressbookShell = {
          acl: [{
            principal: 'principals/users/' + userId,
            privilege: '{DAV:}all'
          }],
          isSubscription: true,
          source: {}
        };

        expect(contactAddressbookACLHelper.canEditContact(addressbookShell, userId)).to.equal(false);
      });

      it('should return false if authenticated user has has only "{DAV:}read" privilege on source address book', function() {
        var addressbookShell = {
          acl: [{
            principal: 'principals/users/' + userId,
            privilege: '{DAV:}all'
          }],
          isSubscription: true,
          source: {
            acl: [{
              principal: CONTACT_ADDRESSBOOK_AUTHENTICATED_PRINCIPAL,
              privilege: '{DAV:}read'
            }]
          }
        };

        expect(contactAddressbookACLHelper.canEditContact(addressbookShell, userId)).to.equal(false);
      });

      it('should return true if authenticated user has has only "{DAV:}write" privilege on source address book', function() {
        var addressbookShell = {
          isSubscription: true,
          source: {
            acl: [{
              principal: CONTACT_ADDRESSBOOK_AUTHENTICATED_PRINCIPAL,
              privilege: '{DAV:}write'
            }]
          }
        };

        expect(contactAddressbookACLHelper.canEditContact(addressbookShell, userId)).to.equal(true);
      });

      it('should return true if authenticated user has has only "{DAV:}write-content" privilege on source address book', function() {
        var addressbookShell = {
          isSubscription: true,
          source: {
            acl: [{
              principal: CONTACT_ADDRESSBOOK_AUTHENTICATED_PRINCIPAL,
              privilege: '{DAV:}write-content'
            }]
          }
        };

        expect(contactAddressbookACLHelper.canEditContact(addressbookShell, userId)).to.equal(true);
      });

      it('should return true if authenticated user has has only "{DAV:}all" privilege on source address book', function() {
        var addressbookShell = {
          isSubscription: true,
          source: {
            acl: [{
              principal: CONTACT_ADDRESSBOOK_AUTHENTICATED_PRINCIPAL,
              privilege: '{DAV:}all'
            }]
          }
        };

        expect(contactAddressbookACLHelper.canEditContact(addressbookShell, userId)).to.equal(true);
      });
    });
  });

  describe('The canCopyContact function', function() {
    it('should always return true', function() {
      expect(contactAddressbookACLHelper.canCopyContact()).to.equal(true);
    });
  });

  describe('The canMoveContact function', function() {
    describe('Personal address book', function() {
      it('should return false if user has no privilege', function() {
        var addressbookShell = {};

        expect(contactAddressbookACLHelper.canMoveContact(addressbookShell, userId)).to.equal(false);
      });

      it('should return false if user has only "{DAV:}read" privilege', function() {
        var addressbookShell = {
          acl: [{
            principal: 'principals/users/' + userId,
            privilege: '{DAV:}read'
          }]
        };

        expect(contactAddressbookACLHelper.canMoveContact(addressbookShell, userId)).to.equal(false);
      });

      it('should return true if user has "{DAV:}write" privilege', function() {
        var addressbookShell = {
          acl: [{
            principal: 'principals/users/' + userId,
            privilege: '{DAV:}write'
          }]
        };

        expect(contactAddressbookACLHelper.canMoveContact(addressbookShell, userId)).to.equal(true);
      });

      it('should return true if user has "{DAV:}unbind" privilege', function() {
        var addressbookShell = {
          acl: [{
            principal: 'principals/users/' + userId,
            privilege: '{DAV:}unbind'
          }]
        };

        expect(contactAddressbookACLHelper.canMoveContact(addressbookShell, userId)).to.equal(true);
      });

      it('should return true if user has "{DAV:}all" privilege', function() {
        var addressbookShell = {
          acl: [{
            principal: 'principals/users/' + userId,
            privilege: '{DAV:}all'
          }]
        };

        expect(contactAddressbookACLHelper.canMoveContact(addressbookShell, userId)).to.equal(true);
      });

      it('should check the logged in user if there is no userId is given', function() {
        session.user = {
          _id: userId
        };
        var addressbookShell = {
          acl: [{
            principal: 'principals/users/' + userId,
            privilege: '{DAV:}all'
          }]
        };

        expect(contactAddressbookACLHelper.canMoveContact(addressbookShell)).to.equal(true);
      });

      it('should return true if user belongs to a group which has "{DAV:}unbind" privilege', function() {
        var domainId = 'domainId';
        var addressbookShell = {
          acl: [{
            principal: 'principals/domains/' + domainId,
            privilege: '{DAV:}unbind'
          }],
          group: {
            type: 'domains',
            id: domainId
          }
        };

        expect(contactAddressbookACLHelper.canMoveContact(addressbookShell, userId)).to.be.true;
      });
    });

    describe('Subscription address book', function() {
      it('should return false if authenticated user has no privilege on source address book', function() {
        var addressbookShell = {
          acl: [{
            principal: 'principals/users/' + userId,
            privilege: '{DAV:}all'
          }],
          isSubscription: true,
          source: {}
        };

        expect(contactAddressbookACLHelper.canMoveContact(addressbookShell, userId)).to.equal(false);
      });

      it('should return false if authenticated user has has only "{DAV:}read" privilege on source address book', function() {
        var addressbookShell = {
          acl: [{
            principal: 'principals/users/' + userId,
            privilege: '{DAV:}all'
          }],
          isSubscription: true,
          source: {
            acl: [{
              principal: CONTACT_ADDRESSBOOK_AUTHENTICATED_PRINCIPAL,
              privilege: '{DAV:}read'
            }]
          }
        };

        expect(contactAddressbookACLHelper.canMoveContact(addressbookShell, userId)).to.equal(false);
      });

      it('should return true if authenticated user has has only "{DAV:}write" privilege on source address book', function() {
        var addressbookShell = {
          isSubscription: true,
          source: {
            acl: [{
              principal: CONTACT_ADDRESSBOOK_AUTHENTICATED_PRINCIPAL,
              privilege: '{DAV:}write'
            }]
          }
        };

        expect(contactAddressbookACLHelper.canMoveContact(addressbookShell, userId)).to.equal(true);
      });

      it('should return true if authenticated user has has only "{DAV:}unbind" privilege on source address book', function() {
        var addressbookShell = {
          isSubscription: true,
          source: {
            acl: [{
              principal: CONTACT_ADDRESSBOOK_AUTHENTICATED_PRINCIPAL,
              privilege: '{DAV:}unbind'
            }]
          }
        };

        expect(contactAddressbookACLHelper.canMoveContact(addressbookShell, userId)).to.equal(true);
      });

      it('should return true if authenticated user has has only "{DAV:}all" privilege on source address book', function() {
        var addressbookShell = {
          isSubscription: true,
          source: {
            acl: [{
              principal: CONTACT_ADDRESSBOOK_AUTHENTICATED_PRINCIPAL,
              privilege: '{DAV:}all'
            }]
          }
        };

        expect(contactAddressbookACLHelper.canMoveContact(addressbookShell, userId)).to.equal(true);
      });
    });
  });

  describe('The canDeleteContact function', function() {
    describe('Personal address book', function() {
      it('should return false if user has no privilege', function() {
        var addressbookShell = {};

        expect(contactAddressbookACLHelper.canDeleteContact(addressbookShell, userId)).to.equal(false);
      });

      it('should return false if user has only "{DAV:}read" privilege', function() {
        var addressbookShell = {
          acl: [{
            principal: 'principals/users/' + userId,
            privilege: '{DAV:}read'
          }]
        };

        expect(contactAddressbookACLHelper.canDeleteContact(addressbookShell, userId)).to.equal(false);
      });

      it('should return true if user has "{DAV:}write" privilege', function() {
        var addressbookShell = {
          acl: [{
            principal: 'principals/users/' + userId,
            privilege: '{DAV:}write'
          }]
        };

        expect(contactAddressbookACLHelper.canDeleteContact(addressbookShell, userId)).to.equal(true);
      });

      it('should return true if user has "{DAV:}unbind" privilege', function() {
        var addressbookShell = {
          acl: [{
            principal: 'principals/users/' + userId,
            privilege: '{DAV:}unbind'
          }]
        };

        expect(contactAddressbookACLHelper.canDeleteContact(addressbookShell, userId)).to.equal(true);
      });

      it('should return true if user has "{DAV:}all" privilege', function() {
        var addressbookShell = {
          acl: [{
            principal: 'principals/users/' + userId,
            privilege: '{DAV:}all'
          }]
        };

        expect(contactAddressbookACLHelper.canDeleteContact(addressbookShell, userId)).to.equal(true);
      });

      it('should check the logged in user if there is no userId is given', function() {
        session.user = {
          _id: userId
        };
        var addressbookShell = {
          acl: [{
            principal: 'principals/users/' + userId,
            privilege: '{DAV:}all'
          }]
        };

        expect(contactAddressbookACLHelper.canDeleteContact(addressbookShell)).to.equal(true);
      });

      it('should return true if user belongs to a group which has "{DAV:}unbind" privilege', function() {
        var domainId = 'domainId';
        var addressbookShell = {
          acl: [{
            principal: 'principals/domains/' + domainId,
            privilege: '{DAV:}unbind'
          }],
          group: {
            type: 'domains',
            id: domainId
          }
        };

        expect(contactAddressbookACLHelper.canDeleteContact(addressbookShell, userId)).to.be.true;
      });
    });

    describe('Subscription address book', function() {
      it('should return false if authenticated user has no privilege on source address book', function() {
        var addressbookShell = {
          acl: [{
            principal: 'principals/users/' + userId,
            privilege: '{DAV:}all'
          }],
          isSubscription: true,
          source: {}
        };

        expect(contactAddressbookACLHelper.canDeleteContact(addressbookShell, userId)).to.equal(false);
      });

      it('should return false if authenticated user has has only "{DAV:}read" privilege on source address book', function() {
        var addressbookShell = {
          acl: [{
            principal: 'principals/users/' + userId,
            privilege: '{DAV:}all'
          }],
          isSubscription: true,
          source: {
            acl: [{
              principal: CONTACT_ADDRESSBOOK_AUTHENTICATED_PRINCIPAL,
              privilege: '{DAV:}read'
            }]
          }
        };

        expect(contactAddressbookACLHelper.canDeleteContact(addressbookShell, userId)).to.equal(false);
      });

      it('should return true if authenticated user has has only "{DAV:}write" privilege on source address book', function() {
        var addressbookShell = {
          isSubscription: true,
          source: {
            acl: [{
              principal: CONTACT_ADDRESSBOOK_AUTHENTICATED_PRINCIPAL,
              privilege: '{DAV:}write'
            }]
          }
        };

        expect(contactAddressbookACLHelper.canDeleteContact(addressbookShell, userId)).to.equal(true);
      });

      it('should return true if authenticated user has has only "{DAV:}unbind" privilege on source address book', function() {
        var addressbookShell = {
          isSubscription: true,
          source: {
            acl: [{
              principal: CONTACT_ADDRESSBOOK_AUTHENTICATED_PRINCIPAL,
              privilege: '{DAV:}unbind'
            }]
          }
        };

        expect(contactAddressbookACLHelper.canDeleteContact(addressbookShell, userId)).to.equal(true);
      });

      it('should return true if authenticated user has has only "{DAV:}all" privilege on source address book', function() {
        var addressbookShell = {
          isSubscription: true,
          source: {
            acl: [{
              principal: CONTACT_ADDRESSBOOK_AUTHENTICATED_PRINCIPAL,
              privilege: '{DAV:}all'
            }]
          }
        };

        expect(contactAddressbookACLHelper.canDeleteContact(addressbookShell, userId)).to.equal(true);
      });
    });
  });

  describe('The canExportContact function', function() {
    it('should always return true', function() {
      expect(contactAddressbookACLHelper.canExportContact()).to.equal(true);
    });
  });
});
