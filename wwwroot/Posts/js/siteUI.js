////// Authors: Henri Grondin & Marc-Antoine Bouchard
////// 2024
//////////////////////////////

import { SessionStorage } from "./../../js/sessionStorage.js";
import { Posts_API } from "./Posts_API.js";
import { UsersServices } from "./UsersServices.js";

const periodicRefreshPeriod = 2;
const waitingGifTrigger = 2000;
const minKeywordLenth = 3;
const keywordsOnchangeDelay = 500;

let categories = [];
let selectedCategory = "";
let currentETag = "";
let currentETagLikes = "";
let currentETagUsersManager = "";
let currentPostsCount = -1;
let periodic_Refresh_paused = false;
let periodic_Refresh_UsersManager_paused = true;
let postsPanel;
let itemLayout;
let waiting = null;
let showKeywords = false;
let keywordsOnchangeTimger = null;

let currentScrollPosition = 0;

Init_UI();
initTimeout(280, logout);

async function Init_UI() {
    postsPanel = new PageManager('postsScrollPanel', 'postsPanel', 'postSample', renderPosts);
    $('#createPost').on("click", async function () {
        showCreatePostForm();
    });
    $('#abort').on("click", async function () {
        showPosts();
    });
    $('#aboutCmd').on("click", function () {
        showAbout();
    });
    $("#showSearch").on('click', function () {
        toogleShowKeywords();
        showPosts();
    });
    $('#loginCmd').on("click", function (){
        showLoginForm();
    });
    $('#logoutCmd').on("click", function (){
        logout();
    });
    $('#usersManagerCmd').on("click", function () {
        currentScrollPosition = 0;
        showUsersManager();
    });
    $('#modifyAccountUserCmd').on("click", function() {
        showModifyAccountForm();
    });
    $('#modifyAccountCmd').on("click", function() {
        showModifyAccountForm();
    });

    installKeywordsOnkeyupEvent();
    await showPosts();
    start_Periodic_Refresh();
    start_Periodic_Refresh_UsersManager();
}

function logout() {
    let user = JSON.parse(SessionStorage.retrieveUser());
    UsersServices.Logout(user.Id);
    showLoginForm();
}

function logout_AccessChange() {
    logout();
    bootbox.dialog({
        message: `Vos droits d'accès ont été changé.`,
    });
}

/////////////////////////// Search keywords UI //////////////////////////////////////////////////////////

function installKeywordsOnkeyupEvent() {

    $("#searchKeys").on('keyup', function () {
        clearTimeout(keywordsOnchangeTimger);
        keywordsOnchangeTimger = setTimeout(() => {
            cleanSearchKeywords();
            showPosts(true);
        }, keywordsOnchangeDelay);
    });
    $("#searchKeys").on('search', function () {
        showPosts(true);
    });
}
function cleanSearchKeywords() {
    /* Keep only keywords of 3 characters or more */
    let keywords = $("#searchKeys").val().trim().split(' ');
    let cleanedKeywords = "";
    keywords.forEach(keyword => {
        if (keyword.length >= minKeywordLenth) cleanedKeywords += keyword + " ";
    });
    $("#searchKeys").val(cleanedKeywords.trim());
}
function showSearchIcon() {
    $("#hiddenIcon").hide();
    $("#showSearch").show();
    if (showKeywords) {
        $("#searchKeys").show();
    }
    else
        $("#searchKeys").hide();
}
function hideSearchIcon() {
    $("#hiddenIcon").show();
    $("#showSearch").hide();
    $("#searchKeys").hide();
}
function toogleShowKeywords() {
    showKeywords = !showKeywords;
    if (showKeywords) {
        $("#searchKeys").show();
        $("#searchKeys").focus();
    }
    else {
        $("#searchKeys").hide();
        showPosts(true);
    }
}

/////////////////////////// Views management ////////////////////////////////////////////////////////////

function intialView() {
    let user = JSON.parse(SessionStorage.retrieveUser());
    $("#hiddenIcon2").hide();
    $('#menu').show();
    $('#commit').hide();
    $('#abort').hide();
    $('#form').hide();
    $('#form').empty();
    hideUsersManager();
    $('#aboutContainer').hide();
    $('#errorContainer').hide();
    showSearchIcon();
    if (user !== null && (user.isAdmin || user.isSuper)){
        $("#createPost").show();
        $("#hiddenIcon").hide();
    }
    else{
        $("#createPost").hide();
        $("#hiddenIcon").show();
    }

    start_Timout_Session();
}
async function showPosts(reset = false) {
    //console.log("ShowPosts: Reset: " + reset);
    intialView();
    $("#viewTitle").text("Fil de nouvelles");
    periodic_Refresh_paused = false;
    await postsPanel.show(reset);
}
function hidePosts() {
    postsPanel.hide();
    hideSearchIcon();
    $("#createPost").hide();
    $('#menu').hide();
    periodic_Refresh_paused = true;

    stop_Timeout_Session();
}

