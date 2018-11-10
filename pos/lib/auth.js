class Authentication{

    static signin(username,token){
        sessionStorage.setItem("username",username);
        sessionStorage.setItem("token",token);
        sessionStorage.setItem("isadmin",token.length==40);
        document.location = "index.html";
    }

    static signout(){
        sessionStorage.removeItem("username");
        sessionStorage.removeItem("token");
        document.location = "signin.html";
    }

    static getUsername(){
        return sessionStorage.getItem("username");
    }

    static getToken(){
        return sessionStorage.getItem("token");
    }

    static isAdmin(){
        return sessionStorage.getItem("isadmin");
    }


}