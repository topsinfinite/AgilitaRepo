angular.module('starter.services', ['firebase', 'ngResource'])

.factory('EmpService', function ($resource, $q, $rootScope) {
      var urlbase = "https://online.amcon.com.ng/disposals/empservice/api/empsvc";
           
      //var empService = $resource(url, { username: '@username', pwd: '@pwd' }, {
      //    query: { method: "GET", isArray: false }
      //});
      return{
          GetToken: function (usr, pwd) {
              var deferred = $q.defer();
              var url = urlbase+"/GetAuthToken?username=".concat(usr).concat("&pwd=").concat(pwd);
              var Token = $resource(url, {}, {
                  query: { method: "GET" }
              })
              Token.query(function (data) {
                  if (data) {
                      deferred.resolve(data);
                  } else {
                      deferred.reject("error");
                  }
              });
              return deferred.promise;
              
          },
          GetUser: function(userid)
          {
              var deferred = $q.defer();
             // var employee = {};
              var url = urlbase + "/GetUserDetails?fname=".concat(userid);
              var Token = $resource(url, {}, {
                  query: { method: "GET", isArray: false }
              })
              Token.query(function (response) {
                  if (response) {
                    //  $rootScope.userData = response;
                      deferred.resolve(response);
                  } else {
                      deferred.reject("error");
                  }
              }, function (error) {
                  deferred.reject(error);
              });
               
              return deferred.promise;
          },
          findAll: function() {
              var deferred = $q.defer();
             
          deferred.resolve(employees);
          return deferred.promise;
            },

          findById: function(employeeId) {
              var deferred = $q.defer();
              
              var employee = {};
              var url = urlbase + "/GetEmployeeDetails?fname=".concat(employeeId);
              var Token = $resource(url, {}, {
                  query: { method: "GET", isArray: false }
              })
              Token.query(function (response) {
                  if (response) {
                      // var data = angular.toJson(response);
                      employee = response;
                      deferred.resolve(employee);
                  } else {
                      deferred.reject("error");
                  }
              }, function (error) {
                  deferred.reject(error);
              });
              //deferred.resolve(results);
              return deferred.promise;
          },
          findByName: function(searchKey) {
              var deferred = $q.defer();
              var employee={};
              var url = urlbase + "/SearchEmployee?fname=".concat(searchKey);
              var Token = $resource(url, {}, {
                  query: { method: "GET", isArray: true }
              })
              Token.query(function (response) {
                  if (response) {
                     // var data = angular.toJson(response);
                      employee = response;
                      
                      deferred.resolve(employee);
                  } else {
                      deferred.reject("error");
                  }
              }, function (error) {
                  deferred.reject(error);
              });
              //deferred.resolve(results);
              return deferred.promise;
          },

          findByManager: function (managerId) {
              var deferred = $q.defer();
             // var employee={};
              var url = urlbase + "/FindByManagerId?fname=".concat(managerId);
              var Token = $resource(url, {}, {
                  query: { method: "GET", isArray: true }
              })
              Token.query(function (response) {
                  if (response) {
                      // var data = angular.toJson(response); 
                      deferred.resolve(response);
                  } else {
                      deferred.reject("error");
                  }
              }, function (error) {
                  deferred.reject(error);
              });
              //deferred.resolve(results);
              return deferred.promise;
          }
      }
    })
