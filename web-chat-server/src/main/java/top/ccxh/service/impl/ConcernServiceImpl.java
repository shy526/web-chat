package top.ccxh.service.impl;

import com.alibaba.fastjson.JSON;
import org.springframework.stereotype.Service;
import top.ccxh.service.ConcernService;
import top.ccxh.spider.BiliBiliMagic;

import javax.websocket.Session;
import java.util.Map;
import java.util.concurrent.LinkedBlockingQueue;

@Service
public class ConcernServiceImpl implements ConcernService {
    @Override
    public void start(final Session session) {
        final LinkedBlockingQueue<Map<String,String>> queue=new LinkedBlockingQueue();
        BiliBiliMagic.start(10,"4548018",new BiliBiliMagic(queue));
      new Thread(new Runnable() {
          @Override
          public void run() {
              Map<String, String> poll = null;
              while (true){
                  try {
                      if (queue.size()>0){
                          poll = queue.take();
                          System.out.println(JSON.toJSONString(poll));
                          Thread.sleep(200);
                          synchronized (session){
                              session.getAsyncRemote().sendText(JSON.toJSONString(poll));
                          }
                      }else {
                          Thread.sleep(1000);
                      }

                  } catch (Exception e) {
                      e.printStackTrace();
                  }
              }
          }
      }).start();
    }
}
