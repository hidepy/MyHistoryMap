(function(){
    'use strict';

    // load event
    // normal javascript
    document.addEventListener("DOMContentLoaded", function(){
        // 本来は、angularの世界なんでservice化すべきとも思うが...angular以外でも使い回ししたいんで
        window.StorageManager_Fav = new StorageManager("MHM-Favorite");

        window.CommonFunctions = {
            formatDate: function(date){
                return ("" + date.getFullYear() + ("00" + (date.getMonth() + 1)).slice(-2) + ("00" + date.getDate()).slice(-2) + ("00" + date.getHours()).slice(-2) + ("00" + date.getMinutes()).slice(-2) + ("00" + date.getSeconds()).slice(-2) );
            }
        };
        /*
        var TABCONTENT_HEIGHT = window.innerHeight * (45.0 / 100.0);
        document.getElementById("history_map").style.height   = TABCONTENT_HEIGHT;
        document.getElementById("cards_wrapper").style.height = TABCONTENT_HEIGHT;
        document.getElementById("cards_wrapper").style.maxHeight = TABCONTENT_HEIGHT;
        document.getElementById("cards_wrapper").style.overflow = "scroll";
        */
    });

    // angular module setup
    angular.module('MHM-APP', ['ngRoute', 'slickCarousel', 'MapHandlerService'])
        .config(function($routeProvider, $locationProvider){
            $routeProvider
                .when("/", {
                    templateUrl: "js/view/main.html",
                    controller: "HeaderController"
                })
                .when("/detail/", {
                    templateUrl: "js/view/detail.html",
                    controller: "DetailController"
                })
                .otherwise({
                    redirectTo: "/"
                });
            $locationProvider.hashPrefix('');
        })
        .controller('RootController', function($scope, $location){
            $scope.title = "絶景マップ";
            $scope.move = function(path){
                $location.path(path);
            };
        })
        .controller('HeaderController', function($scope, MapPointDataAdapter, MapHandler, CurrentState) {

            // map初期化
            MapHandler.loadMap(document.getElementById("history_map"));

            $scope.search_group = "zenkoku";
            $scope.selected_item = {
                images_thumb: []
            };
            $scope.items = [];
            $scope.pref_list = [                                                            "北海道", "青森", "岩手", "宮城", "秋田", "山形", "福島", "茨城", "栃木", "群馬", "埼玉", "千葉", "東京", "神奈川", "新潟", "富山", "石川", "福井", "山梨", "長野", "岐阜", "静岡", "愛知", "三重", "滋賀", "京都", "大阪", "兵庫", "奈良", "和歌山", "鳥取", "島根", "岡山", "広島", "山口", "徳島", "香川", "愛媛", "高知", "福岡", "佐賀", "長崎", "熊本", "大分", "宮崎", "鹿児島", "沖縄"];
            $scope.selected_pref = [];
            $scope.order_list = [
                {id: "", name: "default"},
                {id: "o_rec-d", name: "recommend"},
                {id: "o_new-d", name: "newer-desc"},
                {id: "o_new-a", name: "newer-asc"},
                {id: "o_cro-d", name: "crowdness-desc"},
                {id: "o_cro-a", name: "crowdness-asc"},
                {id: "o_acc-d", name: "accessibility-desc"},
                {id: "o_acc-a", name: "accessibility-asc"}
            ];
            $scope.selected_order = "";

            /* ---------- Angular scope Functions ---------- */
            $scope.init = function(){

                // selected_prefの初期値を、urlのprefパラメータから求める
                /*
                $scope.selected_pref = location.search.substring(1).split("&")
                    .map(v=>{
                        return v.split("=");
                    })
                    .filter(v=>{
                        v[1] = decodeURI(v[1]);// ここほんとさいあく。
                        return (v[0] == "pref") && ($scope.pref_list.filter(p=>{ return (p==v[1])}).length > 0)
                    })
                    .map(v=>v[1]);
                */

                if(CurrentState.searchedItems && (CurrentState.searchedItems.length > 0)){
                    $scope.deleteAllMarkers();

                    $scope.items = CurrentState.searchedItems;

                    $scope.addAllMarkers();
                }
                else{
                    // point dataを問合せ
                    $scope.updateMapPoints();
                }
            };

            $scope.selectTab = function(tabname){
                if(tabname == "M"){
                    jQuery("#tab-map").tab("show");
                    jQuery("#tab-card").removeClass("active");

                    MapHandler.update();
                }
                else if(tabname == "C"){
                    jQuery("#tab-card").tab("show");
                    jQuery("#tab-map").removeClass("active");
                }
            };

            // card 又は markerのclick時動作を1本化
            $scope.selectItem = function(index){
                CurrentState.searchedItems = $scope.items;
                CurrentState.index = index;
                CurrentState.mode = "M";

                $scope.move("/detail/");
            };

            // favに入っているかをチェック
            $scope.isAlreadyFav = function(item){
                return !!StorageManager_Fav.get(item.id);
            };

            // 全件markerを削除
            $scope.deleteAllMarkers = function(){
                MapHandler.deleteMarkers();
            };

            // 全件markerを追加
            $scope.addAllMarkers = function(){
                $scope.items.forEach(function(item, i){
                    $scope.addMarker(i);
                });
            };

            // markerをセット
            $scope.addMarker = function(index){
                // indexをクロージャする...
                var ClickItem = function(){
                    // ここは苦しい...クロージャでいいらしいけど...メモリリークが気になる
                    // 変更を反映させる
                    $scope.$apply(function(){
                        //$scope.selected_item = $scope.items[index];
                        $scope.selectItem(index);
                    });
                };

                // Markerを追加
                MapHandler.addMarker($scope.items[index], {index: index}, ClickItem);
            };

            $scope.selectCard = function(index){
                $scope.selectItem(index);
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

            // thumbnail 選択時
            $scope.selectThumbnailImg = function(index){
                if(index <  $scope.selected_item.images.length){
                    // 現在は, aタグでポップアップコースになったので不要か...?
                }
            };

            // 現在のpointitemsから全件描画する
            $scope.updateMapPoints = function(){

console.log("update map points");

                // 選択中を削除
                $scope.selected_item = {};
                // 一旦削除
                $scope.deleteAllMarkers();
                // 検索&描画
                $scope.searchPoint(function(){
                    // callbackのは受け取らないで$scopeからitemsを拾う
                    $scope.addAllMarkers();
                });
            };

            // point dataを検索する
            $scope.searchPoint = function(callback){

                var param = {};

                // where句のprefに関する絞込条件を設定
                if($scope.selected_pref && ($scope.selected_pref.length > 0)){
                    param["w_pref"] = $scope.selected_pref.join("_");
                }

                // order by句のパラメータを設定
                if(!!$scope.selected_order){
                    param["order"] = $scope.selected_order;
                }

                // レコード取得
                MapPointDataAdapter.getData(param)
                    .then(function(items){
                        $scope.items = items;
                        if(!!callback) callback($scope.items);
                    });
            };

            $scope.thumbLoaded = false;
            // slick(carouselのやつ)の設定
            $scope.slickConfig = {
                enabled: true,
                autoplay: false,
                draggable: true,
                centerMode: true,
                fade: true,
                mobileFirst: true,
                method: {}/*,
                event: {
                    beforeChange: function (event, slick, currentSlide, nextSlide) {
                    },
                    afterChange: function (event, slick, currentSlide, nextSlide) {
                    }
                }
                */
            };
        })
        .controller('DetailController', function($scope, $timeout, CurrentState) {
            $scope.thumbLoaded = false;

            $timeout(function(){
                $scope.selected_item = CurrentState.searchedItems[CurrentState.index];
                $scope.thumbLoaded = true;
            }, 1);
        })
        // Header-Detail画面で値のやり取りに使用. 既に検索しているheader情報や選択しているindexの値を保持する
        .service("CurrentState", function(){
            this.searchedItems = [];
            this.index = -1;
        })
        .service("MapPointDataAdapter", function($http){
            this.getData = function(param){
                var query_string = "needonlydata=true";
                for(var p in param){
                    query_string += "&" + p + "=" + param[p];
                }
                //return $http.jsonp("index.php" + "?" + "callback=JSON_CALLBACK" + query_string)
                return $http.jsonp("index.php" + "?" + query_string, {jsonpCallbackParam: 'callback'})
                    // 戻りはpromiseオブジェクトなんで
                    .then(function(response_wrapper){
                        var response = response_wrapper.data;
                        var res_items = [];
                        if(response && response.head_info && (response.head_info.length > 0)){
                            for(var i = 0; i < response.head_info.length; i++){
                                var item = response.head_info[i];
                                var detail_image_info = response.detail_info[item.id];
                                var detail_images = [];
                                var detail_images_thumb = [];
                                if(detail_image_info){
                                    detail_images = detail_image_info.map(function(v){
                                        return v.image_url;
                                    });
                                    detail_images_thumb = detail_image_info.map(function(v){
                                        return v.image_url_thumb;
                                    });
                                }
                                res_items.push({
                                    id: item.id,
                                    name: item.name,
                                    lat: item.lat,
                                    lng: item.lng,
                                    zip_no: item.zip_no,
                                    address: item.address,
                                    caption: item.caption,
                                    prefecture: item.pref,
                                    season: item.season,
                                    accessibility: item.accessibility,
                                    crowdness: item.crowdness,
                                    image_url: item.image_url,
                                    images: detail_images,
                                    images_thumb: detail_images_thumb,
                                    visit_date: item.visit_date
                                });
                            }
                        }
                        return res_items;
                    }
                );
            }
        });
})();
