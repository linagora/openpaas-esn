'use strict';

var expect = require('chai').expect;

describe('The email helpers module', function() {
  it('should return a well formatted headers', function() {
    var headers = {
      'Received': ['from locahost (localhost [127.0.0.1])', 'from linagora (linagora [10.75.9.2])'],
      'From': 'AwesomeGuy <awesomeguy@linagora.com',
      'To': 'anotherone@linagora.com',
      'Subject': 'a subject'
    };
    var formatHeaders = this.helpers.requireBackend('helpers/email').formatHeaders;

    var formattedHeaders = formatHeaders(headers);

    expect(formattedHeaders).to.deep.equal([
      ['Received', 'from locahost (localhost [127.0.0.1])'],
      ['Received', 'from linagora (linagora [10.75.9.2])'],
      ['From', 'AwesomeGuy <awesomeguy@linagora.com'],
      ['To', 'anotherone@linagora.com'],
      ['Subject', 'a subject']
    ]);
  });

  it('should return empty array if no header', function() {
    expect(this.helpers.requireBackend('helpers/email').formatHeaders(null)).to.deep.equal([]);
  });
});
