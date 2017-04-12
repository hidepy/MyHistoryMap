<?php

// 全ユーザ対象にセッションを開始する
session_start();

// iniファイル読込
$configs = parse_ini_file("../dbconfig.ini", true);
if(!configs){
  die("cannot open ini file...");
} 

// Adminユーザか確認
$is_admin_user = ($_SESSION["imtasokori"] == true);

// callbackパラメータを取得
$callback = $_GET["callback"];

if(isset($callback)){

  // PDOに変更
  $dbh = null;// ブロックスコープなしなんで、ここで宣言する必要はないのだけれど...
  try{
    $dsn = "mysql:host=".$configs["zekkeimap"]["dbhost"] . ";dbname=" . $configs["zekkeimap"]["dbname"] . ";charset=utf8";
    $dbh = new PDO($dsn, $configs["zekkeimap"]["dbuser"], $configs["zekkeimap"]["dbpw"]);
  }
  catch(PDOException $e){
    die("db connect error..." . $e->getMessage());
  }

  // --------SQLのWhere句を設定 ここから--------
  // レコード取得件数を絞り込み
  $cond_v_limit = 20;
  // privateレコード取得の制限
  $cond_s_private = " AND m1.is_private <> 1";
  $cond_s_private_m2 = " AND m2.is_private <> 1";

  // area設定
  $cond_s_area = "";
  {
    // 取得prefを設定
    if(isset($_GET["w_pref"])){
      $splitted_pref_arr = explode("_", $_GET["w_pref"], 48);
      $pref_strings = "";
      for($i = 0; $i < count($splitted_pref_arr); $i++){
        $splitted_pref_arr[$i] = $dbh->quote($splitted_pref_arr[$i]);
      }
      $cond_s_area .= " AND m1.prefecture IN (".join(",", $splitted_pref_arr).")";
    }
  }

  // Adminユーザか判定する

  // Adminユーザの場合
  if($is_admin_user){
    // 200件取得
    $cond_v_limit = 200;
    // privateのものも取得対象にする
    $cond_s_private = "";
    $cond_s_private_m2 = "";
  }
  // --------SQLのWhere句を設定 ここまで--------


  // --------SQLのOrderBy句を設定 ここから--------
  $orderby_key_value = array(
    "o_rec-d"=> "m1.favorite desc",
    "o_new-d"=> "m1.update_datetime desc",
    "o_new-a"=> "m1.update_datetime asc",
    "o_cro-d"=> "m1.crowdness_ave desc",
    "o_cro-a"=> "m1.crowdness_ave asc",
    "o_acc-d"=> "m1.accessibility desc",
    "o_acc-a"=> "m1.accessibility asc"
  );

  $orderby_s = " ORDER BY ";
  $orderby_cols = array();
  // orderパラメータがあって、解釈okだったら
  if(isset($_GET["order"]) && !empty($orderby_key_value[$_GET["order"]])){
    $orderby_cols[] = $orderby_key_value[$_GET["order"]];
  }
  
  // 優先度最後にはidソート
  $orderby_cols[] = "m1.id";
  
  // 配列をカンマjoinする
  $orderby_s .= join(",", $orderby_cols);
  // --------SQLのOrderBy句を設定 ここまで--------

  //DB選択成功の場合
  $query = "
  SELECT
    m1.id
    ,m1.name
    ,m1.lat
    ,m1.lng
    ,m1.prefecture
    ,m1.zip_no
    ,m1.address
    ,m1.caption
    ,m1.accessibility
    ,m1.crowdness_ave
    ,m1.place_type
    ,m1.image_url_top
  FROM
    MHM_M_POINT_DATA m1
  WHERE
    1 = 1 
  ";
  
  // privateレコードの取得制限
  $query .= $cond_s_private;
  // areaレコードの条件
  $query .= $cond_s_area;

  // ソート指定
  $query .= $orderby_s;

  // 制限を付与
  $query .= " LIMIT :limit";
  //$query .= " LIMIT 40";

  $res = array();
  $res_details = array();
  $query_condition = "";

  $stmt = $dbh->prepare($query);
  // パラメータセット
  {
    // 取得件数のバインド
    $stmt->bindValue(':limit', $cond_v_limit, PDO::PARAM_INT);
  }
  $stmt->execute();

  while($r = $stmt->fetch()){
    $res[] = array(
      "id"=>$r["id"],
      "name"=>$r["name"],
      "lat"=>$r["lat"],
      "lng"=>$r["lng"],
      "pref"=>$r["prefecture"],
      "zip_no"=>$r["zip_no"],
      "address"=>$r["address"],
      "caption"=>$r["caption"],
      "season"=>"",
      "season_monthly"=>"",
      "accessibility"=>$r["accessibility"],
      "crowdness"=>$r["crowdness_ave"],
      "place_type"=>$r["place_type"],
      "image_url"=>$r["image_url_top"]
    );

    if($query_condition != ""){
      $query_condition .= ", ";
    }
    $query_condition .= $r["id"];
  }

  $query_detail = "
  SELECT
    m2.id
    ,m2.seq
    ,m2.image_url
    ,m2.comment
    ,m2.visit_date
    ,m2.month
    ,m2.timing_of_month
    ,m2.author
    ,m2.recomend
  FROM
    MHM_M_PICTURES m2
  WHERE
    m2.id IN (" . $query_condition . ") "
  ;

  // privateレコードの取得制限
  $query .= $cond_s_private_m2;

  if($query_condition != ""){
    $select_res_detail = $dbh->query($query_detail);

    while($r = $select_res_detail->fetch(PDO::FETCH_ASSOC)){

      $current = $res_details[$r["id"]];

      if(!$current){
        $current = array();
      }

      array_push($current, array(
        "id"=>$r["id"],
        "seq"=>$r["seq"],
        "image_url"=>$r["image_url"],
        "comment"=>$r["comment"],
        "visit_date"=>$r["visit_date"],
        "month"=>$r["month"],
        "timing_of_month"=>$r["timing_of_month"],
        "author"=>$r["author"],
        "recomend"=>$r["recomend"]
      ));

      $res_details[$r["id"]] = $current;
    }
  }
  
  header( 'Content-Type: text/javascript; charset=utf-8' );

  // jsonpとしてcallback実行させる
  echo $callback . "({head_info: " . json_encode($res). ", detail_info: " . json_encode($res_details) . "})";
  
  // 解放
  $dbh = null;
  
  exit();
}
else{
  // admin判定
  if(isset($_GET["adminkey"])){
    $is_admin_user = (md5($_GET["adminkey"]) == $configs["common"]["adminkey"]);
  }
}

