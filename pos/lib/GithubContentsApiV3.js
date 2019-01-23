class GithubContentsApiV3 {
    constructor(owner, repo, username, password){
        this.owner=owner;
        this.repo=repo;
        this.username=username;
        this.password=password;
    }

    retrieveGithubFile(path) {
        return new Promise((resolve, reject) => {
            fetch("https://api.github.com/repos/" + this.owner + "/" + this.repo + "/contents/" + path, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'User-Agent': this.username,
                    'Accept': 'application/vnd.github.v3+json',
                    'Authorization': 'token ' + this.password
                }
            })
                .then(response => response.json()).then(resp => {
                    if (!resp.type == "file") {
                        console.log("expected response is not a file, resp=" + JSON.stringify(resp));
                        reject("Error while accessing the file on server, contact admin");
                    } else {
                        resolve(resp);
                    }
                })
                .catch((e) => {
                    console.log("Error while retrieving productList " + e);
                    reject("Error while retrieving productList");
                })
        });
    }
    
    updateGithubFile(path,content,sha) {
        return new Promise((resolve,reject)=>{
            fetch("https://api.github.com/repos/" + this.owner + "/" + this.repo + "/contents/" + path, {
                method: 'PUT',
                mode: 'cors',
                body: JSON.stringify({
                    'path': path,
                    'message': 'update product list',
                    'content': content,
                    'sha': sha
                }),
                headers: {
                    'User-Agent': this.username,
                    'Accept': 'application/vnd.github.v3+json',
                    'Authorization': 'token ' + this.password
                }
            }).then(response => response.json()).then(resp => {
                resolve(resp);
            }).catch((e) => {
                reject("Error while updating file", e);
            })
        });
    }
}