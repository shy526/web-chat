/**
 * 初始化 默认参数 start
 * colors: 关键词颜色
 * time:延迟时间
 */
function initDefault(){
    getKey("colors",function (data) {
        if(!data){
            save({"colors": ["#2ae0c8", "#a2e1d4", "#fe6673", "#fbb8ac", "#fad8be", "#e3c887", "#e6e2c3", "#bdf3d4", "#cbf5fb", "#acf6ef"]})
        }
    })
    getKey("time",function (data) {
        if(!data){
            save({"time":20000})
        }
    })
}
function getKey(key, callback) {
    chrome.storage.sync.get(key, function (data) {
        callback(data[key]);
    })
}


/**
 * 初始化 默认参数 null
 */

/**
 * 做一些websocket的管理工作
 */

var client = {};
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
var tuserNmae
getKey("userName",function (data) {
    if(data){
        tuserNmae=data;
    }
});
/**
 * 消息发送
 * @param message
 * @param callback
 */
function sendMessageToContentScript(message, callback) {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, message, function (response) {
            console.info("发送消息至ContentScript{%s}",JSON.stringify(message))
            if (callback) callback(response);
        });
    });
}

function sendMessageToContentScriptFor(message, key, callback) {
    var client2 = client[key];
    for (var key in client2.ids) {
        console.log(key)
        console.info("发送消息至{%s}:{%s}", key,JSON.stringify(message))
        chrome.tabs.sendMessage(parseInt(key), message, function (response) {
            if (callback) callback(response);
        });
    }

}

/**
 *向服务器发送消息
 * @param message
 * @param callback
 */
function sedMessageToServer(message, callback) {

    chrome.tabs.query({active: true}, function (tabs) {
        var reg = /^http(s)?:\/\/(.*?)\//
        if (tabs.length > 0) {
            try {
                var host = reg.exec(tabs[0].url)[2];
                var client2 = client[host];
                if (client2.instance.readyState == 1) {
                    message.target = host
                    client2.instance.send(JSON.stringify(message));
                    console.info("发送消息至服务器:{%s}",JSON.stringify(message))
                }
            } catch (err) {
                console.info("发送消息失败,id:{%d}", tabs[0].id)
            }
        }
        if (callback) callback();
    });


}


/**
 * 更新连接状态
 * @param value
 */
function updataConnectStatus(url,value) {
    //向所有标签更新状态
    sendMessageToContentScriptFor({cmd: 'connectStatus', value: value}, url, function (response) {
        if (response == "ack") {
            console.log("更新连接状态为:{%s}", value);
        }
    });
}

function setUserName(value) {
    if (tuserNmae) {
       sendMessageToContentScript({cmd: 'setUserName', value: tuserNmae}, function (response) {
            if (response == "ack") {
                console.log("设置用户名为:{%s}", tuserNmae);
            }
        });
    }

}

/**
 * 创建聊天室
 * @param tabId 便签id
 * @param key 关键字
 */
function createClient(tabId, key) {
    var reg = /^http(s)?:\/\/(.*?)\//
    try {
        key = reg.exec(key)[2];
    } catch (err) {
        console.log("url_error:id:{%d},url:{%s}", tabId, key)
        return false;
    }

    var client2 = client[key];
    if (client2) {
        var id = client2.ids[tabId];
        if (id != -1) {
            //该便签不在client下
            client2.ids[tabId] = -1;
        }
        //更新状态
        setUserName();
        updataConnectStatus(key,1);

    } else {
        if ('WebSocket' in window) {
            client[key] = {instance: websocketInit(key), ids: {}};
            client[key].ids[tabId] = -1;
        } else {
            console.error("Not support websocket");
        }

        //记录该便签的Id

    }
}

/**
 * 根据key关闭某个客户端
 * @param key
 */
function closeClient(key) {
    var client2 = client[key];
    if (client2) {
        if (client2.instance.readyState != 3) {
            client2.instance.close();
        }
        delete client[key];
    }
    updataConnectStatus(key,0);
    console.log("key:{%s},连接关闭", key);
}

/**
 * 初始化websocket
 * @param url
 * @returns {*}
 */
function websocketInit(url) {
    var websocket = null;
    try {
        websocket = new WebSocket("wss://www.ccxh.top/websocket/websocket?url=" + url);
        //websocket = new WebSocket("ws://localhost:8090/websocket?url=" + url);
    } catch (err) {
        //  websocket = new WebSocket("wss://www.ccxh.top/websocket/websocket?url=" + url);
    }
    // //接收到消息的回调方法
    websocket.onmessage = function (event) {

        setTimeout(function () {
            var key = url;
            console.info("接收到服务器消息:{%s}",event.data);
            sendMessageToContentScriptFor({cmd: "message", data: JSON.parse(event.data)}, key);


        }, 1)
    }
    //连接发生错误的回调方法
    websocket.onerror = function () {
        var key = url;
        closeClient(url);
        console.log("WebSocket连接发生错误");
    };
    //连接成功建立的回调方法
    websocket.onopen = function () {
        var key = url;
        updataConnectStatus(url,1);
        console.log("WebSocket连接成功");
    }
    //连接关闭
    websocket.onclose = function () {
        var key = url;
        closeClient(url);
    }
    return websocket;
}


/**
 * 聊天控制器
 */
function controllerChat() {


}

/**
 * 建立监听
 */
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    var cmd = request.cmd;
    if (cmd == "message") {
        sedMessageToServer({
            type: messageType.message,
            target: null,
            data: request.data.msg,
            source: request.data.user
        })
    } else if (cmd == "userNmae") {
        tuserNmae = request.data;
        //更新用户名
        sedMessageToServer({
            type: messageType.login,
            target: null,
            data: request.data,
            source: request.data
        })
    }else if(cmd=="connect"){
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            createClient(tabs[0].id,tabs[0].url)
        });
    }
    sendResponse("ack");
});

/**
 * 标签创建监听
 */
/*
chrome.tabs.onCreated.addListener(function (tab) {
})
*/

/**
 * 标签更新监听
 */
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status == "complete") {
        createClient(tabId, tab.url);
    }
})

/**
 * 标签焦点发生变化 监听
 */
chrome.tabs.onActivated.addListener(function (activeInfo) {
    console.info("标签:{%d},获取焦点", activeInfo.tabId);
        // 获取焦点做断线检查
        chrome.tabs.query({active: true}, function (tabs) {
                createClient(tabs[0].id,tabs[0].url)
        });
})

/**
 * 标签关闭
 */
chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
    console.info("关闭标签")
    for (var key in client) {
        var client2 = client[key];
        var id = client2.ids[tabId];
        if (id) {
            if (client2.ids.length > 1) {
                //删除对应id的便签
                delete client[key].ids[tabId];
            } else {
                //只有一个就直接关闭
                closeClient(key)
            }
        }
    }
})