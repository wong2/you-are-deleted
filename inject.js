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
            notify(lost_friends);
        }
    }
    localStorage[user_id] = JSON.stringify(new_list);
}

function notify(lost_friends) {
    var html = [];
    var div = document.createElement("div");
    div.className = "xnr_op2";
    div.id = "notify_close";
    div.style.left = (window.screen.width/2-250)+"px";
    div.style.top = "200px";
    document.body.appendChild(div);
    html.push('<div class="title">被刪提醒</div><div class="options">' + '<div class="lost_head"> 很不幸的通知你，你失去了以下好友： </div><div class="friends">');
    for (var i = lost_friends.length; i--;) {
        var friend = lost_friends[i];
        var name = friend.name,
            uid = friend.id,
            img = friend.head;
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

var last_check_time = parseInt(localStorage.last_check_time),
    new_time = (new Date).getTime();

if(isNaN(last_check_time) || (new_time-last_check_time)/60000 >= 5){
    localStorage.last_check_time = new_time;
	chrome.extension.sendRequest({call: "getUserId"}, function(response) {
        var user_id = JSON.parse(response.result)["hostid"];
		chrome.extension.sendRequest({call: "getFriends"}, function(response) {
			var friends = JSON.parse(response.result)["candidate"];
			getLostFriends(friends, user_id);
		});
	});
}