function hideUsersManager() {
    $("#usersManagerScroll").hide();
    periodic_Refresh_UsersManager_paused = true;

    stop_Timeout_Session();
}

function showForm() {
    hidePosts();
    hideUsersManager();
    $('#form').show();
    $('#commit').show();
    $('#abort').show();
}
function showError(message, details = "") {
    hidePosts();
    $('#form').hide();
    $('#form').empty();
    $("#hiddenIcon").show();
    $("#hiddenIcon2").show();
    $('#commit').hide();
    $('#abort').show();
    $("#viewTitle").text("Erreur du serveur...");
    $("#errorContainer").show();
    $("#errorContainer").empty();
    $("#errorContainer").append($(`<div>${message}</div>`));
    $("#errorContainer").append($(`<div>${details}</div>`));
}

function showCreatePostForm() {
    showForm();
    $("#viewTitle").text("Ajout de nouvelle");
    renderPostForm();
}
function showEditPostForm(id) {
    showForm();
    $("#viewTitle").text("Modification");
    renderEditPostForm(id);
}
function showDeletePostForm(id) {
    showForm();
    $("#viewTitle").text("Retrait");
    renderDeletePostForm(id);
}
function showAbout() {
    hidePosts();
    $("#hiddenIcon").show();
    $("#hiddenIcon2").show();
    $('#abort').show();
    $("#viewTitle").text("À propos...");
    $("#aboutContainer").show();
}

//////////////////////////// Posts rendering /////////////////////////////////////////////////////////////

//////////////////////////// Posts rendering /////////////////////////////////////////////////////////////

