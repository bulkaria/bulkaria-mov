angular.module("bulkaria-mov.providers", ["firebase"])

.provider("auth", function backendProvider() {
  var firebaseRef = null;
  var currentUser = null;

  // custom exceptions
  this.noEmailError = function (message) {
    this.name = "noEmailError";
    this.message = (message || "");
  };
  this.noEmailError.prototype = Error.prototype;

  this.noIdError = function (message) {
    this.name = "noIdError";
    this.message = (message || "");
  };
  this.noIdError.prototype = Error.prototype;
  // END custom exceptions
  
  this.setFirebaseRef = function (firebaseUrl) {
    firebaseRef = new Firebase(firebaseUrl);
  };

  this.$get = ["$firebaseAuth", "$log", "uuid2", function ($firebaseAuth, $log, uuid2) {
    var services = {};
    var userModel = {
      uid: null,
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

    services.getSocialData = function (authData) {
      var email = {
        facebook: function (authData) {
          currentUser = {
            uid: authData.uid,
            email: authData.facebook.cachedUserProfile.email,
            displayName: authData.facebook.displayName,
            firstName: authData.facebook.cachedUserProfile.first_name,
            lastName: authData.facebook.cachedUserProfile.last_name,
            nickName: authData.facebook.displayName,
            gender: authData.facebook.cachedUserProfile.gender,
            picture: authData.facebook.cachedUserProfile.picture.url,
            active: true,
            provider: authData.provider,
            isTemporaryPassword: false,
            facebookAccessToken: authData.facebook.accessToken,
            googleAccessToken: null,
            twitterAccessToken: null,
            twitterAccessTokenSecret: null,
            status: "memory"
          };         

        },
        google: function (authData) {
          return authData.google.cachedUserProfile.email;
        },
        twitter: function (authData) {
          // twitter don't provide user email until now
          return null;
        },
        password: function (authData) {
          return authData.password.email;
        }
      };
      return email[authData.provider](authData);
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

    services.signIn = function (user, callback) {
      firebaseRef.authWithPassword({
        email: user.email,
        password: user.password
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
        } else {
          socialSingInHandler(error, authData, callback);
        }
      }, authScope);
    };
    
    var socialSingInHandler = function(error, authData, callback) {
      if (!error) {
        // set current user 
        // TODO
        currentUser.uid = authData.uid;
        currentUser.email = services.getSocialEmail(authData);
        services.saveCurrentUser(callback);
      }
      if (typeof callback === "function") callback(error);
    };    

    services.signOut = function (callback) {
      if (firebaseRef.getAuth()) firebaseRef.unauth();
      currentUser = userModel;
      if (typeof callback === "function") callback();
    };

    // create both, Firebase and app user
    services.createUser = function (callback) {
      $log.info("Create User Function called");

      if (currentUser.email) {
        firebaseRef.createUser({
          email: currentUser.email,
          password: uuid2.newuuid() // random password
        }, function (error, userData) {
          if (error) {
            $log.error("Error creating user:", error);
            if (typeof callback === "function") callback(error);
          } else {
            currentUser.uid = userData.uid;
            services.saveCurrentUser(callback);
          }
        });
      } else {
        if (typeof callback === "function") callback(new noEmailError("You need porvide an valid email address"));
      }
    };

    // Save or update current user
    services.saveCurrentUser = function (callback) {
      if (currentUser.uid) {
        firebaseRef.child("users").child(currentUser.uid).set(currentUser, function (error) {
          if (error) {
            $log.error("Create app user error: " + error);
            if (typeof callback === "function") callback(error);
          } else {
            currentUser.status = "saved";
            if (currentUser.provider === "password") {
              // reset password and send email
              firebaseRef.resetPassword({
                email: currentUser.email
              }, function (error) {
                if (error) {
                  firebaseRef.child("users").child(currentUser.uid).remove(function (error) {
                    if (error) {
                      $log.error('Remove user: Oops! something went wrong. Try again later');
                    } else {
                      $log.info('Remove user: Successfully deleted');
                    }
                  });
                  if (typeof callback === "function") callback(error);
                } else {
                  $log.info("Successfully created user account with uid:", currentUser.uid);
                  if (typeof callback === "function") callback(null);
                }
              });
            }
          }
        });
      } else {
        $log.error("The current user has not user ID");
        if (typeof callback === "function") callback(new noIdError("The current user has not user ID"));
      }
    };

    services.resetPassword = function (email, callback) {
      firebaseRef.resetPassword(email, callback);
    };

    return services;
  }];

});