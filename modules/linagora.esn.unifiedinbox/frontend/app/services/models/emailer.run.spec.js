'use strict';

/* global chai: false, sinon: false */

var expect = chai.expect;

describe('The EMailer run block', function() {

  var $rootScope, jmap, searchService;

  beforeEach(function() {
    module('linagora.esn.unifiedinbox');
  });

  beforeEach(inject(function(_$rootScope_, _jmap_, _searchService_) {
    $rootScope = _$rootScope_;
    jmap = _jmap_;
    searchService = sinon.mock(_searchService_);
  }));

  afterEach(function() {
    searchService.verify();
  });

  it('should add a "resolve" method to jmap.EMailer instances', function() {
    expect(new jmap.EMailer().resolve).to.be.a('function');
  });

  it('should query the search service and use displayName and photo if available', function() {
    var emailer = new jmap.EMailer({ email: 'a@a.com', name: 'a' });

    searchService
      .expects('searchByEmail')
      .once()
      .withExactArgs('a@a.com')
      .returns($q.when({
        displayName: 'displayName',
        photo: '/photo'
      }));

    emailer.resolve();
    $rootScope.$digest();

    expect(emailer.avatarUrl).to.equal('/photo');
    expect(emailer.name).to.equal('displayName');
  });

  it('should query the search service and use existing name and generated avatar if not info is not available', function() {
    var emailer = new jmap.EMailer({ email: 'a@a.com', name: 'a' });

    searchService
      .expects('searchByEmail')
      .once()
      .withExactArgs('a@a.com')
      .returns($q.when({}));

    emailer.resolve();
    $rootScope.$digest();

    expect(emailer.avatarUrl).to.equal('/api/avatars?objectType=email&email=a@a.com&displayName=a');
    expect(emailer.name).to.equal('a');
  });

  it('should query the search service and use existing name and generated avatar if search fails', function() {
    var emailer = new jmap.EMailer({ email: 'a@a.com', name: 'a' });

    searchService
      .expects('searchByEmail')
      .once()
      .withExactArgs('a@a.com')
      .returns($q.reject(new Error()));

    emailer.resolve();
    $rootScope.$digest();

    expect(emailer.avatarUrl).to.equal('/api/avatars?objectType=email&email=a@a.com&displayName=a');
    expect(emailer.name).to.equal('a');
  });

});
