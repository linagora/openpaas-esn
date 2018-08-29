# OpenPaaS Releases & Maintenance

## Release schedule
OpenPaaS is planned to be released every 4 months, which makes 3 releases per year.

Schedule of releases is currently as follow:
- February
- June
- October

Releases tracking follow the [SEMVER spec](https://semver.org/spec/v2.0.0.html), meaning that each release has a number in format MAJOR.MINOR.PATCH.
- a MAJOR upgrade includes huge new features, awesome of course, but with potential breaking changes if you are upgrading from previous major release.
- a MINOR upgrade has new features and bug fixes bundled, but should still be compatible with previous minor version.
- a PATCH upgrade only contains bug fixes that are compatible with previous release. It is strongly advised to get these as soon as they are available, as they can correct unexpected behavior you might encounter or include important security fixes.

Releases happening on the above schedule will mostly be MAJOR and MINOR releases.

## Support

As new features are constantly added, we strongly advise to upgrade to the latest version as soon as possible.   

To get long-term support on a previously released version, you can contact [Linagora's Open Source Software Support Assurance](https://linagora.com/open-source-support/).

You can also get Community Support on our [*forum*](https://forum.open-paas.org)

## How to get upgrades

If you installed OpenPaaS **through packages**, you will get **patches** by running an `update` or `upgrade` command within your favorite package manager.   

To get MAJOR and MINOR upgrades providing new functionnalities, you will need to change your source repository located under `/etc/apt/sources.list.d/` or `/etc/yum.repos.d/`. Repositories location will be published along with these versions.

If you are using **docker images**, you should be able to look for the corresponding tag in our [public docker hub repository](https://hub.docker.com/u/linagora/) and upgrade your containers orchestration scripts.

**Warning:** Do not forget to take a good look at the release notes before upgrading!  
They might tell you about a specific dependency you need to upgrade, or a specific upgrade path to follow.

## Core and Modules technical maintenance
Each reported bug will be tagged with the impacted version(s) number.

The fix will be reported on each corresponding release branch and a patch will be published.

If the bug concerns an OpenPaaS module and not the core itself, the patch will be released on the corresponding branch in the module repository. The core product will also get released afterwards, to refer to the patched version of the module.   
You can have a look at the [`package.json`](../package.json) file in the ESN repository to know about the version used for each officially supported module.

As a consequence, the ESN core will always refer to the same MAJOR and MINOR version of the officially supported modules, but might refer to a different PATCH version of them.

#### Example:
At v1.1.0 release time, the ESN `package.json` file in the `release-1.1.x` branch will look like this:
```
{
  "name": "linagora-rse",
  "version": "1.1.0",
  "dependencies": {
    "linagora.esn.admin": "1.1.0",
    "linagora.esn.calendar": "1.1.0",
    "linagora.esn.unifiedinbox": "1.1.0",
    [...]
  }
}
```
Once the `1.1.1` patch has been released for the `linagora.esn.calendar` module, a patch version will also be tagged & released for the main ESN repository, in the `release-1.1.x` branch.
The `package.json` file will therefore look like this :
```
{
  "name": "linagora-rse",
  "version": "1.1.1",
  "dependencies": {
    "linagora.esn.admin": "1.1.0",
    "linagora.esn.calendar": "1.1.1",
    "linagora.esn.unifiedinbox": "1.1.0",
    [...]
  }
}
```

## Final note
This process is being evaluated and experimented as we go. Dates might change without notice and process might evolve.