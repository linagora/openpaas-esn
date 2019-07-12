# linagora.esn.jobqueue

This modules provides APIs to create and manage queue job in OpenPaaS ESN.

### Register a worker

Each module must register its job into the jobqueue module.
Once registered, the worker can be called and managed in jobqueue UI page.

The worker object to register is defined as:

```javascript

const jobName = 'contact-import';

dependencies('jobqueue').lib.addWorker({
  name: jobName,
  handler: {
    handle
    getTitle
  }
})

function handle(job) {
  const { user, account } = job.data;

  // must return a promise
  return importContact(user, account);
}

function getTitle(jobData) {
  return `Import ${jobData.type} contacts for user ${jobData.user._id}`;
}

```

### Calling a worker to do his job

Once registered, you can call worker job by his name and data:

```javascript

const jobData = { user, account };

dependencies('jobqueue').lib.submitJob(jobName, jobData);

```

_Note that the `jobData` must be as lightweight as possible since it is stored in Redis_

### Job object

To get job object by his id:

```javascript

dependencies('jobqueue').lib.getJobById(jobId);

```