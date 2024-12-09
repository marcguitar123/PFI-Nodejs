import Model from './model.js';
import PostlikeModel from './postlike.js';
import Repository from './repository.js';
import UserModel from '../models/user.js';
import AccessControl from '../accessControl.js';
import AccountsController from '../controllers/AccountsController.js';
import HttpContext  from '../httpContext.js';

export default class Post extends Model {
    constructor() {
        super(true /* secured Id */);

        this.addField('Title', 'string');
        this.addField('Text', 'string');
        this.addField('Category', 'string');
        this.addField('Image', 'asset');
        this.addField('Date', 'integer');
        this.setKey("Title");
        this.addField('AuthorId', 'string');

    }

    bindExtraData(instance, paramHttpContext) {
        instance = super.bindExtraData(instance);
        let postLikesRepo = new Repository(new PostlikeModel());
        let userRepo = new Repository(new UserModel(), AccessControl.admin()); // ******REVOIR let userRepo = new Repository(new UserModel(), AccessControl.admin())
        let postsLikesComplete = postLikesRepo.findByFilter((like) => like.PostId == instance.Id);
        let postLikesNames = [];
        let postLikesIds = [];
        postsLikesComplete.forEach(postLike => {
            let user = userRepo.get(postLike.UserId);
            postLikesNames.push(user.Name);
            postLikesIds.push(user.Id);
        });
        instance.likesNames = postLikesNames;
        instance.likes = postLikesIds;

        //Informations of the author:
        let author = new Repository(new UserModel(), false).get(instance.AuthorId);
        instance.AuthorInfos = { Avatar: author.Avatar, Name:author.Name }
        instance.AuthorId = author.Id;

        return instance;
    }
}