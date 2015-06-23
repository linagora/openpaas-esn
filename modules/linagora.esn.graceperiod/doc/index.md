# linagora.esn.graceperiod

This module is a grace period manager.
It can be used to register tasks to be executed after a given delay. Tasks can be cancelled before the grace period delay.

    var delay = 1000; // in ms
    var grace = dependencies('graceperiod');

    var onComplete = function(err, result) {
      // onComplete may be called by the job when complete
    };

    var onCancel = function() {
      // onCancel will be called if the job is cancelled before the end of the grace period
      // it will be called only once even if job.cancel is called N times
    };

    var fn = function(context, callback) {
      console.log('I am the task and I am executed after a given delay');
      // calling callback will call onComplete so that errors can be handled
      return callback(null, {result: 1});
    };

    var task = grace.create(fn, delay, context, onComplete, onCancel);

    // A job can be canceled before the end of the grace period.
    // If the grace period is over, calling cancel have no effect
    task.cancel();

