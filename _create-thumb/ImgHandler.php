<?php
define("MAX_WIDTH", 1280);
define("MAX_HEIGHT", 960);
define("MAX_WIDTH_THUMB", 320);
define("MAX_HEIGHT_THUMB", 240);

class ImgHandler{

	// REQUIRE
	private $dest_root_path = "";
	private $dest_thumb_root_path = "";
	private $img_watermark = "";

	// OPTIONAL
	private $wm_width = 0;
	private $wm_height = 0;
	private $wm_opacity = 50;
	private $wm_margin_right = 8;
	private $wm_margin_bottom = 8;
	private $quality = 85;
	private $quality_thumb = 60;
	private $delete_original = 0;

	//function __construct($dest, $dest_thumb, $wm, $delete_original, $opacity){
	function __construct($dest, $dest_thumb, $wm, $params){
		// REQUIRE!!
		$this->dest_root_path = $dest;
		$this->dest_thumb_root_path = $dest_thumb;
		$this->img_watermark = imagecreatefrompng($wm); // watermarkをimgとして生成しておく. 何度も使うし

		// OPTIONAL
		if($params["quality"]) $this->quality = $params["quality"];
		if($params["quality_thumb"]) $this->quality_thumb = $params["quality_thumb"];
		if($params["wm_opacity"]) $this->wm_opacity = $params["wm_opacity"];
		if($params["wm_margin_right"]) $this->wm_margin_right = $params["wm_margin_right"];
		if($params["wm_margin_bottom"]) $this->wm_margin_bottom = $params["wm_margin_bottom"];
		if($params["delete_original"]) $this->delete_original = $params["delete_original"];

		$this->wm_width = imagesx($this->img_watermark);
		$this->wm_height = imagesy($this->img_watermark);

		/*
		echo "img handler setting<br>";
		echo "dest_root_path:".$this->dest_root_path;
		echo ",dest_thumb_root_path:".$this->dest_thumb_root_path;
		echo ",wm_opacity:".$this->wm_opacity;
		echo ",wm_margin_right:".$this->wm_margin_right;
		echo ",wm_margin_bottom:".$this->wm_margin_bottom;
		echo ",quality:".$this->quality;
		echo ",quality_thumb:".$this->quality_thumb;
		echo ",delete_original:".$this->delete_original;
		echo ",img_watermark:".$this->img_watermark;
		echo ",wm_width:".$this->wm_width;
		echo ",wm_height:".$this->wm_height;
		*/
	}

	public function createImgForMHM($src){

		// function output
		$result = array(
			"main_path"=> "",
			"thumb_path"=> "", 
			"is_deleted"=> false, 
			"return_cd"=> 0,
			"msg"=> ""
		);
		
		// dest path
		$src_filename = basename($src);
		$dest_main_path = $this->dest_root_path.$src_filename;
		$dest_thumb_path = $this->dest_thumb_root_path."thumb_".$src_filename;

		// inut source
		$im_orig = imagecreatefromjpeg($src);

		// 基データのw/hを保存
		$orig_width = imagesx($im_orig);
		$orig_height = imagesy($im_orig);

		// 一旦リサイズ値を初期化しておく
		$resized_x = MAX_WIDTH;
		$resized_y = MAX_HEIGHT;
		$resized_thumb_x = MAX_WIDTH_THUMB;
		$resized_thumb_y = MAX_HEIGHT_THUMB;

		$rate = 1.0;

		// 横
		if($orig_width > $orig_height){
			$rate = ($orig_height / $orig_width);
			$resized_y = round(MAX_WIDTH * $rate);
			$resized_thumb_y = round(MAX_WIDTH_THUMB * $rate);
		}
		// 縦
		else{
			$rate = ($orig_width / $orig_height);
			$resized_x = round(MAX_HEIGHT * $rate);
			$resized_thumb_x = round(MAX_HEIGHT_THUMB * $rate);
		}

		// output canvas
		$im = imagecreatetruecolor($resized_x, $resized_y);

		// resize
		if(
			!imagecopyresampled(
				$im, $im_orig, // 出力/入力
				0, 0, // 出力側x,y
				0, 0, // 入力側x,y
				$resized_x, $resized_y, // 出力側size
				$orig_width, $orig_height // 入力側size
			)
		)
		{
			// error...
			$result["return_cd"] = 9;
			$result["msg"] = "fatal step1";
			return $result;
		}

		// overlap
		if(
			!imagecopy(
				$im,
				$this->img_watermark,
				imagesx($im) - $this->wm_width - $this->wm_margin_right, imagesy($im) - $this->wm_height - $wm_margin_bottom, // 重ね合わせ開始x,y
				0, 0,
				$this->wm_width, $this->wm_height
			)
		)
		{
			// error...
			$result["return_cd"] = 9;
			$result["msg"] = "fatal step2";
			return $result;
		}

		// resize to thumb
		// output canvas thumb
		$im_thumb = imagecreatetruecolor($resized_thumb_x, $resized_thumb_y);
		if(
			!imagecopyresampled(
				$im_thumb, $im, // 出力/入力
				0, 0, // 出力側x,y
				0, 0, // 入力側x,y
				$resized_thumb_x, $resized_thumb_y, // 出力側size
				$resized_x, $resized_y // 入力側size
			)
		)
		{
			// error...
			$result["return_cd"] = 9;
			$result["msg"] = "fatal step3";
			return $result;
		}

		// 出力
		if(
			imagejpeg($im, $dest_main_path, $this->quality)
			&& imagejpeg($im_thumb, $dest_thumb_path, $this->quality_thumb)
		){
			// image output success!!
			$result["main"] = $dest_main_path;
			$result["thumb"] = $dest_thumb_path;
			$result["is_deleted"] = false;

			// 一応元データを削除する
			if($this->delete_original == 1){
				// 失敗しても本処理の結果には影響を与えないことにします
				$result["is_deleted"] = unlink($src);
			}
		}


		return $result;
	}
}
?>