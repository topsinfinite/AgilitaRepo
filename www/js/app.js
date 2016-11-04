// Ionic Starter App

 
var firebaseUrl = "https://employee-dir.firebaseio.com/"
var AppUrlbase = "https://online.amcon.com.ng/disposals/empservice/";
function onDeviceReady() {
    angular.bootstrap(document, ["starter"]);
}

document.addEventListener("deviceready", onDeviceReady, false);

angular.module('starter', ['ionic', 'ionic.service.core', 'starter.controllers', 'starter.services', 'firebase', 'angularMoment', 'ngCordova'])

.run(function ($ionicPlatform, $rootScope, $cordovaStatusbar,$location, Auth, $ionicLoading, $ionicPopup,$cordovaDialogs, $state, EmpService) {
    
    $ionicPlatform.ready(function () {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      //var push = new Ionic.Push({
      //    "debug": true
      //});
      //push.register(function (token) {
      //    console.log("Device token:", token.token);
      //});
    
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {  
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleLightContent();
    }
    //$cordovaStatusbar.styleHex('#355c7d')
     
    $rootScope.firebaseUrl = firebaseUrl;
    $rootScope.displayName = null;

    Auth.$onAuth(function (authData) {
        if (authData) {
             EmpService.GetUser(authData.uid).then(function (data) {
                 $rootScope.userData = data;
                 var io = Ionic.io();
                // var push = new Ionic.Push();
                 var push = new Ionic.Push({
                     "onNotification": function (notification) {
                         // alert('Received push notification!');
                         var payload = notification.payload;
                         //console.log(notification, payload);
                         //console.log(notification);
                         $cordovaDialogs.alert(notification.text, 'Agilita', 'Ok')
                             .then(function () {
                                 return;
                             });
                         //var alertPopup = $ionicPopup.alert({
                         //    title: 'Agilita',
                         //    content: '<br>' + notification.text
                         //    //templateUrl: 'templates/alert.html'
                         //});
                         //alertPopup.then(function () {
                         //    return;
                         //});
                         return;
                     },
                     "pluginConfig": {
                         "android": {
                             "iconColor": "#ffffff"
                         }
                     }
                 });
                 var user = Ionic.User.current();
                 if (!user.id) {
                     // user.id = Ionic.User.anonymousId();
                     user.id = authData.uid;
                 }
                 // Just add some dummy data..
                 user.set('name', data.FullName);
                 user.set('dept', data.Department);
                 user.save();

                 var callback = function (data) {
                     push.addTokenToUser(user);
                     //user.addPushToken(data, 'android')
                     user.save();
                 };
                 push.register(callback);
            });
            console.log("Logged in as:", authData.uid);
            $state.go('tab.employee');
            //$state.go('tab.contact');

        } else {
            console.log("Logged out");
            $ionicLoading.hide();
            $location.path('/login');
        }
    });

    $rootScope.logout = function () {
        console.log("Logging out from the app");
        $ionicLoading.show({
            template: 'Logging Out...'
        });
        Auth.$unauth();
    }
    $rootScope.$on("$stateChangeError", function (event, toState, toParams, fromState, fromParams, error) {
        // We can catch the error thrown when the $requireAuth promise is rejected
        // and redirect the user back to the home page
        if (error === "AUTH_REQUIRED") {
            $location.path("/login");
        }
    });
    $rootScope.$on('loading:show', function () {
        $ionicLoading.show({
            content: 'Loading',
            animation: 'fade-in',
            showBackdrop: true,
            maxWidth: 200,
            showDelay: 0
        })
    })

    $rootScope.$on('loading:hide', function () {
        $ionicLoading.hide()
    })
    $rootScope.$on('response:error', function () {
        $ionicLoading.hide();
        $cordovaDialogs.alert(' An error occurred. Kindly try again..', 'Loading failed!!', 'Ok')
           .then(function () {
               return;
               });
        //var alertPopup = $ionicPopup.alert({
        //    title: ' Loading failed!!',
        //    content: '<br /> An error occurred. Kindly try again..'
        //    //templateUrl: 'templates/alert.html'
        //});
        //alertPopup.then(function () {
        //    return;
        //});

    });
    var io = Ionic.io();
   
    //var user = Ionic.User.current();
    //if (!user.id) {
    //    // user.id = Ionic.User.anonymousId();
    //    user.id = '130288';
    //}
    //  // Just add some dummy data..
    //user.set('name', 'Temitope Fatayo');
    //user.set('dept', 'Information Technology');
    //user.save();

    //var callback = function (data) {
    //    push.addTokenToUser(user);
    //    //user.addPushToken(data, 'android')
    //    user.save();
    //};
    //push.register(callback);
  });
})

