'use strict';

var expect = require('chai').expect;

describe('The mapping function', function() {
  function getModule() {
    return require('../../../../backend/lib/twitter/mapping')();
  }
  describe('The toVcard function', function() {
    function compareShell(shell, ical) {
      var vcard = getModule().toVcard(shell);

      for (var propName in ical) {
        var prop = vcard.getFirstProperty(propName);
        var value = prop.toICAL();
        expect(value).to.equal(ical[propName].toString());
      }
    }
    it('should correctly create card from a Twitter following with all props', function() {
      var following = {
        name: 'first last1 last2 last3',
        tags: [{ text: 'a' }, { text: 'b'}],
        location: 'France',
        screen_name: 'AwesomePaaS',
        url: 'http://mywebsite.com',
        description: 'description',
        profile_image_url_https: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAA'
      };
      var ical = {
        version: 'VERSION:4.0',
        fn: 'FN:first last1 last2 last3',
        n: 'N:last1 last2 last3;first',
        adr: 'ADR;TYPE=Other:;;;;;;France',
        url: 'URL:http://mywebsite.com',
        socialprofile: 'SOCIALPROFILE;TYPE=Twitter:@AwesomePaaS',
        categories: 'CATEGORIES:Twitter',
        note: 'NOTE:description',
        photo: 'PHOTO:data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAA'
      };

      compareShell(following, ical);
    });
  });
});
