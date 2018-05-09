/*
用于动态注入指定页面
 */
var websocket = null;
var url = null;
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
document.addEventListener('DOMContentLoaded', function () {
    $(function () {
        initMsg();
    })

})

console.log("被加载")
/**
 * 构建发送框
 */
function initMsg() {
    $("html").append(
        "<div id='ccxh' style=''>" +
        "<input id='ccxhName'type='text' style='width: 89px!important; float:left;'placeholder='昵称'>" +
        "<input id='ccxhMsg'type='text' style='width: 480px!important; float:left;' placeholder='内容'>" +
        "<input type='button' id='ccxhSend' value='未连接' style='width: 102px;height: 38px;line-height: 38px; float:left;cursor: pointer;width: 102px;height: 38px;line-height: 38px;padding: 0;border: 0;background: none;background-color: #38f;font-size: 16px;color: white;box-shadow: none;font-weight: normal;' >" +
        "<input type='button' id='ccxhzoom'  value='<' style='height: 38px;line-height: 38px; float:left;cursor: pointer;width: 20px;height: 38px;line-height: 38px;padding: 0;border: 0;background: none;background-color: #0099e5;font-size: 16px;color: white;box-shadow: none;font-weight: normal;'>" +
        "<input type='hidden' id='ccxhconnects' value='0'>" +
        "</div>");
    $("#ccxh").css({left: 0, position: "fixed", bottom: 0, width: "100%", "z-index": 100});
    $("#ccxhMsg").css({
        width: "521px",
        padding: "9px 7px",
        font: "16px arial",
        border: "1px solid #b8b8b8",
        "border-bottom": "1px solid #ccc",
        "border-right": "0",
        "vertical-align": "top",
        "outline": "none",
        "box-shadow": "none",
    })
    $("#ccxhName").css({
        padding: "9px 7px",
        font: "16px arial",
        border: "1px solid #b8b8b8",
        "border-bottom": "1px solid #ccc",
        "border-right": "0",
        "vertical-align": "top",
        "outline": "none",
        "box-shadow": "none",
    })
    if ($("#ccxh")) {
        injectCustomJs();
    }
}

/**
 * 弹幕发射
 */
function launch(str, css) {
    //获取弹幕生成的位置
    var width = document.documentElement.clientWidth
    var height = lauchu(document.documentElement.clientHeight);
    height = randomxy(80, 20) + Math.random();
    var id = new Date().getTime() + "" + lauchu(100, 0)
    $("body").append("<p id='" + id + "' style='display: none'>" + str + "</p>");
    getKey("colors", function (data) {
        if (css == null) {
            css = {
                position: "fixed",
                bottom: height + "%",
                right: 0,
                "font-size": lauchu(75, 30),
                "z-index": 100,
                color: recoloe(data)
            }
        }
        $("#" + id).css(css)
        $("#" + id).fadeIn();
        var boxWidth = document.getElementById(id).clientWidth;
        getKey("time", function (data1) {
            $("#" + id).animate({
                right: width-boxWidth
            }, parseInt(data1), function () {
                $("#" + id).fadeOut();
                $("#" + id).remove();
            });
        })

    })


}

/**
 * 随机数生成 偏移量 默认15
 * @param value
 * @param offer
 */
function lauchu(value, offer) {
    if (!offer) {
        offer = 15;
    }
    x = value - 15;
    return randomxy(value, offer);
}

/**
 * 随机颜色
 * @returns {string}
 */
function recoloe(data) {
    return data[randomxy(data.length - 1, 0)]
}

/**
 * 生成一个指定范围的随机数
 * @param max
 * @param min
 * @returns {number}
 */
function randomxy(max, min) {
    return parseInt(Math.random() * (max - min + 1) + min);
}

/**
 * 加载插件资源
 * @param jsPath
 */
function injectCustomJs(jsPath) {
    jsPath = jsPath || 'js/inject.js';
    var temp = document.createElement('script');
    temp.setAttribute('type', 'text/javascript');
    temp.setAttribute("charset", "utf-8");
    // 获得的地址类似：chrome-extension://ihcokhadfjfchaeagdoclpnjdiokfakg/js/inject.js
    temp.src = chrome.extension.getURL(jsPath);
    temp.onload = function () {
        // 放在页面不好看，执行完后移除掉
        this.parentNode.removeChild(this);

    };
    document.body.appendChild(temp);
}

/**
 * 消息通讯 与页面脚本通讯
 */
window.addEventListener("message", function (e) {
    if (e.data) {
        try {
            if (e.data.cmd == "invoke") {

            } else if ((e.data.cmd == "message")) {
                chrome.runtime.sendMessage({cmd: "message", data: e.data.data});
            } else if ((e.data.cmd=="connect")) {
                chrome.runtime.sendMessage({cmd: "connect"});
            }
        }
        catch (err) {
            console.info("非法对象:" + e)
        }

    }
}, false);


function save(data) {
    chrome.storage.sync.set(data, function () {

    });
}

function getKey(key, callback) {
    chrome.storage.sync.get(key, function (data) {
        callback(data[key]);
    })
}

function deleteKey(key, callback) {
    chrome.storage.sync.remove(key, function () {
        callback();
    })
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.table(request);
    if (request.cmd == 'connectStatus') {
        //更新状态
        if (request.value == 0) {
            $("#ccxhSend").val("未连接")
            $("#ccxhconnects").val(request.value);
        } else {
            $("#ccxhSend").val("发送")
            $("#ccxhconnects").val(request.value);
        }
    } else if (request.cmd =="message") {
        //消息
        setTimeout(function () {
            if (request.data.type == messageType.login) {
                getKey("userName", function (userName) {
                    if (!userName) {
                        //判断是否设置了默认的用户名
                        userName = request.data.data;
                    }
                    chrome.runtime.sendMessage({cmd: "userNmae", data: userName});
                    $("#ccxhName").val(userName);
                })

            } else if (request.data.type == messageType.broadcast) {
                launch(request.data.data);
            }

        }, 1)
    }else if(request.cmd=="setUserName"){
        $("#ccxhName").val(request.value);
    }
    sendResponse("ack");
});