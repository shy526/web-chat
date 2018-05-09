var messageType = {
    /*发送消息*/
    message: 1,
    /*登录*/
    login: 2,
    /*广播消息*/
    broadcast: 3,
    /*登出*/
    logout: 4
}
var origin = null;
document.getElementById("ccxhzoom").onclick = function () {
    var x = document.getElementById("ccxhzoom").value
    if (x == "<") {
        display("ccxhName", "none");
        display("ccxhMsg", "none");
        display("ccxhSend", "none");
        document.getElementById("ccxhzoom").value = ">"
    } else {
        display("ccxhName", "");
        display("ccxhMsg", "");
        display("ccxhSend", "");
        document.getElementById("ccxhzoom").value = "<"
    }
}

document.getElementById("ccxhSend").onclick = function () {
    var value = document.getElementById("ccxhconnects").value;
    if (value > 0) {
        var user = document.getElementById("ccxhName").value.trim();
        var msg = document.getElementById("ccxhMsg").value.trim();
        if (!user) {
            alert("用户名不能为空");
            return;
        }
        if (!msg) {
            alert("消息不能为空");
            return;
        }
        window.postMessage({cmd: "message", data: {user: user, msg: msg}},"*")

    } else {
        window.postMessage({cmd: "connect"}, "*");
    }
}

function display(id, zt) {
    document.getElementById(id).style.display = zt
}

