# linagora.esn.cron

This module is a cronjob manager based on [cron](https://www.npmjs.com/package/cron).

Jobs are simple functions, with a single callback argument, which are planned for execution based on cronjob time expression.
The job callback MUST be called with an error if something failed during processing and without any argument if all is successful.

    var cron = dependencies('cron');
    var job = function(callback) {
      console.log('I am the job', config);
      return callback();
    };

    var onComplete = function() {
      console.log('I am complete');
    };

    cron.submit('Run me every second', '* * * * * *', job, onComplete, function(err, job) {
      if (err) {
        logger.error('Error while submitting the job', err);
      }
      logger.info('Job has been submitted', job);
    });