function start_Periodic_Refresh() {
    $("#reloadPosts").addClass('white');
    $("#reloadPosts").on('click', async function () {
        $("#reloadPosts").addClass('white');
        postsPanel.resetScrollPosition();
        await showPosts();
    })
    setInterval(async () => {
        if (!periodic_Refresh_paused) {
            let etag = await Posts_API.HEAD();
            let etagLikes = await Posts_API.LIKES_HEAD();
            // the etag contain the number of model records in the following form
            // xxx-etag
            let postsCount = parseInt(etag.split("-")[0]);
            if (currentETag != etag || currentETagLikes != etagLikes) {           
                if (postsCount != currentPostsCount) {
                    console.log("postsCount", postsCount)
                    currentPostsCount = postsCount;
                    $("#reloadPosts").removeClass('white');
                } else
                    await showPosts();
                currentETag = etag;
                currentETagLikes = etagLikes;
            }
        }
    },
        periodicRefreshPeriod * 1000);
}
async function renderPosts(queryString) {
    let endOfData = false;
    queryString += "&sort=date,desc";
    compileCategories();
    if (selectedCategory != "") queryString += "&category=" + selectedCategory;
    if (showKeywords) {
        let keys = $("#searchKeys").val().replace(/[ ]/g, ',');
        if (keys !== "")
            queryString += "&keywords=" + $("#searchKeys").val().replace(/[ ]/g, ',')
    }
    addWaitingGif();
    let response = await Posts_API.GetQuery(queryString);
    if (!Posts_API.error) {
        currentETag = response.ETag;
        currentPostsCount = parseInt(currentETag.split("-")[0]);
        let Posts = response.data;
        if (Posts.length > 0) {
            Posts.forEach(async Post => {
                postsPanel.append(renderPost(Post, Post.AuthorInfos));
            });
        } else
            endOfData = true;
        linefeeds_to_Html_br(".postText");
        highlightKeywords();
        attach_Posts_UI_Events_Callback();
    } else {
        showError(Posts_API.currentHttpError);
    }
    removeWaitingGif();
    return endOfData;
}
function renderPost(post, loggedUser) {
    let user = JSON.parse(SessionStorage.retrieveUser());

    let date = convertToFrenchDate(UTC_To_Local(post.Date));

    let crudIcon = "";
    let likeIcon = "";

    if (user != null){
        if (post.AuthorId == user.Id){
            crudIcon =
            `
                <span class="editCmd cmdIconSmall fa fa-pencil" postId="${post.Id}" title="Modifier nouvelle"></span>
                <span class="deleteCmd cmdIconSmall fa fa-trash" postId="${post.Id}" title="Effacer nouvelle"></span>
            `;
        }
        else if (user.isAdmin){
            crudIcon =
            `               
                <span></span>
                <span class="deleteCmd cmdIconSmall fa fa-trash" postId="${post.Id}" title="Effacer nouvelle"></span>
            `;
        } else {
            crudIcon = 
            `
                <span></span>
                <span></span>
            `;
        }
        
        let listPeopleLikes = "";
        post.likesNames.forEach(like => {
            listPeopleLikes += like + "\n";
        })
        let likeIconClass = "fa-regular fa-thumbs-up";
        if (post.likes.includes(user.Id)){
            likeIconClass = "fa-solid fa-thumbs-up";
        }
        likeIcon = `<span class="cmdIconSmall toggleLike" postId="${post.Id}" title="${listPeopleLikes}"><i class="${likeIconClass}"></i> <span>${post.likes.length} </span></span>`;
    }
    return $(`
        <div class="post" id="${post.Id}">
            <div class="postHeader">
                ${post.Category}
                ${crudIcon}
                ${likeIcon}
            </div>
            <div class="postTitle"> ${post.Title} </div>
            <img class="postImage" src='${post.Image}'/>

            <div class="postOwnerAndDate">
                <div class="postOwnerInfos">
                    <div class="UserAvatarXSmall" title="Avatar" style="background-image:url('${loggedUser.Avatar}')"></div>
                    <p class="userTextInfos userManagerUsername" title="Nom de l'auteur">${loggedUser.Name}</p>
                </div>
                <div class="postDate"> ${date} </div>
            </div>
            <div postId="${post.Id}" class="postTextContainer hideExtra">
                <div class="postText" >${post.Text}</div>
            </div>
            <div class="postfooter">
                <span postId="${post.Id}" class="moreText cmdIconXSmall fa fa-angle-double-down" title="Afficher la suite"></span>
                <span postId="${post.Id}" class="lessText cmdIconXSmall fa fa-angle-double-up" title="Réduire..."></span>
            </div>         
        </div>
    `);
}
async function compileCategories() {
    categories = [];
    let response = await Posts_API.GetQuery("?fields=category&sort=category");
    if (!Posts_API.error) {
        let items = response.data;
        if (items != null) {
            items.forEach(item => {
                if (!categories.includes(item.Category))
                    categories.push(item.Category);
            })
            if (!categories.includes(selectedCategory))
                selectedCategory = "";
            updateDropDownMenu(categories);
        }
    }
}
function updateDropDownMenu() {
    let DDMenu = $("#DDMenu");
    let selectClass = selectedCategory === "" ? "fa-check" : "fa-fw";
    DDMenu.empty();
    let user = SessionStorage.retrieveUser();
    if (user === null){ //check if user is online      
        DDMenu.append($(`
            <div class="dropdown-item menuItemLayout" id="loginCmd">
                <i class="menuIcon fa fa-sign-in mx-2"></i> Connexion
            </div>
            `));
    }
    else{
        let userObject = JSON.parse(user);

        
        
        DDMenu.append($(`
            <div class="dropdown-item menuItemLayout" id="modifyAccountUserCmd">
                <div class="UserAvatarXSmall" title="Avatar" style="background-image:url('${userObject.Avatar}')"></div>
                <p class="userTextInfos userManagerUsername" title="Nom de l'utilisateur">${userObject.Name}</p>
            </div>
            `));

        DDMenu.append($(`<div class="dropdown-divider"></div> `));
        if (userObject.isAdmin) {
            //To have the option to manage users:
            DDMenu.append($(`
                <div class="dropdown-item menuItemLayout" id="usersManagerCmd">
                    <i class="menuIcon fa fa-user-gear mx-2"></i> Gestion des usagers
                </div>
                
            `));
            DDMenu.append($(`<div class="dropdown-divider"></div> `));
        }
        DDMenu.append($(`
            <div class="dropdown-item menuItemLayout" id="modifyAccountCmd">
                <i class="menuIcon fas fa-user-edit mx-2"></i> Modifier votre profil
            </div>
            `));
        DDMenu.append($(`
            <div class="dropdown-item menuItemLayout" id="logoutCmd">
                <i class="menuIcon fa fa-sign-out mx-2"></i> Déconnexion
            </div>
            `));
        DDMenu.append($(`<div class="dropdown-divider"></div> `));
        
    }
    DDMenu.append($(`
        <div class="dropdown-item menuItemLayout" id="allCatCmd">
            <i class="menuIcon fa ${selectClass} mx-2"></i> Toutes les catégories
        </div>
        `));
    DDMenu.append($(`<div class="dropdown-divider"></div>`));
    categories.forEach(category => {
        selectClass = selectedCategory === category ? "fa-check" : "fa-fw";
        DDMenu.append($(`
            <div class="dropdown-item menuItemLayout category" id="allCatCmd">
                <i class="menuIcon fa ${selectClass} mx-2"></i> ${category}
            </div>
        `));
    })
    DDMenu.append($(`<div class="dropdown-divider"></div> `));
    DDMenu.append($(`
        <div class="dropdown-item menuItemLayout" id="aboutCmd">
            <i class="menuIcon fa fa-info-circle mx-2"></i> À propos...
        </div>
        `));
    $('#aboutCmd').on("click", function () {
        showAbout();
    });
    $('#allCatCmd').on("click", async function () {
        selectedCategory = "";
        await showPosts(true);
        updateDropDownMenu();
    });
    $('.category').on("click", async function () {
        selectedCategory = $(this).text().trim();
        await showPosts(true);
        updateDropDownMenu();
    });
    $('#loginCmd').on("click", function (){
        showLoginForm();
    });
    $('#logoutCmd').on("click", function (){
        logout();
    });
    $('#usersManagerCmd').on("click", function () {
        showUsersManager();
    });
    $('#modifyAccountUserCmd').on("click", function() {
        showModifyAccountForm();
    });
    $('#modifyAccountCmd').on("click", function() {
        showModifyAccountForm();
    });
}
function attach_Posts_UI_Events_Callback() {

    linefeeds_to_Html_br(".postText");
    // attach icon command click event callback
    $(".editCmd").off();
    $(".editCmd").on("click", function () {
        showEditPostForm($(this).attr("postId"));
    });
    $(".deleteCmd").off();
    $(".deleteCmd").on("click", function () {
        showDeletePostForm($(this).attr("postId"));
    });
    $(".moreText").off();
    $(".moreText").click(function () {
        $(`.commentsPanel[postId=${$(this).attr("postId")}]`).show();
        $(`.lessText[postId=${$(this).attr("postId")}]`).show();
        $(this).hide();
        $(`.postTextContainer[postId=${$(this).attr("postId")}]`).addClass('showExtra');
        $(`.postTextContainer[postId=${$(this).attr("postId")}]`).removeClass('hideExtra');
    })
    $(".lessText").off();
    $(".lessText").click(function () {
        $(`.commentsPanel[postId=${$(this).attr("postId")}]`).hide();
        $(`.moreText[postId=${$(this).attr("postId")}]`).show();
        $(this).hide();
        postsPanel.scrollToElem($(this).attr("postId"));
        $(`.postTextContainer[postId=${$(this).attr("postId")}]`).addClass('hideExtra');
        $(`.postTextContainer[postId=${$(this).attr("postId")}]`).removeClass('showExtra');
    })
    $(".toggleLike").off();
    $(".toggleLike").on("click", function () {
        let user = JSON.parse(SessionStorage.retrieveUser());
        Posts_API.ToggleLike($(this).attr("postId"), user.Id);
    });
}
function addWaitingGif() {
    clearTimeout(waiting);
    waiting = setTimeout(() => {
        postsPanel.itemsPanel.append($("<div id='waitingGif' class='waitingGifcontainer'><img class='waitingGif' src='Loading_icon.gif' /></div>'"));
    }, waitingGifTrigger)
}
function removeWaitingGif() {
    clearTimeout(waiting);
    $("#waitingGif").remove();
}

