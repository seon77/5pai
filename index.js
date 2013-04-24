var LayoutBuilder = Flowjs.Class({
    extend:Flowjs.Step,
    construct:function(options){
        this.callsuper(options);
    },
    methods:{
        _process:function(data,callback){
            var configCont = $('<div id="config_cont" data-elem-type="cont"/>');
            var css = {
                width:'200px',
                height:'200px',
                position:'fixed',
                bottom:'0',
                right:'0',
                border:'1px solid #eeeeee',
                padding:'10px',
                background:'white',
                opacity:'0.3',
                textAlign:'left'
            };
            configCont.css(css);
            var logCont = $('<div id="log_cont" data-elem-type="cont"/>');
            logCont.css($.extend(css,{
                width:'400px',
                height:'150px',
                left:'0',
                whiteSpace:'nowrap',
                overflow:'hidden',
                overflowY:'auto'
            }));
            var pricelogCont = $('<div id="pricelog_cont" data-elem-type="cont"/>');
            pricelogCont.css($.extend(css,{
                bottom:'190px'
            }));
            $('body').append(configCont);
            $('body').append(logCont);
            $('body').append(pricelogCont);
            var conts = $('div[data-elem-type=cont]');
            conts.mouseenter(function(e){
                $(e.target).css('opacity','0.8');
            });
            conts.mouseleave(function(e){
                $(e.target).css('opacity','0.3');
            });
            callback(null,{configCont:'#config_cont',logCont:'#log_cont',pricelogCont:'#pricelog_cont'});
        },
        _describeData:function(){
            return {
                output:{
                    configCont:{
                        type:'string'
                    },
                    logCont:{
                        type:'string'
                    },
                    pricelogCont:{
                        type:'string'
                    }
                }
            };
        }
    }
});

var ConfigDrawer = Flowjs.Class({
    extend:Flowjs.Step,
    construct:function(options){
        this.callsuper(options);
    },
    methods:{
        _process:function(data,callback){
            var cont = $(data.configCont);

            var userStart = $('<input id="start_time"/>');
            cont.append(userStart);
            userStart.attr('placeholder','user start time');

            var isTrue = $('<input id="is_true" type="checkbox" />');
            isTrue.css('margin-left','20px');
            cont.append(isTrue);
            callback(null,{isTrue:'#is_true',startTime:'#start_time'});
        },
        _describeData:function(){
            return {
                input:{
                    configCont:{
                        type:'string'
                    }
                },
                output:{
                    isTrue:{
                        type:'string'
                    },
                    startTime:{
                        type:'string'
                    }
                }
            };
        }
    }
});

var LogDrawer = Flowjs.Class({
    extend:Flowjs.Step,
    construct:function(options){
        this.callsuper(options);
    },
    methods:{
        _process:function(data,callback){
            var cont = $(data.logCont);
            cont.html('222222');
            callback();
        },
        _describeData:function(){
            return {
                input:{
                    logCont:{
                        type:'string'
                    }
                }
            };
        }
    }
});

var PricelogDrawer = Flowjs.Class({
    extend:Flowjs.Step,
    construct:function(options){
        this.callsuper(options);
    },
    methods:{
        _process:function(data,callback){
            var cont = $(data.pricelogCont);
            cont.html('222222');
            callback();
        },
        _describeData:function(){
            return {
                input:{
                    pricelogCont:{
                        type:'string'
                    }
                }
            };
        }
    }
});

var Flow = Flowjs.Class({
    extend:Flowjs.Flow,
    construct:function(options){
        this.callsuper(options);
    },
    methods:{
        //初始化流程
        start:function(){
            var _this = this;
            var steps = this._steps;
            var layoutBuilder = new steps.LayoutBuilder({description:'Build layout.'});
            var configDrawer = new steps.ConfigDrawer({description:'Draw config face.'});
            var logDrawer = new steps.LogDrawer({description:'Draw log face.'});
            var pricelogDrawer = new steps.PricelogDrawer({description:'Draw price log face.'})
            this.go(layoutBuilder);
            this.go(configDrawer);
            this.go(logDrawer);
            this.go(pricelogDrawer);
        }
    }
});

var flow = new Flow({
    steps:{
        LayoutBuilder:LayoutBuilder,
        ConfigDrawer:ConfigDrawer,
        LogDrawer:LogDrawer,
        PricelogDrawer:PricelogDrawer
    }
});

flow.start();