.factory("Auth", ["$firebaseAuth", "$rootScope",
         function ($firebaseAuth, $rootScope) {
             var ref = new Firebase(firebaseUrl);
             return $firebaseAuth(ref);
         }])
 
 .factory('Chats', function ($firebaseAuth,$firebaseArray, $firebase, Rooms) {

        var selectedRoomId;
        var refRooms = new Firebase(firebaseUrl + 'rooms');
        var ref = new Firebase(firebaseUrl);
        var chats = $firebaseArray(ref.child("chats"));
       
        
       return {
           forRoom: function(roomId)
           {
               //var refRooms = new Firebase(firebaseUrl + 'rooms');
               chats = $firebaseArray(refRooms.child(roomId).child('chats'));
               return chats;
           },
           
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
            getSelectedRoomName: function (roomId) {
                var selectedRoom;
                if (roomId && roomId != null) {
                    selectedRoom = Rooms.get(roomId);
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
                    //var refRooms = new Firebase(firebaseUrl + 'rooms');
                    chats = $firebaseArray(refRooms.child(selectedRoomId).child('chats'));
                    //chats = $firebaseArray(ref.child('rooms').child(selectedRoomId).child('chats'));
                }
            },
            send: function (from, message) {
               // console.log("sending message from :" + from.displayName + " & message is " + message);
                if (from && message) {
                    var authData=ref.getAuth();
                    var chatMessage = {
                        uid:authData.uid,
                        from: from.FullName,
                       // from: authData.fullName,
                        message: message,
                        createdAt: Firebase.ServerValue.TIMESTAMP
                    };
                    chats.$add(chatMessage).then(function (data) {
                        message = "";
                        console.log("message added");
                    });
                }
            }
            
        }
    })
 .factory('userMessages', function ($firebaseArray,$firebaseObject, $firebase, UserSvc)
    {
        var chats = null;
        var ref = new Firebase(firebaseUrl);
        var userMessagesRef = new Firebase(firebaseUrl + 'userMessages');
         var usersRef = new Firebase(firebaseUrl + 'users');
       // var users = $firebaseArray(usersRef);
        return {
            forUsers: function (uid1, uid2) {
                var path = uid1 < uid2 ? uid1 + '/' + uid2 : uid2 + '/' + uid1;
                chats = $firebaseArray(userMessagesRef.child(path).orderByChild("createdAt").limitToFirst(100));
                chats.$loaded().then(function (list) {
                    chats = list;
                    return chats;
                })
                return chats;
            },
            RoomName: function (uid) {
                return UserSvc.getDisplayName(uid);
            },
            send: function (from, message,othusrID, othusrObj) {
                // console.log("sending message from :" + from.displayName + " & message is " + message);
               
                if (from && message) {
                    var authData = ref.getAuth();
                    var chatList = $firebaseArray(usersRef.child(authData.uid).child("ChatList"));
                   // var chatObj = $firebaseObject(usersRef.child(authData.uid).child("ChatList").child(othusrID))
                    var chatMessage = {
                        uid:authData.uid,
                        from: from.displayName,
                        message: message,
                        createdAt: Firebase.ServerValue.TIMESTAMP,
                        $priority: Firebase.ServerValue.TIMESTAMP
                    };
                    chats.$add(chatMessage).then(function (data) {
                        var usrChat = {
                            uid: othusrID,
                            from: othusrObj.displayName,
                            message: message,
                            createdAt: Firebase.ServerValue.TIMESTAMP,
                            $priority: othusrID
                        }
                        var key=null;
                        var ChatRef = new Firebase(usersRef + '/' + (authData.uid) + '/ChatList')//search for the current user chat before adding chat
                        ChatRef.equalTo(othusrID).limitToFirst(1)
                       // .endAt(authData.uid)
                         .once('value', function (snap) {
                  
                             if (snap.val() == null) {
                                 chatList.$add(usrChat).then(function (dt) {
                                     //var bb = dt.key();
                                     //ChatRef.child(dt.key()).update({ reckey: bb, createdAt: Firebase.ServerValue.TIMESTAMP })
                                 });
                             } else {
                                 snap.forEach(function (childSnapshot) {
                                     key = childSnapshot.key();
                                 });
                                 ChatRef.child(key).update({ message: message, createdAt: Firebase.ServerValue.TIMESTAMP })
                             }
                             // console.log('user matching ', snap.val())
                         });
                      
                        message = "";
                    });
                }
            },
            remove: function (chat) {
                chats.$remove(chat).then(function (ref) {
                    ref.key() === chat.$id; // true item has been removed
                });
            }

        
        }
    })
.factory('Rooms', function ($firebaseArray, $firebaseObject) {
    // Might use a resource here that returns a JSON array
    var ref = new Firebase(firebaseUrl);
    //ref.child('rooms').update(rooms);
    var refRooms = new Firebase(firebaseUrl + 'rooms');
    var rooms= $firebaseArray(refRooms);
    return {
        all: function () {
           // var rooms = $firebaseArray(refRooms);
            return rooms;
        },
        get: function (roomId) {
            // Simple index lookup
            //var obj = $firebaseObject(refRooms.child(roomId));
            //obj.$loaded().then(function () {
            //    console.log("loaded record:", obj.$id);
            //    return obj;
            //});
           // var refRooms = new Firebase(firebaseUrl + 'rooms');
           // var rooms = $firebaseArray(refRooms);
            return rooms.$getRecord(roomId);
        }
           
    }
})
.factory('UserSvc', function ($firebaseArray, $firebaseObject,$q, EmpService) {
    var usersRef = new Firebase(firebaseUrl + 'users');
    var users = $firebaseArray(usersRef);
    var ref = new Firebase(firebaseUrl);
    return {
        all: function () {
            return users;
        },
        getProfile: function (uid) {
            var deferred = $q.defer();
            // return $firebaseObject(usersRef.child(uid));
            ref.child("users").child(uid).once('value', function (snapshot) {
                var val = snapshot.val();
                if (val) {//if user has been added before to firebase
                   // return val;
                    deferred.resolve(val);
                }
            });
            return deferred.promise;
        },
        getDisplayName: function (uid) {
            //return $firebaseObject(usersRef.child(uid)).displayName;
            var deferred = $q.defer();
            ref.child("users").child(uid).once('value', function (snapshot) {
                var val = snapshot.val();
                if (val) {//if user has been added before to firebase
                    deferred.resolve(val.displayName);
                   // return val.displayName;
                } else {
                    var usrData = null;
                    EmpService.GetUser(uid).then(function (data) {
                        usrData = data;
                        ref.child('counter/users').transaction(function (currentValue) {
                            return (currentValue || 0) + 1
                        }, function (err, committed, ss) {
                            if (err) {
                                alert("Error : " + err);
                            }
                            else if (committed) {
                                ref.child("users").child(uid).set({
                                    recId: ss.val(),
                                    email: usrData.Email,
                                    displayName: usrData.FullName,
                                });
                            }

                        });
                        deferred.resolve(usrData.FullName);
                        //return usrData.FullName;
                    });
                }
            });
            return deferred.promise;
        }
    }
        //return users.$getRecord(uid).displayName;
    })
