# VSCODE

If you are an open source lover like us, and you are using `VSCODE` then you are welcome to read this file. Here we will help you configuring your `VSCODE` to run the different type of tests supported by OpenPaaS. Once done, you can debug any test, by adding `breakpoints` directly from `VSCODE`. Please note that a well-configured `launch.json` is provided in `doc/vscode/vscode_debug.md` so feel free to use it directly .

## Backend tests

### Module unit backend tests

* Open your `launch.json` file `.vscode/launch.json`
* add a new configuration:
```
{
    "name": "Mocha module-unit-backend",
    "request": "launch",
    "type": "node",
    "program": "${workspaceRoot}/node_modules/mocha/bin/_mocha",
    "stopOnEntry": false,
    "args": [
        "modules/**/test/unit-backend/**/*.js",
        "test/module-unit-backend-all.js",
        "--no-timeouts"
    ],
    "cwd": "${workspaceRoot}/",
    "runtimeExecutable": null,
    "env": {
        "NODE_ENV": "dev"
    }
}
```
* Now go to the debug section, and you will find a new configuration called `Mocha module-unit-backend`. Choose it, press play and Have fun!

### Module backend tests

repeat the same steps as for `Module unit backend tests` section, but modify the configuration file with the following:
```
{
    "name": "Mocha unit-backend",
    "request": "launch",
    "type": "node",
    "program": "${workspaceRoot}/node_modules/mocha/bin/_mocha",
    "stopOnEntry": false,
    "args": [
        "test/unit-backend/**/*.js",
        "test/unit-backend/all.js",
        "--no-timeouts"
    ],
    "cwd": "${workspaceRoot}/",
    "runtimeExecutable": null,
    "env": {
        "NODE_ENV": "dev"
    }
},
```

## Frontend tests

For both types of frontend tests (i.e., `frontend tests` and `module frontend tests`) you have to follow these steps:
* go to the `launch.json` file
* add a new configuration:
```
{
    "name": "Debug karma tests in Chrome",
    "type": "chrome",
    "request": "attach",
    "port": 9222,
    "sourceMaps": true,
    "webRoot": "${workspaceRoot}"
}
```
* install `Debugger for Chrome` extension to `VSCODE`:  <https://marketplace.visualstudio.com/items?itemName=msjsdiag.debugger-for-chrome>
* run a karma server:
    - for `frontend tests`, type this in the terminal: 
    ``` 
    SINGLE_RUN=false karma start test/config/karma.conf.js --browsers Chrome_with_debugging 
    ```
    - for `module frontend tests`, type this in the terminal: 
    ``` 
    SINGLE_RUN=false karma start test/config/karma.module.conf.js --browsers Chrome_with_debugging 
    ```
* Go to the debug section, and you will find a new configuration called `Debug karma tests in Chrome`. Choose it, press play and Have fun!