** Creación de Google Cloud Messaging for Android **

fuente: http://developer.android.com/intl/es/google/gcm/gs.html#create-proj

Project Number: 554914461242
API Key: AIzaSyD0PFcp7y1mSGl93XHRQMl_usXONNEC9Ug

** Configuración de node-pushserver **

fuente: https://www.npmjs.com/package/node-pushserver

$ git clone git://github.com/Smile-SA/node-pushserver.git
$ cd node-pushserver
$ npm install

Edit example.config.json and save as config.json
- put API key from GCM
- set mongoDb connection

Verify mongoDb, create admin user and bulkaria db if neccesary

Run:
$ npm start -- --config ./config.json

** Implement notifications en bulkaria-mov **

follow: https://github.com/hollyschinsky/PushNotificationSample

$ ionic plugin add org.apache.cordova.console
$ ionic plugin add org.apache.cordova.device
$ ionic plugin add org.apache.cordova.dialogs    
$ ionic plugin add org.apache.cordova.file
$ ionic plugin add org.apache.cordova.media
$ ionic plugin add https://github.com/phonegap-build/PushPlugin
$ ionic plugin add https://github.com/EddyVerbruggen/Toast-PhoneGap-Plugin.git