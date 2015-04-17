// bulkaria-mov
'use strict';

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
  'ngCordova',
  'firebase', 
  'angularMoment', 
  'bulkaria-mov.controllers', 
  'bulkaria-mov.services', 
  'bulkaria-mov.providers', 
  'bulkaria-mov.directives', 
  'bulkaria-mov.data-service',   
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

.constant("ROOT", "https://bulkaria-dev.firebaseio.com")

.config(["authProvider", "ROOT", "$stateProvider", "$urlRouterProvider", "$httpProvider", 
  function (authProvider, ROOT, $stateProvider, $urlRouterProvider, $httpProvider) {
  
  console.log("setting config");
  
  // set Firebase for auth provider
  authProvider.setRootRef(ROOT);

  // interceptor for loading handling
  $httpProvider.interceptors.push(function($rootScope) {
    return {
      request: function(config) {
        $rootScope.$broadcast('loading:show')
        return config
      },
      response: function(response) {
        $rootScope.$broadcast('loading:hide')
        return response
      }
    }
  });

  console.log("State Provider config");
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
  .state('main', {
    url: "/main",
    templateUrl: 'templates/main.html',
    controller: 'MainCtrl',
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

  // setup an abstract state for change password directive
  .state('main.change-password', {
    url: "/chgpwd",
    views: {
      'menuContent': {
        templateUrl: 'templates/change-password.html',
        controller: 'ChangePasswordCtrl'
      }
    }    
  })
  
  // setup an abstract state for the groups directive
  .state('main.groups', {
    url: "/groups",
    views: {
      'menuContent': {
        templateUrl: 'templates/groups.html',
        controller: 'GroupsCtrl'
      }
    }
  })

  .state('main.profile', {
    url: "/profile",
    views: {
      'menuContent': {
        templateUrl: 'templates/profile.html',
        controller: 'ProfileCtrl'
      }
    }
  })
  
  // setup an abstract state for the tabs directive
  .state('main.tabs', {
    url: "/tabs",
    abstract: true,
    templateUrl: "templates/tabs.html",
    views: {
      'menuContent': {
        templateUrl: 'templates/tabs.html'
      }
    }
  })

  // Each tab has its own nav history stack:

  .state('main.tabs.wall', {
    url: '/wall',
    views: {
      'tab-wall': {
        templateUrl: 'templates/group-wall.html',
        controller: 'GroupWallCtrl'
      }
    }
  })

  .state('main.tabs.config', {
    url: '/config',
    views: {
      'tab-config': {
        templateUrl: 'templates/group-config.html',
        controller: 'GroupConfigCtrl'
      }
    }
  })

  .state('main.tabs.resolve', {
    url: '/resolve',
    views: {
      'tab-resolve': {
        templateUrl: 'templates/group-resolve.html',
        controller: 'GroupResolveCtrl'
      }
    }
  })

  .state('main.tabs.members', {
    url: '/members',
    views: {
      'tab-members': {
        templateUrl: 'templates/group-members.html',
        controller: 'GroupMembersCtrl'
      }
    }
  })
  ;
    
  console.log("Other wise");
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');
    
}])

.run(["$ionicPlatform", "$rootScope", "$log", "$state", "auth", "$ionicLoading", "$ionicHistory", "gettextCatalog", "userFactory",
  function ($ionicPlatform, $rootScope, $log, $state, auth, $ionicLoading, $ionicHistory, gettextCatalog, userFactory) {
    console.log("App run");    
    try {
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

        // listeners for loading state handling
        $rootScope.$on('loading:show', function() {
          $ionicLoading.show();
        });
        $rootScope.$on('loading:hide', function() {
          $ionicLoading.hide();
        });

        // traslate stuffs
        console.log("Translate config");      
        $log.info("Base language: " + gettextCatalog.baseLanguage);
        gettextCatalog.setCurrentLanguage('es');
        //gettextCatalog.debug = true;    

        //$rootScope.ref = auth.getRootRef();
        //$rootScope.ref = new Firebase("https://bulkaria-dev.firebaseio.com");
        //$rootScope.currentUser = auth.getCurrentUser();  

        console.log("Auth core init");      
        // auth core init
        auth.init();

        // Globals
        $rootScope.currentGroupId = null;
        $rootScope.objUser = null;

        $rootScope.logout = function () {
          $log.info(auth.getCurrentUser().email + " logged out");
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

        auth.onAuth(function (authData) {
          if (authData) {
            $log.info("Logged in as: " + authData.uid);
            $ionicLoading.hide();          
            $ionicHistory.clearCache();
            $rootScope.objUser = new userFactory(auth.getCurrentUserRef());
            if(authData.provider === "password" && authData.password.isTemporaryPassword) {
              $state.go("main.change-password");
            } else {
              auth.clearCurrentPassword();
              $state.go("main.groups");
            }
          } else {
            $rootScope.objUser = null;
            $ionicLoading.hide();
            $ionicHistory.clearCache();
            $state.go("login");
          }
        });

      });  
      
    } catch(e) {
      console.log(e);
    }
}])
