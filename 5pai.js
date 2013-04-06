// var w=new Worker(chrome.extension.getURL("timer.js"));
// w.onmessage=function(event){
// console.log(event.data);
// };

var wrapper = document.createElement('div');
wrapper.style.width = '200px';
wrapper.style.height = '200px';
wrapper.style.position = 'fixed';
wrapper.style.bottom = '0';
wrapper.style.right = '0';
wrapper.style.padding = '10px';
wrapper.style.opacity = '0.3';
wrapper.style.background = 'white';
wrapper.style.border = '1px solid #eeeeee';
document.body.appendChild(wrapper);
wrapper.onmouseover = function(){
    wrapper.style.opacity = '0.8';
}
wrapper.onmouseout = function(){
    wrapper.style.opacity = '0.3';
}

var priceStart = 0;
var real = false;
var maxTimes = 1000;

var info = document.createElement('div');
wrapper.appendChild(info);



var priceStartElem = document.createElement('input');
info.appendChild(priceStartElem);
priceStartElem.placeholder = 'start price';
priceStartElem.onblur = function(){
    priceStart = parseFloat(priceStartElem.value || 0);
    updateConfig();
}

var maxTimesElem = document.createElement('input');
maxTimesElem.placeholder = 'max times';
info.appendChild(maxTimesElem);
maxTimesElem.onblur = function(){
    maxTimes = parseInt(maxTimesElem.value || 1000);
    updateConfig();
}

var userStartTime = 0;
var userStartTimeElem = document.createElement('input');
info.appendChild(userStartTimeElem);
userStartTimeElem.placeholder = 'user start time';
userStartTimeElem.onblur = function(){
    userStartTime = parseInt(userStartTimeElem.value || 0);
    updateConfig();
}

var isTrueElem = document.createElement('input');
info.appendChild(isTrueElem);
isTrueElem.type = 'checkbox';
isTrueElem.onclick = function(){
    real = isTrueElem.checked;
    updateConfig();
}

var result = document.createElement('div');
wrapper.appendChild(result);

var logElem = document.createElement('div');
logElem.style.width = '400px';
logElem.style.height = '300px';
logElem.style.position = 'fixed';
logElem.style.bottom = '0';
logElem.style.left = '0';
logElem.style.padding = '10px';
logElem.style.background = 'white';
logElem.style.opacity = '0.3';
logElem.style.border = '1px solid #eeeeee';
logElem.style.whiteSpace = 'nowrap';
logElem.style.overflow = 'hidden';
logElem.style.overflowY = 'auto';
document.body.appendChild(logElem);
logElem.onmouseover = function(){
    logElem.style.opacity = '0.8';
}
logElem.onmouseout = function(){
    logElem.style.opacity = '0.3';
}

try{
    var pid = $('#ProductId').val() || $('.ni_tbtn')[0].outerHTML.match(/M.bid\((\d+)\)/)[1];
}catch(e){
    var pid = ($('.dirbuy')[0] || $('.disbuy')[0]).href.match(/\d+$/)[0];
}
$('.ni_tbold1').on('click',function(){
    window.open('http://jsmsg.video.qiyi.com/5/daemon/info?pid=' + pid);
});
var user = $('a[href="http://user.5pai.com/"]').html();
var pkey = 'p' + pid;
var dkey = 'd' + pid;
var priceTimes = 0;
var sPriceTimes = localStorage.getItem(pkey);
var sDeal = localStorage.getItem(dkey);
if(sPriceTimes){
    priceTimes = parseInt(sPriceTimes);
}
var html = [
    'Make price : ' + sPriceTimes + ' times',
    'Deal price : ' + sDeal
];
result.innerHTML = (html.join('<br/>'));
var timeStarts = {
    '1':3000,
    '2':500,
    '3':500,
    '4':500,
    '5':500
};
var id = pid;
var priceElem = $('.n_m');
priceElem.on('click',function(){
    window.open('http://jsmsg.video.qiyi.com/5/daemon/info?pid=' + id);
});
var timeElem = $('#n_t');
var userElem = $('.ni_tright a.n_u');
var avgDelay = 150;
var timeout = 200;
function send(cb,err){
    $.ajax({
        url: 'http://c.5pai.com/BidAction.aspx',
        data: { "id": id },
        type: "get",
        dataType: "html",
        cache: false,
        success:cb,
        error:err,
        timeout:timeout
    });
}
$('.logo').on('click',function(){
    window.webkitNotifications.requestPermission();
});
var currPrice,priceTimes = 0;
var maxRetry = 2,retry = 0;
function getUserNum(){
    var users = $('#BidRightDiv').find('.noreturn');
    var userNames = [];
    if(users){
        users.each(function(i,userName){
            userName = userName.innerHTML;
            if(userNames.indexOf(userName) == -1 && i < 5 && userName != user){
                userNames.push(userName);
            }
        });
    }
    return userNames.length;
}
var logs = [];
var lastCountdown = 0;
function log(s){
    if(logs.last){
        var delay = Date.now() - logs.last;
    }
    logs.last = Date.now();
    setTimeout(function(){
        if(logs.length > 1000){
            logs.splice(0,1);
        }
        logs.push('[' + (delay || 0) + ']' + s);
        logElem.innerHTML = logs.join('<br/>');
        logElem.scrollTop = 100000;
    },0);
}
$('[ac=__history]').click();
var delay = 0,delay2 = 0;

