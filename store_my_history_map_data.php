<?php

$callback = $_GET['callback'];

if(isset($callback)){

	//$con = mysql_connect("localhost",  "hidork0222", "koritaso1117");
	$con = mysql_connect("mysql118.phy.lolipop.lan",  "LAA0758614", "koritaso1117");

	if (!$con) {
	    die("cannot open connection...".mysql_error());
	}

	//接続成功の場合

	$db = mysql_select_db("LAA0758614-mhm", $con);

	if(!$db){
		die("cannot select db...".mysql_error());
	}

	//DB選択成功の場合

	$query = "
	SELECT
	id
	,name
	,lat
	,lng
	,prefecture
	,zip_no
	,address
	,caption
	,accessibility
	,crowdness_ave
	,image_url_top
	FROM
	  MHM_M_POINT_DATA
	";

	$select_res = mysql_query($query);
	
	$res = array();

$record_cnt = 0;

	while($r = mysql_fetch_assoc($select_res)){

$record_cnt++;

		$res[] = array(

			"id"=>$r["id"],
			"name"=>$r["name"],
			"lat"=>$r["lat"],
			"lng"=>$r["lng"],
			"pref"=>$r["prefecture"],
			"zip_no"=>$r["zip_no"],
			"address"=>$r["address"],
			"caption"=>$r["caption"],
			"season"=>"nothing...",
			"season_monthly"=>"nothing...",
			"accessibility"=>$r["accessibility"],
			"crowdness"=>$r["crowdness_ave"],
			"image_url"=>$r["image_url_top"]
			
		);
	}

	header( 'Content-Type: text/javascript; charset=utf-8' );

	//GETかPOSTかは$.ajax側の設定次第？
	echo $callback . "(" . json_encode($res). ")";


	$close_flag = mysql_close($con);
}

?>
