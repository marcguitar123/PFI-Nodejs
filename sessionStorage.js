class SessionStorage{

    accessToken = "";
    user = "";

    static storeAccessToken(token){
        this.accessToken = token;
    }
    static eraseAccessToken(){
        this.accessToken = "";
    }
    static retrieveAccessToken(){
        return this.accessToken;
    }
    static storeUser(user){
        this.user = user;
    }
    static eraseUser(){
        this.user = "";
    }
    static retrieveUser(){
        return this.user;
    }
}