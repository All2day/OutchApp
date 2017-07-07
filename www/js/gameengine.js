var http = require('http')
var url = require('url')
var fs = require('fs')
const concat = require('concat-stream');
var path = require('path')
var baseDirectory = __dirname   // or whatever base directory you want

require('./gamestate');


Class.extend('GameServer',{
  players:null,
  gs:null,
  hooks:null,
  port: 9615,
  init:function(gameobject){
    //read the gameobject and create a game state
    this.gs = new GameState(gameobject);

    //add players
    this.gs.addPlayer('mads');
    this.gs.addPlayer('simon');

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
  handleRequest:function(request,response){

    try {
      var t = new Date().getTime();
      this.r++;
      var requestUrl = url.parse(request.url,true)
      //console.log(this.gs.phases.play.vars.revenge_amount._value);
      var test_var = this.gs.currentPhase.vars.test_var;
      console.log('test_var with id:'+test_var._id+'='+test_var._value);
      var json_data = decodeURI(requestUrl.search.substr(1));
      var data = JSON.parse(json_data);
      //console.log(data);
      var UUID = data.UUID;

      if(!this.gs.players[UUID]){
        console.log('creating player:'+UUID);
        this.gs.addPlayer(UUID);
      }
      var player = this.gs.players[UUID];

      var response_data = {};
      response_data.t = t;

      //apply updates from client

      //handle change hooks
      Hookable._handleTriggerQueue();



      //console.log(r);
      response.setHeader('Access-Control-Allow-Origin','*');
      response.setHeader('Content-Type','application/json');
      response.writeHead(200);

      //var response_data = {players:players,bombs:bombs,t:t,rt:new Date().getTime() - t};

      response_data.u = this.gs.getFullState();

      response_data.rt = new Date().getTime() - t;

      var response_txt = JSON.stringify(response_data);
      response.write(response_txt);

      response.end();
    } catch(e) {
      console.log(e.stack);
      response.writeHead(500)
      response.end()     // end the response so browsers don't hang
    }
  },
  start:function(){
    this.http = http.createServer(this.handleRequest.bind(this));
    this.http.listen(this.port)

    console.log("listening on port "+this.port);
  }
});
