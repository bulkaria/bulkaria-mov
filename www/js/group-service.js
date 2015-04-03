'use strict';
angular.module("bulkaria-mov.group-service", ["firebase"])

.factory("groups", ["$firebaseArray", function($firebaseArray) {
  return $firebaseArray.$extend({
    sum: function() {
      var total = 0;
      angular.forEach(this.$list, function(rec) {
        total += rec.x;
      });
      return total;
    }
  });
}])
;