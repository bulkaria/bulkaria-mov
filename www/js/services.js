angular.module('bulkaria-mov.services', ['firebase'])

.factory("getEmail", function ($firebaseAuth, $rootScope) {
  return {
    facebook: function(authData) {
      return null;
    },
    google: function(authData) {
      return null;
    },
    twitter: function(authData) {
      return null;
    },
    password: function(authData) {
      return authData.password.email; 
    }
  }
})

.factory("popup", function($ionicPopup, gettextCatalog) {
  return {
    alert: function (title, message) {
      // I must traslated title before because ionicPopup don't allow <translate> injection
      var _title = gettextCatalog.getString(title);
      var alertPopup = $ionicPopup.alert({
        title: _title,
        template: "<translate>" + message + "</translate>",
        cssClass: 'custom-alert',
        okType: 'button-dark'
      });
    }
  }
})

.factory("Auth", ["$firebaseAuth", "$rootScope",
  function ($firebaseAuth, $rootScope) {
    var ref = new Firebase(firebaseUrl);
    return $firebaseAuth(ref);
}])

.factory('Chats', function ($firebase, Rooms) {

  var selectedRoomId;

  var ref = new Firebase(firebaseUrl);
  var chats;

  return {
    all: function () {
      return chats;
    },
    remove: function (chat) {
      chats.$remove(chat).then(function (ref) {
        ref.key() === chat.$id; // true item has been removed
      });
    },
    get: function (chatId) {
      for (var i = 0; i < chats.length; i++) {
        if (chats[i].id === parseInt(chatId)) {
          return chats[i];
        }
      }
      return null;
    },
    getSelectedRoomName: function () {
      var selectedRoom;
      if (selectedRoomId && selectedRoomId != null) {
        selectedRoom = Rooms.get(selectedRoomId);
        if (selectedRoom)
          return selectedRoom.name;
        else
          return null;
      } else
        return null;
    },
    selectRoom: function (roomId) {
      console.log("selecting the room with id: " + roomId);
      selectedRoomId = roomId;
      if (!isNaN(roomId)) {
        chats = $firebase(ref.child('rooms').child(selectedRoomId).child('chats')).$asArray();
      }
    },
    send: function (from, message) {
      console.log("sending message from :" + from.displayName + " & message is " + message);
      if (from && message) {
        var chatMessage = {
          from: from.displayName,
          message: message,
          createdAt: Firebase.ServerValue.TIMESTAMP
        };
        chats.$add(chatMessage).then(function (data) {
          console.log("message added");
        });
      }
    }
  }
})

/**
 * Simple Service which returns Rooms collection as Array from Salesforce & binds to the Scope in Controller
 */
.factory('Rooms', function ($firebase) {
  // Might use a resource here that returns a JSON array
  var ref = new Firebase(firebaseUrl);
  var rooms = $firebase(ref.child('rooms')).$asArray();

  return {
    all: function () {
      return rooms;
    },
    get: function (roomId) {
      // Simple index lookup
      return rooms.$getRecord(roomId);
    }
  }
})

.factory('Groups', function ($firebase) {
  // Might use a resource here that returns a JSON array
  var ref = new Firebase(firebaseUrl);
  var groups = $firebase(ref.child('groups')).$asArray();

  return {
    all: function () {
      return groups;
    },
    get: function (groupId) {
      // Simple index lookup
      return groups.$getRecord(groupId);
    }
  }
});