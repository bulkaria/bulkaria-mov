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
  };

  return $firebaseObject.$extend(userFactory);
}])

.factory("groupFactory", ["$firebaseObject", "fkArray", "auth", "$q", function($firebaseObject, fkArray, auth, $q) {
  function groupFactory(groupId) {
    this.ref = auth.getRootRef().child("groups").child(groupId);
    this.members = null;
    return $firebaseObject.call(this, this.ref);
  }

  groupFactory.prototype.getMembers = function() {
    if(!this.members) {
      this.members = new fkArray(this.ref.child("members"), this.ref.root().child("users"));
    }

    return this.members;
  };

  groupFactory.prototype.membersArray = function() {
    // create a promise
    var def = $q.defer();

    // get group members
    this.ref.child("members").once("value", function(mSnap) {
      // array to return
      var mArray = [];
      var mLen = 0;
      // for each member
      mSnap.forEach(function(ss) {
        mLen++; // to control when promise is complete         
        // search user record for member
        var uRef = ss.ref().root().child("users/" + ss.key());
        uRef.once("value", function(uSnap) {
          // push an object with parcial user data in returning array
          var u = uSnap.val();
          if(u) {
            mArray.push({key: ss.key(), name: u.displayName, picture: u.picture});
          } else {
            mArray.push({key: ss.key(), name: ss.key(), picture: null});
          }
          if(mArray.length==mLen) {
            // return the array
            def.resolve(mArray);            
          }          
        });
      });
    });

    // return the promise
    return def.promise;
  };

  return $firebaseObject.$extend(groupFactory);
}])
;