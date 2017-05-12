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
            },
            isEmpty: function(s){
                return (s == null) || (s == undefined) || (s == "");
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

// Given:
// URL: http://server.com/index.html#/Chapter/1/Section/2?search=moby
// Route: /Chapter/:chapterId/Section/:sectionId
//
// Then
//$routeParams ==> {chapterId:'1', sectionId:'2', search:'moby'}

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
            $locationProvider.html5Mode(true);
        })
        .controller('RootController', function($scope, $location){

            // ---------- properties ----------
            $scope.PLACE_COLOR_MAP = {
                "N": {
                    body: "#80d080",
                    line: "#50a050"
                },
                "B": {
                    body: "#d08070",
                    line: "#a05040"
                },
                "P": {
                    body: "#eeee60",
                    line: "#bebe30"
                },
                "H": {
                    body: "#606060",
                    line: "#303030"
                }
            };

            // ---------- methods ----------
            $scope.move = function(path, param){
                $location.path(path).search(param || {});
            };
        })
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
                if(["w_pref", "w_ptype", "w_score", "w_name", "order"].filter(v=> !(($routeParams[v] || "") == (CurrentState.searchCondition[v] || ""))).length > 0){

console.log("forceSearch");

                    $scope.updateMapPoints({
                        w_pref : $routeParams.w_pref  || "",
                        w_ptype: $routeParams.w_ptype || "",
                        w_score: $routeParams.w_score || "",
                        w_name : $routeParams.w_name  || "",
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

                    MapHandler.update(lat, lng);
                }
                else if(tabname == "C"){
                    jQuery("#tab-card").tab("show");
                    jQuery("#tab-card").addClass("active");
                    jQuery("#tab-map").removeClass("active");
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
        .controller('DetailController', function($scope, $timeout, CurrentState) {

            // 前画面で選択された場所情報を格納する
            $scope.selected_item = {};
            // thumbnail選択された詳細情報を格納する
            $scope.selected_item_detail = {};

            // first select img index
            $scope.selected_img_index = 0;

            // carousel 有効/無効制御
            $scope.thumbLoaded = false;

            // slick(carouselのやつ)の設定
            $scope.slickConfig = {
                enabled: true,
                dots: true,
                infinite: false,
                speed: 300,
                slidesToShow: 4,
                slidesToScroll: 4,
                responsive: [
                    {
                      breakpoint: 1024,
                      settings: {
                        slidesToShow: 4,
                        slidesToScroll: 4,
                        infinite: true,
                        dots: true
                      }
                    },
                    {
                      breakpoint: 600,
                      settings: {
                        slidesToShow: 3,
                        slidesToScroll: 3,
                        infinite: true
                      }
                    },
                    {
                      breakpoint: 480,
                      settings: {
                        slidesToShow: 2,
                        slidesToScroll: 2,
                        infinite: true
                      }
                    }
                  ],
                method: {},
                event: {
                    afterChange: function (event, slick, currentSlide, nextSlide) {
                        $scope.selected_img_index = currentSlide;
                        $scope.selected_item_detail = $scope.selected_item.detail_info[currentSlide];
                    }
                }
            };

            // initialize
            $scope.init = function(){
                // carousel setup
                $timeout(function(){
                    $scope.selected_img_index = 0;
                    $scope.selected_item = CurrentState.searchedItems[CurrentState.index];
                    $scope.selected_item_detail = $scope.selected_item.detail_info[$scope.selected_img_index];
                    $scope.thumbLoaded = true;
                }, 1);
            };

            // event when location change
            //   to close lightbox
            $scope.$on('$locationChangeStart', function(event, next, current){
                // Here you can take the control and call your own functions:
                //alert('Sorry ! Back Button is disabled');
                // Prevent the browser default action (Going back):
                //event.preventDefault();            
            });
        })
        .directive("navHeader", function(){
            return {
                templateUrl: "js/view/nav-search.html",
                scope: true,
                controller: function($scope){
                    // ----------- Search Params ----------
                    $scope.title = "zekkei map";
                    $scope.search_group = "zenkoku";

                    $scope.pref_list = [                                                            "北海道", "青森", "岩手", "宮城", "秋田", "山形", "福島", "茨城", "栃木", "群馬", "埼玉", "千葉", "東京", "神奈川", "新潟", "富山", "石川", "福井", "山梨", "長野", "岐阜", "静岡", "愛知", "三重", "滋賀", "京都", "大阪", "兵庫", "奈良", "和歌山", "鳥取", "島根", "岡山", "広島", "山口", "徳島", "香川", "愛媛", "高知", "福岡", "佐賀", "長崎", "熊本", "大分", "宮崎", "鹿児島", "沖縄"];
                    $scope.selected_pref = [];

                    $scope.type_list = [
                        {id: "",  name: "(no)"},
                        {id: "N", name: "Nat"},
                        {id: "B", name: "Bui"},
                        {id: "P", name: "Pla"},
                        {id: "H", name: "Hot"},
                    ];
                    $scope.selected_type = [];

                    $scope.score_list = [
                        {id: "8", name: "SPLENDID!!"},
                        {id: "5", name: "GOOD!"},
                        {id: "",  name: "ALL"}
                    ];
                    $scope.selected_score = "";

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

                    $scope.keyword = "";

                    $scope.search_toggle_state = false;

                    $scope.toggleSearchMenu = function(){
                        $scope.search_toggle_state = !$scope.search_toggle_state;
                    }

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
                        // order by句のパラメータを設定
                        if(!!$scope.selected_order){
                            param["order"] = $scope.selected_order;
                        }

                        $scope.move("/", param);
                    };
                }
            };
        })
        .directive("adsense", function(){
            return {
                restrict: "E",
                template: '<script async src="//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>    <ins class="adsbygoogle"         style="display:block"         data-ad-format="autorelaxed"         data-ad-client="ca-pub-2131186805773040"         data-ad-slot="2021420810"></ins>    <script>         (adsbygoogle = window.adsbygoogle || []).push({});    </script>',
                compile: function(el, attr){
                    
                }
            }
        })
        // Header-Detail画面で値のやり取りに使用. 既に検索しているheader情報や選択しているindexの値を保持する
        .service("CurrentState", function(){
            this.searchedItems = [];
            this.index = -1;
            this.selectedTab = "M";
            this.searchCondition = {};
        })
        .service("MapPointDataAdapter", function($http){
            // monthからseasonを返す
            var month_season_map = {
                "3": "SPRI", "4": "SPRI", "5": "SPRI",
                "6": "SUMM", "7": "SUMM", "8": "SUMM",
                "9": "AUTU", "10":"AUTU", "11":"AUTU",
                "12":"WINT", "1": "WINT", "2": "WINT"
            };
            this.getData = function(param){
                var query_string = "needonlydata=true";
                for(var p in param){
                    query_string += "&" + p + "=" + param[p];
                }
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
                                    prefecture: item.pref,
                                    zip_no: item.zip_no,
                                    address: item.address,
                                    caption: item.caption,
                                    favorite: item.favorite,
                                    accessibility: item.accessibility,
                                    crowdness: item.crowdness,
                                    place_type: item.place_type,
                                    image_url: item.image_url,
                                    detail_info: response.detail_info[item.id],
                                    images: detail_images,
                                    images_thumb: detail_images_thumb
                                });
                            }
                        }
console.log("in MapPointDataAdapter getData success");
                        return res_items;
                    }
                );
            }
        });
})();
