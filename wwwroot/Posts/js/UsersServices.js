class UsersServices
{
    static HOST_URL() { return "http://localhost:5000/accounts" };
    static URL() { return "http://localhost:5000" };
    static API_URL() { return this.URL() + "/api/accounts"}

    static initHttpState() {
        this.currentHttpError = "";
        this.currentStatus = 0;
        this.error = false;
    }
    static setHttpErrorState(xhr) {
        if (xhr.responseJSON)
            this.currentHttpError = xhr.responseJSON.error_description;
        else
            this.currentHttpError = xhr.statusText == 'error' ? "Service introuvable" : xhr.statusText;
        this.currentStatus = xhr.status;
        this.error = true;
    }

    static async HEAD() {
        UsersServices.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: this.API_URL(),
                type: 'HEAD',
                contentType: 'text/plain',
                headers: {"Authorization" : `Bearer ${SessionStorage.retrieveAccessToken()}`},
                complete: data => { resolve(data.getResponseHeader('ETag')); },
                error: (xhr) => { UsersServices.setHttpErrorState(xhr); resolve(null); }
            });
        });
    }

    static async Get()
    {
        UsersServices.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: this.HOST_URL(),
                type: 'GET',
                headers: {"Authorization" : `Bearer ${SessionStorage.retrieveAccessToken()}`},
                complete: data => { resolve({ ETag: data.getResponseHeader('ETag'), data: data.responseJSON }); },
                error: (xhr) => { Posts_API.setHttpErrorState(xhr); resolve(null); }
            });
        });
    }

    static async Save(data, create = true) {
        UsersServices.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: create ? this.HOST_URL() + "/register" : this.HOST_URL() + "/modify",
                type: create ? "POST" : "PUT",
                headers: {"Authorization" : `Bearer ${SessionStorage.retrieveAccessToken()}`},
                contentType: 'application/json',
                data: JSON.stringify(data),
                success: (data) => { resolve(data); },
                error: (xhr) => { UsersServices.setHttpErrorState(xhr); resolve(null); }
            });
        });
    }

    static async RemoveUser(userId) {
        UsersServices.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: this.HOST_URL() + "/remove/" + userId,
                type: "GET",
                contentType: 'application/json',
                headers: { "Authorization" : `Bearer ${SessionStorage.retrieveAccessToken()}` },
                success: (data) => { resolve(data); },
                error: (xhr) => { UsersServices.setHttpErrorState(xhr); resolve(null); }
            });
        });
    }

    static async Login(data) {
        UsersServices.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: this.URL() + "/token",
                type: "POST",
                contentType: 'application/json',
                data: JSON.stringify(data),
                success: (data) => { resolve(data); },
                error: (xhr) => { UsersServices.setHttpErrorState(xhr); resolve(null); }
            });
        });
    }
    static async Logout(userId) {
        UsersServices.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: this.HOST_URL() + "/logout?userId=" + userId,
                type: "GET",
                contentType: 'application/json',
                success: (data) => { resolve(data); SessionStorage.eraseAccessToken(); SessionStorage.eraseUser(); },
                error: (xhr) => { UsersServices.setHttpErrorState(xhr); resolve(null); }
            });
        });
    }
    static async Verify(data) {
        UsersServices.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: this.HOST_URL() + "/verify?" + "id=" + data.Id + "&code=" + data.code,
                type: "GET",
                contentType: 'application/json',
                success: (data) => { resolve(data); },
                error: (xhr) => { UsersServices.setHttpErrorState(xhr); resolve(null); }
            });
        });
    }

    static async BlockUser(data) { //Data is the information of a user
        UsersServices.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: this.HOST_URL() + "/block",
                type: "POST",
                contentType: "application/json",
                headers: {"Authorization" : `Bearer ${SessionStorage.retrieveAccessToken()}`},
                data: JSON.stringify(data),
                complete: (data) => { resolve({ ETag: data.getResponseHeader('ETag') }); },
                error: (xhr) => { UsersServices.setHttpErrorState(xhr); resolve(null); }
            });
        })
    }

    static async PromoteUser(data) { //Data is the information of a user
        UsersServices.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: this.HOST_URL() + "/promote",
                type: "POST",
                contentType: "application/json",
                headers: {"Authorization" : `Bearer ${SessionStorage.retrieveAccessToken()}`},
                data: JSON.stringify(data),
                complete: (data) => { resolve({ ETag: data.getResponseHeader('ETag') }); },
                error: (xhr) => { UsersServices.setHttpErrorState(xhr); resolve(null); }
            });
        });
    }
}