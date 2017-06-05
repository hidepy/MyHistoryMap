// Wrapper Class for Google Sheets API 
class SheetsManager {

	// Constructor
	// クライアントID, スプレッドシートIDを受け取りもろもろ初期化する(本クラスの仕様として、インスタンス化時に)
	//   cliend_id   : your CLIENT ID
	//   sheet_id    : SHEET ID (https://docs.google.com/spreadsheets/d/{HERE IS SHEET ID!!}/edit#gid=0)
	//   auto_sign_in: インスタンス化と同時にサインインする場合はtrue[OPTIONAL]
	constructor(client_id, sheet_id, auto_sign_in){	
		this.client_id = client_id;
		this.sheet_id = sheet_id;
		this.googleClient = {};

		this.DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/sheets/v4/rest"];
		this.SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
		
		// 各種ライブラリの準備
		this.loadLibraries()
			.then(
				()=>{
					// ロード成功時処理
					console.log("[constructor] in loadLibraries's then");

					// 自動サインインフラグがtrueで未サインインなら
					if(auto_sign_in && !this.isSignedIn()){
							this.signIn();
					}
				},
				(error)=>{
					console.log("loadLibraries Failure...");
					console.log(error);
				}
			)
	}

	// ---------- ここから認証関連 ----------
	// loadLibraries
	// 認証ライブラリ, とSheetsAPIライブラリのロードを行う.
	// Promiseオブジェクトを返却するんで、thenすればsheets api使用可能になった直後に処理を繋げる
	loadLibraries(){
		console.log("[loadLibraries] driven");
		return new Promise((resolve, reject)=>{
			try{
				// クライアント認証ライブラリをロード
				gapi.load('client:auth2',
					()=>{
						console.log("[loadLibraries] in gapi.load");
						// クライアント情報のセット(初期化)
				        gapi.client.init({
					          discoveryDocs: this.DISCOVERY_DOCS,
					          clientId: this.client_id,
					          scope: this.SCOPE
					        }).then(()=> {
					        	// 認証OK時に駆動する関数. SheetsAPIをロードする
					        	var loadSheetsApi = ()=> {
							        gapi.client.load('https://sheets.googleapis.com/$discovery/rest?version=v4')
							        	.then(()=> {
							        		console.log("[loadLibraries] sheets api loaded");

							        		// 再利用するんで
							        		this.googleClient = gapi.client;
							        	});
							    };

					        	// 認証状態を監視させる
					        	gapi.auth2.getAuthInstance().isSignedIn.listen(function(is_signed_in){
					        		if(is_signed_in){
					        			console.log("[loadLibraries] signed in!!");
					        			loadSheetsApi();
					        		}
					        		else{
										console.log("[loadLibraries] signed out...");
					        		}
					        	});

					        	// ここを通った時点でログイン済かを確認. 既に認証済なら早速sheets api をロードする
					        	if(gapi.auth2.getAuthInstance().isSignedIn.get()){
					        		loadSheetsApi();
					        	}

					        	resolve(gapi.auth2);
					        });
					},
					(error)=>{// gapi.load failure callback
						console.log("[loadLibraries] gapi.load error...");
						console.log(error)
					}
				);
			}
			catch(e){
				console.log("[loadLibraries] loadLibraries rejected...");
				reject(e);
			}
		});
	}

	// signIn
	// サインインする
	signIn(){
		gapi.auth2.getAuthInstance().signIn();
	}

	// signOut
	// サインアウトする
	signOut(){
		gapi.auth2.getAuthInstance().signOut();
	}
	
	// isSignedIn
	//  サインイン状態を返却する
	isSignedIn(){
		return gapi.auth2.getAuthInstance().isSignedIn.get();
	}
	// ---------- ここまで認証関連 ----------
	// 認証とspreadsheetの操作を分けろよ！とのコメントがありそうですが...ごもっともです
	// 分けると、spreadsheetだけシンプルに使いたいんだけど、という人からすると分かりにくいかな、ということで、1クラスにしてますと言い訳しておきます。



	// getValue
	// SpreadSheetからrange_stringで指定された範囲の値を取得する. thenableなんで、値取得後に描画処理をしたい場合は、getValue.then(function(){})してください。
	//   range_string: シートから抽出する値の範囲. "シート1!B2:D24"のような文字列を与える
	//   戻り値はgoogleのvalues.getの値まんま. 十分使い易かったんで
    getValue(range_string){
    	// 呼出元でthenする
    	return this.googleClient.sheets.spreadsheets.values.get({
          spreadsheetId: this.sheet_id,
          range: range_string
        });
    }

    // findValue
    //  SpreadSheetからrange_stringで与えられた範囲のなかにfind_valueと一致するデータが存在するかを検査する
    //   range_string: getValueと同様. シートから抽出する値の範囲
    //   find_value  : 検索したい値. プリミティブ型を想定(文字列や数字など)
    //   search_all  : 検索値にヒットする全ての値を取得したい場合にtrue
    //   戻り値は配列. 1要素ごと{row, col, data}を持つ. row, colは、検索開始位置からの差分を表す. ヒットしなかった場合は配列長0
    findValue(range_string, find_value, search_all){
    	return this.getValue(range_string)
    		.then(function(response){
    			console.log("[findvalue] getvalue's callback");
    			return new Promise(function(resolve, reject){
					if(!!(response && response.result && response.result.values && (response.result.values.length > 0))){
						var result = [];
						for(var i = 0; i < response.result.values.length; i++){
							var r = response.result.values[i];
							for(var j = 0; j < r.length; j++){
								var c = r[j];
								if(c == find_value){
									result.push({ row: i, col: j, data: c });
									if(!search_all) break;
								}
							}
						}
						console.log("[findvalue] getvalue callback-> resolve");
						resolve(result);
					}
					else{
						console.log("[findvalue] getvalue callback-> reject");

						// nodata...
						reject();
					}
    			});
    		});
    }

    // updateValue
    // 与えられたrange_string範囲を, update_valuesの値で更新する
    //   range_string : getValueと同様.　更新対象範囲を指定する
    //   update_values: 2次元配列を与える. range_stringで与えた範囲と一致するだけの行, 列を持った2次元配列をセットすること
    updateValue(range_string, update_values){
    	return this.googleClient.sheets.spreadsheets.values.update({
          spreadsheetId: this.sheet_id,
          range: range_string,
          valueInputOption: "USER_ENTERED",
          values: update_values
    	});
    }

    // convAlpha2Number
    // 与えられたアルファベットを数値に変換する(ex: A=0, D=3)
    //   s: 変換対象のアルファベット. 大文字想定
    convAlpha2Number(s){
    	return s.charCodeAt(0) - 65;
    }

    // convNumber2Aplha
    // 与えられた数値をアルファベットに変換する. convAlpha2Numberの反対
    //   n: 変換対象の数値
    convNumber2Aplha(n){
    	return String.fromCharCode(65 + n);
    }
    
}
