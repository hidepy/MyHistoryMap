(function(){
    'use strict';

	angular.module('MHM-APP')
        .directive("adminMemo", function(){
            return {
                restrict: "E",
                template: '<div id="adminmemo-wrapper" ng-init="init()"><button id="adminmemo-toggler">tap here to toggle</button><div id="adminmemo-content"> <div><input ng-model="adminmemo_inputmemo" /><button ng-click="insert()">INS</button></div><ul><li ng-repeat="memo in memos">{{memo.text}}<button ng-click="update(memo.id)">UPD</button><button ng-click="delete(memo.id)">DEL</button></li></ul></div></div>',
                compile: function(el, attr){
                    var is_shown = false;
                    jQuery("#adminmemo-content").hide();
                    
                    jQuery("#adminmemo-toggler").click(function(){    
                        is_shown = !is_shown;
                        if(is_shown) jQuery("#adminmemo-content").show();
                        else         jQuery("#adminmemo-content").hide();
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
                        $http.jsonp("/webapps/components/choco-memo/index.php?type=" + $scope.memoMasterName, {jsonpCallbackParam: 'callback'})
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

                    // 投稿先はどのopでも同じなんで外出し
                    var choco_post = function(send_data){
                        return $http({
                            method: "POST",
                            url: "/webapps/components/choco-memo/index.php",
                            headers: {'Content-Type': 'application/x-www-form-urlencoded'},// でPOST強制するか、
                            data: $.param(send_data)
                        });
                    }
                    $scope.insert = function(){
                        if(!$scope.adminmemo_inputmemo) {
                            alert("need text...");
                            return;
                        }
                        choco_post({
                            action: "insert",
                            type: $scope.memoMasterName,
                            text: $scope.adminmemo_inputmemo,
                            key: $scope.accessKey
                        })
                            .then(function(data){
                                console.log("in insert callback");
                                $scope.adminmemo_inputmemo = "";
                                $scope.getMemo();
                            });
                    };
                    $scope.update = function(target_id){
                        if(!( (target_id >= 0) && !!$scope.adminmemo_inputmemo)) {
                            alert("need id and text...");
                            return;
                        }

                        choco_post({
                            action: "update",
                            type: $scope.memoMasterName,
                            id: target_id,
                            text: $scope.adminmemo_inputmemo,
                            key: $scope.accessKey
                        })
                            .then(function(data){
                                console.log("in update callback");
                                $scope.getMemo();
                            });
                    }
                    $scope.delete = function(target_id){
                        if(!confirm("want to delete??")) return;
                        choco_post({
                            action: "delete",
                            type: $scope.memoMasterName,
                            id: target_id,
                            key: $scope.accessKey
                        })
                            .then(function(data){
                                console.log("in delete callback");
                                $scope.getMemo();
                            });
                    };
                }
            }
        });
})();

                    /*
headers: {'Content-Type': 'application/x-www-form-urlencoded'},// でPOST強制するか、
                            
$request_body = file_get_contents('php://input');
$data = json_decode($request_body,true);
する。サーバ側で。
http://qiita.com/mikakane/items/36f998b6b248ac4806c3
                            
                    */