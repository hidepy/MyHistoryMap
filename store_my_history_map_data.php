<?php

$callback = $_GET["callback"];

if(isset($callback)){

	$configs = parse_ini_file("../dbconfig.ini", true);
	if(!configs){
		die("cannot open ini file...");
	}

	// Adminユーザか確認
	$is_admin_user = false;
	if(isset($_GET["adminkey"])){
		$is_admin_user = (md5($_GET["adminkey"]) == $configs["common"]["adminkey"]);
	}

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

	// Adminユーザの場合
	if($is_admin_user){
		// 200件取得
		$cond_v_limit = 200;
		// privateのものも取得対象にする
		$cond_s_private = "";
	}
	// --------SQLのWhere句を設定 ここまで--------


	// ソート順
	$orderby_s = " ORDER BY ";
	$orderby_cols = array();
	if(isset($_GET["o_access"])){
		$orderby_cols[] = "m1.accessibility";
	}
	else if(isset($_GET["o_crowdness"]){
		$orderby_cols[] = "m1.crowdness_ave";
	}
	// 優先度最後にはidソート
	$orderby_cols[] = "m1.id";
	
	// 配列をカンマjoinする
	$orderby_s .= join(",", $orderby_cols);

	/* 課題
	order by 指定できていない
	県指定のみになっている
	*/ 

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

	//while($r = $select_res->fetch(PDO::FETCH_ASSOC)){
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
	  m2.id IN (" . $query_condition . ")
	";

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

}

?>