?>

<html ng-app="app">
<head>

  <meta charset="utf-8">
    
  <title>my history map</title>

  <link rel="stylesheet" type="text/css" href="bootstrap3/css/bootstrap.min.css">
  <link rel="stylesheet" type="text/css" href="css/my_history_map.css">
  <link rel="stylesheet" type="text/css" href="lib/lightbox/css/lightbox.css">

  <script src="http://maps.googleapis.com/maps/api/js?key=AIzaSyAC5TnApJHV0fXpLJ7NyEsrKevtWEefP_M&sensor=false"></script>
  <script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>

  <style>
  body{
    opacity: 0.2;
  }
  </style>

</head> 

<body ng-controller="AppController">

  <nav id="top_navigation" class="navbar navbar-inverse navbar-fixed-top">
    <div class="container">
      <div class="navbar-header">
        <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">
          <span class="sr-only">Toggle navigation</span>
          <span class="icon-bar"></span>
          <span class="icon-bar"></span>
          <span class="icon-bar"></span>
        </button>
        <a class="navbar-brand" href="#">mhm</a>
      </div>
      <div id="navbar" class="navbar-collapse collapse">
        <form class="navbar-form navbar-right">
          <div class="form-group">
            <input type="text" placeholder="Email" class="form-control">
          </div>
          <div class="form-group">
            <input type="password" placeholder="Password" class="form-control">
          </div>
          <button type="submit" class="btn btn-success">Sign in</button>
        </form>
      </div><!--/.navbar-collapse -->
    </div>
  </nav>

  <!-- Main jumbotron for a primary marketing message or call to action -->
  <div id="header" class="jumbotron">
    <div class="container">
      <h1>My History Map</h1>
      <p>色々な所を旅してきましたね。<br>でも、なかなかパッと何処にいったか思い出せません。<br>
      そこで！このツールに保存しておきましょう</p>
      <button class="btn" ng-click="pushStart()">Start</button>
    </div>
  </div>

  <div id="contents">
    <div class="container">
      <div class="row" id="map_detailarea_wrapper">
        <div class="col-md-5 col-xs-12">
          <div id="history_map"></div>

          <!--
          <div>
            <button ng-click="addAllMarkers()">add all markers</button>
            <button ng-click="deleteAllMarkers()">delete all markers</button>
          </div>
          -->
        </div>

        <div id="detail" class="col-md-7 col-xs-12">
          <div class="img_box clearfix">
            <div class="main_img">
              <a href="{{selected_item.image_url}}" data-lightbox="main_images" data-title="{{selected_item.name}}" ng-style="{'background-image': 'url('+ selected_item.image_url +')'}"></a>
            </div> 
            
            <ul class="thumb_group">
              <li class="thumb_img" ng-repeat="item_img in selected_item.images_thumb" ng-click="selectThumbnailImg($index, $event)">
                <div ng-style="{'background-image': 'url('+ item_img +')'}"></div>
              </li>            
            </ul>             
          </div>

          <div class="card">
            <div class="card_heading">
              <h2>{{selected_item.name}}</h2>
            </div>

            <div class="card_body clearfix">
              <div class="left_area">
                <span class="item_name">place</span>
                <p>{{selected_item.zip_no}}<br>
                {{selected_item.address}}</p>

                <span class="item_name">visit</span>
                <p>{{selected_item.visit_date}}</p>
            
                <span class="item_name">comment</span>
                <p>{{selected_item.caption}}</p>
              </div>
              <!--
              <div>{{selected_item.prefecture}}</div>
              -->
              <div class="right_area">
                <ul>
                  <li class="box"><span class="item_name">season</span>
                  <p>{{selected_item.season}}</p></li>
                  <li class="box"><span class="item_name">migoro</span>
                  <p>{{selected_item.season_monthly}}</p></li>
                  <li class="box"><span class="item_name">accessibility</span>
                  <p>{{selected_item.accessibility}}</p></li>
                  <li class="box"><span class="item_name">crowdness</span>
                  <p>{{selected_item.crowdness}}</p></li>
                </ul>
              </div>
            </div>
          </div><!-- /.card -->
        </div><!-- /#detail -->
      </div><!-- /.row -->

      <!-- ↓ここから検索条件指定↓ -->
      <div class="row" id="search_condition_wrapper">
        <div class="col-md-4 col-xs-5">
          <select id="select_list_pref" size="8" multiple ng-model="selected_pref">
            <option ng-repeat="option in pref_list" value="{{option}}">{{option}}</option>
          </select>
        </div>
        <div class="col-md-4 col-xs-5">
          <select id="select_list_order" size="8" ng-model="selected_order">
            <option ng-repeat="option in order_list" value="{{option.id}}">{{option.name}}</option>
          </select>
        </div>
        <div class="col-md-4 col-xs-2">
          <button class="btn" ng-click="searchPoint()">Search</button>
        </div>
      </div>
      <!-- ↑ここまで検索条件指定↑ -->

      <!-- ↓ここからadsense↓ -->
      <?php
      if(!$is_admin_user){
        echo '
<div class="row" id="adsense_wrapper">
  <div class="col-md-12">
  <script async src="//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
  <!-- MyHistoryMap用横長広告 -->
  <ins class="adsbygoogle"
       style="display:inline-block;width:728px;height:90px"
       data-ad-client="ca-pub-2131186805773040"
       data-ad-slot="1600252016"></ins>
  <script>
  (adsbygoogle = window.adsbygoogle || []).push({});
  </script>
  </div>
</div>';
      }
      else{
        // admin判定用プロパティをたてる
        $_SESSION["imtasokori"] = true;
      }
      ?>
      <!-- ↑ここまでadsense↑-->

      <div id="cards_wrapper" class="row">
        <div class="col-md-3 col-xs-6" ng-repeat="(card_idx, item) in items" >
            <div class="panel" ng-click="selectCard(card_idx)">
              <div class="panel-heading">
                <div class="panel_img" ng-style="{'background-image': 'url('+ item.image_url +')'}"></div>
                <div class="ravel">
                  <span class="season">{{item.season}}</span>
                  <span class="prefecture">{{item.prefecture}}</span>
                </div>
              </div>
              <div class="panel-body">
                {{item.name}}
              </div>
            </div>
        </div>
      </div><!-- /#cards_wrapper -->

    </div> <!-- /.container -->
  </div> <!-- /#contents -->

<script src="lib/lightbox/js/lightbox.js"></script>

<script src="lib/angular/angular.js"></script>
<script src="lib/angular/checklist-model.js"></script>
<script src="js/app.js"></script>

</body>
</html>
