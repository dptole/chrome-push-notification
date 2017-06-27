Chrome push notifications
=========================

Sample code for chrome push notifications.

Create your project here
========================

Click [here][gc-project] to create your project. The important bit here is the `Project number` copy it when you create your project.

Get your api key
================

Click [here][fc-project] to open the console where you should be able to get your api key.

> Replace the URL so it looks like this https://console.firebase.google.com/project/NAME_OF_YOUR_PROJECT/settings/cloudmessaging/?hl=en

Create your `env.json`
======================

Copy the file `env.example.json` renaming it to `env.json`. Replace the fields `gcm_sender_id` and `api_key` with the information found on the previous steps.

Demo
====

Click the image below.

[![Demo][ngrok-image]][ngrok-far]

[ngrok-far]: https://dptole.ngrok.io/chrome_push_notification/
[ngrok-image]: https://ngrok.com/static/img/demo.png
[gc-project]: https://console.cloud.google.com/projectcreate?previousPage=%2Fprojectselector%2Fiam-admin%2Fsettings&organizationId=0
[fc-project]: https://console.firebase.google.com/project/
