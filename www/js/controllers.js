angular.module('bulkaria-mov.controllers', [])

.controller('LoginCtrl', function ($log, $scope, $ionicModal, $ionicPopup, $state, $firebaseAuth, $ionicLoading, $rootScope, uuid2, gettextCatalog, popup, getEmail) {

  $log.info('Login Controller Initialized');

  $scope.ref = new Firebase($scope.firebaseUrl);

  // Create a callback to handle the result of the authentication
  $scope.authHandler = function (error, authData) {
    if (error) {
      $log.info("Login Failed!", error);
      popup.alert("Authentication failed", error.message);
      $ionicLoading.hide();
    } else {
      $log.info("User " + authData.uid + " is logged in with " + authData.provider);

      $scope.authData = authData;
      $scope.userEmail = getEmail[authData.provider](authData);

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
      $scope.ref.unauth();
      popup.alert("You can't login", "You need porvide an valid email address");
    } else {
      $scope.ref.child("users").child(authData.uid).once('value', function (snapshot) {
        var val = snapshot.val();
        // To Update AngularJS $scope either use $apply or $timeout
        $scope.$apply(function () {
          $rootScope.currentUser = val;
        });
      });

      if (authData.provider = "password" && authData.password.isTemporaryPassword) {
        $state.go('groups');
      } else {
        $state.go('groups');
      }
    }
  };

  $scope.signIn = function (user) {
    if (user && user.email && user.password) {
      $ionicLoading.show();
      $scope.ref.authWithPassword({
        email: user.email,
        password: user.password
      }, $scope.authHandler);
      $ionicLoading.hide();
    } else
      popup.alert("Authentication failed", "Please enter email and password both");
  };

  $scope.socialSignIn = function (provider) {
    // prefer pop-ups, so we don't navigate away from the page
    $scope.ref.authWithOAuthPopup(provider, function (error, authData) {
      if (error && error.code === "TRANSPORT_UNAVAILABLE")
      // fall-back to browser redirects, and pick up the session
      // automatically when we come back to the origin page
        $scope.ref.authWithOAuthRedirect(provider, $scope.authHandler);
      else
        $scope.authHandler(error, authData);
    });
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
      var setDisplayName = user.nickName || user.firstName;

      $ionicLoading.show();

      $scope.ref.createUser({
        email: user.email,
        password: uuid2.newuuid()
      }, function (error, userData) {
        if (error) {
          $log.error("Error creating user:", error);
          popup.alert("Create User Error", error);
        } else {
          $scope.ref.child("users").child(userData.uid).set({
            email: user.email,
            displayName: setDisplayName,
            firstName: user.firstName,
            lastName: user.lastName,
            nickName: user.nickName
          });

          $log.info("Successfully created user account with uid:", userData.uid);
          popup.alert("Create User", "User created successfully!");
          $scope.modal.hide();
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
      $scope.ref.resetPassword({
        email: resetToEmail
      }, function (error) {
        if (error === null) {
          $log.info("Password reset email sent successfully");
        } else {
          $log.info("Error sending password reset email:", error);
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
})

.controller('GroupsCtrl', function ($scope, Groups, $state) {
  console.log("Groups Controller initialized");

  $scope.groups = Groups.all();

  $scope.openGroup = function (groupId) {
    $state.go('tabs', {
      groupId: groupId
    });
  }
});