.factory('FileService', function ($firebaseObject) {
    var images;
    var IMAGE_STORAGE_KEY = 'images';
    var ref = new Firebase(firebaseUrl);
    var authData=ref.getAuth();
    var refusr = new Firebase(firebaseUrl + '/users/'+authData.uid);
    var obj = $firebaseObject(refusr);
   
   
    function getImages() {
        //var img = window.localStorage.getItem(IMAGE_STORAGE_KEY);
        //if (img) {
        //    images = JSON.parse(img);
        //} else {
        //    images = [];
        //}
        var objp = $firebaseObject(refusr);
        var img = objp.profileImg;
        if (img) {
            images = img;
        } else {
            images ="";
        }
        
        return images;
    };

    function addImage(img) {
        obj.profileImg = img;
        obj.$save().then(function (ref) {
            console.log("img name added successfully"); // true
        }, function (error) {
            console.log("Error:", error);
        });
        //images = [];
        //images.push(img);
        //window.localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify(images));
    };

    return {
        storeImage: addImage,
        images: getImages
    }
})
.factory('ImageService', function ($cordovaCamera, FileService, $q, $cordovaFile, $cordovaFileTransfer) {
   
    var ref = new Firebase(firebaseUrl);
    function makeid() {
        var text = '';
        var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        for (var i = 0; i < 5; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    };

    function optionsForType(type) {
        var source;
        switch (type) {
            case 0:
                source = Camera.PictureSourceType.CAMERA;
                break;
            case 1:
                source = Camera.PictureSourceType.PHOTOLIBRARY;
                break;
        }
        return {
           destinationType: Camera.DestinationType.FILE_URI,
            //destinationType: Camera.DestinationType.DATA_URL,
            sourceType: source,
            quality: 90,
            allowEdit: true,
            encodingType: Camera.EncodingType.JPEG,
            popoverOptions: CameraPopoverOptions,
            saveToPhotoAlbum: false,
            chunkedMode: false,
            targetWidth: 200,
            targetHeight: 200,
            correctOrientation:true
        };
    }

    function saveMedia(type) {
        return $q(function (resolve, reject) {
            var options = optionsForType(type);

            $cordovaCamera.getPicture(options).then(function (imageUrl) {
                //var name = imageUrl.substr(imageUrl.lastIndexOf('/') + 1);
                //var newName = makeid() + name;
                //if (name.indexOf('?') != -1) {
                //    name = name.substr(0, name.lastIndexOf('?'));
                //    newName = makeid() + name;
                //}
                //var namePath = imageUrl.substr(0, imageUrl.lastIndexOf('/') + 1);
               
                var authData=ref.getAuth();
                var filename = authData.uid+'.jpg';
                var uploadOptions = {
                    fileKey: "file",
                    fileName:filename ,
                    chunkedMode: false,
                    mimeType: "image/jpg",
                   
                    params: { 'directory': 'Upload', 'fileName': filename }
                };
               // var source = "file:///android_asset/www/img/ionic.png";
                //var targetPath = cordova.file.exthttp://localhost:22847/www/img/ionic.pngernalRootDirectory + "logo_radni.png";
                // $cordovaFile.copyFile(namePath, name, cordova.file.dataDirectory, newName)
                $cordovaFileTransfer.upload(AppUrlbase.concat("upload.php"), imageUrl, uploadOptions,true)
                  .then(function (info) {
                      console.log("SUCCESS: " + JSON.stringify(info.response));
                      FileService.storeImage(filename);
                      resolve();
                  }, function (err) {
                      console.log("ERROR: " + JSON.stringify(err));
                      reject();
                  }, function () {

                  });
            });
        })
    }
    return {
        handleMediaDialog: saveMedia
    }
});
