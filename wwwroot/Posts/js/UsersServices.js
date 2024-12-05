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
                headers: {"Authorization" : 'Bearer 657284211a02d5552a79c362432a46125def365052945c4ac2cfc1fe40a58361'},
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
                headers: {"Authorization" : 'Bearer 657284211a02d5552a79c362432a46125def365052945c4ac2cfc1fe40a58361'},
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
                headers: {"Authorization" : 'Bearer 657284211a02d5552a79c362432a46125def365052945c4ac2cfc1fe40a58361'},
                data: JSON.stringify(data),
                success: (data) => { resolve(data); },
                error: (xhr) => { UsersServices.setHttpErrorState(xhr); resolve(null); }
            });
        });
    }
}