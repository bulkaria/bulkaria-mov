angular.module('bulkaria-mov.controllers', [])

.controller('LoginCtrl', function ($log, $scope, $ionicModal, $ionicPopup, $state, $firebaseAuth, $ionicLoading, $rootScope, uuid2, gettextCatalog, popup, getEmail) {
  
  $log.info('Login Controller Initialized');

  var ref = new Firebase($scope.firebaseUrl);
  
  // Create a callback to handle the result of the authentication
  var authHandler = function (error, authData) {
    if (error) {
      $log.info("Login Failed!", error);
      popup.alert("Authentication failed", error.message);
      $ionicLoading.hide();
    } else {
      $log.info("User " + authData.uid + " is logged in with " + authData.provider);

  
      getEmail[authData.provider](authData);
      
      /*
      switch (authData.provider) {
      case "facebook":
        break;
      case "google":
        break;
      case "twitter":
        break;
      };
      */
      
      ref.child("users").child(authData.uid).once('value', function (snapshot) {
        var val = snapshot.val();
        // To Update AngularJS $scope either use $apply or $timeout
        $scope.$apply(function () {
          $rootScope.currentUser = val;
        });
      });
      $state.go('groups');
    }
  };

  var getFacebookEmail = function(authData) {
  };
  
  var getGoogleEmail = function(authData) {
  };
  
  var getTwitterEmail = function(authData) {
  };
  
  
  
  
  /*
  $scope.user = {
    email: 'test1@foo.com',
    password: '1234'
  };
  */

  $scope.signIn = function (user) {
    if (user && user.email && user.password) {
      $ionicLoading.show();
      ref.authWithPassword({
        email: user.email,
        password: user.password
      }, authHandler);
      $ionicLoading.hide();
    } else
      popup.alert("Authentication failed", "Please enter email and password both");
  };

  $scope.socialSignIn = function (provider) {
    // prefer pop-ups, so we don't navigate away from the page
    ref.authWithOAuthPopup(provider, function (error, authData) {
      if (error && error.code === "TRANSPORT_UNAVAILABLE")
      // fall-back to browser redirects, and pick up the session
      // automatically when we come back to the origin page
        ref.authWithOAuthRedirect(provider, authHandler);
      else
        authHandler(error, authData);
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

      ref.createUser({
        email: user.email,
        password: uuid2.newuuid()
      }, function (error, userData) {
        if (error) {
          $log.error("Error creating user:", error);
          popup.alert("Create User Error", error);
        } else {
          ref.child("users").child(userData.uid).set({
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

      /*
      auth.$createUser({
        email: user.email,
        password: uuid2.newuuid()
      }).then(function (userData) {
        ref.child("users").child(userData.uid).set({
          email: user.email,
          displayName: setDisplayName,
          firstName: user.firstName,
          lastName: user.lastName,
          nickName: user.nickName
        });

        popup.alert("Create User", "User created successfully!");
        $ionicLoading.hide();
        $scope.modal.hide();

      }).catch(function (error) {
        popup.alert("Create User Error", error);
        $ionicLoading.hide();
      });
      */

    } else
      popup.alert("Create User Error", "Please fill all details");
  }

  $scope.forgotPassword = function () {
    $ionicModal.fromTemplateUrl('templates/reset-password.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.modal = modal;
      modal.show();
    });
  };

  $scope.resetPassword = function (resetEmail) {
    if (resetEmail) {
      $ionicLoading.show();
      ref.resetPassword({
        email: resetEmail
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

})

.controller('ChatCtrl', function ($scope, Chats, $state) {
  //console.log("Chat Controller initialized");
  $scope.IM = {
    textMessage: ""
  };

  Chats.selectRoom($state.params.roomId);

  var roomName = Chats.getSelectedRoomName();

  // Fetching Chat Records only if a Room is Selected
  if (roomName) {
    $scope.roomName = " - " + roomName;
    $scope.chats = Chats.all();
  }

  $scope.sendMessage = function (msg) {
    console.log(msg);
    Chats.send($scope.displayName, msg);
    $scope.IM.textMessage = "";
  }

  $scope.remove = function (chat) {
    Chats.remove(chat);
  }
})

.controller('RoomsCtrl', function ($scope, Rooms, Chats, $state) {
  //console.log("Rooms Controller initialized");
  $scope.rooms = Rooms.all();

  $scope.openChatRoom = function (roomId) {
    $state.go('tab.chat', {
      roomId: roomId
    });
  }
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