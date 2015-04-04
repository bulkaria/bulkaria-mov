'use strict';
angular.module("bulkaria-mov.group-service", ["firebase"])

.factory("GroupFactory", ["$firebaseObject", function($firebaseObject) {
  return $firebaseObject.$extend({
      getMembers: function() {
        return $firebaseArray(this.$$conf.ref.child("members"));
      }
   });
}])

// create a User object from our Factory
.factory("Group", ["GroupFactory", "ROOT", function(GroupFactory, ROOT) {
  var ref = new Firebase(ROOT+"/groups/");

  return function(groupId) {
    return new GroupFactory(ref.child(groupId));
  }
}])
;