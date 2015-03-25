angular.module('bulkaria-mov.controllers', [])

.controller('LoginCtrl', ["$log", "$scope", "$ionicModal", "$state", "$ionicLoading", "$rootScope", "gettextCatalog", "popup", "auth",
  function ($log, $scope, $ionicModal, $state, $ionicLoading, $rootScope, gettextCatalog, popup, auth) {
    $log.info('Login Controller Initialized');
    // link current user to variable scope for use in controller an views
    $scope.user = auth.getCurrentUser();

    $scope.signIn = function () {
      if ($scope.user && $scope.user.email && $scope.user.password) {
        $ionicLoading.show();

        auth.signIn(function(error) {
          $ionicLoading.hide();
          if(error) {
            popup.alert("Authentication failed", error);
          } else {
            $log.info("User " + $scope.user.uid + " is logged in with " + $scope.user.provider);
            if ($scope.user.provider === "password" && $scope.user.isTemporaryPassword) {
              // TODO
              // send to change password
              $state.go('groups');
            } else {
              $state.go('groups');
            }                
          }        
        });
      } else
        popup.alert("Authentication failed", "Please enter email and password both");
    };

    $scope.socialSignIn = function (provider) {
      auth.socialSignIn(provider, function(error){
        if (error && error.name === "noEmailError") {
          $scope.askUserEmail();
        } else if (error) {
          popup.alert("Authentication failed", error);
        } else {
          $log.info("User " + $scope.user.uid + " is logged in with " + $scope.user.provider);
          $state.go('groups');
        }
      });
    };    
    
    $scope.askUserEmail = function(callback) {
      $scope.userEmail = null;
      $ionicModal.fromTemplateUrl('templates/get-email.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.modal = modal;
        modal.show();
      });
      $scope.$on('modal.hidden', function() {
        if($scope.userEmail) {
          auth.getCurrentUser().email = $scope.userEmail;
          auth.createUser(function(error) {
            if(error) {
              popup.alert("Authentication failed", error.message);
              auth.signOut();
            } else {
              $log.info("User " + $scope.user.uid + " is logged in with " + $scope.user.provider);
              $state.go('groups');              
            }          
          });
        } else {
          $log.error("Logoff user because not had provided email");
          popup.alert("Authentication failed", "Logoff user because not had provided email");
          auth.signOut();
        }
      });      
    };
    
    // signUp and createUser are hardnets cupled!
    // TODO validar el form de alta de cuenta
    $scope.signUp = function () {
      $ionicModal.fromTemplateUrl('templates/signup.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.modal = modal;
        modal.show();
      });
      $scope.$on('modal.hidden', function() {
        $ionicLoading.show();      

        var setDisplayName = $scope.user.nickName || ($scope.user.firstName + " " + $scope.user.lastName);

        auth.createUser(function (error) {
          if (error) {
            popup.alert("Create User Error", error);
          } else {
            popup.alert("Create User", "User created successfully! A temporary password was sent for email, this expire in 24h");
          }
        });
        
        $ionicLoading.hide();        
      });
    };

    /***
    // signUp and createUser are hardnets cupled!
    $scope.createUser = function (successFunction) {
      $ionicLoading.show();      
      
      if ($scope.user && $scope.user.email && ($scope.user.nickName || $scope.user.firstName)) {
        var setDisplayName = $scope.user.nickName || ($scope.user.firstName + " " + $scope.user.lastName);
        
        auth.createUser(function (error) {
          if (error) {
            popup.alert("Create User Error", error);
          } else {
            popup.alert("Create User", "User created successfully! A temporary password was sent for email, this expire in 24h");
            successFunction();
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
    ***/

    $scope.resetPassword = function (resetToEmail, successFunction) {
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
        successFunction();
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