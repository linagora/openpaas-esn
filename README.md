# OpenPaaS

OpenPaaS is your next collaboration platform, for enterprises & organizations.

## Discover
#### Try it in docker
Discover the OpenPaaS platform on your machine within 5 minutes by checking out the [demo docker-compose recipe](http://docs.open-paas.org/getting-started/docker/).

#### Install it on your server
Check out the [installation guide](http://docs.open-paas.org/getting-started/linux/) to install OpenPaaS on a Linux server and start using it now!
If you're a developer looking for a development setup, head to the next section:

#### Improve it with us
Developers are more than welcome to help build OpenPaaS!
To get your development environement up & running, see our [developers installation documentation](doc/develop.md).

Once you are ready to go, you can explore the project's [documentation site](http://docs.open-paas.org/) and [this repository's](doc/) documentation.
If you have any question, don't hesitate to come and ask on [the forum](http://forum.open-paas.org/)!

## Our CI

We are currently using Gitlab CI.   
Hence, you can have a look at the `.gitlab-ci.yml` file on the root of this repository for more information.

However, some jobs are more complicated than expected, as they are depending on external tools.  
Hopefully for you, such jobs are the latest in the pipeline execution; linters, build & tests jobs are simple.   
The "complexe" jobs are those dedicated to CD (Continuous Delivery) which main reason is that we are delivering Docker 
images to two different registries. 

The main complexity is about `git` branches & their related delivery, the following matrix might help you:

| Branch name | Internal registry | DockerHub |
| ----------- | ----------------- | --------- |
| `master`    | openpaas-snapshots/openpaas-esn:branch-master | linagora/esn:branch-master |
| `release-*` (1) | openpaas-snapshots/openpaas-esn:* | linagora/esn:branch-* |
| `feature-*` (2) | openpaas-snapshots/openpaas-esn:* | linagora/esn:* |

(1) The goal of release branches is to be able to maintain release (bug fix backport, CVE fixes...), and then produce minor releases based on this major release.     
They should be prefixed by `release-`.
e.g. `git` branch name `release-1.6.x` build will deliver:
- openpaas-snapshots/openpaas-esn:1.6
- openpaas-snapshots/openpaas-esn:1.6.3 (depending on the minor release)
- linagora/esn:branch-1.6.3

(2) Feature branches are not release. They are used in order to publish & validate features (maybe several MRs & commits).
They should be prefixed by `feature-`.
e.b. `git` branch name `feature-friday-delivery` build will deliver:
- openpaas-snapshots/openpaas-esn:feature-friday-delivery
- linagora/esn:feature-friday-delivery

## Licence

[Affero GPL v3](http://www.gnu.org/licenses/agpl-3.0.html)

## Special thanks

<img src="https://cloud.githubusercontent.com/assets/7864462/12837037/452a17c6-cb73-11e5-9f39-fc96893bc9bf.png" alt="drawing" width="250"/>

[BrowserStack](https://www.browserstack.com/) for supporting open source projects.