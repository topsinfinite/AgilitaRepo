angular.module('starter.controllers', [])

.controller('LoginCtrl', function ($scope, $ionicModal, $state, $firebaseAuth, $ionicLoading,$ionicPopup, $rootScope, EmpService) {
    console.log('Login Controller Initialized');

    var ref = new Firebase(firebaseUrl);
    var auth = $firebaseAuth(ref); var AUTH_TOKEN = "";

    $ionicModal.fromTemplateUrl('templates/signup.html', {
        scope: $scope
    }).then(function (modal) {
        $scope.modal = modal;
    });

    $scope.createUser = function (user) {
        console.log("Create User Function called");
        if (user && user.email && user.password && user.displayname) {
            $ionicLoading.show({
                template: 'Signing Up...'
            });

            auth.$createUser({
                email: user.email,
                password: user.password
            }).then(function (userData) {
                alert("User created successfully!");
                ref.child('counter/users').transaction(function (currentValue) {
                    return (currentValue||0) + 1
                }, function(err, committed, ss) {
                    if( err ) {
                        alert("Error : "+err);
                    }
                    else if( committed ) {
                        // if counter update succeeds, then create record
                        // probably want a recourse for failures too
                        // addRecord(ss.val()); 
                        ref.child("users").child(userData.uid).set({
                            recId:ss.val(),
                            email: user.email,
                            displayName: user.displayname,
                        });
                    }
                });
               
                $ionicLoading.hide();
                $scope.modal.hide();
            }).catch(function (error) {
                alert("Error: " + error);
                $ionicLoading.hide();
            });
        } else
            alert("Please fill all details");
    }
    
    $scope.signIn = function (user) {
        if (user && user.email && user.pwdForLogin) {
            $ionicLoading.show({
                template: 'Signing In...'
            });
            auth.$authWithPassword({
                email: user.email,
                password: user.pwdForLogin
            }).then(function (authData) {
                console.log("Logged in as:" + authData.uid);
                ref.child("users").child(authData.uid).once('value', function (snapshot) {
                    var val = snapshot.val();
                    // To Update AngularJS $scope either use $apply or $timeout
                    // $rootScope.displayName = val;
                    $scope.$apply(function () {
                        $rootScope.displayName = val;
                    });
                });
                $ionicLoading.hide();
                $state.go('tab.rooms');
            }).catch(function (error) {
                alert("Authentication failed:" + error.message);
                $ionicLoading.hide();
            });
        } else
            alert("Please enter email and password both");

    }
    $scope.signInCustom = function (user) {
        if (user && user.email && user.pwdForLogin) {
            $ionicLoading.show({
                template: 'Signing In...'
            });
            EmpService.GetToken(user.email, user.pwdForLogin)
                  .then(function (data) {
                      if (!data) {
                          alert("Authentication failed:" + "an error occured..Kindly try again");
                          $ionicLoading.hide();
                          return;
                      }
                      if (data.Token == "INVALID" || data.Token == "NOT FOUND") {
                          //alert("Authentication failed:" + "user credential is incorrect or userId no found");
                          $ionicLoading.hide();
                          var alertPopup = $ionicPopup.alert({
                              title: 'Authentication failed!!',
                              content: '<br /> User credential is incorrect or userid no found'
                              //templateUrl: 'templates/alert.html'
                          });
                          alertPopup.then(function () {
                              return;
                          });
                          return;
                      } else if (data) {
                          AUTH_TOKEN = data.Token;
                          ref.authWithCustomToken(AUTH_TOKEN, function (error, authData) {
                              if (error) {
                                  console.log("Login Failed!", error);
                              } else {
                                  ref.child("users").child(authData.uid).once('value', function (snapshot) {
                                      var val = snapshot.val();
                                      if (val) {//if user has been added before to firebase
                                          $scope.$apply(function () {
                                              $rootScope.displayName = val;
                                          });
                                      } else {
                                          var usrData = $rootScope.userData;
                                          ref.child('counter/users').transaction(function (currentValue) {
                                              return (currentValue || 0) + 1
                                          }, function (err, committed, ss) {
                                              if (err) {
                                                  alert("Error : " + err);
                                              }
                                              else if (committed) {
                                                  // if counter update succeeds, then create record
                                                  // probably want a recourse for failures too
                                                  // addRecord(ss.val()); 
                                                  ref.child("users").child(authData.uid).set({
                                                      recId: ss.val(),
                                                      email: usrData.Email,
                                                      displayName: usrData.FullName,
                                                  });
                                              }
                                          });

                                      }
                                  });

                                  ref.child("users").child(authData.uid).once('value', function (snapshot) {
                                      var val = snapshot.val();
                                      $scope.$apply(function () {
                                          $rootScope.displayName = val;
                                      });
                                  });
                                  console.log("Login Succeeded!", authData);
                                  $ionicLoading.hide();
                                  $state.go('tab.employee');

                              }
                          });
                      } else {
                          // alert("Authentication failed:" + "an error occured..Kindly try again");
                          $ionicLoading.hide();
                          var alertPopup = $ionicPopup.alert({
                              title: 'Authentication failed!!',
                              content: '<br /> An error occurred. Kindly try again..'
                              //templateUrl: 'templates/alert.html'
                          });
                          alertPopup.then(function () {
                              return;
                          });
                          return;
                      }
                  })
         
        } else
            alert("Please enter email and password both");

    }
})
    .controller('EmployeeIndexCtrl', function ($scope,$state,$firebaseArray, EmpService) {
        var usersRef = new Firebase(firebaseUrl + 'users');
        var ref = new Firebase(firebaseUrl);
        var uid = ref.getAuth().uid;
        $scope.profileId = uid;
        $scope.searchKey = "";

        $scope.clearSearch = function () {
            $scope.searchKey = "";
            $scope.employees = {};
            // findAllEmployees();
        }

        $scope.search = function () {
            EmpService.findByName($scope.searchKey).then(function (employees) {
                $scope.employees = employees;
            });
        }

        var findAllEmployees = function () {
            EmpService.findAll().then(function (employees) {
                $scope.employees = employees;
            });
        }
        var getRecentlySearchEmployee = function () {
           
            var recentSrch = $firebaseArray(usersRef.child(uid).child("RecentSearch").orderByChild("DateAdded").limitToLast(10));

            $scope.recentEmployees = recentSrch;
        }
        $scope.openEmployee = function (employeeid,index) {
            //var usersRef = new Firebase(firebaseUrl + 'users');
            //var ref = new Firebase(firebaseUrl);
            //var uid = ref.getAuth().uid;
            if (index === 0)//if it's coming from employee search
            {
                var recentSrch = $firebaseArray(usersRef.child(uid).child("RecentSearch"));
                var usrData = null;
                EmpService.GetUser(employeeid).then(function (data) {
                    usrData = data;
                    var employee = {
                        EmployeeID: usrData.EmployeeID,
                        FullName: usrData.FullName,
                        Department: usrData.Department,
                        JobTitle: usrData.JobTitle,
                        DateAdded: Firebase.ServerValue.TIMESTAMP,
                        $priority: usrData.EmployeeID
                    };
                    var rectRef = new Firebase(usersRef+'/'+(uid)+'/RecentSearch')//search for the current user before adding to recent search
                    rectRef.startAt(employeeid)
                    .endAt(employeeid)
                     .once('value', function (snap) {
                         if (snap.val() == null) {
                             recentSrch.$add(employee);
                         }
                     // console.log('user matching ', snap.val())
                     });
                   
                })
            }
           
            $state.go('employee-detail', { "employeeId": employeeid });//the 
        }
        getRecentlySearchEmployee();
        //findAllEmployees();

    })
    .controller('EmployeeDetailCtrl', function ($scope, $state, $stateParams,  $ionicHistory, EmpService) {
        $scope.myGoBack = function () {
            // $ionicHistory.goBack();
            $state.go('tab.employee');
        };
        EmpService.findById($stateParams.employeeId).then(function (employee) {
            $scope.employee = employee;
            $scope.openChat = function (uId1) {
                $state.go('tab-direct', {
                    uId: uId1
                })
            }
        })
        
    })
    .controller('EmployeeReportsCtrl', function ($scope, $stateParams, EmpService) {
        EmpService.findByManager($stateParams.employeeId).then(function (employees) {
            $scope.employees = employees;
        });
    })
