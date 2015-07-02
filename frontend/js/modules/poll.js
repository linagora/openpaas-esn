'use strict';

angular.module('esn.poll', ['restangular'])
.service('pollAPI', function(Restangular) {

  function vote(messageId, pollVote) {
    return Restangular.one('messages', messageId).one('vote', pollVote + '').customPUT({});
  }

  return {
    vote: vote
  };
});
