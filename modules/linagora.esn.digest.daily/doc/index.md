# linagora.esn.digest.daily module

This module manages the daily message digest.

The digest is run as defined in the config/cronjob.json file:

    {
      "dailydigest": {
        "active": true,
        "expression": "00 30 06 * * 1-5",
        "description": "Daily Digest fires every weekday at 6:30 AM"
      }
    }

- active: Start the job or not on the current ESN node
- expression: The cron expression which defines when to launch the daily digest processing
- description: A human readable description
