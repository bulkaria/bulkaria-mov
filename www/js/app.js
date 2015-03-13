// Ionic bulkaria-mov App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'bulkaria-mov' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'bulkaria-mov.services' is found in services.js
// 'bulkaria-mov.controllers' is found in controllers.js
angular.module('bulkaria-mov', ['ionic', 'bulkaria-mov.controllers', 'bulkaria-mov.services', 'firebase'])

.factory("Auth", ["$firebaseAuth", "$rootScope",
  function ($firebaseAuth, $rootScope) {
    var ref = new Firebase(firebaseUrl);
    return $firebaseAuth(ref);
  }
]);

.run(function($ionicPlatform, $rootScope) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
    $rootScope.logout = function () {
        console.log("Logging out from the app");
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  // State to represent Login View
  .state('login', {
      url: "/login",
      templateUrl: "templates/login.html",
      controller: 'LoginCtrl',
      resolve: {
          // controller will not be loaded until $waitForAuth resolves
          // Auth refers to our $firebaseAuth wrapper in the example above
          "currentAuth": ["Auth",
              function (Auth) {
                  // $waitForAuth returns a promise so the resolve waits for it to complete
                  return Auth.$waitForAuth();
              }
          ]
      }    
  })

  // State to represent Select Group View
  .state('groups', {
      url: "/groups",
      templateUrl: "templates/groups.html",
      controller: 'GroupsCtrl',
      resolve: {
        // controller will not be loaded until $requireAuth resolves
        // Auth refers to our $firebaseAuth wrapper in the example above
        "currentAuth": ["Auth",
          function (Auth) {
            // $requireAuth returns a promise so the resolve waits for it to complete
            // If the promise is rejected, it will throw a $stateChangeError (see above)
            return Auth.$requireAuth();
          }
        ]
      }    
  })

  // setup an abstract state for the tabs directive
  .state('tab', {
    url: "/tab",
    abstract: true,
    templateUrl: "templates/tabs.html",
    resolve: {
      // controller will not be loaded until $requireAuth resolves
      // Auth refers to our $firebaseAuth wrapper in the example above
      "currentAuth": ["Auth",
        function (Auth) {
          // $requireAuth returns a promise so the resolve waits for it to complete
          // If the promise is rejected, it will throw a $stateChangeError (see above)
          return Auth.$requireAuth();
        }
      ]
    }    
  })

  // Each tab has its own nav history stack:

  .state('tab.dash', {
    url: '/dash',
    views: {
      'tab-dash': {
        templateUrl: 'templates/tab-dash.html',
        controller: 'DashCtrl'
      }
    }
  })

  .state('tab.chats', {
      url: '/chats',
      views: {
        'tab-chats': {
          templateUrl: 'templates/tab-chats.html',
          controller: 'ChatsCtrl'
        }
      }
    })
    .state('tab.chat-detail', {
      url: '/chats/:chatId',
      views: {
        'tab-chats': {
          templateUrl: 'templates/chat-detail.html',
          controller: 'ChatDetailCtrl'
        }
      }
    })

  .state('tab.account', {
    url: '/account',
    views: {
      'tab-account': {
        templateUrl: 'templates/tab-account.html',
        controller: 'AccountCtrl'
      }
    }
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');

});