.config(function ($stateProvider, $urlRouterProvider, $httpProvider, $ionicConfigProvider) {
    //console.log("setting config");
    $ionicConfigProvider.views.maxCache(0);
    $httpProvider.interceptors.push(function ($rootScope) {
        return {
            request: function (config) {
                $rootScope.$broadcast('loading:show')
                return config
            },
            response: function (response) {
                $rootScope.$broadcast('loading:hide')
                return response
            },
            responseError: function (response) {
                $rootScope.$broadcast('loading:hide')
                $rootScope.$broadcast('response:error')
                return response

            },
            requestError: function (response) {
                $rootScope.$broadcast('loading:hide')
                $rootScope.$broadcast('response:error')
                return response
            }
        }
    });
    $stateProvider

    // setup an abstract state for the tabs directive
      .state('tab', {
          url: '/tab',
          abstract: true,
          templateUrl: 'templates/tabs.html',
          resolve: {
              // controller will not be loaded until $requireAuth resolves
              // Auth refers to our $firebaseAuth wrapper in the example above
              "currentAuth": ["Auth",
                  function (Auth) {
                      // $requireAuth returns a promise so the resolve waits for it to complete
                      // If the promise is rejected, it will throw a $stateChangeError (see above)
                      return Auth.$requireAuth();
                  }]
          }
      })

    // Each tab has its own nav history stack:

         .state('tab.employee', {
             url: '/employees',
             views: {
                 'tab-employee': {
                     templateUrl: 'templates/employeeIndex.html',
                     controller: 'EmployeeIndexCtrl'
                 }
             }
         })

        .state('tab.setting', {
            url: '/profile',
            cache: false,
            views: {
                'tab-setting': {
                    templateUrl: 'templates/profile.html',
                    controller: 'ProfileCtrl'
                }
            }
        })
        .state('tab.chatlist', {
            url: '/chatlist',
            views: {
                'chattrail': {
                    templateUrl: 'templates/chatlist.html',
                    controller: 'ChatListCtrl'
                }
            }

        })
        .state('tab.rooms', {
            url: '/rooms',
            views: {
                'tab-rooms': {
                    templateUrl: 'templates/tab-rooms.html',
                    controller: 'RoomsCtrl'
                }
            }
        })
        .state('tab-direct', {
            url: '/direct/:uId',
            templateUrl: 'templates/chatprivate.html',
            controller: 'UserChatsCtrl'
            //views: {
            //    'chatprivate': {
            //        templateUrl: 'templates/chatprivate.html',
            //        controller: 'UserChatsCtrl'
            //    }
            //}

        })
          .state('employee-detail', {
              url: '/employee/:employeeId',
              templateUrl: 'templates/employee-detail.html',
              controller: 'EmployeeDetailCtrl'
          })
        .state('employee-reports', {
            url: '/employee/:employeeId/reports',
            templateUrl: 'templates/employee-reports.html',
            controller: 'EmployeeReportsCtrl'
        })
        .state('tab-chat', {
            url: '/chat/:roomId',
            templateUrl: 'templates/tab-chat.html',
            controller: 'ChatCtrl'
        })
      .state('login', {
          url: '/login',
          templateUrl: 'templates/login.html',
          controller: 'LoginCtrl',
          resolve: {
              // controller will not be loaded until $waitForAuth resolves
              // Auth refers to our $firebaseAuth wrapper in the example above
              "currentAuth": ["Auth",
                  function (Auth) {
                      // $waitForAuth returns a promise so the resolve waits for it to complete
                      return Auth.$waitForAuth();
                  }]
          }
      });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/employee');

});