.controller('ChatCtrl', function ($scope, $rootScope, Chats, UserSvc, $state) {
    //console.log("Chat Controller initialized");
    var ref = new Firebase($scope.firebaseUrl);
    $scope.IM = {
        textMessage: ""
    };
    var roomId = $state.params.roomId;
    Chats.selectRoom($state.params.roomId);
    var roomName = Chats.getSelectedRoomName(roomId);

    // Fetching Chat Records only if a Room is Selected
    if (roomName) {
        $scope.roomName = " - " + roomName;
        $scope.chats = Chats.forRoom(roomId);
    }
    //} else {
    //    $scope.chats = Chats.all();
    //}

    $scope.sendMessage = function (msg) {
        console.log(msg);
        Chats.send($rootScope.userData, msg);
        // var ref = new Firebase($scope.firebaseUrl);
        // var uid = ref.getAuth().uid;
        //var auth = ref.getAuth();
        // Chats.send(auth.fullName, msg);
        // Chats.send(UserSvc.getProfile(uid), msg);
        $scope.IM.textMessage = "";
    }

    $scope.remove = function (chat) {
        Chats.remove(chat);
    }
})
    .controller('RoomsCtrl', function ($scope, Rooms, $state) {
        //console.log("Rooms Controller initialized");
        $scope.rooms = Rooms.all();

        $scope.openChatRoom = function (roomId) {
            $state.go('tab-chat', {
                roomId: roomId
            });
        }
    })
   .controller('UsersCtrl', function ($scope, UserSvc, $state, $rootScope) {
       //console.log("Rooms Controller initialized");
       var ref = new Firebase($scope.firebaseUrl);
       var uid = ref.getAuth().uid;
       $scope.contacts = UserSvc.all();
       $scope.profileId = uid;
       $scope.openChatRoom = function (uId1) {
           $state.go('tab.direct', {
               uId: uId1
           })
       }
      
       
   })
    .controller('UserChatsCtrl', function ($scope, $rootScope, $firebaseObject, userMessages, $ionicScrollDelegate, $timeout, UserSvc, $state, $ionicHistory) {
        var ref = new Firebase(firebaseUrl);
        var ParamUid = $state.params.uId;
        var roomName = "";
        //$scope.$on("$ionicView.enter", function () {
        //  //  $ionicHistory.clearCache();
        //    $ionicScrollDelegate.$getByHandle('mainScroll').scrollBottom();
        //});
        $scope.onEnter = function () {
            $ionicScrollDelegate.$getByHandle('mainScroll').scrollBottom();
        };
        $scope.myGoBack = function () {
            $ionicHistory.goBack();
        };
        //var refusr = new Firebase(firebaseUrl+'users')
        UserSvc.getDisplayName(ParamUid).then(function (data) {
            roomName = data;
            $scope.roomName = " - " + roomName;
        });
        var otherUsr = null; $scope.displayName = null;
        var uid = ref.getAuth().uid; var obj = null;
        UserSvc.getProfile(uid).then(function (udata) {
            $scope.displayName = udata;
        });
        UserSvc.getProfile(ParamUid).then(function (udata) {
            otherUsr = udata;// var obj = null;
            //var authData = ref.getAuth();
           // var refusr = new Firebase(firebaseUrl + '/users/' + uid);
            ref.child("users").child(uid).once('value', function (snapshot) {
                 obj = snapshot.val();
            })
            $scope.chats = userMessages.forUsers(otherUsr.recId, obj.recId);
        });    
        $scope.IM = {
            textMessage: ""
        };

        $scope.sendMessage = function (msg) {
            //console.log(msg);
            userMessages.send($scope.displayName, msg, ParamUid, otherUsr)
            $scope.IM.textMessage = "";
            $ionicScrollDelegate.$getByHandle('mainScroll').scrollBottom();
        }

        $scope.remove = function (chat) {
            userMessages.remove(chat);
        }
    })
     .controller('ChatListCtrl', function ($scope,$state, $stateParams, $firebaseArray, EmpService) {
         var srchchat = null;
         var usersRef = new Firebase(firebaseUrl + 'users');
         var ref = new Firebase(firebaseUrl);
         var uid = ref.getAuth().uid;
         var getChatList = function () {
             var srchchat = $firebaseArray(usersRef.child(uid).child("ChatList").orderByChild("createdAt"));
             srchchat.$loaded().then(function (list) {
                 $scope.chatTrail = list;
                 srchchat = list;
             })
            
         }
         getChatList();
         $scope.openChat1 = function (uId1) {
             $state.go('tab-direct', {
                 uId: uId1
             });
         }
         $scope.remove = function (chat) {
             srchchat = $scope.chatTrail;
             srchchat.$remove(chat).then(function (ref) {
                 ref.key() === chat.$id; // true item has been removed
             });;
         }
     })
