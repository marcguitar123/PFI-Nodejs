class UsersServices
{
    static API_URL() { return "http://localhost:5000/api/accounts" };
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
                url: this.API_URL(),
                type: 'GET',
                headers: {"Authorization" : 'Bearer eb65dfe4132e9f6563e7558e105960d4d1eddf8194c22514f9a26b83d92febf3'},
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
}