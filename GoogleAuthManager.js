class GoogleAuthManager {

	/* need google cliend js!! */

	constructor(client_id){
		this.client_id = client_id;
		this.scope = ['https://www.googleapis.com/auth/drive'];
		this.googleDriveClient = {};
		this.nextPageToken = "";
		this.parentId = "";
	}

	execAuth(){

		// 認証を行うLocalFuncion
		function getGoogleAuth(client_id, scope){
	        var objAuthParam = {
	            'client_id': client_id,
	            'scope': scope,
	            'immediate': false
	        };
	        return new Promise(function(resolve, reject){
	            gapi.load('auth', {
	                callback: function() {
	                    gapi.auth.authorize(objAuthParam, function(objAuthResult){
							if (objAuthResult && !objAuthResult.error)
			                    resolve(objAuthResult.access_token);
			                else
			                    // auth failed.
			                    reject(objAuthResult);
	                    });
	                }
	            });
	        });
		}

		// 上記関数を実行して認証を行う
		getGoogleAuth(this.client_id, this.scope) // GoogleAuthentication
            .then(function(){ // Load google drive api
            	return new Promise(function(resolve, reject){
			        try{
			            gapi.client.load('drive', 'v3', function(){
			            	resolve(gapi.client)
			            });
			        }catch(e){
			            reject(e);
			        }
			    });
            }) // auth okならgoogle drive apiロード
            .then((gClient)=>{ // google drive api ロードok なら. こっちはthisを使うんでアローじゃないとダメ
                this.googleDriveClient = gClient;
        	});
	}

    getFileList(strPageToken, strParentId) {
        var objParam = {
            pageSize: 10,
            orderBy: 'folder,modifiedTime',
            q: 'trashed=false',
            fields: 'files(id, name, kind, size, mimeType, lastModifyingUser, modifiedTime, iconLink, owners, folderColorRgb, shared, webViewLink, webContentLink), nextPageToken'
        };
        if (strParentId) {
            objParam.q += ' and ' + '"' + strParentId + '" in parents';
        }
        if (strPageToken) {
            objParam.pageToken = strPageToken;
        }
        return new Promise((resolve, reject)=>{
            var objReq = this.googleDriveClient.drive.files.list(objParam);
            objReq.execute(function (resp) {
                resolve(resp);
            });
        });
    }

    // ファイルの一覧表示
    viewFileList(objFileList) {
        var arrayFiles = objFileList.files;
        this.nextPageToken = objFileList.nextPageToken ? objFileList.nextPageToken : '';
        for (var i = 0; i < arrayFiles.length; i++) {
            var file = arrayFiles[i];
            var filename = $('<td/>').text(file.name);
            var filesize = $('<td/>').text(file.size ? file.size : '-');
            var viewLink = file.webViewLink ? $('<a/>').attr('href', file.webViewLink).text('表示') : '<span/>';
            var fileview = $('<td/>').append(viewLink);
            var dlLink = file.webContentLink ? $('<a/>').attr('href', file.webContentLink).text('DL') : '<span/>';
            var filedownload = $('<td/>').append(dlLink);
            var $row = $('<tr/>').append(filename).append(filesize).append(fileview).append(filedownload);
            $row.attr('dblclick', "getDrilldownFile('" + file.mimeType + "','" + file.id + "')");
            $('.file-list tbody').append($row);
        }
    }

    // フォルダのドリルダウン
    getDrilldownFile(mime, id) {
        if (mime === 'application/vnd.google-apps.folder') {
            clearList();
            this.parentId = id;
            getFileList(null, id).then(function (objFileList) {
                viewFileList(objFileList);
            });
        }
    }

    // 追加取得
    nextPage() {
        this.getFileList(this.nextPageToken, this.parentId)
        	.then((objFileList)=>{
            	this.viewFileList(objFileList);
        	});
    }


    /**
     * Insert new file.
     *
     * @param {fileName} 保存するファイル名
     * @param {content} 保存するファイルの内容
     * @param {Function} callback Function to call when the request is complete.
     */
    insertFile(fileName, content, callback) {
        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";

        var contentType = 'text/plain';
        var metadata = {
                'title': fileName,
                'mimeType': contentType
        };

		function utf8_to_b64(str) {
		  return window.btoa( unescape(encodeURIComponent( str )) );
		}

        var base64Data = utf8_to_b64(content);
        var multipartRequestBody = delimiter +
                'Content-Type: application/json\r\n\r\n' + JSON.stringify(metadata) + delimiter +
                'Content-Type: ' + contentType + '\r\n' +
                'Content-Transfer-Encoding: base64\r\n' +
                '\r\n' + base64Data + close_delim;

        var request = gapi.client.request({
                'path': '/upload/drive/v3/files',
                'method': 'POST',
                'params': {
                    'uploadType': 'multipart'
                 },
                'headers': {
                    'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
                },
                'body': multipartRequestBody
        });
        if(!callback) {
          callback = function(file){
              alert("保存しました。");
              console.log(file)
          };
        }
        request.execute(callback);

    }

};


	/* 
	get latest(){}
	で、
	GoogleAuthManager.latest のようにメソッドじゃなくてプロパティアクセスできる



	promise
	こんな感じ
	function readFileAsync(file) {
	  return new Promise(function(resolve, reject){
	    fs.readFile(file, function(err, data){
	      if (err) {
	        reject(err); // errがあればrejectを呼び出す
	        return;
	      }

	      resolve(data); // errがなければ成功とみなしresolveを呼び出す
	    });
	  });
	}
	*/