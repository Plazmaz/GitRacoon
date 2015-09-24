var SearchString = function (part, type, pattern, info) {
    this.part = part;
    this.type = type;
    this.pattern = pattern;
    this.info = info;
};
var searchedCommits = [];
var key = prompt('Please enter a github api key');
var results = [];
var searches = [];//[new SearchString('filename', 'match', '.gitignore', 'test'), new SearchString('filename', 'regex', '(.*?)\\.txt', 'test')];
load('https://rawgit.com/Plazmaz/GitRacoon/master/patterns.json', function() {
        searches = JSON.parse(this.responseText.substring(this.responseText.indexOf("*/") + 2));
    	search();
		setInterval(search, 30000);
});


function search() {
    var commits = [];
    //var limit = 10;
    load('https://api.github.com/events', function () {
        var events = JSON.parse(this.responseText);
        events.forEach(function (event) {
            //limit--;
            //if (limit <= 0) {
            //    return;
            //}
            if (event.type == "PushEvent") {
                event.payload.commits.forEach(function (commit) {
                    if (searchedCommits.indexOf(commit.sha) == -1) {
                        parseCommit(commit.url, function (commitVal) {
                            commits.push(commit);
                            searchCommit(commitVal);
                            searchedCommits.push(commit.sha);
                        });
                        //delay(50);
                    } else {
                        //console.log('Skipping already checked: ' + commit.sha);
                    }
                });
            }
        });
    });
    setTimeout(function() {
        if(results.length > 0) {
        	alert('FOUND SOMETHING!');
     	    console.log(document.createTextNode(JSON.stringify(results)));
            document.body.innerHTML += "<br><textarea>" + JSON.stringify(results) + "</textarea>";
            results = [];
        }
    }, 5000);
}

function searchCommit(commit) {
    searches.forEach(function (search) {
        if (search.part == 'filename') {
            commit.files.forEach(function (file) {
                switch (search.type) {
                    case 'match':
                        if (file.filename == search.pattern) {
                            console.log(file.filename);
                            results.push(JSON.stringify({search, commit}));
                        }
                        break;
                    case 'regex':
                        var re = new RegExp(search.pattern, 'g');
                        if ((file.filename).match(re)) {
                            console.log(file.filename);
                            results.push(JSON.stringify({search, commit}));
                        }
                        break;
                }
            });
        } else if(search.part == "extension") {
            commit.files.forEach(function (file) {
                var name = file.filename.substr(file.filename.lastIndexOf('.'));
                switch (search.type) {
                    case 'match':
                        if (name == search.pattern) {
                            results.push({search, commit});
                        }
                        break;
                    case 'regex':
                        var re = new RegExp(search.pattern, 'g');
                        if (name.match(re)) {
                            results.push({search, commit});
                        }
                        break;
                }
            });
        }
    });
}

function delay(ms) {
    var start = new Date().getTime();
    while (new Date().getTime() - start < ms);
}

function parseCommit(url, callback) {
    var result;
    load(url, function () {
        var commit = JSON.parse(this.responseText);
        result = commit;
        callback(result);
    });
}

function load(url, callback) {
    var request = new XMLHttpRequest();
    request.onload = callback;
    // Initialize a request
    request.open('get', url);
    if(url.indexOf('github.com') != -1) {
    	request.setRequestHeader("Authorization", "token " + key);
    }
    // Send it
    request.send();
}
