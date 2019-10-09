const kue = require('kue');

module.exports = dependencies => {
  const logger = dependencies('logger');
  const workers = require('./workers')(dependencies);
  const pubsub = dependencies('pubsub').local;
  let jobQueue;

  return {
    addWorker,
    getJobById,
    init,
    kue,
    submitJob
  };

  function init() {
    return _initJobQueue();
  }

  function addWorker(worker) {
    workers.add(worker);

    return _initJobQueue().then(queue => {
      queue.process(worker.name, (job, done) => {
        worker.handler.handle(job).then(() => {
          logger.debug(`Job queue done: ${worker.name} - ${job.data.title}`);
          done();
        }, err => {
          logger.error(`Job queue failed: ${worker.name} - ${job.data.title}`, err);
          done(err);
        }, progress => {
          if (progress) {
            job.log(progress.message);
            job.progress(progress.value, 100);
          }
        });
      });
    });
  }

  function getJobById(id) {
    return new Promise((resolve, reject) => {
      kue.Job.get(id, (err, job) => {
        if (err) return reject(err);

        return resolve(job);
      });
    });
  }

  function submitJob(workerName, data) {
    if (!workerName) {
      return Promise.reject(new Error('Cannot submit a job without workerName'));
    }
    const worker = workers.get(workerName);

    if (!worker) {
      return Promise.reject(new Error(`Can not find worker for this job ${workerName}`));
    }

    const jobData = Object.assign({
      title: worker.handler.getTitle(data)
    }, data);

    return _initJobQueue()
      .then(queue => new Promise((resolve, reject) => {
        const job = queue.create(workerName, jobData);

        job.save(err => {
          if (err) return reject(err);

          logger.debug(`Job queue submitted: ${workerName} - ${jobData.title}`);

          resolve(job.id);
        });
      }));
  }

  function _initJobQueue() {
    return new Promise(resolve => {
      if (jobQueue) {
        return resolve(jobQueue);
      }

      pubsub.topic('redis:configurationAvailable').subscribe(config => {
        jobQueue = kue.createQueue({ redis: config });

        return resolve(jobQueue);
      });
    });
  }
};
