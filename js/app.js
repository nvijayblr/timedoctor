//configuration
var config = {
	authUrl: 'https://webapi.timedoctor.com/oauth/v2/auth?',
	clientId: '771_3mkorr4gjvi8wsg4kwccswowogk804os8o80g4oc8kkkgwwkc8',
	redirectUrl: 'https://chfiialgglblnfgddogedjjkcfmmokop.chromiumapp.org/auth',
	secretKey: '2o7u6vvii16ossccockcgc48gscgw0gcossc04kogwcoc884ok'
},
company = {};
//chfiialgglblnfgddogedjjkcfmmokop
//https://webapi.timedoctor.com/app

//bpjecilncdmkhfhblnpkbiilnkgegokh
document.addEventListener('DOMContentLoaded', function() {
	
	var authBtn = document.getElementById('authBtn');
	var logout = document.getElementById('logout');
	var token = {}, currentUser;
	var _http = new XMLHttpRequest();
	var timeDoctor = {
		loadCompany: function(_callback) {
			document.getElementById('users').style.display = 'block';
			document.getElementById('tasks').style.display = 'none';
			document.getElementById('users').innerHTML = '<div class="loading">Loading...</div>';
			_http.onreadystatechange = function() {
				if (this.readyState == 4 && this.status == 200) {
					_callback(JSON.parse(this.response));
				}
				if (this.readyState == 4 && this.status == 401) {
					timeDoctor.logout();
				}
			};
			//_http.open("GET", "https://webapi.timedoctor.com/v1.1/companies?access_token=" + currentUser.access_token, true);
			_http.open("GET", "https://webapi.timedoctor.com/v1.1/companies", true);
			_http.setRequestHeader('Authorization', 'Bearer ' + currentUser.access_token);
			_http.send();
		},
		generateUserView: function(_users) {
			var html = '<ul>';
			for(var i=0; i<_users.users.length; i++) {
				if(_users.users[i].work_status.code == 'online')
					html = html + '<li><div class="userLink" user_id="'+_users.users[i].user_id+'">'+_users.users[i].full_name+'<span class="status active"></span><br><span class="email">'+_users.users[i].email+'</span></div></li>';
				else
					html = html + '<li><div class="userLink" user_id="'+_users.users[i].user_id+'">'+_users.users[i].full_name+'<span class="status inactive"></span><br><span class="email">'+_users.users[i].email+'</span></div></li>';
			}
			html = html + '</ul>';
			document.getElementById('users').innerHTML = html;
			var userLink = document.getElementsByClassName('userLink');
			for (var i = 0; i < userLink.length; i++) {
				userLink[i].addEventListener('click', function() {
					timeDoctor.loadTasks(this.getAttribute('user_id'));
				}, false);
			}
			
		},
		
		loadUsers: function(_company) {
			document.getElementById('users').style.display = 'block';
			document.getElementById('tasks').style.display = 'none';
			document.getElementById('users').innerHTML = '<div class="loading">Loading...</div>';
			_http.onreadystatechange = function() {
				if (this.readyState == 4 && this.status == 200) {
					timeDoctor.generateUserView(JSON.parse(this.response));
				}
			};
			_http.open("GET", "https://webapi.timedoctor.com/v1.1/companies/"+_company.company_id+"/users", true);
			_http.setRequestHeader('Authorization', 'Bearer ' + currentUser.access_token);
			_http.send();
		},
		 
		generateTaskView: function(_task) {
			var html = '<div class="back">Back</div><ul>';
			for(var i=0; i<_task.tasks.length; i++) {
				html = html + '<li><div class="userLink">'+_task.tasks[i].task_name+'</div></li>';
			}
			if(!_task.tasks.length) {
				html = html + '<div class="loading">Tasks not found.</div>';
			}
			html = html + '</ul>';
			document.getElementById('tasks').innerHTML = html;
			document.getElementsByClassName('back')[0].addEventListener('click', function() {
				timeDoctor.loadUsers(company);
			}, false);
		},

		loadTasks: function(_userId) {
			document.getElementById('users').style.display = 'none';
			document.getElementById('tasks').style.display = 'block';
			document.getElementById('tasks').innerHTML = '<div class="loading">Loading...</div>';
			_http.onreadystatechange = function() {
				if (this.readyState == 4 && this.status == 200) {
					timeDoctor.generateTaskView(JSON.parse(this.response));
				}
			};
			_http.open("GET", "https://webapi.timedoctor.com/v1.1/companies/"+company.company_id+"/users/"+_userId+"/tasks", true);
			_http.setRequestHeader('Authorization', 'Bearer ' + currentUser.access_token);
			_http.send();
		},
		checkLoggedInStatus: function() {
			console.log('checkLoggedInStatus');
			if(localStorage.getItem('timeDoctor')) {
				authBtn.style.display = 'none';
				logout.style.display = 'inline-block';
				currentUser = JSON.parse(localStorage.getItem('timeDoctor'));
				console.log(currentUser);
				this.loadCompany(function(_company) {
					company = _company.accounts[0] ? _company.accounts[0] : {};
					timeDoctor.loadUsers(company);
				});
			} else {
				authBtn.style.display = 'inline-block';
				logout.style.display = 'none';
			}
		},
		logout: function() {
			localStorage.removeItem('timeDoctor');
			authBtn.style.display = 'inline-block';
			authBtn.setAttribute('disabled', false);
			logout.style.display = 'none';
		}
	}
	
	timeDoctor.checkLoggedInStatus();
	
	logout.addEventListener('click', function() {
		timeDoctor.logout();
	}, false);
	
	authBtn.addEventListener('click', function() {
		authBtn.innerHTML = 'Loading...';
		authBtn.setAttribute('disabled', true);
		chrome.identity.launchWebAuthFlow ({
			'url': config.authUrl + 'client_id=' + config.clientId + '&redirect_uri=' + config.redirectUrl + '&response_type=token',
			'interactive': true
		}, function(redUrl) {
			console.log('redUrl', redUrl)
			//Authentication
			var params = redUrl.split('auth#state=&')[1];
			if(params) {
				params = params.split('&');
				token = {
					access_token: params[0].split('access_token=')[1],
					expires_in: params[1].split('expires_in=')[1] ,
					token_type: params[2].split('token_type=')[1] 
				}
				localStorage.setItem('timeDoctor', JSON.stringify(token));
				currentUser = token;
				authBtn.innerHTML = 'Authenticated';
				authBtn.style.display = 'none';
				logout.style.display = 'inline-block';
			};
			if(!token) {
				authBtn.innerHTML = 'Failed. Train again.';
				authBtn.setAttribute('disabled', false);
				return;
			}
			timeDoctor.loadCompany(function(_company) {
				company = _company.accounts[0] ? _company.accounts[0] : {};
				timeDoctor.loadUsers(company);
			});
		})
	}, false);
	
}, false);


