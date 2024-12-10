class SessionStorage{
    static storeAccessToken(token){
        sessionStorage.setItem("accessToken", token);
    }
    static eraseAccessToken(){
        sessionStorage.removeItem("accessToken");
    }
    static retrieveAccessToken(){
        return sessionStorage.getItem('accessToken');
    }
    static storeUser(user){
        sessionStorage.setItem("user", JSON.stringify(user));
    }
    static eraseUser(){
        sessionStorage.removeItem("user");
    }
    static retrieveUser(){
        return sessionStorage.getItem("user");
    }
}