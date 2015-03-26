// bulkaria-mov

function onDeviceReady() {
  angular.bootstrap(document, ["bulkaria-mov"]);
}

//console.log("binding device ready");
// Registering onDeviceReady callback with deviceready event
document.addEventListener("deviceready", onDeviceReady, false);

// 'bulkaria-mov.services' is found in services.js
// 'bulkaria-mov.controllers' is found in controllers.js
angular.module('bulkaria-mov', [
  'ionic', 
  'firebase', 
  'angularMoment', 
  'bulkaria-mov.controllers', 
  'bulkaria-mov.services', 
  'bulkaria-mov.providers', 
  'bulkaria-mov.directives', 
  'gettext', 
  'angularUUID2'])

// Test here differents spinners for $ionicLoading service
.constant('$ionicLoadingConfig', {
    template: '<ion-spinner icon="android"/>'
    //content: 'Loading Data',
    //animation: 'fade-in',
    //showBackdrop: false,
    //maxWidth: 200,
    //showDelay: 500
})

.constant("firebaseUrl", "https://bulkaria-dev.firebaseio.com")

.config(["authProvider", "firebaseUrl", "$stateProvider", "$urlRouterProvider", function (authProvider, firebaseUrl, $stateProvider, $urlRouterProvider) {
  console.log("setting config");
  
  // set Firebase for auth provider
  authProvider.setFirebaseRef(firebaseUrl);
  
  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  // State to represent Login View
  .state("login", {
    url: "/login",
    templateUrl: "templates/login.html",
    controller: "LoginCtrl",
    resolve: {
      // controller will not be loaded until $waitForAuth resolves
      // Auth refers to our $firebaseAuth wrapper in the example above
      "currentAuth": ["auth",
        function (auth) {
          // $waitForAuth returns a promise so the resolve waits for it to complete
          //return auth.status().$waitForAuth();
          return auth.waitForAuth();
        }]
    }
  })

  // setup an abstract state for change password directive
  .state('change-password', {
    url: "/chgpwd",
    templateUrl: 'templates/change-password.html',
    controller: 'ChangePasswordCtrl',
    resolve: {
      // controller will not be loaded until $requireAuth resolves
      // Auth refers to our $firebaseAuth wrapper in the example above
      "currentAuth": ["auth",
        function (auth) {
          // $requireAuth returns a promise so the resolve waits for it to complete
          // If the promise is rejected, it will throw a $stateChangeError (see above)
          //return auth.status().$requireAuth();
          return auth.requireAuth();
        }]
    }
  })
  
  // setup an abstract state for the groups directive
  .state('groups', {
    url: "/groups",
    templateUrl: 'templates/groups.html',
    controller: 'GroupsCtrl',
    resolve: {
      // controller will not be loaded until $requireAuth resolves
      // Auth refers to our $firebaseAuth wrapper in the example above
      "currentAuth": ["auth",
        function (auth) {
          // $requireAuth returns a promise so the resolve waits for it to complete
          // If the promise is rejected, it will throw a $stateChangeError (see above)
          //return auth.status().$requireAuth();
          return auth.requireAuth();
        }]
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
      "currentAuth": ["auth",
        function (auth) {
          // $requireAuth returns a promise so the resolve waits for it to complete
          // If the promise is rejected, it will throw a $stateChangeError (see above)
          //return auth.status().$requireAuth();
          return auth.requireAuth();
        }]
    }
  })

  // Each tab has its own nav history stack:

  .state('tab.rooms', {
    url: '/rooms',
    views: {
      'tab-rooms': {
        templateUrl: 'templates/tab-rooms.html',
        controller: 'RoomsCtrl'
      }
    }
  })

  .state('tab.chat', {
    url: '/chat/:roomId',
    views: {
      'tab-chat': {
        templateUrl: 'templates/tab-chat.html',
        controller: 'ChatCtrl'
      }
    }
  })

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');

}])

.run(["$ionicPlatform", "$rootScope", "$log", "$location", "auth", "$ionicLoading", "$ionicHistory", "gettextCatalog", 
  function ($ionicPlatform, $rootScope, $log, $location, auth, $ionicLoading, $ionicHistory, gettextCatalog) {
    $ionicPlatform.ready(function () {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if (window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      }
      if (window.StatusBar) {
        // org.apache.cordova.statusbar required
        StatusBar.styleDefault();
      }
      // To Resolve Bug
      ionic.Platform.fullScreen();

     // traslate stuffs
      $log.info("Base language: " + gettextCatalog.baseLanguage);
      gettextCatalog.setCurrentLanguage('es');
      gettextCatalog.debug = true;    

      //$rootScope.ref = auth.getFirebaseRef();
      //$rootScope.ref = new Firebase("https://bulkaria-dev.firebaseio.com");
      //$rootScope.currentUser = auth.getCurrentUser();  

      
      // auth core init
      auth.init();
      
      auth.onAuth(function (authData) {
        if (authData) {
          $log.info("Logged in as: " + authData.uid);
          $ionicLoading.hide();          
          $ionicHistory.clearCache();
          if(authData.password.isTemporaryPassword) {
            $location.path('/chgpwd');
          } else {
            $location.path('/groups');
          }
        } else {
          $ionicLoading.hide();
          $ionicHistory.clearCache();
          $location.path('/login');
        }
      });

      $rootScope.logout = function () {
        $log.info(auth.uid() + " logged out");
        $ionicLoading.show();
        auth.signOut();
      };

      $rootScope.$on("$stateChangeError", function (event, toState, toParams, fromState, fromParams, error) {
        // We can catch the error thrown when the $requireAuth promise is rejected
        // and redirect the user back to the home page
        if (error === "AUTH_REQUIRED") {
          $ionicHistory.clearCache();
          $location.path("/login");
        }
      });
    });                       
}])
