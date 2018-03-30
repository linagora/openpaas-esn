'use strict';

var expect = require('chai').expect;

describe('The twitter contact importer mapping function', function() {
  function getModule() {
    return require('../../../backend/lib/mapping')();
  }
  describe('The toVcard function', function() {
    function compareShell(shell, ical) {
      var vcard = getModule().toVcard(shell);

      Object.keys(ical).forEach(function(propName) {
        var prop = vcard.getFirstProperty(propName);
        var value = prop.toICALString();
        expect(value).to.equal(ical[propName].toString());
      });
    }
    it('should correctly create card from a Twitter following with all props', function() {
      var following = {
        name: 'first last1 last2 last3',
        tags: [{ text: 'a' }, { text: 'b'}],
        location: 'Paris',
        withheld_in_countries: 'FR',
        screen_name: 'AwesomePaaS',
        url: 'http://mywebsite.com',
        description: 'description',
        profile_image_url_https: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAA'
      };
      var ical = {
        version: 'VERSION:4.0',
        fn: 'FN:first last1 last2 last3',
        n: 'N:last1 last2 last3;first',
        adr: 'ADR;TYPE=Other:;;Paris;;;;FR',
        url: 'URL:http://mywebsite.com',
        socialprofile: 'SOCIALPROFILE;TYPE=Twitter:@AwesomePaaS',
        categories: 'CATEGORIES:Twitter',
        note: 'NOTE:description',
        photo: 'PHOTO:data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAA'
      };

      compareShell(following, ical);
    });

    it('should trim white spaces from Twitter profile name when create card', function() {
      var following = {
        name: ' first    last ',
        tags: [{ text: 'a' }, { text: 'b'}],
        location: 'Paris',
        withheld_in_countries: 'FR',
        screen_name: 'AwesomePaaS',
        url: 'http://mywebsite.com',
        description: 'description',
        profile_image_url_https: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAA'
      };
      var ical = {
        version: 'VERSION:4.0',
        fn: 'FN:first last',
        n: 'N:last;first',
        adr: 'ADR;TYPE=Other:;;Paris;;;;FR',
        url: 'URL:http://mywebsite.com',
        socialprofile: 'SOCIALPROFILE;TYPE=Twitter:@AwesomePaaS',
        categories: 'CATEGORIES:Twitter',
        note: 'NOTE:description',
        photo: 'PHOTO:data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAA'
      };

      compareShell(following, ical);
    });

    it('should correctly create card when Twitter profile name has no spaces', function() {
      var following = {
        name: 'Alone',
        tags: [{ text: 'a' }, { text: 'b'}],
        location: 'Paris',
        withheld_in_countries: 'FR',
        screen_name: 'AwesomePaaS',
        url: 'http://mywebsite.com',
        description: 'description',
        profile_image_url_https: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAA'
      };
      var ical = {
        version: 'VERSION:4.0',
        fn: 'FN:Alone',
        n: 'N:;Alone',
        adr: 'ADR;TYPE=Other:;;Paris;;;;FR',
        url: 'URL:http://mywebsite.com',
        socialprofile: 'SOCIALPROFILE;TYPE=Twitter:@AwesomePaaS',
        categories: 'CATEGORIES:Twitter',
        note: 'NOTE:description',
        photo: 'PHOTO:data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAA'
      };

      compareShell(following, ical);
    });

    it('should not add note to vcard when Twitter profile description is not present', function() {
      var following = {
        name: 'First Last',
        tags: [{ text: 'a' }, { text: 'b'}],
        location: 'Paris',
        withheld_in_countries: 'FR',
        screen_name: 'AwesomePaaS',
        url: 'http://mywebsite.com',
        profile_image_url_https: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAA'
      };
      var ical = {
        version: 'VERSION:4.0',
        fn: 'FN:First Last',
        n: 'N:Last;First',
        adr: 'ADR;TYPE=Other:;;Paris;;;;FR',
        url: 'URL:http://mywebsite.com',
        socialprofile: 'SOCIALPROFILE;TYPE=Twitter:@AwesomePaaS',
        categories: 'CATEGORIES:Twitter',
        photo: 'PHOTO:data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAA'
      };

      compareShell(following, ical);
    });

    it('should add address to vcard when either Twitter profile location or withheld_in_countries is present', function() {
      var followingWithLocation = {
        name: 'First Last',
        tags: [{ text: 'a' }, { text: 'b'}],
        location: 'Paris',
        screen_name: 'AwesomePaaS',
        url: 'http://mywebsite.com',
        profile_image_url_https: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAA'
      };
      var icalWithLocation = {
        version: 'VERSION:4.0',
        fn: 'FN:First Last',
        n: 'N:Last;First',
        adr: 'ADR;TYPE=Other:;;Paris;;;;',
        url: 'URL:http://mywebsite.com',
        socialprofile: 'SOCIALPROFILE;TYPE=Twitter:@AwesomePaaS',
        categories: 'CATEGORIES:Twitter',
        photo: 'PHOTO:data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAA'
      };

      compareShell(followingWithLocation, icalWithLocation);

      var followingWithCountry = {
        name: 'First Last',
        tags: [{ text: 'a' }, { text: 'b'}],
        withheld_in_countries: 'FR',
        screen_name: 'AwesomePaaS',
        url: 'http://mywebsite.com',
        profile_image_url_https: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAA'
      };
      var icalWithCountry = {
        version: 'VERSION:4.0',
        fn: 'FN:First Last',
        n: 'N:Last;First',
        adr: 'ADR;TYPE=Other:;;;;;;FR',
        url: 'URL:http://mywebsite.com',
        socialprofile: 'SOCIALPROFILE;TYPE=Twitter:@AwesomePaaS',
        categories: 'CATEGORIES:Twitter',
        photo: 'PHOTO:data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAA'
      };

      compareShell(followingWithCountry, icalWithCountry);
    });

    it('should not address to vcard when neither Twitter profile location nor withheld_in_countries is present', function() {
      var following = {
        name: 'First Last',
        tags: [{ text: 'a' }, { text: 'b'}],
        screen_name: 'AwesomePaaS',
        url: 'http://mywebsite.com',
        profile_image_url_https: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAA'
      };
      var ical = {
        version: 'VERSION:4.0',
        fn: 'FN:First Last',
        n: 'N:Last;First',
        url: 'URL:http://mywebsite.com',
        socialprofile: 'SOCIALPROFILE;TYPE=Twitter:@AwesomePaaS',
        categories: 'CATEGORIES:Twitter',
        photo: 'PHOTO:data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAA'
      };

      compareShell(following, ical);
    });

    it('should not add url to vcard when Twitter profile url is not present', function() {
      var following = {
        name: 'First Last',
        tags: [{ text: 'a' }, { text: 'b'}],
        location: 'Paris',
        withheld_in_countries: 'FR',
        screen_name: 'AwesomePaaS',
        profile_image_url_https: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAA'
      };
      var ical = {
        version: 'VERSION:4.0',
        fn: 'FN:First Last',
        n: 'N:Last;First',
        adr: 'ADR;TYPE=Other:;;Paris;;;;FR',
        socialprofile: 'SOCIALPROFILE;TYPE=Twitter:@AwesomePaaS',
        categories: 'CATEGORIES:Twitter',
        photo: 'PHOTO:data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAA'
      };

      compareShell(following, ical);
    });

    it('should use ID of Twitter account as uid of vcard', function() {
      var following = {
        id_str: '12345',
        name: 'First Last',
        tags: [{ text: 'a' }, { text: 'b'}],
        screen_name: 'AwesomePaaS',
        profile_image_url_https: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAA'
      };
      var ical = {
        version: 'VERSION:4.0',
        uid: 'UID:12345',
        fn: 'FN:First Last',
        n: 'N:Last;First',
        socialprofile: 'SOCIALPROFILE;TYPE=Twitter:@AwesomePaaS',
        categories: 'CATEGORIES:Twitter',
        photo: 'PHOTO:data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAA'
      };

      compareShell(following, ical);
    });
  });
});
