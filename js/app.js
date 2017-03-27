(function(){
    'use strict';
    var module = angular.module('app', []);

    module.controller('AppController', function($scope, MapPointDataAdapter) {

        $scope.selected_item = {};
        $scope.items = [];
        $scope.markers = [];
        $scope.pref_list = [                                                            "北海道", "青森", "岩手", "宮城", "秋田", "山形", "福島", "茨城", "栃木", "群馬", "埼玉", "千葉", "東京", "神奈川", "新潟", "富山", "石川", "福井", "山梨", "長野", "岐阜", "静岡", "愛知", "三重", "滋賀", "京都", "大阪", "兵庫", "奈良", "和歌山", "鳥取", "島根", "岡山", "広島", "山口", "徳島", "香川", "愛媛", "高知", "福岡", "佐賀", "長崎", "熊本", "大分", "宮崎", "鹿児島", "沖縄"];
        $scope.selected_pref = [];
        $scope.order_list = [
            {id: "", "default"},
            {id: "recommend", name: "recommend"},
            {id: "newer-desc", name: "newer-desc"},
            {id: "newer-asc", name: "newer-asc"},
            {id: "crowdness-desc", name: "crowdness-desc"},
            {id: "crowdness-asc", name: "crowdness-asc"}
        ];
        $scope.selected_order = "";

        // 全件markerを削除
        $scope.deleteMarkers = function(){
            $scope.markers.forEach(function(mkr){
                mkr.setMap(null);
            });

            $scope.markers = [];
        };

        // marker選択時
        $scope.selectMapData = function(index, event){
            var item = $scope.items[index];
            $scope.selected_item = item;

            var mkr = new google.maps.Marker({
                position: new google.maps.LatLng(item.lat, item.lng)
            });

            mkr.setMap(history_map);

            $scope.markers.push(mkr);
        };

        // thumbnail 選択時
        $scope.selectThumbnailImg = function(index, event){
            var thumb_item = $scope.selected_item.images[index];
            $scope.selected_item.image_url = thumb_item;
        };

        // Start 押下時
        $scope.pushStart = function(){
            jQuery("#header > .container").hide( 300 , function(){
              $("#header").remove();
            });
            jQuery("#top_navigation").show("slow", function(){
              this.style.display = "inline";
            });
            jQuery("#contents").show("slow", function(){
              this.style.display = "inline";
            });

            // mapの初期化
            initialize_map();

            // point dataを問合せ
            MapPointDataAdapter.getData({})
                .then(function(items){
                    $scope.items = items;
                });
        };

        // point dataを検索する
        $scope.searchPoint = function(){
            var param = {};

            // where句のprefに関する絞込条件を設定
            if($scope.selected_pref && ($scope.selected_pref.length > 0)){
                param["w_pref"] = $scope.selected_pref.join("_");
            }

            // レコード取得
            MapPointDataAdapter.getData(param)
                .then(function(items){
                    $scope.items = items;
                });
        };
    });

    module.service("MapPointDataAdapter", function($http){
        this.getData = function(param){
            var query_string = "";
            for(var p in param){
                query_string += "&" + p + "=" + param[p];
            }
            return $http.jsonp("store_my_history_map_data.php" + "?" + "callback=JSON_CALLBACK" + query_string)
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
