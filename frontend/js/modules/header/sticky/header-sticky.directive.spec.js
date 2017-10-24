'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The esnHeaderSticky directive', function() {
  var $rootScope, $compile, matchmedia;
  var ESN_MEDIA_QUERY_SM_XS, ESN_MEDIA_QUERY_MD;
  var ESN_HEADER_HEIGHT_MD, ESN_HEADER_HEIGHT_XL, ESN_SUBHEADER_HEIGHT_XS, ESN_SUBHEADER_HEIGHT_MD;
  var scope;

  beforeEach(function() {
    module('jadeTemplates');
    module('esn.header');
  });

  beforeEach(inject(function(
    _$rootScope_,
    _$compile_,
    _matchmedia_,
    _ESN_MEDIA_QUERY_SM_XS_,
    _ESN_MEDIA_QUERY_MD_,
    _ESN_HEADER_HEIGHT_MD_,
    _ESN_HEADER_HEIGHT_XL_,
    _ESN_SUBHEADER_HEIGHT_XS_,
    _ESN_SUBHEADER_HEIGHT_MD_
  ) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
    matchmedia = _matchmedia_;
    ESN_MEDIA_QUERY_SM_XS = _ESN_MEDIA_QUERY_SM_XS_;
    ESN_MEDIA_QUERY_MD = _ESN_MEDIA_QUERY_MD_;
    ESN_HEADER_HEIGHT_MD = _ESN_HEADER_HEIGHT_MD_;
    ESN_HEADER_HEIGHT_XL = _ESN_HEADER_HEIGHT_XL_;
    ESN_SUBHEADER_HEIGHT_XS = _ESN_SUBHEADER_HEIGHT_XS_;
    ESN_SUBHEADER_HEIGHT_MD = _ESN_SUBHEADER_HEIGHT_MD_;
  }));

  function initDirective(html) {
    scope = $rootScope.$new();

    var element = $compile(html || '<div esn-header-sticky></div>')(scope);

    scope.$digest();

    return element;
  }

  it('should add sticky directive to element', function() {
    var element = initDirective();

    expect(element.attr('hl-sticky')).to.exist;
    expect(element.attr('offset-top')).to.exist;
  });

  it('should set the offset depending on header\'s height (sm, xs screens)', function() {
    matchmedia.is = sinon.stub().returns(false);
    matchmedia.is.withArgs(ESN_MEDIA_QUERY_SM_XS).returns(true);

    var element = initDirective();

    expect(element.attr('offset-top')).to.equal(ESN_SUBHEADER_HEIGHT_XS + '');
  });

  it('should set the offset depending on header\'s height (md screens)', function() {
    matchmedia.is = sinon.stub().returns(false);
    matchmedia.is.withArgs(ESN_MEDIA_QUERY_MD).returns(true);

    var element = initDirective();

    expect(element.attr('offset-top')).to.equal(ESN_HEADER_HEIGHT_MD + ESN_SUBHEADER_HEIGHT_MD + '');
  });

  it('should set the offset depending on header\'s height (xl screens)', function() {
    matchmedia.is = sinon.stub().returns(false);

    var element = initDirective();

    expect(element.attr('offset-top')).to.equal(ESN_HEADER_HEIGHT_XL + ESN_SUBHEADER_HEIGHT_MD + '');
  });

});
