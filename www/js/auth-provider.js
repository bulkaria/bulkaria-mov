angular.module("bulkaria-mov.providers", ["firebase"])

.provider("auth", function backendProvider() {
  var firebaseRef = null;
  var currentUser = {};
  var currentPassword = null;

  this.setFirebaseRef = function (firebaseUrl) {
    firebaseRef = new Firebase(firebaseUrl);
  };

  this.$get = ["$rootScope", "$firebaseAuth", "$log", "uuid2", function ($rootScope, $firebaseAuth, $log, uuid2) {
    var services = {};
    var internals = {};
    var firebaseAuth = null;

    services.init = function () {
      firebaseAuth = $firebaseAuth(firebaseRef);
      internals.clearCurrentUser();
      var authData = firebaseAuth.$getAuth();
      if (authData) {
        internals.setUserData(authData);
      }
    };

    services.getCurrentUser = function () {
      return currentUser;
    };

    services.getCurrentPassword = function () {
      return currentPassword;
    };

    internals.clearCurrentUser = function () {
      for (var key in currentUser) {
        currentUser[key] = null;
      }
      currentUser.active = false;
      currentUser.status = "memory";
      services.clearCurrentPassword();
    };

    services.clearCurrentPassword = function () {
      currentPassword = null;
    };

    services.onAuth = function (callback) {
      if (typeof callback === "function") firebaseAuth.$onAuth(callback);
    };

    services.getFirebaseAuth = function () {
      return firebaseAuth;
    };

    services.waitForAuth = function () {
      return firebaseAuth.$waitForAuth();
    };

    services.requireAuth = function () {
      return firebaseAuth.$requireAuth();
    };

    internals.setUserData = function (authData) {
      var userData = {
        facebook: function (authData) {
          currentUser.fuid = authData.uid;
          currentUser.email = authData.facebook.cachedUserProfile.email;
          currentUser.displayName = authData.facebook.displayName;
          currentUser.firstName = authData.facebook.cachedUserProfile.first_name;
          currentUser.lastName = authData.facebook.cachedUserProfile.last_name;
          currentUser.nickName = authData.facebook.displayName;
          currentUser.gender = authData.facebook.cachedUserProfile.gender;
          currentUser.picture = authData.facebook.cachedUserProfile.picture.data.url;
          currentUser.active = true;
          currentUser.provider = authData.provider;
          currentUser.isTemporaryPassword = false;
          currentUser.facebookAccessToken = authData.facebook.accessToken;
          currentUser.status = "memory";
        },
        google: function (authData) {
          currentUser.guid = authData.uid;
          currentUser.email = authData.google.cachedUserProfile.email;
          currentUser.displayName = authData.google.displayName;
          currentUser.firstName = authData.google.cachedUserProfile.given_name;
          currentUser.lastName = authData.google.cachedUserProfile.family_name;
          currentUser.nickName = authData.google.displayName;
          currentUser.gender = authData.google.cachedUserProfile.gender;
          currentUser.picture = authData.google.cachedUserProfile.picture;
          currentUser.active = true;
          currentUser.provider = authData.provider;
          currentUser.isTemporaryPassword = false;
          currentUser.googleAccessToken = authData.google.accessToken;
          currentUser.status = "memory";
        },
        twitter: function (authData) {
          // twitter don't provide user email until now
          currentUser.tuid = authData.uid;
          currentUser.email = authData.twitter.username + "@twitter.com";
          currentUser.displayName = authData.twitter.displayName;
          currentUser.nickName = authData.twitter.username;
          currentUser.picture = authData.twitter.cachedUserProfile.profile_image_url;
          currentUser.active = true;
          currentUser.provider = authData.provider;
          currentUser.isTemporaryPassword = false;
          currentUser.twitterAccessToken = authData.twitter.accessToken;
          currentUser.twitterAccessTokenSecret = authData.twitter.accessTokenSecret;
          currentUser.status = "memory";
        },
        password: function (authData) {
          // twitter don't provide user email until now
          currentUser.tuid = authData.uid;
          currentUser.email = authData.password.email;
          currentUser.isTemporaryPassword = authData.password.isTemporaryPassword;
          currentUser.status = "memory";
        }
      };

      try {
        userData[authData.provider](authData);
        return true;
      } catch (e) {
        $log.error("setUserData error: " + e);
        return false;
      }
    };

    internals.getSocialScope = function (provider) {
      return {
        facebook: {
          scope: "email"
        },
        google: {
          scope: "email"
        },
        twitter: {
          scope: "email"
        }
      }[provider];
    };

    services.getFirebaseRef = function () {
      return firebaseRef;
    };

    services.signIn = function (callback) {
      currentPassword = currentUser.password;
      firebaseAuth.$authWithPassword({
        email: currentUser.email,
        password: currentPassword
      }).then(function (authData) {
        $log.info("User " + authData.uid + " is logged in with " + authData.provider);
        //$log.info("authData: " + angular.toJson(authData, true));

        // set current user in background
        firebaseRef.child("users").child(internals.encodeEmail(currentUser.email)).once('value', function (snapshot) {
          currentUser = snapshot.val();
        });
        if (typeof callback === "function") callback(null);
      }).catch(function (error) {
        $log.info("Login Failed!", error);
        if (typeof callback === "function") callback(error);
      });
    };

    services.socialSignIn = function (provider, callback) {
      var authScope = internals.getSocialScope(provider);
      // prefer pop-ups, so we don't navigate away from the page
      firebaseAuth.$authWithOAuthPopup(provider, authScope).then(function (authData) {
        internals.socialSingInHandler(authData, callback);
      }).catch(function (error) {
        if (error && error.code === "TRANSPORT_UNAVAILABLE") {
          // fall-back to browser redirects, and pick up the session
          // automatically when we come back to the origin page
          firebaseAuth.$authWithOAuthRedirect(provider, authScope).then(function (authData) {
            internals.socialSingInHandler(authData, callback);
          }).catch(function (error) {
            $log.error("Error socialSignIn: " + error);
            if (typeof callback === "function") callback(error);
          });
        } else {
          $log.error("Error socialSignIn: " + error);
          if (typeof callback === "function") callback(error);
        }
      });
    };

    internals.socialSingInHandler = function (authData, callback) {
      if (internals.setUserData(authData)) {
        // update app user
        internals.updateAppUser(callback);
      } else {
        var error = new Error();
        error.name = "setUserDataError";
        error.message = "Cant update app user with social data";
        $log.error(error.message);
        callback(error);
      }
    };

    internals.encodeEmail = function (email) {
      return email.replace(/\./g, ':');
    };

    // Save or update current user
    internals.updateAppUser = function (callback) {
      if (currentUser.email) {
        firebaseRef.child("users").once("value", function (snapshot) {
          var encEmail = internals.encodeEmail(currentUser.email);
          if (snapshot.hasChild(encEmail)) {
            currentUser.status = "updated";
            firebaseRef.child("users").child(encEmail).update(currentUser, function (error) {
              if (error) {
                $log.error("Update app user error: " + error);
                if (typeof callback === "function") callback(error);
              } else {
                $log.info("The app user had been updated");
                if (typeof callback === "function") callback(null);
              }
            });
          } else {
            // the app user doen't exist
            internals.createAppUser(callback);
          }
        });
      } else {
        if (typeof callback === "function") callback(internals.noEmailError);
      }
    };

    internals.createAppUser = function (callback) {
      if (currentUser.email) {
        currentUser.status = "stored";
        firebaseRef.child("users").child(internals.encodeEmail(currentUser.email)).set(currentUser, function (error) {
          if (error) {
            $log.error("Create app user error: " + error);
            currentUser.status = "error";
          }
          if (typeof callback === "function") callback(error);          
        });
      } else {
        if (typeof callback === "function") callback(internals.noEmailError);
      }
    };

    // create firabase auth user 
    services.createUser = function (callback) {
      $log.info("Create User Function called");
      // email is the key
      if (currentUser.email) {
        firebaseAuth.$createUser({
          email: currentUser.email,
          password: uuid2.newuuid() // random password
        }).then(function (authData) {
          currentUser.provider = "password";
          currentUser.uid = authData.uid;
          // reset password and send email
          services.resetPassword(currentUser.email, function(error){
              if(error){
                  $log.error("Error reseting password: " + error)
              }
              // whe need update or create internal app user
              internals.updateAppUser(callback);
          });          
        }).catch(function (error) {
          console.log("Error creating user:", error);
          if (typeof callback === "function") callback(error);
        });
      } else {
        if (typeof callback === "function") callback(internals.noEmailError);
      }
    };

    internals.noEmailError = function () {
      var error = new Error();
      $log.error("The current user has not email");
      error.name = "noEmailError";
      error.message = "The current user has not email";
      return error;
    };

    services.signOut = function (callback) {
      if (firebaseAuth.$getAuth()) firebaseAuth.$unauth();
      internals.clearCurrentUser();
      if (typeof callback === "function") callback();
    };

    services.resetPassword = function (email, callback) {
      firebaseRef.resetPassword({
        email: currentUser.email
      }, function (error) {
        if (typeof callback === "function") callback(error);
      });
    };

    services.changePassword = function (oldPassword, newPassword, callback) {
      firebaseRef.changePassword({
        email: currentUser.email,
        oldPassword: oldPassword,
        newPassword: newPassword
      }, function (error) {
        if (typeof callback === "function") callback(error)
      });
    };

    return services;
  }];

});