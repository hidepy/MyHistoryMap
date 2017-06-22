(function(){
    'use strict';

	angular.module('MHM-APP')
        .controller('DetailController', function($scope, $timeout, $routeParams, CurrentState, MapPointDataAdapter) {

            // 前画面で選択された場所情報を格納する
            $scope.selected_item = {};
            // thumbnail選択された詳細情報を格納する
            $scope.selected_item_detail = {};

            // first select img index
            $scope.selected_img_index = 0;

            // carousel 有効/無効制御
            $scope.thumbLoaded = false;

            // データロード失敗
            $scope.has_no_data = false;

            // slick(carouselのやつ)の設定
            $scope.slickConfig = {
                //enabled: true,
                dots: true,
                centerMode: true,
                infinite: false,
                centerPadding: '30px',
                slidesToShow: 1,
                focusOnSelect: true,
                //asNavFor: "#slick-main",
                responsive: [
                    {
                      breakpoint: 1024,
                      settings: {
                        slidesToShow: 1,
                        //slidesToScroll: 1,
                        //infinite: true,
                        dots: true
                      }
                    },
                    {
                      breakpoint: 600,
                      settings: {
                        arrows: false,
                        centerMode: true,
                        centerPadding: '40px',
                        slidesToShow: 1
                      }
                    },
                    {
                      breakpoint: 480,
                      settings: {
                        arrows: false,
                        centerMode: true,
                        centerPadding: '40px',
                        slidesToShow: 1
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

                console.log("DetailController init");
                //console.log($routeParams.name);

                $scope.selected_img_index = 0;

                function setup(item){
console.log("in setup function");

console.log(item);


                    $scope.selected_item = item;
                    $scope.selected_item_detail = item.detail_info ? 
                        item.detail_info[$scope.selected_img_index]
                        : {
                            "id": "",
                            "seq": "",
                            "image_url": "",
                            "image_url_thumb": "",
                            "comment": "",
                            "visit_date": "",
                            "month": "",
                            "timing_of_month": "",
                            "author": "",
                            "recomend": ""
                        };

                    // carousel setup
                    $timeout(function(){
                        $scope.thumbLoaded = true;
                    }, 1);
                }

                // ※※あとで、seession_storageを使ってdetailの問合せをより減らせるように変更すること

                var header_info = null;

                // 苗画面有で、名称が一致する場所情報を保有していれば
                if(CurrentState.searchedItems 
                    && (CurrentState.index >= 0 && CurrentState.index < CurrentState.searchedItems.length)
                    && (CurrentState.searchedItems.filter(v=>v.name == $routeParams.name).length > 0)
                ){
                    console.log("DetailController-> init: has header info!!");
                    // 画面表示用にデータコピーなど...
                    //setup(CurrentState.searchedItems[CurrentState.index]);
                    header_info = CurrentState.searchedItems[CurrentState.index];
                }
                // 詳細画面直できた場合
                else{
                    // 詳細画面フラグ(=戻る/タイトルへボタンの制御)を折る.　戻った時にブラウザ戻るじゃなくてホームへ戻って欲しい
                    $scope.binding.is_detail_page = false;
                }

                
                // 名称からデータを検索する(1件検索用にbynameに値セット)
                MapPointDataAdapter.getData({
                    w_pref   : "",
                    w_ptype  : "",
                    w_score  : "",
                    w_name   : "",
                    w_byname : $routeParams.name  || "",
                    w_id     :  header_info ? header_info.id : "",
                    w_hasnoimg : "1",
                    dontneed_header: !!header_info,
                    order    : ""
                })
                    .then(function(items){
console.log("detail MapPointDataAdapter callback. items=");
console.log(items);
                        // レコードなしの場合
                        if(!items || !items[0]){
                            $scope.selected_item.name = "(データなし)";
                            $scope.is_detail_page = false;
                            $scope.has_no_data = true;

                            console.log("detail no data...");
                        }
                        // レコードがあった場合
                        else{

console.log("detail got data!!");

                            var display_info = {};
                            // 既にヘッダ情報を持っているなら詳細だけコピー, まだないなら全てコピー
                            if(!!header_info){
                                header_info.detail_info = items[0].detail_info;
                                header_info.tag_info = items[0].tag_info;
                                header_info.related_info = items[0].related_info;
                                display_info = header_info;
                            }
                            else{
                                display_info = items[0];
                            }

                            // タイプ名称を取得
                            display_info.place_type_name = $scope.getName(display_info.place_type, "type_list");

                            // GoogleMapで開く時のパラメータ
                            display_info.gmap_search_param = display_info.gmap_by_latlng ? display_info.lat + "," + display_info.lng : display_info.name;

                            // タグ名称を取得
                            display_info.tag_info = (display_info.tag_info || []).map(function(v){
                                return {
                                    id: v.id,
                                    tag_id: v.tag_id,
                                    tag_name: $scope.getName(v.tag_id, "type2_list")
                                };
                            });

                            // タグ名称解釈を関連場所側にも... なんかもったいない...
                            for(var t in display_info.related_info.tags){
                                display_info.related_info.tags[t]["tag"] = $scope.getName(display_info.related_info.tags[t]["tag"], "type2_list");
                            }

                            // 画面表示用にデータコピーなど...共通処理へ
                            setup(display_info);
                        }
                    });
                
            };

            $scope.selectThumbnailImg = function(index){
                $scope.selected_img_index = index;
                $scope.selected_item_detail = $scope.selected_item.detail_info[$scope.selected_img_index];
            };

            // 名称が
            $scope.selectCardByName = function(name){
                $scope.move("/detail/" + name);
            }

            $scope.searchRelated = function(type, options){

                var param = {};

                // where句のprefに関する絞込条件を設定
                // 地域のみ指定
                if(type == "PREF"){
                    param["w_pref"] = $scope.selected_item.prefecture;
                }
                
                // タイプ指定
                if(type == "TYPE"){
                    param["w_ptype"]  = $scope.selected_item.place_type  || "";
                    //param["w_ptype2"] = $scope.selected_item.place_type2 || "";
                }

                // タグ指定
                if(type == "TAG"){
                    param["w_tags"] = options;
                }

                // imgに関しては指定をかけない
                param["w_hasnoimg"] = "1";

                $scope.move("/", param);
            };

            // event when location change
            //   to close lightbox
            $scope.$on('$locationChangeStart', function(event, next, current){
                // Here you can take the control and call your own functions:
                //alert('Sorry ! Back Button is disabled');
                // Prevent the browser default action (Going back):
                //event.preventDefault();            
            });
        });
})();
