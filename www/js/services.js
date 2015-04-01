'use strict';
angular.module("bulkaria-mov.services", ["firebase"])

.factory("popup", ["$ionicPopup", "gettextCatalog",
  function($ionicPopup, gettextCatalog) {
    return {
      alert: function (title, message) {
        // I must traslated title before because ionicPopup don't allow <translate> injection
        var _title = gettextCatalog.getString(title);
        var alertPopup = $ionicPopup.alert({
          title: _title,
          template: "<translate>" + message + "</translate>",
          cssClass: "custom-alert",
          okType: "button-dark"
        });
      }
    }
}])

.factory("Groups", ["$firebase", "auth", 
  function ($firebase, auth) {
    // Might use a resource here that returns a JSON array
    var groups = $firebase(auth.getFirebaseRef().child("groups")).$asArray();

    return {
      all: function () {
        return groups;
      },
      get: function (groupId) {
        // Simple index lookup
        return groups.$getRecord(groupId);
      }
    }
}]);