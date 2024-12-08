import PostlikeModel from '../models/postlike.js';
import Repository from '../models/repository.js';
import Controller from './Controller.js';
import AccessControl from '../accessControl.js';

export default class PostlikesController extends Controller {
    constructor(HttpContext) {
        super(HttpContext, new Repository(new PostlikeModel()));
    }
    // POST: /postlikes/togglelike body payload[{"PostId": "...", "UserId": "..."}]
    togglelike(likeInfo){
        if (AccessControl.writeGranted(this.HttpContext.authorizations, AccessControl.user())) {
            if (this.repository != null) {
                let foundPostlike = this.repository.findByFilter((like) => like.PostId == likeInfo.PostId && like.UserId == likeInfo.UserId)[0];
                if (foundPostlike !== undefined){ /* Exists so we remove it */
                    //this.remove(foundPostlike.Id);
                    this.repository.remove(foundPostlike.Id)
                }
                else{ /* Doesn't exist so we create one */
                    likeInfo.Id = 0;
                    this.post(likeInfo);
                }
            } else
                this.HttpContext.response.notImplemented();
        } else
            this.HttpContext.response.unAuthorized();
    }
}

//Get: Access.Annynamous

//TokenManager.logout()