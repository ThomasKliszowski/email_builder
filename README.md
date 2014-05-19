Email Builder
=============

Build email templates easily and quickly, using GruntJS.

Installation
------------

Before using this app, you must launch few commands.

1.  Ensure that you have NodeJS installed, e.g. on Mac OSX:
    ```
    brew install nodejs
    ```

2.  Install grunt:
    ```
    npm install grunt-cli -g
    ```

3.  Install node packages inside the email_builder app:
    ```
    npm install -d
    ```

Usage
-----

To launch the development environment, just enter this command:
```
grunt server
```

To build your template, by example `email_builder/templates/my_template.html`, just enter this command:
```
grunt build:my_template
```
You will obtain your builded template inside the new dist/ folder.