/////////////////////// Posts content manipulation ///////////////////////////////////////////////////////

function linefeeds_to_Html_br(selector) {
    $.each($(selector), function () {
        let postText = $(this);
        var str = postText.html();
        var regex = /[\r\n]/g;
        postText.html(str.replace(regex, "<br>"));
    })
}
function highlight(text, elem) {
    text = text.trim();
    if (text.length >= minKeywordLenth) {
        var innerHTML = elem.innerHTML;
        let startIndex = 0;

        while (startIndex < innerHTML.length) {
            var normalizedHtml = innerHTML.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            var index = normalizedHtml.indexOf(text, startIndex);
            let highLightedText = "";
            if (index >= startIndex) {
                highLightedText = "<span class='highlight'>" + innerHTML.substring(index, index + text.length) + "</span>";
                innerHTML = innerHTML.substring(0, index) + highLightedText + innerHTML.substring(index + text.length);
                startIndex = index + highLightedText.length + 1;
            } else
                startIndex = innerHTML.length + 1;
        }
        elem.innerHTML = innerHTML;
    }
}
function highlightKeywords() {
    if (showKeywords) {
        let keywords = $("#searchKeys").val().split(' ');
        if (keywords.length > 0) {
            keywords.forEach(key => {
                let titles = document.getElementsByClassName('postTitle');
                Array.from(titles).forEach(title => {
                    highlight(key, title);
                })
                let texts = document.getElementsByClassName('postText');
                Array.from(texts).forEach(text => {
                    highlight(key, text);
                })
            })
        }
    }
}

//////////////////////// Forms rendering /////////////////////////////////////////////////////////////////

