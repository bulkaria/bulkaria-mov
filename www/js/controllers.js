'use strict';
angular.module('bulkaria-mov.controllers', ["firebase"])

.controller('LoginCtrl', ["$log", "$scope", "$ionicModal", "$state", "$ionicLoading", "$rootScope", "gettextCatalog", "popup", "auth",
  function ($log, $scope, $ionicModal, $state, $ionicLoading, $rootScope, gettextCatalog, popup, auth) {
    $log.info('Login Controller Initialized');

    // link current user to a scope variable for use in controller and views
    $scope.user = auth.getCurrentUser();

    // need it to manage modal forms  
    $scope.hideModal = function (action) {
      $scope.modelAction = action;
      $scope.$emit("modal.request-hide", action)
    };

    $scope.signIn = function () {
      if ($scope.user && $scope.user.email && $scope.user.password) {
        $ionicLoading.show();

        auth.signIn(function (error) {
          $ionicLoading.hide();
          // only deal with error, if not the login event is trapped for app.js
          if (error) {
            popup.alert("Authentication failed", error);
          }
        });
      } else
        popup.alert("Authentication failed", "Please enter email and password both");
    };

    $scope.socialSignIn = function (provider) {
      auth.socialSignIn(provider, function (error) {
        if (error) {
          popup.alert("Authentication failed", error);
        } else {
          $log.info("User " + $scope.user.uid + " is logged in with " + $scope.user.provider);
          $state.go('main.groups');
        }
      });
    };

    // TODO validar el form de alta de cuenta
    $scope.signUp = function () {
      $ionicModal.fromTemplateUrl('templates/signup.html', {
        scope: $scope,
        animation: 'slide-in-up',
        focusFirstInput: true
      }).then(function (modal) {
        $scope.modal = modal;
        modal.show();
      });
      var detachOn = $scope.$on('modal.request-hide', function (event, action) {
        if (action === "ok") {
          var setDisplayName = $scope.user.nickName || ($scope.user.firstName + " " + $scope.user.lastName);
          $ionicLoading.show();
          auth.createUser(function (error) {
            if (error) {
              popup.alert("Create User Error", error);
            } else {
              popup.alert("Create User", "User created successfully! A temporary password was sent for email, this expire in 24h");
            }
            $ionicLoading.hide();
            $scope.modal.hide();
          });
        } else {
          $scope.modal.hide();
        }
        $scope.modal.hide();
        detachOn();
      });
    };

    $scope.forgotPassword = function () {
      $ionicModal.fromTemplateUrl('templates/reset-password.html', {
        scope: $scope,
        animation: 'slide-in-up',
        focusFirstInput: true
      }).then(function (modal) {
        $scope.modal = modal;
        modal.show();
      });
      var detachOn = $scope.$on('modal.request-hide', function (event, action) {
        if (action === "ok") {
          $ionicLoading.show();
          auth.getRootRef().resetPassword({
            email: $scope.user.email
          }, function (error) {
            $ionicLoading.hide();
            if (error) {
              $log.info("Error sending password reset email:", error);
              popup.alert("Wrong!", error);
            } else {
              $log.info("Password reset email sent successfully");
              popup.alert("Congrat!", "We sent you an email with a new password that expire at in 24h");
            }
            $scope.modal.hide();
          });
        } else {
          $scope.modal.hide();
        }
        detachOn();
      });
    };

    $scope.$on("$destroy", function () {
      if ($scope.modal) $scope.modal.destroy();
    });
}])

.controller("ChangePasswordCtrl", ["$log", "$scope", "$ionicModal", "$state", "$ionicLoading", "$rootScope", "gettextCatalog", "popup", "auth",
  function ($log, $scope, $ionicModal, $state, $ionicLoading, $rootScope, gettextCatalog, popup, auth) {
    $log.info("Change Password Controller initialized");

    $scope.currentPassword = auth.getCurrentPassword();
    $scope.newPassword = "";
    $scope.newPasswordCtrl = "";

    $scope.changePassword = function (currentPassword, newPassword) {
      $ionicLoading.show();
      auth.changePassword(currentPassword, newPassword, function (error) {
        $ionicLoading.hide();
        if (error) {
          $log.info("Error changing password:", error);
          popup.alert("Change password", error);
        } else {
          $log.info("Password changed successfully");
          popup.alert("Congrat!", "Password changed successfully");
          $state.go('main.groups');
        }
      });
    };
}])

.controller("MainCtrl", ["$rootScope", "$scope", "$state", "$log", "auth", function ($rootScope, $scope, $state, $log, auth) {
  $log.info("Main Controller initialized");

  $rootScope.$on("userReady", function () {
    $scope.$apply(function () {
      $scope.user = auth.getCurrentUser();

      if (!$scope.user.picture) {
        switch ($scope.gender) {
        case "male":
          $scope.user.picture = "/img/male-avatar.svg";
          break;
        case "female":
          $scope.user.picture = "/img/female-avatar.svg";
          break;
        default:
          $scope.user.picture = "/img/generic-avatar.svg";
        }
      }
    });
  });

}])

.controller("ProfileCtrl", ["$rootScope", "$scope", "auth", "$state", "$log", function ($rootScope, $scope, auth, $state, $log) {
  $log.info("Profile Controller initialized");


}])

.controller("GroupsCtrl", ["$rootScope", "$scope", "$state", "$log", "auth",
  function ($rootScope, $scope, $state, $log, auth) {

  $log.info("Groups Controller initialized");

  $scope.finishRender = false;

  $scope.groups = $rootScope.objUser.getGroups();

  $scope.$on('ngRepeatFinished', function(ngRepeatFinishedEvent) {
    $scope.finishRender = true; 
  });

  $scope.openGroup = function (groupId) {
    $rootScope.currentGroupId = groupId;
    $state.go('main.tabs.wall');
  };

}])

.controller("GroupWallCtrl", ["$rootScope", "$scope", "auth", "$state", "$log", function ($rootScope, $scope, auth, $state, $log) {
  $log.info("Group Wall Controller initialized");

}])

.controller("GroupConfigCtrl", ["$rootScope", "$scope", "auth", "$state", "$log", function ($rootScope, $scope, auth, $state, $log) {
  $log.info("Group Config Controller initialized");

}])

.controller("GroupResolveCtrl", ["$rootScope", "$scope", "auth", "$state", "$log", function ($rootScope, $scope, auth, $state, $log) {
  $log.info("Group Resolve Controller initialized");

}])

/*
.controller("GroupMembersCtrl", ["$rootScope", "$scope", "auth", "$state", "$log", "groupFactory", function ($rootScope, $scope, auth, $state, $log, groupFactory) {
  $log.info("Group Members Controller initialized");

  var groupObj = new groupFactory($rootScope.currentGroupId);
  $scope.finishRender = false;
  $scope.members = [];

  $scope.members = groupObj.getMembers();

  $scope.$on('ngRepeatFinished', function(ngRepeatFinishedEvent) {
    $scope.finishRender = true; 
  });

}])
*/

.controller("GroupMembersCtrl", ["$rootScope", "$scope", "auth", "$state", "$log", "groupFactory", function ($rootScope, $scope, auth, $state, $log, groupFactory) {
  $log.info("Group Members Controller initialized");

  var groupObj = new groupFactory($rootScope.currentGroupId);
  $scope.finishRender = false;
  $scope.members = [];

  // get a promise for members array
  groupObj.membersArray().then(function(mArray) {
    $scope.members = mArray;
  });  
  
  $scope.$on('ngRepeatFinished', function(ngRepeatFinishedEvent) {
    $scope.finishRender = true; 
  });

}])
;