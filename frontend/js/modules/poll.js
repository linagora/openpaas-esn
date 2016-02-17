'use strict';

angular.module('esn.poll', ['esn.http'])
.service('pollAPI', function(esnRestangular) {

  function vote(messageId, pollVote) {
    return esnRestangular.one('messages', messageId).one('vote', pollVote + '').customPUT({});
  }

  return {
    vote: vote
  };
});
