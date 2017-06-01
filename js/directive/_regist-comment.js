(function(){
    'use strict';

    angular.module('MHM-APP')
        .directive("registComment", function(){
            return {
                restrict: "E",
                template: '<div id="regist-comment-wrapper"><button id="regist-comment-toggler">ここタップでコメント登録フィールド表示</button>'
                        + '  <div id="regist-comment-content" style="position: relative;">'
                        + '    <div><textarea ng-model="currentComment"></textarea><button ng-click="insert()">INS</button></div>'
                        + '  </div>'
                        + '</div>',
                compile: function(el, attr){
                    var is_shown = false;

                    jQuery("#regist-comment-content textarea").css({
                        width: "100%",
                        height: "128px"
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

                    angular.element("#regist-comment-content").append(
                        angular.element("<div id='regist-comment-msg-wrapper'></div>")
                            .css({
                                position: "absolute",
                                top: 0,
                                left: 0
                            })
                    );

                    function appendMsg(msg){
                        angular.element("#regist-comment-msg-wrapper").append(
                            angular.element("<div class='alert alert-info'>" + msg + "</div>")
                                .css({
                                    opacity: 0
                                })
                                .click(function(el){
                                    console.log(el);
                                    el.target.display = "none";
                                })
                                .animate({
                                    opacity: 1.0
                                }, 100)
                                .delay(
                                    4000
                                )
                                .fadeOut(
                                    "slow"
                                )
                                .queue(function(){
                                    this.remove();
                                })
                        );
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
                    var post_mhm_comment = function(send_data){
                        return $http({
                            method: "POST",
                            url: "/webapps/components/mhm-comment-updater/index.php",
                            headers: {'Content-Type': 'application/x-www-form-urlencoded'},// でPOST強制するか、
                            data: $.param(send_data)
                        });
                    }
                    $scope.insert = function(){
                        console.log("id=" + $scope.currentId);

                        if(!$scope.sheetsManager.isSignedIn()){
                            console.log("is not isSignedIn...");
                            appendMsg("Googleアカウントにサインインしてくださいね!!");
                            return;
                        }

                        appendMsg("コメント登録処理を開始します");

                        // 1. Sheet更新, 2. DB更新

                        // Sheet更新-> memo insert -> DB更新のフローで
                        $scope.sheetsManager.findValue("MHM_M_POINT_DATA!A2:A1024", $scope.currentId, false)
                            // this then -> find and get value
                            .then(
                                // success
                                function(result){                                    
                                    var pos_r = result[0].row;
                                    var pos_c = result[0].col;

                                    // SheetsManagerのfindValueはresult.length > 0のみresolveする
                                    return $scope.sheetsManager.getValue("MHM_M_POINT_DATA!H" + (2 + pos_r));
                                },
                                // failure...
                                function(error){
                                    console.log("findvalue-> failure...");
                                    console.log(error);
                                }
                            )
                            // this then -> update phase
                            .then(
                                // get value success
                                function(response){
                                    return new Promise(function(resolve, reject){
                                        try{
                                            console.log("in get value success!!");
                                            if(!(response && response.result && response.result.range)){
                                                console.log("response not filled...");
                                                reject();
                                            }

                                            var current_text = (response.result.values && response.result.values[0] ?  response.result.values[0][0] : "") || ""; // 絶対に空に落とす
                                            var new_text = current_text + $scope.currentComment.replace(/\n/g, "/br");
                                            var values = [
                                                [new_text]
                                            ];

                                            // ここでresolve or rejectしてないから次のthenが起動しなかったという気づき...まぁ、これでいいよね
                                            return $scope.sheetsManager.updateValue(response.result.range, values)
                                            .then(function(response){
                                                console.log("update success!!");
                                                console.log(response);

                                                appendMsg("MHMデータ管理シートを更新しました!!");

                                                resolve(new_text);
                                            })
                                        }
                                        catch(e){
                                            console.log("fatal error occured... in get value success");
                                            console.log(e);

                                            reject();
                                        }
                                    });
                                }
                            )/*
                            .catch(
                                function(error_info){
                                    console.log("Fatal error occured... in sheet update process");
                                    console.log(error_info);
                                }    
                            )
                            */
                            // this then -> update db table
                            .then(function(response_update_text){
                                try{
                                    // update db
                                    post_mhm_comment({
                                        action: "update",
                                        id: $scope.currentId,
                                        caption: $scope.currentComment.replace(/\n/g, "/br")
                                    })
                                        .then(function(data){
                                            //alert("テーブル(COMMON_D_MEMO)にコメントを登録しました。後に手動でテーブルからMHMデータ管理シートに値をコピーしてください");
                                            appendMsg("テーブル(MHM_M_POINT_DATA)のコメントを更新しました");
                                        });
                                }
                                catch(e){
                                    console.log("fatal error occured... in db update process");
                                    console.log(e);
                                }
                            })
                        ;
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