.controller('ProfileCtrl', function ($scope, $rootScope,$state,$ionicHistory, $cordovaDevice,$timeout, $cordovaFile, $ionicPlatform,$ionicLoading, $cordovaEmailComposer, $ionicActionSheet,EmpService, ImageService, FileService) {

    var ref = new Firebase(firebaseUrl);
    var uid = ref.getAuth().uid;
    // $scope.image = FileService.images();
    $scope.$on("$ionicView.enter", function () {
        $ionicHistory.clearCache();
    });
    EmpService.GetUser(uid).then(function (data) {
        $scope.profile = data;
        $ionicLoading.show({
            template: 'loading...'
        });
        $scope.urlForImage = function () {
            //var trueOrigin = cordova.file.dataDirectory + imageName;
           // if (imageName !== null) {
                var trueOrigin = AppUrlbase + 'Upload/' + uid+'.jpg';
                return trueOrigin;
           // }
        }
        $ionicLoading.hide();
    });
    //  $scope.profile = $rootScope.userData;
    var imageName = FileService.images();
    $scope.addMedia = function () {
        $scope.hideSheet = $ionicActionSheet.show({
            buttons: [
              { text: 'Take photo' },
              { text: 'Photo from library' }
            ],
            titleText: 'Add images',
            cancelText: 'Cancel',
            buttonClicked: function (index) {
                $scope.addImage(index);
            }
        });
    }

    $scope.addImage = function (type) {
        $scope.hideSheet();
        $ionicLoading.show({
            template: 'uploading...'
        });
        ImageService.handleMediaDialog(type).then(function () {
            $timeout(function () {
                $scope.$apply();
                //$scope.images = FileService.images();
                $scope.urlForImage = function () {
                    //var trueOrigin = cordova.file.dataDirectory + imageName;
                    // if (imageName !== null) {
                    var trueOrigin = AppUrlbase + 'Upload/' + uid + '.jpg';
                    return trueOrigin;
                    $state.go($state.currentState, {}, { reload: true });
                    // }
                }
                $ionicLoading.hide();
              
            });
           
        });
    }
    //$state.go($state.currentState, {}, { reload: true });
    $scope.sendEmail = function () {
        if ($scope.images != null && $scope.images.length > 0) {
            var mailImages = [];
            var savedImages = $scope.images;
            if ($cordovaDevice.getPlatform() == 'Android') {
                // Currently only working for one image..
                var imageUrl = $scope.urlForImage(savedImages[0]);
                var name = imageUrl.substr(imageUrl.lastIndexOf('/') + 1);
                var namePath = imageUrl.substr(0, imageUrl.lastIndexOf('/') + 1);
                $cordovaFile.copyFile(namePath, name, cordova.file.externalRootDirectory, name)
                .then(function (info) {
                    mailImages.push('' + cordova.file.externalRootDirectory + name);
                    $scope.openMailComposer(mailImages);
                }, function (e) {
                    reject();
                });
            } else {
                for (var i = 0; i < savedImages.length; i++) {
                    mailImages.push('' + $scope.urlForImage(savedImages[i]));
                }
                $scope.openMailComposer(mailImages);
            }
        }
    }

    $scope.openMailComposer = function (attachments) {
        var bodyText = '<html><h2>My Images</h2></html>';
        var email = {
            to: 'some@email.com',
            attachments: attachments,
            subject: 'Devdactic Images',
            body: bodyText,
            isHtml: true
        };

        $cordovaEmailComposer.open(email).then(null, function () {
            for (var i = 0; i < attachments.length; i++) {
                var name = attachments[i].substr(attachments[i].lastIndexOf('/') + 1);
                $cordovaFile.removeFile(cordova.file.externalRootDirectory, name);
            }
        });
    }
});
 

