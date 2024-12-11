import AccessControl from '../accessControl.js';
import PostModel from '../models/post.js';
import Repository from '../models/repository.js';
import Controller from './Controller.js';

export default class PostModelsController extends Controller {
    constructor(HttpContext) {
        super(HttpContext, new Repository(new PostModel()));
    }
    
    post(data) {
        if (AccessControl.writeGranted(this.HttpContext.authorizations, AccessControl.superUser())) {
            data = this.repository.add(data);
            if (this.repository.model.state.isValid) {
                this.HttpContext.response.created(data);
            } else {
                if (this.repository.model.state.inConflict)
                    this.HttpContext.response.conflict(this.repository.model.state.errors);
                else
                    this.HttpContext.response.badRequest(this.repository.model.state.errors);
            }
        } else
            this.HttpContext.response.unAuthorized("Unauthorized access");
    }

    put(data) {
        if (AccessControl.writeGrantedAdminOrOwner(this.HttpContext, AccessControl.superUser(), data.Id)) {
            if (this.HttpContext.path.id !== '') {
                data = this.repository.update(this.HttpContext.path.id, data);
                if (this.repository.model.state.isValid) {
                    this.HttpContext.response.accepted(data);
                } else {
                    if (this.repository.model.state.notFound) {
                        this.HttpContext.response.notFound(this.repository.model.state.errors);
                    } else {
                        if (this.repository.model.state.inConflict)
                            this.HttpContext.response.conflict(this.repository.model.state.errors)
                        else
                            this.HttpContext.response.badRequest(this.repository.model.state.errors);
                    }
                }
            } else
                this.HttpContext.response.badRequest("The Id of ressource is not specified in the request url.");
        } else
            this.HttpContext.response.unAuthorized("Unauthorized access");
    }
    remove(id) {
        if (AccessControl.writeGrantedAdminOrOwner(this.HttpContext, AccessControl.superUser(), id)) {
            if (this.HttpContext.path.id !== '') {
                if (this.repository.remove(id))
                    this.HttpContext.response.accepted();
                else
                    this.HttpContext.response.notFound("Ressource not found.");
            } else
                this.HttpContext.response.badRequest("The Id in the request url is  not specified.");
        } else
            this.HttpContext.response.unAuthorized("Unauthorized access");
    }
}