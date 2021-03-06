var https = require('https')
var url = require('url')
var fs = require('fs')
const concat = require('concat-stream');
var path = require('path')
var baseDirectory = __dirname   // or whatever base directory you want

require('./gamestate');


if((window || global).alert){
  var alert = function(txt){
    console.log(txt);
  }
  if(global){
    global.alert = alert;
  }
}

Class.extend('GameServer',{
  server_ping_delay:5000,
  control_url:null, //communication with webserver is done through this url
  players:null,
  gs:null,
  hooks:null,
  port: null,
  game_id:null,
  process_id:null,
  server_options: null,
  init:function(gameobject, game_id, port,control_url, process_id){

    //setup certificates for TLS
    this.server_options = {
      key: fs.readFileSync('../key.pem'),
      cert: fs.readFileSync('../cert.pem')
    };

    //read the gameobject and create a game state
    this.gs = new GameState(gameobject);

    this.game_id = game_id;
    this.port = port;
    this.control_url = control_url;
    this.process_id = process_id;

    //add players
    //this.gs.addPlayer('mads');
    //this.gs.addPlayer('simon');

    //add hook to update the server on the current phase
    this.gs.currentPhase.addHook('change',function(){
      var data = {phase:this.gs.getCurrentPhaseType(),process_id:process_id};

      //store the settings
      if(this.gs.getCurrentPhaseType() == 'play'){
        data.settings = this.gs.getSettings();
      }

      if(this.gs.getCurrentPhaseType() == 'scoreboard'){
        console.log('scoreboard phase, calculate rank');
        this.gs.calculateRanking();

        data.results = {};
        //update the server with the ranking:
        $.each(this.gs.players._value,function(i,p){
          data.results[i] = p._getResultVars();
        });

      }

      if(!this.control_url){
        console.log('[phase change]no control url, dont use');
        return;
      }


      console.log('phase changed sending to server',this.control_url+'/update');
      $.getJSON(this.control_url+'/update',data,function(r){
        console.log('phase change result')
        //console.log(r);
      }.bind(this)).fail(function(r){
        console.log('phase change update error',r);
      });
    }.bind(this));

    //load the first game phase which will setup hooks

    this.gs.loadPhase(/*default to first*/);

  },
  ping:function(gsuo){
    //mark old GSUO as received and clear it
    //update game state using the Game State Update object
    //add client triggered hooks to queue
    //do the queue
    //send back collapsed GSUO
  },
  r:0,//request count
  handleMessage:function(message,data){
    var res = {};
    res.message = message;
    switch(message){
      case 'join':
        res.status = 'ok';
        console.log('player joined',data);
        this.gs.addPlayer(data);
        res.players = this.gs.players.getObject();
        break;
      case 'exit':
        var p = this.gs.players[data.token];
        if(p){
          res.status = 'ok';
          p.status.set(this.gs.getCurrentPhaseType() == 'scoreboard' ? 'ended' : 'exited');

          //this.gs.removePlayer(p);
        } else {
          res.status = 'error';
          res.error = 'no such player with toke:'+data.token;
          console.log(res.error);
        }
        break;
      default:
        res.status = 'error';
        res.error = 'no such message:'+message;
    }

    return res;
  },
  handlePing:function(data){
    var response_data = {};
    //console.log(data);
    var token = data.token;

    if(!this.gs.players[token]){
      if(!this.control_url){
        this.gs.addPlayer({token:token,name:token});

        console.log('created player with name:'+this.gs.players[token].get('name')._value);
      } else {
        console.log('no such player with token:'+token);
        response_data.res = 'error';
        response_data.error = 'no such player with token:'+token;
        return response_data;
      }
    }


    var player = this.gs.players[token];


    player.last_ping = this.gs.getTime();

    //handle data updates from the player
    if(data.p){
      //console.log('setting player data:',data.p);
      $.each(data.p,function(k,v){
        if(player[k]){
          player[k].set(v);
        } else {
          console.log('cannot set ',k);
        }
      });
      //console.log('game center:',this.gs.vars.center?this.gs.vars.center._value:'not set');
      //player.pos.set(data.p);
    }


    response_data.game_id = this.game_id;
    //apply updates from client
    var that = this;

    //Handl remotely triggered hooks in data
    $.each(data.rt || [],function(i,hd){
      console.log('triggering client hook['+token+' for '+player.get('name')._value+'] with vars',hd.h,hd.v);
      that.gs.triggerClientHook(token,hd.h,hd.v);
    });


    //handle change hooks
    Hookable._handleTriggerQueue();

    response_data.u = this.gs.getFullState();

    return response_data;
  },
  handleRequest:function(request,response){
    //console.log('request:'+request.url);

    var t = new Date().getTime();
    try {

      this.r++;
      var requestUrl = url.parse(request.url,true)
      var m;
      var response_data = {};

      var json_data = requestUrl.search ? decodeURIComponent(requestUrl.search.substr(1)) : '{}';

      var data = JSON.parse(json_data);
      if(m = requestUrl.pathname.match(/^\/message\/(.*)$/)){
        response_data = this.handleMessage(m[1],data);
        console.log('\nmessage handled');
      } else
      if(m = requestUrl.pathname.match(/^\/ping$/)){
        response_data = this.handlePing(data);
      } else {
        throw ('Unknown message:'+requestUrl.pathname);
      }


      //console.log(response_data.u);
      response_data.rt = new Date().getTime() - t;
      response_data.t = t;

      var response_txt = JSON.stringify(response_data);

      response.setHeader('Access-Control-Allow-Origin','*');
      response.setHeader('Content-Type','application/json');
      response.writeHead(200);
      response.write(response_txt);

      response.end();
    } catch(e) {
      console.log(e);
      if(e.message !== undefined)
        console.log(e.message);
      if(e.stack !== undefined)
        console.log(e.stack);

      response.writeHead(500);
      response.end();     // end the response so browsers don't hang
    }
    //console.log('request handled');
  },
  serverPing:function(){
    try{
      if(!this.control_url){
        console.log('[serverping]no control url, dont use');
        return;
      }
      //console.log('sending server ping to:'+this.control_url+'/update'+ ' with process_id:'+this.process_id);


      var players = [];
      var n = this.gs.getTime();
      $.each(this.gs.players._value,function(i,p){
        var t = n - p.last_ping;
        var ping_status = null;
        if(t < 300){
          ping_status = 'good';
        } else
        if(t < 1000){
          ping_status = 'bad';
        } else
        if(t < 5000){
          ping_status = 'lost';
        } else
        if(t < 60000){
          ping_status = 'removed';
          if(p.status._value == 'joined'){
            p.status.set('timeout');
          }

          //this.gs.removePlayer(p);
        }

        var status = p.status._value;

        players.push({
          token:i,
          ping_status:ping_status ,
          status: status,
          last_ping:p.last_ping
        });

        //remove it so that it will not be there the next time
        if(status !== "joined" && this.gs.getCurrentPhaseType() == 'join'){
          this.gs.removePlayer(p);
        }
      }.bind(this));


      $.getJSON(this.control_url+'/update',{
          process_id:this.process_id,
          players: players
        },function(r){
        //console.log('server ping',players);

      }.bind(this)).fail(function(r){
        console.log('server ping error',this.control_url,r);
      }.bind(this)).always(function(){
        setTimeout(this.serverPing.bind(this),this.server_ping_delay);
      }.bind(this));
    } catch(e){
      console.log('exception in server ping:'+e);
    }
  },
  start:function(){
    //fetch initial state

    //use the control url to fetch more info of this game instance
    $.getJSON(this.control_url+'/info',function(data){
      console.log('got info, setting name to:'+data.instance.name);
      this.gs.vars.set('name',data.instance.name);


      this.https = https.createServer(this.server_options,this.handleRequest.bind(this));
      this.https.listen(this.port);

      console.log("listening on port "+this.port);

      //delay the first ping
      setTimeout(this.serverPing.bind(this),this.server_ping_delay);
      //this.serverPing();

    }.bind(this));
    //exit;

    if(!this.control_url){
      console.log('[init] no control url, start directly without info');
      this.serverPing();
      this.https = https.createServer(this.server_options,this.handleRequest.bind(this));
      this.https.listen(this.port)
    }

  }
});
