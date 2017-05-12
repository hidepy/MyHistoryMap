<?php

// 全ユーザ対象にセッションを開始する
session_start();

// iniファイル読込
$configs = parse_ini_file("../dbconfig.ini", true);
if(!configs){
  die("cannot open ini file...");
} 

// Adminユーザか確認
$is_admin_user = ($_SESSION["imtasokori"] == true) && isset($_GET["adminkey"]);

// callbackパラメータを取得
$callback = $_GET["callback"];

if(isset($callback)) {

  // PDOに変更
  $dbh = null;// ブロックスコープなしなんで、ここで宣言する必要はないのだけれど...
  try{
    $dsn = "mysql:host=".$configs["zekkeimap"]["dbhost"] . ";dbname=" . $configs["zekkeimap"]["dbname"] . ";charset=utf8";
    $dbh = new PDO($dsn, $configs["zekkeimap"]["dbuser"], $configs["zekkeimap"]["dbpw"]);
  }
  catch(PDOException $e){
    die("db connect error..." . $e->getMessage());
  }

  // 共通戻りI/Fオブジェクト
  $if_return = array("return_cd"=> 0, "msg"=> "", "item"=> "");

  // --------SQLのWhere句を設定 ここから--------
  // レコード取得件数を絞り込み
  $cond_v_limit = 48;
  // privateレコード取得の制限
  $cond_s_private = " AND m1.is_private <> 1";
  $cond_s_private_m2 = " AND m2.is_private <> 1";

  // area設定
  $cond_s_area = "";
  $cond_s_ptype = "";
  $cond_s_score = "";

  {
    // 取得prefを設定
    if(isset($_GET["w_pref"]) && !empty($_GET["w_pref"])){
      $splitted_pref_arr = explode("-", $_GET["w_pref"], 48);
      if(count($splitted_pref_arr) > 0){
        for($i = 0; $i < count($splitted_pref_arr); $i++){
          $splitted_pref_arr[$i] = $dbh->quote($splitted_pref_arr[$i]);
        }
        $cond_s_area .= " AND m1.prefecture IN (".join(",", $splitted_pref_arr).")";
      }
    }

    // 取得タイプを設定
    if(isset($_GET["w_ptype"]) && !empty($_GET["w_ptype"])){
      $splitted_ptype_arr = explode("-", $_GET["w_ptype"], 5);
      if(count($splitted_ptype_arr)){
        for($i = 0; $i < count($splitted_ptype_arr); $i++){
          $splitted_ptype_arr[$i] = $dbh->quote($splitted_ptype_arr[$i]);
        }
        $cond_s_ptype .= " AND m1.place_type IN (".join(",", $splitted_ptype_arr).")";
      }
    }

    // 対象をscoreで絞り込み
    if(isset($_GET["w_score"]) && ctype_digit($_GET["w_score"]) ){
      $cond_s_score .= " AND m1.favorite >= " . $dbh->quote($_GET["w_score"]);
    }
  }

  // Adminユーザか判定する

  // Adminユーザの場合
  if($is_admin_user){
    // 200件取得
    $cond_v_limit = 240;
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
    ,m1.favorite
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
  // ptypeの条件
  $query .= $cond_s_ptype;
  // scoreの条件
  $query .= $cond_s_score;

  // ソート指定
  $query .= $orderby_s;

  // 制限を付与
  $query .= " LIMIT ".$cond_v_limit;
  //$query .= " LIMIT 40";

  $res = array();
  $res_details = array();
  $query_condition = "";

  $stmt = $dbh->prepare($query);
  // パラメータセット
  {
    // 取得件数のバインド
    //$stmt->bindValue(':limit', $cond_v_limit, PDO::PARAM_INT);
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
      "favorite"=>$r["favorite"],
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
    ,m2.image_url_thumb
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
  $query_detail .= $cond_s_private_m2;

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
        "image_url_thumb"=>$r["image_url_thumb"],
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
  
  $if_return["msg"] .= "sql-head=".$query.", sql-body=".$query_detail;

  header( 'Content-Type: text/javascript; charset=utf-8' );

  // jsonpとしてcallback実行させる
  echo $callback . "({head_info: " . json_encode($res). ", detail_info: " . json_encode($res_details) . ", if_return: ". json_encode($if_return) ."})";
  
  // 解放
  $dbh = null;
  
  exit();
}
else{
  // admin判定
  if(isset($_GET["adminkey"])){
    $is_admin_user = (md5($_GET["adminkey"]) == $configs["common"]["adminkey"]);
    // admin判定用プロパティをたてる
    $_SESSION["imtasokori"] = $is_admin_user;
  }

  if (!isset($_COOKIE["isnot-first-visit"])){
      $is_first_visit = true;
      setcookie("isnot-first-visit", $is_first_visit);
  }
}

?>

<html ng-app="MHM-APP">
<head>
<!--
値受け渡しで結構いけてる感じらしい
http://twofuckingdevelopers.com/2014/07/angularjs-best-practices-003-routeprovider/
-->

  <meta charset="utf-8">
    
  <meta name="viewport" content="width=device-width,initial-scale=1">

  <title><?php echo ($is_admin_user ? "MyHistoryMap" : "zekkei-map") ?></title>

  <link rel="stylesheet" type="text/css" href="css/my_history_map.css">
  <link rel="stylesheet" type="text/css" href="lib/lightbox/css/lightbox.css">

  <link rel="stylesheet" href="lib/slick/slick.css">
  <link rel="stylesheet" href="lib/slick/slick-theme.css">


  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-alpha.6/css/bootstrap.min.css" integrity="sha384-rwoIResjU2yc3z8GV/NPeZWAv56rSmLldC3R/AZzGRnGxQQKnKkoFVhFQhNUwEyJ" crossorigin="anonymous">

  <script src="http://maps.googleapis.com/maps/api/js?key=AIzaSyAC5TnApJHV0fXpLJ7NyEsrKevtWEefP_M&sensor=false"></script>
  
  <script src="//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/tether/1.4.0/js/tether.min.js" integrity="sha384-DztdAPBWPRXSA/3eYEEUWrWCy7G5KFbe8fFjk5JAIxUYHKkDx6Qin1DkWx51bBrb" crossorigin="anonymous"></script>
  <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-alpha.6/js/bootstrap.min.js" integrity="sha384-vBWWzlZJ8ea9aCX4pEW3rVHjgjt7zpkNpZk+02D9phzyeVkE+jo0ieGizqPLForn" crossorigin="anonymous"></script>

  <script type="text/javascript" src="js/storageManager.js"></script>

  <style>

  body{
    opacity: 0.92;
  }
  </style>

  <base href="/webapps/zekkei-map/">

</head> 

<body ng-controller="RootController">

  <?php
  if($is_first_visit){
    echo "<p> is first visit</p>";
  }
  ?>

  <nav-header></nav-header>

  <div id="contents" ng-view></div>

  <?php
    if(!$is_admin_user && false){
      echo "<adsense></adsense>";
    }
  ?>

  <!-- normal js liblalies -->
  <script src="lib/lightbox/js/lightbox.js"></script>

  <!-- Angular core -->
  <script src="lib/angular/angular.js"></script>
  <script src="lib/angular/angular-route.js"></script>
  <!-- Angular libs-->
  <script src="lib/slick/slick.js"></script>
  <script src="lib/slick/angular-slick.js"></script>
  <!-- Services -->
  <script src="js/service/MapHandlerService.js"></script>
  <!-- Init js -->
  <script src="js/main.js"></script>

</body>
</html>
