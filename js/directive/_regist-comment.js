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

console.log("in registComment controller");

                    function appendMsg(msg){
                        var el_msg = angular.element("<div class='alert alert-info'>" + msg + "</div>");

                        el_msg
                            .css({
                                position: "absolute",
                                top: 0,
                                left: 0,
                                opacity: 0
                            })
                            .animate({
                                opacity: 1.0
                            }, 500)
                            .delay(
                                3000
                            )
                            .fadeOut(
                                "slow"
                            )
                            .queue(function(){
                                this.remove();
                            });

                        // append
                        angular.element("#regist-comment-wrapper").append(el_msg);
                    }

                    // SheetsManagerをインスタンス化
                    if(!window.sheetsManager){
                        // マジ残念だけど仕方ない...
                        window.sheetsManager = new SheetsManager(
                                "415543251090-ang8urrq1dr71v8k66fi8r9nfl5gprru.apps.googleusercontent.com",
                                "1oJFvI75mIkeAdA97kVpSjr2CwPhW0_d6MvNRjs6Hy9M",
                                true
                        );
                    }

                    $scope.sheetsManager = window.sheetsManager;

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
                        console.log("id=" + $scope.currentId);

                        // Sheet更新-> memo insert -> DB更新のフローで
                        $scope.sheetsManager.findValue("MHM_M_POINT_DATA", "A2:A1024", $scope.currentId, false)
                            .then(
                                // success
                                function(result){
// 発見-> 既存値取得-> update
                                    console.log("findvalue-> success-> result");
                                    console.log(result);
                                    
                                    var pos_r = result[0].row;
                                    var pos_c = result[0].col;

                                    // SheetsManagerのfindValueはresult.length > 0のみresolveする
                                    return $scope.sheetsManager.getValue("MHM_M_POINT_DATA", "H" + (2 + pos_r));
                                },
                                // failure...
                                function(error){
                                    console.log("findvalue-> failure...");
                                    console.log(error);
                                }
                            )
                            .then(
                                // get value success
                                function(response){
                                    return new Promise(function(resolve, reject){
                                        console.log("in get value success!!");
                                        console.log(response);

                                        if(!(response && response.result && response.result.range)){
                                            console.log("response not filled...");
                                            reject();
                                        }

                                        var current_text = (response.result.values && response.result.values[0] ?  response.result.values[0][0] : "") || ""; // 絶対に空に落とす

                                        console.log("current_text=" + current_text);

                                        return $scope.sheetsManager.updateValue("MHM_M_POINT_DATA", response.result.range, [
                                            [current_text + $scope.currentComment.replace(/\n/g, "/br")]
                                        ]);
                                    });
                                }
                            )
                            .then(
                                function(response){
                                    console.log("final callback...");
                                    console.log(response);

                                    appendMsg("Spreadsheet Update Finished!!");
                                }
                            )
                            ;/*
                            .catch(function(error){
                                console.log("findValue Failured...");
                                console.log(error);
                            });*/

                        choco_post({
                            action: "insert",
                            type: $scope.memoMasterName,
                            text: $scope.currentComment.replace(/\n/g, "/br"),
                            additional1: $scope.currentId
                        })
                            .then(function(data){
                                //alert("テーブル(COMMON_D_MEMO)にコメントを登録しました。後に手動でテーブルからMHMデータ管理シートに値をコピーしてください");
                                appendMsg("テーブル(COMMON_D_MEMO)にコメントを登録しました。後に手動でテーブルからMHMデータ管理シートに値をコピーしてください");
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