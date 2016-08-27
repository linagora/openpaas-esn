'use strict';

module.exports = function() {
  var googleClientId = process.env.GOOGLE_CLIENT_ID || 'Create an app on google and put client id here';
  var googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || 'Create an app on google and put client secret';

  var twitterConsumerKey = process.env.TWITTER_CONSUMER_KEY || 'Create an app on twitter and put consumer key here';
  var twitterConsumerSecret = process.env.TWITTER_CONSUMER_SECRET || 'Create an app on twitter and put consumer secret here';

  return {
    google: {
      client_id: googleClientId,
      client_secret: googleClientSecret,
      info: 'Localhost tests. Configured with localhost:8080 as callback'
    },
    twitter: {
      consumer_key: twitterConsumerKey,
      consumer_secret: twitterConsumerSecret
    }
  };
};
