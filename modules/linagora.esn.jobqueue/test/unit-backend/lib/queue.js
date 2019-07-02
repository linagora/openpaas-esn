const { expect } = require('chai');
const mockery = require('mockery');
const sinon = require('sinon');

describe('The queue lib module', function() {
  let getModule, jobMock, workersMock, kueMock, pubsubMock;
  const workerName = 'workerName';
  const jobName = 'jobName';
  const redisConfig = {
    port: '12345',
    host: 'my-host'
  };
  const error = new Error('error');

  beforeEach(function() {
    pubsubMock = {
      local: {
        topic: function() {
          return {
            subscribe: function(callback) {
              return callback(redisConfig);
            }
          };
        }
      }
    };

    jobMock = {
      create: function() {
        return {
          save: function() {}
        };
      },
      process: function() {}
    };

    workersMock = {
      add: function() {},
      get: function() {},
      list: function() {}
    };

    kueMock = {
      Job: {
        get: function() {
          return Promise.resolve([]);
        }
      },
      createQueue: function() {
        return jobMock;
      }
    };

    mockery.registerMock('kue', kueMock);
    mockery.registerMock('./workers', function() {
      return workersMock;
    });

    this.moduleHelpers.addDep('pubsub', pubsubMock);

    getModule = () => require('../../../backend/lib/queue')(this.moduleHelpers.dependencies);
  });

  describe('The init function', function() {
    it('should creatQueue with correct params when receive redis config', function(done) {
      kueMock.createQueue = options => {
        expect(options).to.deep.equal({ redis: redisConfig });
        done();
      };

      getModule().init();
    });

    it('should resolve jobs immediately if queue is created', function(done) {
      const queueModule = getModule();

      queueModule.init().then(() => {
        kueMock.createQueue = () => done(error);

        queueModule.init().then(jobs => {
          expect(jobs).to.deep.equal(jobMock);
          done();
        });
      });
    });
  });

  describe('The submitJob function', function() {
    it('should reject if there is no worker name is provided', function(done) {
      getModule().submitJob().then(null, function(err) {
        expect(err.message).to.equal('Cannot submit a job without workerName');
        done();
      });
    });

    it('should reject if there is no worker for provided worker name', function(done) {
      getModule().submitJob(workerName).then(null, function(err) {
        expect(err.message).to.equal(`Can not find worker for this job ${workerName}`);
        done();
      });
    });

    it('should reject if create job error', function(done) {
      jobMock.create = function() {
        return {
          save: function(callback) {
            return callback(1);
          }
        };
      };
      getModule().submitJob(workerName, jobName).then(null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should get worker if succeed creating job', function(done) {
      jobMock = {
        create: function() {
          return {
            save: function(callback) {
              return callback(null);
            }
          };
        }
      };
      workersMock.get = function(name) {
        expect(name).to.equal(workerName);
        done();
      };
      getModule().submitJob(workerName, 'jobName');
    });

    it('should create job with correct parameters ', function(done) {
      const title = 'foo';

      const data = {
        bar: 'baz'
      };

      workersMock.get = _workerName => {
        expect(_workerName).to.equal(workerName);

        return {
          handler: {
            getTitle: () => title
          }
        };
      };

      jobMock.create = name => {
        expect(name).to.equal(workerName);

        return {
          save: () => done()
        };
      };

      getModule().submitJob(workerName, { title, ...data });
    });
  });

  describe('The getJobById function', function() {
    it('should getJobById with correct parameters ', function(done) {
      kueMock.Job.get = function(value) {
        expect(value).to.equal(1234);
        done();
      };
      getModule().getJobById(1234);
    });

    it('should resolve job if job is found', function(done) {
      kueMock.Job.get = function(value, callback) {
        return callback(null, 'job');
      };
      getModule().getJobById(1234).then(function(job) {
        expect(job).to.equal('job');
        done();
      });
    });

    it('should reject if fail creating job', function(done) {
      kueMock.Job.get = function(value, callback) {
        return callback('error');
      };
      getModule().getJobById(1234).then(null, function(err) {
        expect(err).to.equal('error');
        done();
      });
    });

  });

  describe('The addWorker method', function() {
    it('should add worker to the list workers', function(done) {
      const worker = { name: 'bar' };

      workersMock.add = sinon.spy();

      getModule().addWorker(worker)
        .then(() => {
          expect(workersMock.add).to.have.been.calledWith(worker);
          done();
        })
        .catch(done);
    });

    it('should process the job', function(done) {
      const worker = { name: 'bar' };

      jobMock.process = sinon.spy();

      getModule().addWorker(worker)
        .then(() => {
          expect(jobMock.process).to.have.been.calledWith(worker.name);
          done();
        })
        .catch(done);
    });
  });
});
