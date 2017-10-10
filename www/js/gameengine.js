var http = require('http')
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
  control_url:null, //communication with webserver is done through this url
  players:null,
  gs:null,
  hooks:null,
  port: null,
  game_id:null,
  process_id:null,
  init:function(gameobject, game_id, port,control_url, process_id){
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
      console.log('phase changed sending to server',this.control_url);
      $.getJSON(this.control_url,{phase:this.gs.currentPhase._value._name,process_id:process_id},function(r){
        console.log('phase change result')
        console.log(r);
      }.bind(this)).fail(function(r){
        console.log('error',r);
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
        console.log('adding player',data);
        this.gs.addPlayer(data);
        res.players = this.gs.players.getObject();
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
      console.log('no such player with token:'+token);
      response_data.res = 'error';
      response_data.error = 'no such player with token:'+token;
      return response_data;
    }

    var player = this.gs.players[token];

    player.last_ping = this.gs.getTime();

    //handle data updates from the player
    if(data.p){
      //console.log('setting player pos:',data.p);
      player.pos.set(data.p);
    }


    response_data.game_id = this.game_id;
    //apply updates from client
    var that = this;

    //Handl remotely triggered hooks in data
    $.each(data.rt || [],function(i,hd){
      console.log('triggering client hook['+token+'] with vars',hd.h,hd.v);
      that.gs.triggerClientHook(token,hd.h,hd.v);
    });


    //handle change hooks
    Hookable._handleTriggerQueue();

    response_data.u = this.gs.getFullState();

    return response_data;
  },
  handleRequest:function(request,response){
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

      response.writeHead(500)
      response.end()     // end the response so browsers don't hang
    }
  },
  serverPing:function(){
    console.log('sending server ping to:'+this.control_url+ ' with process_id:'+this.process_id);

    var players = [];
    var n = this.gs.getTime();
    $.each(this.gs.players._value,function(i,p){
      var t = p.last_ping - n;
      var status = null;
      if(t < 300){
        status = 'good';
      } else
      if(t < 1000){
        status = 'bad';
      } else
      if(t < 5000){
        status = 'lost';
      } else
      if(t < 60000){
        status = 'removed';
        this.gs.removePlayer(p);
      }

      players.push({
        token:i,
        status:status ,
        last_ping:p.last_ping
      });
    }.bind(this));

    $.getJSON(this.control_url,{
        process_id:this.process_id,
        players: players
      },function(r){
      console.log('server ping',players);

    }.bind(this)).fail(function(r){
      console.log('server ping error',this.control_url,r);
    }.bind(this)).always(function(){
      setTimeout(this.serverPing.bind(this),5000);
    }.bind(this));

  },
  start:function(){
    this.serverPing();
    this.http = http.createServer(this.handleRequest.bind(this));
    this.http.listen(this.port)

    console.log("listening on port "+this.port);
  }
});
