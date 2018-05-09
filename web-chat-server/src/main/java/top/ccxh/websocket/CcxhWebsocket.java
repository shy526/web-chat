package top.ccxh.websocket;

import com.alibaba.fastjson.JSON;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.context.ContextLoader;
import top.ccxh.api.service.ConcernService;
import top.ccxh.websocket.message.MessageType;
import top.ccxh.websocket.message.ResultMessage;

import javax.websocket.*;
import javax.websocket.server.ServerEndpoint;
import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

/**
 * @author honey
 */
@Service
//该注解表示该类被声明为一个webSocket终端
@ServerEndpoint("/websocket")
public class CcxhWebsocket {
    private static ConcernService concernService;
    private static final Logger logger= LoggerFactory.getLogger(CcxhWebsocket.class);
    private final static ConcurrentHashMap<String,BaseChatRoom> chartoom=new ConcurrentHashMap<>();
    @Autowired
    public void getConcenService(ConcernService concernService){
        CcxhWebsocket.concernService=concernService;
    }
    @OnOpen
    public void onOpen( Session session){
        String queryString=geturl(session);
        if (queryString.equals("t")){
            concernService.start(session);
            return;
        };
        BaseChatRoom baseChatRoom = chartoom.get(queryString);
        if (baseChatRoom == null) {
            baseChatRoom=new BaseChatRoom(queryString);
            chartoom.put(queryString,baseChatRoom);
        }
        baseChatRoom.addUser(session.getId(),session);

        ResultMessage resultMessage=new ResultMessage();
        resultMessage.setSource("System");
        resultMessage.setType(MessageType.login.getType());
        resultMessage.setData(session.getId());
        //返回用户名
        baseChatRoom.sedmessage(session,resultMessage);
        logger.info("聊天室URL:{},加入一位成员:{},共有:{}",queryString,session.getId(),baseChatRoom.getCount());
    }

    @OnMessage
    public void onMessage(String message,Session session) throws IOException {
        ResultMessage resultMessage = JSON.parseObject(message, ResultMessage.class);
        logger.info("消息:{}",resultMessage);
        if (resultMessage.getType()==MessageType.message.getType()){
            BaseChatRoom baseChatRoom = chartoom.get(resultMessage.getTarget());
            if (baseChatRoom == null) {
                logger.info("非法连接");
                session.close();
            }else {
                resultMessage.setType(MessageType.broadcast.getType());
                baseChatRoom.broadcast(resultMessage);
            }
        }else if (resultMessage.getType()==MessageType.login.getType()){
            BaseChatRoom baseChatRoom = chartoom.get(resultMessage.getTarget());
            if (baseChatRoom != null) {
                resultMessage.setType(MessageType.broadcast.getType());
                resultMessage.setData("欢迎".concat(resultMessage.getData()).concat("加入"));
                baseChatRoom.broadcast(resultMessage);
            }else{
                logger.info("非法连接");
                session.close();
            }
        }
    }
    @OnClose
    public void onClose(Session session) {
        String queryString=geturl(session);
        BaseChatRoom baseChatRoom = chartoom.get(queryString);
        if (baseChatRoom!=null){
            baseChatRoom.removeUser(session);
            if(baseChatRoom.getCount()<=0){
                chartoom.remove(queryString);
                logger.info("id:{},退出房间", session.getId());
                logger.info("删除聊天室:{}", baseChatRoom.getUrl());
            }
        }else {
            try {
                session.close();
            } catch (IOException e) {

            }finally {
                session=null;
                logger.info("id:{},非法连接", session.getId());
            }

        }

    }

    @OnError
    public void onError(Session session, Throwable error) {
        String queryString=geturl(session);
        BaseChatRoom baseChatRoom = chartoom.get(queryString);
        error.printStackTrace();
        logger.error("error:{}",session.getId());
        if (baseChatRoom!=null){
            baseChatRoom.removeUser(session);
            if(baseChatRoom.getCount()<=0){
                chartoom.remove(queryString);
                logger.info("发生错误,删除里聊天室:{}", baseChatRoom.getUrl());
            }else{
                logger.info("发生错误,聊天室剩余:{}", baseChatRoom.getCount());
            }
        }else {
            logger.info("发生错误,聊天室已经关闭:{}", baseChatRoom.getCount());
        }
    }
    private String geturl(Session session){
        String queryString = session.getQueryString();
        //去掉参数
        if (queryString.lastIndexOf("?")==-1){
            queryString = queryString.substring(4);
        }else {
            queryString = queryString.substring(4,queryString.lastIndexOf("?"));
        }
        return queryString;
    }
}
