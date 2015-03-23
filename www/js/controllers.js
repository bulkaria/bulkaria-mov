angular.module('bulkaria-mov.controllers', [])

.controller('LoginCtrl', ["$log", "$scope", "$ionicModal", "$state", "$firebaseAuth", "$ionicLoading", "$rootScope", "uuid2", "gettextCatalog", "popup", "auth",
  function ($log, $scope, $ionicModal, $state, $firebaseAuth, $ionicLoading, $rootScope, uuid2, gettextCatalog, popup, auth) {

    $log.info('Login Controller Initialized');

    // Create a callback to handle the result of the authentication
    $scope.authHandler = function (error, authData) {
      $ionicLoading.hide();
      if (error) {
        $log.info("Login Failed!", error);
        popup.alert("Authentication failed", error.message);
        $ionicLoading.hide();
      } else {
        $log.info("User " + authData.uid + " is logged in with " + authData.provider);

        //$log.info("authData: " + angular.toJson(authData, true));

        $scope.authData = authData;
        $scope.userEmail = auth.getSocialEmail(authData);
        //getEmail[authData.provider](authData);

        // we need an email, if not the user could not login
        if (!$scope.userEmail) {
          $ionicModal.fromTemplateUrl('templates/get-email.html', {
            scope: $scope,
            animation: 'slide-in-up'
          }).then(function (modal) {
            $scope.modal = modal;
            modal.show();
          });
        } else {
          $scope.setCurrentUserAndGo(authData);
        }
      }
    };

    $scope.setCurrentUserAndGo = function (authData) {
      if (!$scope.userEmail) {
        $rootScope.ref.unauth();
        popup.alert("You can't login", "You need porvide an valid email address");
      } else {
        $rootScope.ref.child("users").child(authData.uid).once('value', function (snapshot) {
          var val = snapshot.val();
          // To Update AngularJS $scope either use $apply or $timeout
          $scope.$apply(function () {
            $rootScope.currentUser = val;
          });
        });

        if (authData.provider === "password" && authData.password.isTemporaryPassword) {
          $state.go('groups');
        } else {
          $state.go('groups');
        }
      }
    };

    $scope.signIn = function (user) {
      if (user && user.email && user.password) {
        $ionicLoading.show();
        $rootScope.ref.authWithPassword({
          email: user.email,
          password: user.password
        }, $scope.authHandler);
      } else
        popup.alert("Authentication failed", "Please enter email and password both");
    };

    $scope.socialSignIn = function (provider) {
      var authScope = auth.getSocialScope(provider);
      //getSocialScope[provider]();
      // prefer pop-ups, so we don't navigate away from the page
      $rootScope.ref.authWithOAuthPopup(provider, function (error, authData) {
        if (error && error.code === "TRANSPORT_UNAVAILABLE")
        // fall-back to browser redirects, and pick up the session
        // automatically when we come back to the origin page
          $rootScope.ref.authWithOAuthRedirect(provider, $scope.authHandler, authScope);
        else
          $scope.authHandler(error, authData);
      }, authScope);
    };

    $scope.signUp = function () {
      $ionicModal.fromTemplateUrl('templates/signup.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.modal = modal;
        modal.show();
      });
    };

    $scope.createUser = function (user) {
      $log.info("Create User Function called");
      if (user && user.email && (user.nickName || user.firstName)) {
        var setDisplayName = user.nickName || (user.firstName + " " + user.lastName);

        $ionicLoading.show();

        $rootScope.ref.createUser({
          email: user.email,
          password: uuid2.newuuid()
        }, function (error, userData) {
          if (error) {
            $log.error("Error creating user:", error);
            popup.alert("Create User Error", error);
          } else {
            $rootScope.ref.child("users").child(userData.uid).set({
              email: user.email,
              displayName: setDisplayName,
              firstName: user.firstName,
              lastName: user.lastName,
              nickName: user.nickName,
              gender: user.gender,
              picture: null,
              active: false,
              facebookAccessToken: null,
              googleAccessToken: null,
              twitterAccessToken: null,
              twitterAccessTokenSecret: null
            });

            // reset password and send email
            $rootScope.ref.resetPassword({
              email: user.email
            }, function (error) {
              if (error) {
                $rootScope.ref.child("users").child(userData.uid).remove(function (error) {
                  if (error) {
                    $log.error('Remove user: Oops! something went wrong. Try again later');
                  } else {
                    $log.info('Remove user: Successfully deleted');
                  }
                });
                popup.alert("Wrong!", error);
              } else {
                $log.info("Successfully created user account with uid:", userData.uid);
                popup.alert("Create User", "User created successfully! A temporary password was sent for email, this expire in 24h");
                $scope.modal.hide();
              }
            });            
          }

          $ionicLoading.hide();
        });
      } else
        popup.alert("Create User Error", "Please fill all details");
    };

    $scope.forgotPassword = function () {
      $ionicModal.fromTemplateUrl('templates/reset-password.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.modal = modal;
        modal.show();
      });
    };

    $scope.resetPassword = function (resetToEmail) {
      if (resetToEmail) {
        $ionicLoading.show();
        $rootScope.ref.resetPassword({
          email: resetToEmail
        }, function (error) {
          if (error) {
            $log.info("Error sending password reset email:", error);
            popup.alert("Wrong!", error);
          } else {
            $log.info("Password reset email sent successfully");
            popup.alert("Congrat!", "We sent you an email with a new password that expire at in 24h");
          }
        });
        $ionicLoading.hide();
        $scope.modal.hide();
      } else
        popup.alert("Reset Password", "Please fill email");
    };

    $scope.changePassword = function () {
      $ionicModal.fromTemplateUrl('templates/change-password.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.modal = modal;
        modal.show();
      });
    };
}])

.controller("GroupsCtrl", ["$scope", "Groups", "$state", function ($scope, Groups, $state) {
  console.log("Groups Controller initialized");

  $scope.groups = Groups.all();

  $scope.openGroup = function (groupId) {
    $state.go('tabs', {
      groupId: groupId
    });
  }
}]);