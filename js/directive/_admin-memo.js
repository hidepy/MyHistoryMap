(function(){
    'use strict';

	angular.module('MHM-APP')
        .directive("adminMemo", function(){
            return {
                restrict: "E",
                template: '<div id="adminmemo-wrapper" ng-init="init()"><button id="adminmemo-toggler">tap here to toggle</button><div id="adminmemo-content"> <div><input ng-model="adminmemo_inputmemo" /><button ng-click="submit()">SUBMIT</button></div><ul><li ng-repeat="memo in memos">{{memo.text}}<button ng-click="delete(memo.id)">DELETE</button></li></ul></div></div>',
                compile: function(el, attr){
                    var is_shown = true;
                    jQuery("#adminmemo-toggler").click(function(){    
                        is_shown = !is_shown;
                        if(is_shown){
                            jQuery("#adminmemo-content").show();
                        }
                        else{
                            jQuery("#adminmemo-content").hide();
                        }
                    });
                },
                scope: {
                    memoMasterName: "@",
                    accessKey: "@"
                },
                controller: function($scope, $http){
                    $scope.memos = [];
                    $scope.adminmemo_inputmemo = "";

                    $scope.init = function(){
                        $scope.getMemo();
                    };
                    $scope.getMemo = function(){
                        $http.jsonp("/webapps/utils/choco-memo/index.php?type=" + $scope.memoMasterName, {jsonpCallbackParam: 'callback'})
                            .then(function(response_wrapper){
                                console.log("[adminMemo] getMemo success");
                                if(response_wrapper.data){
                                    $scope.memos = response_wrapper.data.if_return.item;
                                }
                                
                            },    function(data){
                                console.log("[adminMemo] getMemo failure...");
                                console.log(data);
                            });
                    };
                    $scope.submit = function(){
console.log("submit driven!!");
                        $http({
                            method: "POST",
                            url: "/webapps/utils/choco-memo/index.php",
                            headers: {'Content-Type': 'application/x-www-form-urlencoded'},// でPOST強制するか、
                            /*
$request_body = file_get_contents('php://input');
$data = json_decode($request_body,true);
する。サーバ側で。
http://qiita.com/mikakane/items/36f998b6b248ac4806c3
                            */
                            data: $.param({
                                action: "insert",
                                type: $scope.memoMasterName,
                                text: $scope.adminmemo_inputmemo,
                                key: $scope.accessKey
                            })
                        })
                            .then(function(data){
                                console.log("in insert callback");
                                console.log(data);
                                $scope.adminmemo_inputmemo = "";
                                $scope.getMemo();
                            });
                    };
                    $scope.delete = function(target_id){

                        if(!confrim("want to delete??")){
                            return;
                        }

                        $http({
                            method: "POST",
                            url: "/webapps/utils/choco-memo/index.php",
                            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                            data: $.param({
                                action: "delete",
                                type: $scope.memoMasterName,
                                id: target_id,
                                key: $scope.accessKey
                            })
                        })
                            .then(function(data){
                                console.log("in delete callback");
                                console.log(data);
                                $scope.getMemo();
                            });
                    };
                }
            }
        });
})();