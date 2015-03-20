angular.module('bulkaria-mov.controllers', [])

.controller('LoginCtrl', function ($scope, $ionicModal, $ionicPopup, $state, $firebaseAuth, $ionicLoading, $rootScope) {
  //console.log('Login Controller Initialized');

  var ref = new Firebase($scope.firebaseUrl);
  var auth = $firebaseAuth(ref);
  $scope.user = {
    email: 'test1@foo.com',
    pwdForLogin: '1234'
  };

  $scope.signIn = function (user) {
    if (user && user.email && user.pwdForLogin) {
      $ionicLoading.show();
      auth.$authWithPassword({
        email: user.email,
        password: user.pwdForLogin
      }).then(function (authData) {
        console.log("Logged in as:" + authData.uid);
        ref.child("users").child(authData.uid).once('value', function (snapshot) {
          var val = snapshot.val();
          // To Update AngularJS $scope either use $apply or $timeout
          $scope.$apply(function () {
            $rootScope.displayName = val;
          });
        });
        $ionicLoading.hide();
        $state.go('groups');
      }).catch(function (error) {
        $scope.showAlert("Authentication failed", error.message);
        $ionicLoading.hide();
      });
    } else
      $scope.showAlert("Authentication failed", "Please enter email and password both");
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
    console.log("Create User Function called");
    if (user && user.email && user.password && user.displayname) {
      $ionicLoading.show();

      auth.$createUser({
        email: user.email,
        password: user.password
      }).then(function (userData) {
        $scope.showAlert("Create User", "User created successfully!");

        ref.child("users").child(userData.uid).set({
          email: user.email,
          displayName: user.displayname
        });

        $ionicLoading.hide();
        $scope.modal.hide();

      }).catch(function (error) {
        $scope.showAlert("Create User Error", error);
        $ionicLoading.hide();
      });
    } else
      $scope.showAlert("Create User Error", "Please fill all details");
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
          console.log("Password reset email sent successfully");
        } else {
          console.log("Error sending password reset email:", error);
        }
      });
      $ionicLoading.hide();
      $scope.modal.hide();
    } else
      $scope.showAlert("Reset Password", "Please fill email");
  };

  $scope.showAlert = function (title, message) {
    var alertPopup = $ionicPopup.alert({
      title: title,
      template: message,
      cssClass: 'custom-alert',
      okType: 'button-dark'
    });
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