(function(){
    'use strict';

	angular.module('MHM-APP')
        .controller('HeaderController', function($scope, $routeParams, MapHandler, MapPointDataAdapter, CurrentState) {
            // map初期化
            MapHandler.loadMap(document.getElementById("history_map"));

            // ---------- Display Items ----------
            $scope.items = [];
            $scope.selected_item = {
                images_thumb: []
            };
            
            // ---------- Local Functions ----------
            // point dataを検索する
            var searchPoint = function(param, callback){
                // 検索条件を更新
                CurrentState.searchCondition = param;

                // レコード取得
                MapPointDataAdapter.getData(param)
                    .then(function(items){
                        // レコードなしの場合
                        if(!items){
                            $scope.showMessage("データ取得に失敗しました...", "alert-dangaer");
                        }
                        else{
                            $scope.showMessage("" + items.length + "件ヒットしました", "alert-success");
                        }

                        if(!!callback) callback(items);
                    });
            };
            // card 又は markerのclick時動作を1本化
            var selectItem = function(index){
                CurrentState.searchedItems = $scope.items;
                CurrentState.index = index;
                CurrentState.selectedTab = "M";

                $scope.move("/detail/");
            };
            // 全件markerを削除
            var deleteAllMarkers = function(){
                MapHandler.deleteMarkers();
            };
            // 全件markerを追加
            var addAllMarkers = function(){
                $scope.items.forEach(function(item, i){
                    addMarker(i);
                });
            };
            // markerをセット
            var addMarker = function(index){
                // indexをクロージャする...
                var ClickItem = function(){
                    // 変更を反映させる
                    $scope.$apply(function(){
                        //$scope.selectItem(index);
                        selectItem(index);
                    });
                };

                var marker_color_def = $scope.PLACE_COLOR_MAP[$scope.items[index].place_type];

                // Markerを追加
                MapHandler.addMarker(
                    $scope.items[index],
                    {
                        index: index,
                        marker_color: marker_color_def ? marker_color_def.body : "",
                        marker_line_color: marker_color_def ? marker_color_def.line : "",
                        marker_opacity: (score=>{ // opacityを求める. 評価が高い程鮮明に表示する
                            var opacity = 0.4;
                            if(!isNaN(score) && (score != null)){
                                // scoreは0-9の想定
                                opacity += (Number(score) + 1) / (10.0 * (1.0 / (1.0 - opacity)));
                            }
                            return opacity;
                        })($scope.items[index].favorite)
                    },
                    ClickItem);
            };


            /* ---------- Angular scope Functions ---------- */
            // ---------- Init ----------
            $scope.init = function(){

                console.log("HeaderController -> init");

                CurrentState.searchCondition = CurrentState.searchCondition || {};
                var lat = null;
                var lng = null;

                // 変更点があるか                    
                if(["w_pref", "w_ptype", "w_score", "w_name", "w_hasnoimg", "order"].filter(v=> !(($routeParams[v] || "") == (CurrentState.searchCondition[v] || ""))).length > 0){

console.log("forceSearch");

                    $scope.updateMapPoints({
                        w_pref : $routeParams.w_pref  || "",
                        w_ptype: $routeParams.w_ptype || "",
                        w_score: $routeParams.w_score || "",
                        w_name : $routeParams.w_name  || "",
                        w_hasnoimg : $routeParams.w_hasnoimg  || "",
                        order  : $routeParams.order   || ""
                    });
                }
                // 位置情報リストが既にあれば単純描画(detailから戻った場合)
                else if(CurrentState.searchedItems && (CurrentState.searchedItems.length > 0)){
                    
console.log("no retrieve");

                    deleteAllMarkers();

                    $scope.items = CurrentState.searchedItems;

                    addAllMarkers();

                    // 検索済レコードからlatlngを取得する
                    var current_item = CurrentState.searchedItems && (CurrentState.index >= 0) && (CurrentState.index < CurrentState.searchedItems.length)
                        ? CurrentState.searchedItems[CurrentState.index] : {lat: null, lng: null};

                    lat = current_item.lat;
                    lng = current_item.lng;
                }
                // 全てのルートに当てはまらない⇒ページ初回ロード時↓
                else{

console.log("else... maybe first load");

                    // point dataを問合せ
                    $scope.updateMapPoints();
                }

                // デフォルトタブを決定
                if(window.CommonFunctions.isEmpty(CurrentState.selectTab)){
                    CurrentState.selectTab = "M";
                }

                $scope.selectTab(CurrentState.selectTab, lat, lng);
            };
            $scope.selectTab = function(tabname, lat, lng){
                if(tabname == "M"){
                    jQuery("#tab-map").tab("show");
                    jQuery("#tab-map").addClass("active");

                    jQuery("#tab-card").removeClass("active");
                    jQuery("#tab-list").removeClass("active");

                    MapHandler.update(lat, lng);
                }
                else if(tabname == "C"){
                    jQuery("#tab-card").tab("show");
                    jQuery("#tab-card").addClass("active");

                    jQuery("#tab-map").removeClass("active");
                    jQuery("#tab-list").removeClass("active");
                }
                else if(tabname == "L"){
                    jQuery("#tab-list").tab("show");
                    jQuery("#tab-list").addClass("active");

                    jQuery("#tab-map").removeClass("active");
                    jQuery("#tab-card").removeClass("active");
                }

                CurrentState.selectTab = tabname;
            };
            // 現在のpointitemsから全件描画する
            $scope.updateMapPoints = function(params){
                // 選択中を削除
                $scope.selected_item = {};
                // 一旦削除
                deleteAllMarkers();

                // 検索&描画
                searchPoint(params, function(items){
                    $scope.items = items;
                    addAllMarkers();
                });
            };
            $scope.selectCard = function(index){
                selectItem(index);
            };
            $scope.add2Favorite = function(index){
                var item = $scope.items[index];

                if(item && item.id){
                    window.StorageManager_Fav.set(item.id, {
                        id: item.id,
                        name: item.name,
                        datetime: CommonFunctions.formatDate(new Date())
                    });
                }
            };
            // favに入っているかをチェック
            $scope.isAlreadyFav = function(item){
                return !!StorageManager_Fav.get(item.id);
            };
        })
})();
