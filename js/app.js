(function(){
    'use strict';

    var mp = google.maps;
    var module = angular.module('app', []);

    module.controller('AppController', function($scope, MapPointDataAdapter) {

        $scope.selected_item = {};
        $scope.items = [];
        $scope.markers = [];
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
            $scope.markers.forEach(function(mkr){
                mkr.setMap(null);
            });

            $scope.markers = [];
        };

        // 全件markerを追加
        $scope.addAllMarkers = function(){
            $scope.items.forEach(function(item, i){
                $scope.addMarker(i);
            });
        };

        // markerをセット
        $scope.addMarker = function(index){
            var item = $scope.items[index];
            console.log("addMarker clicked. idx=" + index);

            var mkr = new mp.Marker({
                position: new mp.LatLng(item.lat, item.lng),
                title: item.name
            });
            mkr.unique_idx = index;
            mkr.setMap(history_map);
            mp.event.addListener(mkr, "click", function(event){
                // ここは苦しい...クロージャでいいらしいけど...メモリリークが気になる
                // 変更を反映させる
                $scope.$apply(function(){
                    $scope.selected_item = $scope.items[mkr.unique_idx];
                });
            });

            $scope.markers.push(mkr);
        };

        $scope.selectCard = function(index){
            var item = $scope.items[index];
            console.log("selectCard clicked. idx=" + index);
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


            // ここ汚いからなんとかして...
            jQuery("#header > .container").hide( 300 , function(){
              $("#header").remove();

                mp.event.trigger(history_map,'resize');
            });

            jQuery("#top_navigation").show(100, function(){
              this.style.display = "inline";
            });
            jQuery("#search_condition_wrapper").show(100, function(){
              this.style.display = "inline";
            });
            jQuery("#map_detailarea_wrapper").show(100, function(){
              this.style.display = "inline";
            });
            jQuery("#cards_wrapper").show(100, function(){
              this.style.display = "inline";
            });


            // mapの初期化
            initialize_map();

            // point dataを問合せ
            $scope.searchPoint();
        };

        // point dataを検索する
        $scope.searchPoint = function(){
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
                });
        };
    });

    module.service("MapPointDataAdapter", function($http){
        this.getData = function(param){
            var query_string = "&needonlydata=true";
            for(var p in param){
                query_string += "&" + p + "=" + param[p];
            }
            return $http.jsonp(/*"store_my_history_map_data.php"*/"index.php" + "?" + "callback=JSON_CALLBACK" + query_string)
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
