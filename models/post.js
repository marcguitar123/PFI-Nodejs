import Model from './model.js';
import PostlikeModel from './postlike.js';
import Repository from './repository.js';
import UserModel from '../models/user.js';
import AccessControl from '../accessControl.js';

export default class Post extends Model {
    constructor() {
        super(true /* secured Id */);

        this.addField('Title', 'string');
        this.addField('Text', 'string');
        this.addField('Category', 'string');
        this.addField('Image', 'asset');
        this.addField('Date', 'integer');

        this.setKey("Title");
    }

    bindExtraData(instance) {
        instance = super.bindExtraData(instance);
        let postLikesRepo = new Repository(new PostlikeModel());
        let userRepo = new Repository(new UserModel(), AccessControl.admin())
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
        return instance;
    }
}