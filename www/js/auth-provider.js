angular.module("bulkaria-mov.providers", ["firebase"])

.provider("auth", function backendProvider() {
  var firebaseRef = null;
  var currentUser = null;

  this.setFirebaseRef = function (firebaseUrl) {
    firebaseRef = new Firebase(firebaseUrl);
  };

  this.$get = ["$firebaseAuth", "$log", "uuid2", function ($firebaseAuth, $log, uuid2) {
    var services = {};
    var userModel = {
      uid: null,
      fuid: null,
      guid: null,
      tuid: null, 
      email: null,
      displayName: null,
      firstName: null,
      lastName: null,
      nickName: null,
      gender: null,
      picture: null,
      active: false,
      provider: null,
      isTemporaryPassword: null,
      facebookAccessToken: null,
      googleAccessToken: null,
      twitterAccessToken: null,
      twitterAccessTokenSecret: null,
      status: "memory"
    };      
    
    currentUser = userModel;
    
    services.getCurrentUser = function () {
      return currentUser;
    };

    services.setSocialData = function (authData) {
      var socialData = {
        facebook: function (authData) {
          currentUser = {
            fuid: authData.uid,
            email: authData.facebook.cachedUserProfile.email,
            displayName: authData.facebook.displayName,
            firstName: authData.facebook.cachedUserProfile.first_name,
            lastName: authData.facebook.cachedUserProfile.last_name,
            nickName: authData.facebook.displayName,
            gender: authData.facebook.cachedUserProfile.gender,
            picture: authData.facebook.cachedUserProfile.picture.data.url,
            active: true,
            provider: authData.provider,
            isTemporaryPassword: false,
            facebookAccessToken: authData.facebook.accessToken,
            status: "memory"
          };         
        },
        google: function (authData) {
          currentUser = {
            guid: authData.uid,
            email: authData.google.cachedUserProfile.email,
            displayName: authData.google.displayName,
            firstName: authData.google.cachedUserProfile.given_name,
            lastName: authData.google.cachedUserProfile.family_name,
            nickName: authData.google.displayName,
            gender: authData.google.cachedUserProfile.gender,
            picture: authData.google.cachedUserProfile.picture,
            active: true,
            provider: authData.provider,
            isTemporaryPassword: false,
            googleAccessToken: authData.google.accessToken,
            status: "memory"
          };         
        },
        twitter: function (authData) {
          // twitter don't provide user email until now
          currentUser = {
            tuid: authData.uid,
            displayName: authData.twitter.displayName,
            nickName: authData.twitter.username,
            picture: authData.twitter.cachedUserProfile.profile_image_url,
            active: true,
            provider: authData.provider,
            isTemporaryPassword: false,
            twitterAccessToken: authData.twitter.accessToken,
            twitterAccessTokenSecret: authData.twitter.accessTokenSecret,
            status: "memory"
          };         
        }
      };
      
      try {
        socialData[authData.provider](authData);
        return true;
      } catch(e) {
        $log.error("setSocialData error: " + e);
        return false;
      }
    };

    services.getSocialScope = function (provider) {
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

    services.status = function () {
      return $firebaseAuth(firebaseRef);
    };

    services.signIn = function (callback) {
      firebaseRef.authWithPassword({
        email: currentUser.email,
        password: currentUser.password
      }, function (error, authData) {
        if (error) {
          $log.info("Login Failed!", error);
          if (typeof callback === "function") callback(error);
        } else {
          $log.info("User " + authData.uid + " is logged in with " + authData.provider);

          //$log.info("authData: " + angular.toJson(authData, true));

          // set current user
          firebaseRef.child("users").child(authData.uid).once('value', function (snapshot) {
            currentUser = val();
          });
        }
      });
    };

    services.socialSignIn = function (provider, callback) {
      var authScope = services.getSocialScope(provider);

      // prefer pop-ups, so we don't navigate away from the page
      firebaseRef.authWithOAuthPopup(provider, function (error, authData) {
        if (error && error.code === "TRANSPORT_UNAVAILABLE") {
        // fall-back to browser redirects, and pick up the session
        // automatically when we come back to the origin page
          firebaseRef.authWithOAuthRedirect(provider, socialSingInHandler(error, authData, callback), authScope);
        } else if (error) {
        } else {
          if (services.setSocialData(authData)) {
            // create or update app user
            services.createUser(callback);
          } else {
            $log.error("Cant update app user with social data");
          }
        }
      }, authScope);
    };
    
    services.signOut = function (callback) {
      if (firebaseRef.getAuth()) firebaseRef.unauth();
      currentUser = userModel;
      if (typeof callback === "function") callback();
    };

    // create both, Firebase and app user or update if exists
    services.createUser = function (callback) {
      $log.info("Create User Function called");

      // email is the key
      if (currentUser.email) {
        firebaseRef.createUser({
          email: currentUser.email,
          password: uuid2.newuuid() // random password
        }, function (error, userData) {
          if (error) {
            if(currentUser.provider !== "password" && error.code === "EMAIL_TAKEN") {
              // the user exists but is trying to access via other provider
              // get uid from existing user
              firebaseRef.child("users").startAt(currentUser.email).endAt(currentUser.email).once('value', function(snap) {
                snap.forEach(function(childSnap) {
                  currentUser.uid = childSnap.val().uid;
                  // then update if needed              
                  services.updateUser(callback);
                  return true;
                });
              });              
            } else {
              console.log("Error creating user:", error);          
              if (typeof callback === "function") callback(error);
            }
          } else {
            // is a new user, then we need create own internal user
            // update new uid
            currentUser.uid = userData.uid;
            // update status
            currentUser.status = "stored";
            // set provider
            if(!currentUser.provider) currentUser.provider = "password";
            // create app user
            firebaseRef.child("users").child(currentUser.uid).setWithPriority(currentUser, currentUser.email,function (error) {
              if (error) {
                $log.error("Create app user error: " + error);
                currentUser.status = "error";
                if (typeof callback === "function") callback(null);
              } else {
                // if the procider is firebase, we need sen a nre password
                if (currentUser.provider === "password") {
                  // reset password and send email
                  firebaseRef.resetPassword({
                    email: currentUser.email
                  }, function (error) {
                    if (error) {
                      $log.error("Error in resert user password: " + error);
                    } else {
                      $log.info("Successfully created user account with uid: " + currentUser.uid);
                    }
                    if (typeof callback === "function") callback(null);
                  });
                }
              }
            });
          }
        });
      } else {
        if (typeof callback === "function") {
          callback({name: "noEmailError", message: "No email address informed"});
        }
      }
    };
    
    // Save or update current user
    services.updateUser = function (callback) {
      if (currentUser.uid) {
        firebaseRef.child("users").child(currentUser.uid).update(currentUser, function (error) {
          if (error) {
            $log.error("Update app user error: " + error);
            if (typeof callback === "function") callback(error);
          } else {
            $log.error("The app user had been updated");
            if (typeof callback === "function") callback(null);
          }
        });
      } else {
        $log.error("The current user has not user ID");
        if (typeof callback === "function") {
          callback({name: "noIdError", message: "The current user has not user ID"});
        }
      }
    };

    services.resetPassword = function (email, callback) {
      firebaseRef.resetPassword(email, callback);
    };

    return services;
  }];

});