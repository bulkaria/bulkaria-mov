angular.module('bulkaria-mov.controllers', [])

.controller('LoginCtrl', ["$log", "$scope", "$ionicModal", "$state", "$ionicLoading", "$rootScope", "gettextCatalog", "popup", "auth",
  function ($log, $scope, $ionicModal, $state, $ionicLoading, $rootScope, gettextCatalog, popup, auth) {
    $log.info('Login Controller Initialized');
    $scope.user = auth.getCurrentUser();

    // Handle auth and route to a home page
    $scope.authHandler = function (error) {
      if($ionicLoading.isOpen) $ionicLoading.hide();
      
      if (error) {
        $log.info("Login Failed!", error);
        popup.alert("Authentication failed", error);
      } else {
        $log.info("User " + $scope.user.uid + " is logged in with " + $scope.user.provider);

        //$scope.user = auth.getCurrentUser():
          
        // we need an email, if not the user could not login
        if ($scope.user.email) {
          $ionicModal.fromTemplateUrl('templates/get-email.html', {
            scope: $scope,
            animation: 'slide-in-up'
          }).then(function (modal) {
            $scope.modal = modal;
            modal.show();
          });
        } else {
          if ($scope.user.provider === "password" && $scope.user.isTemporaryPassword) {
            // TODO
            // send to change password
            $state.go('groups');
          } else {
            $state.go('groups');
          }          
        }
      }
    };
  
    $scope.setUserEmail = function (email, callback) {
      if(email) {
        $scope.user.email = email;
        if($scope.user.uid) auth.saveUser();
      } else {
        auth.signOut();
      }
      if (typeof callback === "function") callback();
    };
    
    $scope.signIn = function (user) {
      if (user && user.email && user.password) {
        $ionicLoading.show();

        auth.signIn(user, $scope.authHandler);
        
      } else
        popup.alert("Authentication failed", "Please enter email and password both");
    };

    $scope.socialSignIn = function (provider) {
      auth.socialSignIn(provider, $scope.authHandler);
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

    $scope.createUser = function (callback) {
      $ionicLoading.show();      
      
      if ($scope.user && $scope.user.email && ($scope.user.nickName || $scope.user.firstName)) {
        var setDisplayName = $scope.user.nickName || ($scope.user.firstName + " " + $scope.user.lastName);

        auth.createUser(function (error) {
          if (error) {
            popup.alert("Create User Error", error);
          } else {
            popup.alert("Create User", "User created successfully! A temporary password was sent for email, this expire in 24h");
            if (typeof callback === "function") callback();
          }
        });
      } else {
        popup.alert("Create User Error", "Please fill all details");
      }
      
      $ionicLoading.hide();
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
        auth.getFirebaseRef().resetPassword({
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

    // TODO
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