async function renderEditPostForm(id) {
    $('#commit').show();
    addWaitingGif();
    let response = await Posts_API.Get(id)
    if (!Posts_API.error) {
        let Post = response.data;
        if (Post !== null)
            renderPostForm(Post);
        else
            showError("Post introuvable!");
    } else {
        showError(Posts_API.currentHttpError);
    }
    removeWaitingGif();
}
async function renderDeletePostForm(id) {
    start_Timout_Session();

    let response = await Posts_API.Get(id)
    if (!Posts_API.error) {
        let post = response.data;
        if (post !== null) {
            let date = convertToFrenchDate(UTC_To_Local(post.Date));
            $("#form").append(`
                <div class="post" id="${post.Id}">
                <div class="postHeader">  ${post.Category} </div>
                <div class="postTitle ellipsis"> ${post.Title} </div>
                <img class="postImage" src='${post.Image}'/>
                <div class="postDate"> ${date} </div>
                <div class="postTextContainer showExtra">
                    <div class="postText">${post.Text}</div>
                </div>
            `);
            linefeeds_to_Html_br(".postText");
            // attach form buttons click event callback
            $("#commit").off();
            $('#commit').on("click", async function () {
                await Posts_API.Delete(post.Id);
                if (!Posts_API.error) {
                    await showPosts();
                    stop_Timeout_Session();
                }
                else {
                    console.log(Posts_API.currentHttpError)
                    showError("Une erreur est survenue!");
                }
            });
            $('#cancel').on("click", async function () {
                await showPosts();
            });

        } else {
            showError("Post introuvable!");
        }
    } else
        showError(Posts_API.currentHttpError);
}
function newPost() {
    let Post = {};
    Post.Id = 0;
    Post.Title = "";
    Post.Text = "";
    Post.Image = "news-logo-upload.png";
    Post.Category = "";
    return Post;
}
function renderPostForm(post = null) {
    start_Timout_Session();

    let create = post == null;
    if (create) post = newPost();
    $("#form").show();
    $("#form").empty();
    $("#form").append(`
        <form class="form" id="postForm">
            <input type="hidden" name="Id" value="${post.Id}"/>
             <input type="hidden" name="Date" value="${post.Date}"/>
             <input type="hidden" name="AuthorId" value="${JSON.parse(SessionStorage.retrieveUser()).Id}"/>
            <label for="Category" class="form-label">Catégorie </label>
            <input 
                class="form-control"
                name="Category"
                id="Category"
                placeholder="Catégorie"
                required
                value="${post.Category}"
            />
            <label for="Title" class="form-label">Titre </label>
            <input 
                class="form-control"
                name="Title" 
                id="Title" 
                placeholder="Titre"
                required
                RequireMessage="Veuillez entrer un titre"
                InvalidMessage="Le titre comporte un caractère illégal"
                value="${post.Title}"
            />
            <label for="Url" class="form-label">Texte</label>
             <textarea class="form-control" 
                          name="Text" 
                          id="Text"
                          placeholder="Texte" 
                          rows="9"
                          required 
                          RequireMessage = 'Veuillez entrer une Description'>${post.Text}</textarea>

            <label class="form-label">Image </label>
            <div class='imageUploaderContainer'>
                <div class='imageUploader' 
                     newImage='${create}' 
                     controlId='Image' 
                     imageSrc='${post.Image}' 
                     waitingImage="Loading_icon.gif">
                </div>
            </div>
            <div id="keepDateControl">
                <input type="checkbox" name="keepDate" id="keepDate" class="checkbox" checked>
                <label for="keepDate"> Conserver la date de création </label>
            </div>
            <input type="submit" value="Enregistrer" id="savePost" class="btn btn-primary displayNone">
        </form>
    `);
    if (create) $("#keepDateControl").hide();

    initImageUploaders();
    initFormValidation(); // important do to after all html injection!

    $("#commit").off();
    $("#commit").click(function () {
        $("#commit").off();
        return $('#savePost').trigger("click");
    });
    $('#postForm').on("submit", async function (event) {
        event.preventDefault();
        let post = getFormData($("#postForm"));
        if (post.Category != selectedCategory)
            selectedCategory = "";
        if (create || !('keepDate' in post))
            post.Date = Local_to_UTC(Date.now());
        delete post.keepDate;
        post = await Posts_API.Save(post, create);
        if (!Posts_API.error) {
            await showPosts();
            postsPanel.scrollToElem(post.Id);
            stop_Timeout_Session();
        }
        else
            showError("Une erreur est survenue! ", Posts_API.currentHttpError);
    });
    $('#cancel').on("click", async function () {
        await showPosts();
    });
}
//This fonction allow a admin user to the management of the users of the web site.
async function showUsersManager() {  
    hidePosts();
    start_Timout_Session();
    $("#usersManagerScroll").off();
    $("#usersManagerScroll").empty();
    $('#abort').show();
    $('#menu').show();
    $(".userAccess").off("click");
    $(".blockedUnblocked").off("click");

    let users = await UsersServices.Get("?sort=Name");
    
    if (users === null) {
        logout_AccessChange();
    } else {
        currentETagUsersManager = users.ETag;
        periodic_Refresh_UsersManager_paused = false;
        
        users.data.forEach((user) => {
            if (user.Id !== JSON.parse(SessionStorage.retrieveUser()).Id) {
                renderUserManager(user);
            }
        });
        $("#usersManagerScroll").show();
    }
    $("#usersManagerScroll").scrollTop(currentScrollPosition);


    function GetUser(idUser) {
        let user;
        users.data.forEach((paramUser) => {
            if (paramUser.Id == idUser) {
                user = paramUser;
            }
        });
        return user;
    }

    $(".userAccess").click(async function () {
        periodic_Refresh_UsersManager_paused = true;

        let idUser = $(this).parent().attr('id');
        let user = GetUser(idUser);
        let response = await UsersServices.PromoteUser(user);
        if (UsersServices.currentStatus !== 401) {
            if (currentETagUsersManager != response.ETag) {
                currentETagUsersManager = response.ETag;
                await showUsersManager();
            }  
        } else {
            logout();
        }
        periodic_Refresh_UsersManager_paused = false;
    });

    $(".blockedUnblocked").click(async function () {
        periodic_Refresh_UsersManager_paused = true;

        let idUser = $(this).parent().attr('id');
        let user = GetUser(idUser);

        let response = await UsersServices.BlockUser(user);   
        if (currentETagUsersManager != response.ETag) {
            currentETagUsersManager = response.ETag;
            await showUsersManager();
        } 

        periodic_Refresh_UsersManager_paused = false; 
    });

    $(".deleteUser").click(async function () {
        let idUser = $(this).parent().attr('id');
        let user = GetUser(idUser);
        console.log(user);

        bootbox.confirm(`Voulez-vous vraiment supprimer l'utilisateur ${user.Name} ?`, async (result) => {
            if (result) {
                let response = await UsersServices.RemoveUser(idUser);
            }
        });
    });

    $("#usersManagerScroll").on("scroll", function() {
        currentScrollPosition = $(this).scrollTop();
    });
  
    $(".moreText").click(function () {
    })
}
function renderUserManager(user) {
    if (user != null && user != undefined) {
        let userAuthorizationsImg = "";
        if (user.isAdmin) {
            userAuthorizationsImg = "./Images/admin.png";
        } else if (user.isSuper) {
            userAuthorizationsImg = "./Images/power_user.png";
        } else {
            userAuthorizationsImg = "./Images/user.png";
        }

        let userBlockedOrUnblocked = "";
        let titleUserBlockedOrUnblocked = "";
        if (!user.isAdmin && !user.isSuper) {
            if (user.isBlocked) {
                userBlockedOrUnblocked = "userManagerBlockedIcon fa fa-ban";
                titleUserBlockedOrUnblocked = "Débloquer";
            } else {
                userBlockedOrUnblocked = "userManagerUnblockedIcon fa fa-check-circle";
                titleUserBlockedOrUnblocked = "Bloquer";
            }
        } else {
            userBlockedOrUnblocked = "userManagerBlockedIconNotVisible";
        }

        $("#usersManagerScroll").append(`
            <div class="userManagerContainer">
                <div class="userManagerAvatarName">
                    <div class="UserAvatarXSmall" title="Avatar" style="background-image:url('${user.Avatar}')">
                    </div>
                    <p class="userTextInfos userManagerUsername" title="Nom de l'utilisateur">${user.Name}</p>
                </div>
                <div class="userActionsContainer" id="${user.Id}">
                    <div class="userAccess userManagerIconPermissionUser userAction" style="background-image:url('${userAuthorizationsImg}')" title="User"></div>
                    <span class="${userBlockedOrUnblocked} blockedUnblocked userManagerIcons userAction" title="${titleUserBlockedOrUnblocked}"></span>                                                                                         
                    <span class="deleteUser userManagerTrashIcon userManagerIcons fa fa-trash userAction" title="Effacer l'usager"></span>                                                                                         
                </div>
            </div>    
        `);
    }
}



