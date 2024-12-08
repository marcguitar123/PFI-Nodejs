class UsersServices
{
    static HOST_URL() { return "http://localhost:5000/accounts" };
    static URL() { return "http://localhost:5000" };

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

    static async Get()
    {
        UsersServices.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: this.HOST_URL(),
                type: 'GET',
                headers: {"Authorization" : 'Bearer 6fda1031925c57f92699cd806cabd40b9b0c8840e84e32beb31708c82853b4db'},
                complete: data => { resolve({ ETag: data.getResponseHeader('ETag'), data: data.responseJSON }); },
                error: (xhr) => { Posts_API.setHttpErrorState(xhr); resolve(null); }
            });
        });
    }
    static async Save(data, create = true) {
        UsersServices.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: create ? this.HOST_URL() + "/register" : this.HOST_URL() + "/" + data.Id,
                type: create ? "POST" : "PUT",
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
                headers: { "Authorization" : 'Bearer 6fda1031925c57f92699cd806cabd40b9b0c8840e84e32beb31708c82853b4db' },
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

    static async BlockUser(data) { //Le data correspond au user
        UsersServices.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: this.HOST_URL() + "/block",
                type: "POST",
                contentType: "application/json",
                headers: {"Authorization" : 'Bearer 6fda1031925c57f92699cd806cabd40b9b0c8840e84e32beb31708c82853b4db'},
                data: JSON.stringify(data),
                success: (data) => { resolve(data); },
                error: (xhr) => { UsersServices.setHttpErrorState(xhr); resolve(null); }
            });
        })
    }

    static async PromoteUser(data) { //Le data correspond au user
        UsersServices.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: this.HOST_URL() + "/promote",
                type: "POST",
                contentType: "application/json",
                headers: {"Authorization" : 'Bearer 6fda1031925c57f92699cd806cabd40b9b0c8840e84e32beb31708c82853b4db'},
                data: JSON.stringify(data),
                success: (data) => { resolve(data); },
                error: (xhr) => { UsersServices.setHttpErrorState(xhr); resolve(null); }
            });
        });
    }
}