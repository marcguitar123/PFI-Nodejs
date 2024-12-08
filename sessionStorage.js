class SessionStorage{

    /*accessToken = "";
    user = "";*/

    static storeAccessToken(token){
        sessionStorage.setItem("accessToken", token);
        //this.accessToken = token;
    }
    static eraseAccessToken(){
        sessionStorage.removeItem("accessToken");
        //this.accessToken = "";
    }
    static retrieveAccessToken(){
        return sessionStorage.getItem('accessToken');
        //return this.accessToken;
    }
    static storeUser(user){
        sessionStorage.setItem("user", JSON.stringify(user));
        //this.user = user;
    }
    static eraseUser(){
        sessionStorage.removeItem("user");
        //this.user = "";
    }
    static retrieveUser(){
        return sessionStorage.getItem("user");
        //return this.user;
    }
}