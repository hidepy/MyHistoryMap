(function(){
    'use strict';

	angular.module('MHM-APP')
		.directive("navHeader", function(){
            return {
                templateUrl: "js/view/nav-search.html",
                scope: true,
                link: function(scope, el, attr){
                    // admin属性があれば...
                    if(!!attr.$attr["isAdmin"]){
                        scope.binding.is_admin = true;
                    }
                },
                controller: function($scope, $window){
                    // ----------- Search Params ----------
                    // 選択された検索条件
                    $scope.selected_pref = [];
                    $scope.selected_area = "";
                    $scope.selected_type = [];
                    $scope.selected_type2 = [];
                    $scope.selected_score = "";
                    $scope.selected_order = "";
                    $scope.get_no_img_data = false;
                    $scope.keyword = "";

                    $scope.search_toggle_state = false;

                    $scope.toggleSearchMenu = function(){
                        $scope.search_toggle_state = !$scope.search_toggle_state;
                    };

                    $scope.moveBack = function($event){
                        $event.preventDefault();

                        // 詳細ページなら前画面に戻る, ヘッダページなら条件クリアで再描画
                        if($scope.binding.is_detail_page){
                            $window.history.back();
                        }
                        else{
                            $scope.move("/");
                        }
                    };
                    
                    $scope.doSearch = function(){

                        // 入力チェック
                        if($scope.selected_pref.length > 8){
                            $scope.showMessage("地域は8個まで指定できます", "alert-danger");
                            return;
                        }


                        // close search area
                        $scope.search_toggle_state = false;

                        var param = {};

                        // where句のprefに関する絞込条件を設定
                        // 県
                        if($scope.selected_pref && ($scope.selected_pref.length > 0)){
                            param["w_pref"] = $scope.selected_pref.join("-");
                        }
                        // 地域が指定されていれば県を上書きする
                        if($scope.selected_area){
                            param["w_pref"] = $scope.selected_area;
                        }
                        if($scope.selected_type && ($scope.selected_type.length > 0)){
                            param["w_ptype"] = $scope.selected_type.join("-");
                        }
                        if($scope.selected_type2 && ($scope.selected_type2.length > 0)){
                            param["w_tags"] = $scope.selected_type2.join("-");
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
