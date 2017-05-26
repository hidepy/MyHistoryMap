(function(){
    'use strict';

	angular.module('MHM-APP')
        .directive("registComment", function(){
            return {
                restrict: "E",
                template: '<div id="regist-comment-wrapper"><button id="regist-comment-toggler">ここタップでコメント登録フィールド表示</button>'
                        + '  <div id="regist-comment-content">'
                        + '    <div><textarea ng-model="currentComment"></textarea><button ng-click="insert()">INS</button></div>'
                        + '  </div>'
                        + '</div>',
                compile: function(el, attr){
                    var is_shown = false;

                    jQuery("#regist-comment-content textarea").css({
                        width: "100%",
                        height: "256px"
                    });

                    jQuery("#regist-comment-content").hide();
                    
                    jQuery("#regist-comment-toggler").click(function(){    
                        is_shown = !is_shown;
                        if(is_shown) jQuery("#regist-comment-content").show();
                        else         jQuery("#regist-comment-content").hide();
                    });
                },
                scope: {
                    currentComment: "=",
                    currentId: "=",
                    memoMasterName: "@"
                },
                controller: function($scope, $http){
                    // 投稿先はどのopでも同じなんで外出し
                    var choco_post = function(send_data){
                        return $http({
                            method: "POST",
                            url: "/webapps/utils/choco-memo/index.php",
                            headers: {'Content-Type': 'application/x-www-form-urlencoded'},// でPOST強制するか、
                            data: $.param(send_data)
                        });
                    }
                    $scope.insert = function(){
                        console.log("id=" + $scope.currentId);
                        choco_post({
                            action: "insert",
                            type: $scope.memoMasterName,
                            text: $scope.currentComment.replace(/\n/g, "/br"),
                            additional1: $scope.currentId
                        })
                            .then(function(data){
                                alert("テーブル(COMMON_D_MEMO)にコメントを登録しました。後に手動でテーブルからMHMデータ管理シートに値をコピーしてください");
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