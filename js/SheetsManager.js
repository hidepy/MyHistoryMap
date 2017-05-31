class SheetsManager {

	constructor(client_id, sheet_id, auto_sign_in){	

		console.log("in SheetsManager constructor");

		this.client_id = client_id;
		this.sheet_id = sheet_id;
		this.googleClient = {};

		this.DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/sheets/v4/rest"];
		this.SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
		
		if(auto_sign_in){
			this.startAuth()
				.then(
					()=>{
						console.log("in then before sign in");
						this.signIn();
					},
					(error)=>{
						console.log("startAuth Failure...");
						console.log(error);
					}
				)
		}
	}

	// G認証を行う
	startAuth(){
		console.log("in startAuth");
		return new Promise((resolve, reject)=>{
			try{
				gapi.load('client:auth2',
					()=>{
						console.log("in startAuth-> gapi.load");
				        gapi.client.init({
					          discoveryDocs: this.DISCOVERY_DOCS,
					          clientId: this.client_id,
					          scope: this.SCOPE
					        }).then(()=> {
					        	console.log("in then before listen");

					        	// 認証OK時に駆動する関数
					        	var loadSheetsApi = ()=> {
							        gapi.client.load('https://sheets.googleapis.com/$discovery/rest?version=v4')
							        	.then(()=> {
							        		console.log("sheets api loaded");

							        		// 再利用するんで
							        		this.googleClient = gapi.client;
							        	});
							    };

					        	// 認証状態を監視させる
					        	gapi.auth2.getAuthInstance().isSignedIn.listen(function(is_signed_in){
					        		if(is_signed_in){
					        			console.log("signed in!!");
					        			loadSheetsApi();
					        		}
					        		else{
										console.log("signed out...");
					        		}
					        	});

					        	// ここを通った時点でログイン済かを確認. 済なら
					        	if(gapi.auth2.getAuthInstance().isSignedIn.get()){
					        		loadSheetsApi();
					        	}

					        	resolve(gapi.auth2);
					        });
					},
					(error)=>{// gapi.load failure callback
						console.log("gapi.load error...");
						console.log(error)
					}
				);
			}
			catch(e){
				console.log("startAuth rejected...");
				reject(e);
			}
		});
	}

	signIn(){
		gapi.auth2.getAuthInstance().signIn();
	}

	signOut(){
		gapi.auth2.getAuthInstance().signOut();
	}
	
	isSignedIn(){
		return gapi.auth2.getAuthInstance().isSignedIn.get();
	}

	// this method returns thenable object.
    getValue(sheet_name, range_string){
    	// 呼出元でthenする
    	return this.googleClient.sheets.spreadsheets.values.get({
          spreadsheetId: this.sheet_id,
          range: sheet_name + "!" + range_string
        });
    }

    // this method returns thenable object. 
    findValue(sheet_name, range_string, find_value, search_all){
    	return this.getValue(sheet_name, range_string)
    		.then(function(response){
    			console.log("in findvalue getvalue callback");
    			return new Promise(function(resolve, reject){
    				console.log("findvalue -> getvalue callback response=");
    				console.log(response);
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
						console.log("findvalue -> getvalue callback-> resolve");
						resolve(result);
					}
					else{
						console.log("findvalue -> getvalue callback-> reject");

						// nodata...
						reject();
					}
    			});
    		});
    }

    convAlpha2Number(s){
    	// s is MUST uppercase
    	return s.charCodeAt(0) - 65;
    }

    convNumber2Aplha(n){
    	return String.fromCharCode(65 + n);
    }

    // this method returns thenable object.
    updateValue(sheet_name, range_string, update_values/* as 2dim arr */){
    	if(!this.sheet_id){
    		console.log("no sheet selected... quit process");
    		return;
    	}
    	if(!this.isSignedIn()){
    		console.log("no auth... quit process");
    		return;
    	}
    	return this.googleClient.sheets.spreadsheets.values.update({
          spreadsheetId: this.sheet_id,
          range: sheet_name + "!" + range_string,
          valueInputOption: "USER_ENTERED",
          values: update_values
    	});
    }
    
}
