package top.ccxh.spider;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import us.codecraft.webmagic.Page;
import us.codecraft.webmagic.Request;
import us.codecraft.webmagic.Site;
import us.codecraft.webmagic.Spider;
import us.codecraft.webmagic.processor.PageProcessor;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Pattern;

public class BiliBiliMagic  implements PageProcessor {
    private Logger log = LoggerFactory.getLogger(getClass());
    private Site site = Site.me().setRetryTimes(3).setSleepTime(100)
            .addHeader("User-Agent","Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3414.0 Safari/537.36");
    private static  String url="http://api.bilibili.com/x/relation/followings?vmid=%s&pn=%s&ps=20&order=desc";
    private final static Pattern pageSize = Pattern.compile("pn=(\\w+)");
    private final LinkedBlockingQueue<Map<String,String>> queue;
    public  BiliBiliMagic(LinkedBlockingQueue<Map<String,String>> queue){
        this.queue=queue;
    }
    public static  AtomicInteger x=new AtomicInteger(0);
    //最大深度
    private final static int maxDepth=3;
    @Override
    public void process(Page page) {
        x.addAndGet(1);
        String rawText = page.getRawText();
        JSONObject jsonObject = JSON.parseObject(rawText);
        JSONArray list = jsonObject.getJSONObject("data").getJSONArray("list");
        if (list.isEmpty()) return;
        Request request = page.getRequest();
        Iterator<Object> iterator = list.iterator();
        while (iterator.hasNext()){

            JSONObject next = (JSONObject)iterator.next();
            //用户名
            String uname = next.getString("uname");
            //头像
         /*   String face = next.getString("face");*/
            //id
            String mid = next.getString("mid");
            int index = (int) request.getExtra("index");
            index++;
             Request request1 =new Request(String.format(url,mid,1));
            HashMap<String, Object> ex = new HashMap<>();
            ex.put("index",index );
            ex.put("pageSize",1);
            ex.put("myid",mid);
            ex.put("tname",uname);
            request1.setExtras(ex);
            page.addTargetRequest(request1);
            Map<String,String> map=new HashMap<>();
            map.put("target", (String)request.getExtra("myid"));
            map.put("tname", (String)request.getExtra("tname"));
            map.put("source",mid);
            map.put("sname",uname);
            queue.offer(map);
            if (index>maxDepth) return;
        }
        //自己增长
        Map<String, Object> extras = request.getExtras();
        int pageSize = (int) request.getExtra("pageSize");
        pageSize++;
        extras.put("pageSize",pageSize);
        String myurl = String.format(url, (String) request.getExtra("myid"), pageSize);
        Request request1 =new Request(myurl);
        request1.setExtras(extras);
        page.addTargetRequest(request1);

    }

    @Override
    public Site getSite() {
        return site;
    }
    public static void main(String[] args) {

        System.out.println("x = " + x);

    }
    private void ss(int i){
        System.out.println("i = " + i);
    }

    public static void start(int thread,String id,PageProcessor object){
        Spider spider = Spider.create(object);
        Request request =new Request(String.format(url,id,1));
        HashMap<String, Object> ex = new HashMap<>();
        ex.put("index", 0);
        ex.put("pageSize",1);
        ex.put("myid","4548018");
        ex.put("tname","扎双马尾的丧尸");
        request.setExtras(ex);
        spider.addRequest(request).thread(thread).start();
    }
}
