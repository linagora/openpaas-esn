# linagora.esn.cron

This module is a cronjob manager based on [cron](https://www.npmjs.com/package/cron).

Jobs are simple functions, without any argument, which are planned for execution based on cronjob time expression.

    var cron = dependencies('cron');
    var job = function() {
      console.log('I am the job', config);
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

