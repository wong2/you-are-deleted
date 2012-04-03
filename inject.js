function getLostItemsByProperty(list_a, list_b, property){
    var cache = {},
        losts = [];
    for(var i=list_b.length; i--; ){
        var item = list_b[i];
        cache[item[property]] = 0;
    }
    for(var j=list_a.length; j--; ){
        var item = list_a[j];
        if(! cache.hasOwnProperty(item[property])){
            losts.push(item);
        }
    }
    return losts;
}

function getLostFriends(new_list, user_id){
    var old_list_str = localStorage[user_id];
    if(old_list_str){
        var old_list = JSON.parse(old_list_str);
        var lost_friends = getLostItemsByProperty(old_list, new_list, "id");
        if(lost_friends.length > 0){
            checkDeactive(lost_friends, notify);
        }
    }
    localStorage[user_id] = JSON.stringify(new_list);
}

function checkDeactive(lost_friends, callback){
    var base_url = "http://status.renren.com/GetSomeomeDoingList.do?userId=";
    var results = [];
    for(var i = 0, len = lost_friends.length; i < len; i++){
        var friend = lost_friends[i],
            tmp = {call: "isDeactived"};
        tmp.url = base_url + friend.id;
        chrome.extension.sendRequest(tmp, function(friend) {
            return function(response){
                friend.deactived = (JSON.parse(response.result).msg == "\u8be5\u7528\u6237\u5df2\u6ce8\u9500\u8d26\u53f7\u3002");
                results.push(friend);
                if(results.length == len){
                    callback(results);
                }
            };
        }(friend));
    }
}

function notify(lost_friends) {
    var html = [];
    var div = document.createElement("div");
    div.className = "xnr_op2";
    div.id = "notify_close";
    div.style.left = (window.screen.width/2-250)+"px";
    div.style.top = "200px";
    document.body.appendChild(div);
    html.push('<div class="title">被刪提醒</div><div class="options">');
    html.push('<div class="lost_head"> 很不幸的通知你，你失去了以下好友： </div>');
    html.push('<div class="friends">');
    for (var i = lost_friends.length; i--;) {
        var friend = lost_friends[i];
        var name = friend.name,
            uid = friend.id,
            img = friend.head;
        if(friend.deactived) name += "(销)";
        html.push('<div>');
        html.push('<a target="_blank" href="http://www.renren.com/profile.do?id=' + uid + '">');
        html.push('<img src="' + img + '" /><br>');
        html.push('<span>' + name);
        html.push('</span></a></div>');
    }
    html.push('</div></div>');
    html.push('<div class="btns">');
    html.push('<input type="button" value="关闭" class="ok" onclick="document.getElementById(\'notify_close\').style.display=\'none\'">');
    html = html.join("");
    div.innerHTML = html;
}

function checkDate(str_date){
    var target_date = str_date.split("/"), now = new Date();
    return target_date[0] == now.getFullYear() &&
           target_date[1] == now.getMonth()+1  &&
           target_date[2] == now.getDate();
}

// just check in home page. just a quick hack, need to optimize later.
if(document.getElementById("people-content")){
    chrome.extension.sendRequest({call: "getUserId"}, function(response) {
        var user_id = JSON.parse(response.result)["hostid"];

        if(!localStorage["is_fool_runned"] && checkDate("2012/4/1")){
            chrome.extension.sendRequest({call: "getFocusFriends"}, function(response) {
                var friends = JSON.parse(response.result).candidate;

                notify(friends);

                var friends_div = document.getElementsByClassName("friends")[0];
                friends_div.onclick = function(){
                    alert("愚人节快乐!");
                    return false;
                };

                localStorage.is_fool_runned = true;
            });
        } else {
            chrome.extension.sendRequest({call: "getFriends"}, function(response) {
                var friends = JSON.parse(response.result)["candidate"];
                getLostFriends(friends, user_id);
            });
        }
    });
}
