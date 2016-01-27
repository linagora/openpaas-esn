# linagora.esn.jobqueue

This modules provides APIs to create and manage queue job in OpenPaaS ESN.

## Adding a worker

Each module must register its job into the jobqueue module.
Once registered, the worker can be called and managed in jobqueueUI page.

The worker object to register is defined as:

```javascript

dependencies('jobqueue').lib.workers.add({
  name: 'contact-twitter-import',
  getWorkerFunction: function() {
    return self.lib.importer.importContact;
  }
})

```

## Calling a worker to do his job

Once registered, you can call worker job by his name and data:

```javascript

dependencies('jobqueue').lib.startJob(jobName, jobData);

```

## Job object

To get job object by his id:

```javascript

dependencies('jobqueue').lib.getJobById(jobId);

```