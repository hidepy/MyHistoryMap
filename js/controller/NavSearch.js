(function(){
    'use strict';

	angular.module('MHM-APP')
		.directive("navHeader", function(){
            return {
                templateUrl: "js/view/nav-search.html",
                scope: true,
                controller: function($scope, $window){
                    // ----------- Search Params ----------
                    $scope.title = $scope.isDetailPage() ? "戻る" : "絶景マップ";

                    $scope.pref_list = [                                                            "北海道", "青森", "岩手", "宮城", "秋田", "山形", "福島", "茨城", "栃木", "群馬", "埼玉", "千葉", "東京", "神奈川", "新潟", "富山", "石川", "福井", "山梨", "長野", "岐阜", "静岡", "愛知", "三重", "滋賀", "京都", "大阪", "兵庫", "奈良", "和歌山", "鳥取", "島根", "岡山", "広島", "山口", "徳島", "香川", "愛媛", "高知", "福岡", "佐賀", "長崎", "熊本", "大分", "宮崎", "鹿児島", "沖縄"];
                    $scope.selected_pref = [];

                    $scope.type_list = [
                        {id: "",  name: "(指定なし)"},
                        {id: "N", name: "自然の景色"},
                        {id: "B", name: "建造物"},
                        {id: "P", name: "プレイスポット"},
                        //{id: "H", name: "宿"}
                    ];
                    $scope.selected_type = [];

                    $scope.score_list = [
                        {id: "8", name: "最高の絶景のみ！"},
                        {id: "5", name: "良景以上"},
                        {id: "",  name: "すべて"}
                    ];
                    $scope.selected_score = "";

                    $scope.order_list = [
                        {id: "", name: "(ソート指定なし)"},
                        {id: "o_rec-d", name: "オススメ順"},
                        {id: "o_new-d", name: "新しい順"},
                        {id: "o_new-a", name: "古い順"},
                        {id: "o_cro-a", name: "混雑度低い順"},
                        {id: "o_cro-d", name: "混雑度高い順"},
                        {id: "o_acc-d", name: "アクセスし易い順"},
                        {id: "o_acc-a", name: "アクセスし難い順"}
                    ];
                    $scope.selected_order = "";

                    $scope.get_no_img_data = false;

                    $scope.keyword = "";

                    $scope.search_toggle_state = false;

                    $scope.toggleSearchMenu = function(){
                        $scope.search_toggle_state = !$scope.search_toggle_state;
                    };

                    $scope.move2Top = function($event){
                        $event.preventDefault();

                        // 詳細ページなら前画面に戻る, ヘッダページなら条件クリアで再描画
                        if($scope.isDetailPage()){
                            $window.history.back();
                        }
                        else{
                            $scope.move("/");
                        }
                    };

                    $scope.doSearch = function(){
                        // close search area
                        $scope.search_toggle_state = false;

                        var param = {};

                        // where句のprefに関する絞込条件を設定
                        if($scope.selected_pref && ($scope.selected_pref.length > 0)){
                            param["w_pref"] = $scope.selected_pref.join("-");
                        }
                        if($scope.selected_type && ($scope.selected_type.length > 0)){
                            param["w_ptype"] = $scope.selected_type.join("-");
                        }
                        if($scope.selected_score){
                            param["w_score"] = $scope.selected_score;
                        }
                        if($scope.keyword){
                            param["w_name"] = $scope.keyword;
                        }
                        if($scope.get_no_img_data){
                            param["w_hasnoimg"] = $scope.get_no_img_data ? "1" : "0";
                        }
                        // order by句のパラメータを設定
                        if(!!$scope.selected_order){
                            param["order"] = $scope.selected_order;
                        }

                        $scope.move("/", param);
                    };
                }
            };
        });
})();