function getFormData($form) {
    // prevent html injections
    const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
    var jsonObject = {};
    // grab data from all controls
    $.each($form.serializeArray(), (index, control) => {
        jsonObject[control.name] = control.value.replace(removeTag, "");
    });
    return jsonObject;
}

//////////////////////// Accounts management /////////////////////////////////////////////////////////////////
function newAccount() {
    let Account = {};
    Account.Id = 0;
    Account.Email = "";
    Account.Password = "";
    Account.Avatar = "no-avatar.png";
    Account.Name = "";
    Account.Created = "";
    return Account;
}
function showCreateAccountForm() {
    showForm();
    $("#viewTitle").text("Inscription");
    renderAccountForm(`Votre compte à été créé. Veuillez prendre vos courriels pour récupérer votre code de vérification
                           qui vous sera demandé lors de votre prochaine connexion.`);
}
function showModifyAccountForm() {
    showForm();
    $("#viewTitle").text("Modification");
    let account = JSON.parse(SessionStorage.retrieveUser());
    renderAccountForm("", account);
}
function renderAccountForm(message = "", account = null){
    start_Timout_Session();

    let create = account == null;
    if (create){
        account = newAccount();
        $("#hiddenIcon").hide();
    }
    $("#form").empty();
    $("#form").append(`
        <form class="form" id="accountForm">
            <input type="hidden" name="Id" id="Id" value="${account.Id}"/>
                
            <fieldset class="fieldsetAccountForm">
                <label for="Email" class="form-label">Adresse de courriel</label>
                <input 
                    class="form-control"
                    name="Email"
                    id="Email"
                    placeholder="Courriel"
                    required
                    RequireMessage="Veuillez entrer un courriel"
                    CustomErrorMessage="Ce courriel est déjà utilisé"
                    value="${account.Email}"
                />
                <input 
                    class="form-control MatchedInput"
                    matchedInputId="Email"
                    name="EmailVerification"
                    id="EmailVerification"
                    placeholder="Vérification"
                    required
                    RequireMessage="Veuillez entrer une vérification du courriel"
                    CustomErrorMessage="La vérification ne correspond pas"
                    value="${account.Email}"
                />
            </fieldset>
            <fieldset class="fieldsetAccountForm">
            <label for="Password" class="form-label">Mot de passe</label>
            <input 
                type="password"
                class="form-control"
                name="Password" 
                id="Password" 
                placeholder="Mot de passe"
                ${create ? "required" : ""}
                RequireMessage="Veuillez entrer un mot de passe"
            />
            <input 
                type="password"
                class="form-control MatchedInput"
                matchedInputId="Password"
                name="PasswordVerification"
                id="PasswordVerification"
                placeholder="Vérification"
                ${create ? "required" : ""}
                RequireMessage="Veuillez entrer une vérification du mot de passe"
                CustomErrorMessage="La vérification ne correspond pas"
            />
            </fieldset>
            <fieldset class="fieldsetAccountForm">
            <label for="Name" class="form-label">Nom</label>
                <input 
                class="form-control"
                name="Name"
                id="Name"
                placeholder="Nom"
                required
                RequireMessage="Veuillez entrer un nom"
                value="${account.Name}"
            />
            </fieldset>
            <fieldset class="fieldsetAccountForm">
            <label class="form-label">Avatar </label>
            <div class='imageUploaderContainer'>
                <div class='imageUploader' 
                        newImage='${create}'
                        controlId='Avatar' 
                        imageSrc='${account.Avatar}' 
                        waitingImage="Loading_icon.gif">
                </div>
            </div>
            </fieldset>
            <input type="submit" value="Enregistrer" id="saveAccount" class="form-control btn btn-primary" style="margin-bottom: 10px;">
            ${create ? '<input type="button" value="Annuler" id="cancel" class="form-control btn btn-secondary">' :
                 '<input type="button" value="Effacer le compte" id="delete" class="form-control btn btn-warning"></input>'}
        </form>
    `);

    initImageUploaders();
    initFormValidation(); // important do to after all html injection!
    addConflictValidation(UsersServices.HOST_URL() + "/conflict", "Email", "saveAccount");

    $('#accountForm').on("submit", submitForm);
    $("#commit").off();
    $('#commit').on("click", submitForm);
    $('#cancel').on("click", async function () {
        await showPosts();
        stop_Timeout_Session();
    });
    $("#delete").on("click", function(){
        stop_Timeout_Session();
        showDeleteAccountForm();
    });

    async function submitForm(event){
        event.preventDefault();
        let account = getFormData($("#accountForm"));
        if (create)
            account.Creation = Local_to_UTC(Date.now());
        delete account.EmailVerification;
        delete account.PasswordVerification;
        account = await UsersServices.Save(account, create);
        if (!UsersServices.error) {
            if (create)
                showLoginForm(message);
            else{
                if (account.VerifyCode !== "verified" /* Email changed */){
                    UsersServices.Logout(account.Id);
                    showLoginForm(`Votre courriel à été modifié. Veuillez prendre vos courriels pour récupérer votre code de vérification
                           qui vous sera demandé lors de votre prochaine connexion.`);
                }
                else{
                    SessionStorage.storeUser(account);
                    showPosts();
                }
                
            }
        }
        else
            showError("Une erreur est survenue! ", UsersServices.currentHttpError);
    }
}
function showDeleteAccountForm(){
    showForm();
    start_Timout_Session();
    $("#viewTitle").text("Suppression");
    $("#commit").hide();
    $("#hiddenIcon2").show();
    $("#form").empty();
    $("#form").append(`
        <form class="form" id="deleteAccountForm">
            <div class="deleteAccount">Voulez-vous vraiment effacer votre compte?</div> <br>
            <input type="submit" id="deleteAccount" class="form-control btn-danger" value="Effacer mon compte" /> <br>
            <input type="button" value="Annuler" id="cancel" class="form-control btn btn-secondary">
        </form>
    `);

    $('#deleteAccountForm').on("submit", async function(event) {
        event.preventDefault();
        let user = JSON.parse(SessionStorage.retrieveUser());
        await UsersServices.RemoveUser(user.Id);
        if (!UsersServices.error) {
            stop_Timeout_Session();
            UsersServices.Logout(user.Id);
            showPosts();
        }
        else
            showError("Une erreur est survenue! ", UsersServices.currentHttpError);
    });
    $('#cancel').on("click", async function () {
        stop_Timeout_Session();
        await showPosts();
    });
}
function showLoginForm(message = ""){
    showForm();
    $("#viewTitle").text("Connexion");
    renderLoginForm(message);
}
function renderLoginForm(message){
    $("#commit").hide();
    $("#hiddenIcon2").show();
    $("#form").show();
    $("#form").empty();
    $("#form").append(`
        <form class="form" id="loginForm">
                <div  class="topMessage">${message}</div>
            <fieldset>
                <label for="Email" class="form-label">Adresse de courriel</label>
                <input 
                    class="form-control"
                    name="Email"
                    id="Email"
                    placeholder="Courriel"
                    required
                    RequireMessage="Veuillez entrer un courriel"
                    CustomErrorMessage="Ce courriel est déjà utilisé"
                />
                <div class="emailError"></div>
            </fieldset>
            <label for="Password" class="form-label">Mot de passe</label>
            <input 
                type="password"
                class="form-control"
                name="Password" 
                id="Password" 
                placeholder="Mot de passe"
                required
                RequireMessage="Veuillez entrer un mot de passe"
            />
            <div class="passwordError"></div>
            
            <br>
            <input type="submit" value="Enregistrer" id="saveAccount" class="form-control btn btn-primary">
            <hr>
            <input type="button" value="Nouveau Compte" id="newAccount" class="form-control btn btn-info">
        </form>
    `);

    initFormValidation(); // important do to after all html injection!

    $("#loginForm").on("submit", async function(event){
        event.preventDefault();
        let info = getFormData($("#loginForm"));
        let user = SessionStorage.retrieveUser();
        if (user !== null) //Before: if (user !== undefined && user !== "")
            UsersServices.Logout(user.Id);
        let data = await UsersServices.Login(info);
        if (!UsersServices.error) {
            SessionStorage.storeAccessToken(data.Access_token);
            if (data.User.VerifyCode == "verified"){
                SessionStorage.storeUser(data.User);
                await showPosts();
            }
            else{ //User is not verified
                renderVerifyForm(data, "Veuillez entrer le code de vérification que vous avez reçu par courriel");
            }
        }
        else{
            if (UsersServices.currentStatus == 481 /* user not found */)
                $(".emailError").text("Courriel Introuvable");
            else if (UsersServices.currentStatus == 482 /* incorrect password */)
                $(".passwordError").text("Mot de passe incorrect");
            else
                showError("Une erreur est survenue! ", UsersServices.currentHttpError);
        }
    });
    $("#newAccount").on("click", async function() {
        showCreateAccountForm();
    });
}
function renderVerifyForm(data, message = "", messageStyle = ""){
    $("#form").empty();
    $("#form").append(`
        <form class="form" id="verifyForm">
            <input type="hidden" name="Id" id="Id" value="${data.User.Id}"/>
            <div class="topMessage" style="${messageStyle}">${message}</div>
            <br>
            <input 
                type="text"
                class="form-control"
                name="code" 
                id="code" 
                placeholder="Code de vérification"
                required
                RequireMessage="Veuillez entrer un code de vérification"
            />
            <br>
            <input type="submit" value="Vérifier" id="verify" class="form-control btn btn-primary">
        </form>
    `);

    $("#verifyForm").on("submit", async function(event){
        event.preventDefault();
        let info = getFormData($("#verifyForm"));
        let user = await UsersServices.Verify(info);
        if (!UsersServices.error) {
            SessionStorage.storeUser(user);
            await showPosts();
        }
        else{
            if (UsersServices.currentStatus == 480){ //unverified user
                renderVerifyForm("La vérification ne correpond pas.", "color: red;");
            }
            else
                showError("Une erreur est survenue! ", UsersServices.currentHttpError);
        }
    })
}

//Partial refresh - Users manager
function start_Periodic_Refresh_UsersManager() {
    currentETagUsersManager
    setInterval(async () => {
        if (!periodic_Refresh_UsersManager_paused) {
            let etag = await UsersServices.HEAD();

            if (currentETagUsersManager != etag) {
                currentETagUsersManager = etag;
                await showUsersManager();
            }
        }
    },
        periodicRefreshPeriod * 1000);
}

function start_Timout_Session() {
    if (!inProgress && JSON.parse(SessionStorage.retrieveUser()) !== null) {
        timeout();
    }
}

function stop_Timeout_Session() {
    noTimeout();
}