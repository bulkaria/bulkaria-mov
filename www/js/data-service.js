'use strict';
angular.module("bulkaria-mov.data-service", ["firebase"])

.factory("fkArray", ["$firebaseArray", "$firebaseObject", "$log", function($firebaseArray, $firebaseObject, $log) {
  function fkArray(ref, fkRef) {
    this.fkRef = fkRef;
    this.objArray = [];
    return $firebaseArray.call(this, ref); 
  }

  fkArray.prototype.getFkObject = function(key) {
    var obj = null;
    if(key) {
      if(!this.objArray[key]) {
        try {
          this.objArray[key] = $firebaseObject(this.fkRef.child(key));
        } catch(e) {
          $log.error("getFkObject: " + e)
        }
      }
      obj = this.objArray[key];       
    }
    return obj;
  };

  return $firebaseArray.$extend(fkArray);
}])

.factory("userFactory", ["$firebaseObject", "fkArray", function($firebaseObject, fkArray) {
  function userFactory(ref) {
    this.ref = ref;
    this.groups = null;
    return $firebaseObject.call(this, ref);
  }

  userFactory.prototype.getGroups = function() {
    if(!this.groups) {
      this.groups = new fkArray(this.ref.child("memberOf"), this.ref.root().child("groups"));
    }

    return this.groups;
  }

  return $firebaseObject.$extend(userFactory);
}])
;