var currOwener;

var noticeOnce = {};

var maxQueryRetry = 3,queryRetry = 0;

function notice(t,b,once){
    if(once && notice[t + b]){
        return;
    }
    notice[t + b] = 1;
    var notification = window.webkitNotifications.createNotification(
      '',  // icon url - can be relative
      t,  // notification title
      b
    );
    notification.show();
}
var sendPrice = function(){
    var d1 = Date.now();
    log('Price start.');
    send(function(s){
        var d2 = Date.now();
        delay2 = d2 - d1;
        if(s == '{Code:1,Detail:\'点拍成功\'}' || s == '{Code:0,Detail:\'您暂时不用再次出价：您是当前出价人。\'}'){
            retry = 0;
            log('<span style="color:green">Price delay : ' + delay2 + '</span>');
            // setTimeout(check,0);
        }
        else{
            retry++;
            if(retry < maxRetry){
                notice('出价失败',s);
                sendPrice();
            }
            else{
                notice('出价失败超过重试次数',s);
            }
        }
    },function(){
        log('<span style="color:red">Price timeout.</span>');
        sendPrice();
    });
};
var timeStart;
function updateConfig(){
    var html = [
        'Is real:' + real,
        'Start price:' + priceStart,
        'Max times:' + maxTimes,
        'Start time:' + (userStartTime || timeStart)
    ];
    result.innerHTML = (html.join('<br/>'));
}
function check(){
    log('Begin to check.');
    var ended = timeElem.html() == '已结束';
    if(ended){
        try{
            notice('竞拍结束!','已出价' + priceTimes + '次，当前价格：' + currPrice);
        }
        catch(e){}
    }
    else if(priceTimes >= maxTimes){
        try{
            notice('超出限额','已出价' + priceTimes + '次，当前价格：' + currPrice);
        }
        catch(e){}
    }
    else{
        if(priceElem.length > 0 && !isNaN(priceStart) && user){
            var d1 = Date.now();
            $.ajax({
                url:'http://bid.5pai.com/pull/i1',
                data:{
                    id:id,
                    x:'0',
                    _:Date.now()
                },
                type:'get',
                dataType:'html',
                cache:false,
                timeout:timeout,
                error:function(){
                    log('<span style="color:red">Query timeout.</span>');
                    queryRetry++;
                    if(queryRetry >= maxQueryRetry){
                        if(real){
                            for(var i = 0; i < 5; i++)
                                sendPrice();
                            check();
                        }
                        else{
                            check();
                        }
                    }
                    else{
                        check();
                    }
                },
                success:function(s){
                    queryRetry = 0;
                    d2 = Date.now();
                    delay = d2 - d1;
                    var data = s.match(/^P.*?a:([\d\.]+).*?c:'(.*?)'.*?e:(\d+).*?SS:(\d+)$/);
                    if(data){
                        currPrice = parseFloat(data[1]);
                        var currUser = decodeURIComponent(data[2]);
                        var countdown = parseInt(data[3]);
                        //真正的剩余时间，用服务器返回的剩余时间 - 本次请求的delay - 平均网络延迟，保证在正常网络状态下，发出的请求足够在到期之前到达服务端
                        var realCountdown = countdown - delay;
                        // log('>>>>>' + countdown + '|' + delay);
                        lastCountdown = countdown;
                        var userNum = getUserNum();
                        if(userNum == 0){
                            // notice('发生错误','产品' + id + '用户数为0');
                        }
                        timeStart = timeStarts[userNum] || 1500;
                        if(userStartTime > 0){
                            timeStart = userStartTime;
                        }
                        if(currOwener != currUser){
                            currOwener = currUser;
                        }
                        log('Query data : ' + delay + ' | ' + currUser + ' | ' + countdown + ' | ' + timeStart);
                        localStorage.setItem(dkey,currPrice);
                        
                        if(realCountdown < timeStart && currPrice > priceStart && user != currUser){
                            priceTimes++;
                            userElem.html(user);
                            if(real){
                                for(var i = 0; i < 5; i++)
                                    sendPrice();
                                check();
                            }
                            else{
                                userElem.html(user);
                                log('<span style="color:green">Virtual price.</span>')
                                setTimeout(check,realCountdown);
                            }
                            localStorage.setItem(pkey,priceTimes);
                        }
                        else{
                            log('Will check again in ' + (realCountdown - timeStart));
                            setTimeout(check,realCountdown - timeStart);
                        }
                        updateConfig();
                        document.title = (real ? '!' : '') + priceTimes + ' , ' + currPrice + ' , ' + userNum;
                    }
                    else{
                        log('Query data is null');
                        check();
                    }
                }
            });
        }
    }
}
check();