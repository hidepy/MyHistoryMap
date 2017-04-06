(function(){
    'use strict';

    var mp = google.maps;
    var module = angular.module('app', []);

    module.controller('AppController', function($scope, MapPointDataAdapter, MapHandler) {

        $scope.selected_item = {};
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

        // admin権限と判断するキーをURLから取得
        var tasokoriadmin_key = (function(){
            var target = location.search.substring(1).split('&').filter(function(v){
                var splitted_v = v.split("=");
                return splitted_v[0] == "imtasokoriadmin";
            });
            if(target.length == 1){
                var splitted_str = target[0].split("=");
                return splitted_str.length == 2 ? splitted_str[1] : "";
            }
        })();

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
                    $scope.selected_item = $scope.items[index];
                });
            };

            // Markerを追加
            MapHandler.addMarker($scope.items[index], {index: index}, ClickItem);
        };

        $scope.selectCard = function(index){
            var item = $scope.items[index];
            // 選択明細カードを更新
            $scope.selected_item = item;
        };

        // thumbnail 選択時
        $scope.selectThumbnailImg = function(index, event){
            var thumb_item = $scope.selected_item.images[index];
            $scope.selected_item.image_url = thumb_item;
        };

        // Start 押下時
        $scope.pushStart = function(){
            // ヘッダをしまってMapを再描画(表示されないんで)
            jQuery("#header > .container").hide(300 , function(){
              $("#header").remove();
                MapHandler.update();
            });

            // 各要素を表示状態に
            ["#top_navigation", "#search_condition_wrapper", "#map_detailarea_wrapper", "#cards_wrapper"].forEach(function(v){
                jQuery(v).show(100);
            });

            // 初期化
            MapHandler.loadMap(document.getElementById("history_map"));

            // point dataを問合せ
            //$scope.searchPoint();
            $scope.updateMapPoints();
        };

        // 現在のpointitemsから全件描画する
        $scope.updateMapPoints = function(){
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

            // adminキーをセット
            if(!!tasokoriadmin_key){
                param["adminkey"] = tasokoriadmin_key;
            }

            // レコード取得
            MapPointDataAdapter.getData(param)
                .then(function(items){
                    $scope.items = items;
                    if(!!callback) callback($scope.items);
                });
        };
    });

    module.service("MapHandler", function(){
        // クロージャされる
        var map = {};
        var markers = [];

        var infowindow = new mp.InfoWindow({
            content: "",
            maxWidth: 128
        });
        var INFO_TEMPLATE = "<div><h3>%TITLE%</h3><p>%COMMENT%</p></div>";

        // 選択中マーカ
        var current_select_marker = -1;

        this.loadMap = function(el_map){
            map = new mp.Map(el_map, {
                  center: (new mp.LatLng(35.792621, 139.406513)),
                  zoom: 8
                }
            );
            /*
            mp.event.addDomListener(window, "resize", function(){

            });
            */
        };
        this.update = function(){
            mp.event.trigger(map, "resize");
        };
        this.addMarker = function(item, options, callback){
            var mkr = new mp.Marker({
                position: new mp.LatLng(item.lat, item.lng),
                title: item.name
            });

            mkr.setMap(map);

            // marker click時の色管理
            mp.event.addListener(mkr, "click", function(){

                infowindow.setContent(
                    INFO_TEMPLATE
                        .replace("%TITLE%", mkr.title)
                        .replace("%COMMENT%", (item.caption || ""))
                );
                
                infowindow.open(map, this);
                
                if(!!options && (options.index >= 0)){
                    if(current_select_marker != options.index){
                    }

                    current_select_marker = options.index;
                }
            });

            // callback指定あれば
            if(!!callback){
                mp.event.addListener(mkr, "click", callback);
            }


            markers.push(mkr);
        };
        this.deleteMarkers = function(){
            markers.forEach(function(mkr){
                mkr.setMap(null);
            });
            markers = [];
        };
    });

    module.service("MapPointDataAdapter", function($http){
        this.getData = function(param){
            var query_string = "&needonlydata=true";
            for(var p in param){
                query_string += "&" + p + "=" + param[p];
            }
            return $http.jsonp("index.php" + "?" + "callback=JSON_CALLBACK" + query_string)
                // 戻りはpromiseオブジェクトなんで
                .then(function(response_wrapper){
                    var response = response_wrapper.data;
                    var res_items = [];
                    if(response && response.head_info && (response.head_info.length > 0)){
                        for(var i = 0; i < response.head_info.length; i++){
                            var item = response.head_info[i];
                            var detail_image_info = response.detail_info[item.id];
                            var detal_images = [];
                            if(detail_image_info){
                                detal_images = detail_image_info.reduce(function(p, c){
                                    return Array.isArray(p) ? p.push(c.image_url) : [p.image_url, c.image_url];
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
                                images: detal_images,
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
