'use strict';
angular.module("bulkaria-mov.user-service", ["firebase"])

.factory("UserFactory", ["$firebaseObject", "$firebaseArray", function($firebaseObject, $firebaseArray) {
  return $firebaseObject.$extend({
      getFullName: function() {
        return this.firstName + " " + this.lastName;
      },
      memberOf: function() {
        var mo = $firebaseArray(this.$$conf.ref.child("memberOf"));
        return mo;
      }
   });
}])

// create a User object from our Factory
.factory("User", ["UserFactory", "ROOT", function(UserFactory, ROOT) {
  var ref = new Firebase(ROOT+"/users/");

  return function(userId) {
    return new UserFactory(ref.child(userId));
  }
}])
;