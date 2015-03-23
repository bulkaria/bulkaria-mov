angular.module("bulkaria-mov.providers", ["firebase"])

.provider("auth", function backendProvider () { 
  var firebaseRef = null;
  
  this.setFirebaseRef = function(firebaseUrl) {
    firebaseRef = new Firebase(firebaseUrl);
  };
  
  this.$get = ["$firebaseAuth", function ($firebaseAuth) {
    var services = {};

    services.getSocialEmail = function (authData) {
      var email = {
        facebook: function(authData) {
          return authData.facebook.cachedUserProfile.email;
        },
        google: function(authData) {
          return authData.google.cachedUserProfile.email;
        },
        twitter: function(authData) {
          // twitter don't provide user email until now
          return null;
        },
        password: function(authData) {
          return authData.password.email; 
        }
      };
      return email[authData.provider](authData);      
    }

    services.getSocialScope = function (provider) {
      return {
        facebook: {scope: "email"},
        google: {scope: "email"},
        twitter: {scope: "email"}
      }[provider];
    }
    
    services.getFirebaseRef = function () {
      return firebaseRef;
    }
    
    services.status = function () {
      return $firebaseAuth(firebaseRef);
    }
      
    return services;
  }];

});