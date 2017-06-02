var http = require('http')
var url = require('url')
var fs = require('fs')
const concat = require('concat-stream');
var path = require('path')
var baseDirectory = __dirname   // or whatever base directory you want

var port = 9615

var r = 0;
var players = {};
var bombs = {};
var uid = 0;

http.createServer(function (request, response) {
   try {
     var t = new Date().getTime();
     r++;
        var requestUrl = url.parse(request.url,true)
        //console.log(requestUrl);
        var json_data = decodeURI(requestUrl.search.substr(1));
        var data = JSON.parse(json_data);
        //console.log(data);
        var UUID = data.UUID;
        if(!players[UUID]){
                players[UUID] = {
                  cmdQueue: [],
                  bombs:3,
                  hits:0,
                  dies:0
                };
        }
        var player = players[UUID];

        player.pos = data['pos'];
        var cmdQueue = null;
        if(cmdQueue = data['cmdQueue']){
                cmdQueueLoop:
                for(var i=0;i< cmdQueue.length;i++){
                        console.log('got cmd'+cmdQueue);
                        switch(cmdQueue[i][0]){
                                case 'createBomb':
                                  if(player.bombs <= 0){
                                    player.cmdQueue.push(['write','No more bombs']);
                                    continue cmdQueueLoop;
                                  }
                                  player.bombs--;
                                  var bomb_uid = uid++;
                                  var duration = 6000;
                                  bombs[bomb_uid] = {
                                    owner:UUID,
                                    start_pos:player.pos,
                                    end_pos:cmdQueue[i][2],
                                    time:cmdQueue[i][1],
                                    duration: duration
                                  };

                                  setTimeout(function(){
                                      try{
                                          player.bombs++;

                                          //go through the players to find if anyone is hit
                                          Object.keys(players).forEach(function(key){
                                                  var p = players[key];
                                                  if(!p.pos){
                                                    console.log('player pos missing:'+key);
                                                    return;
                                                  }
                                                  if(!bombs[bomb_uid]){
                                                    console.log('bomb missing:'+bomb_uid);
                                                    return;
                                                  }

                                                  //calculate the distance
                                                  var d_x =p.pos[0]-bombs[bomb_uid].end_pos[0];
                                                  var d_y = p.pos[1]-bombs[bomb_uid].end_pos[1];

                                                  var d = Math.sqrt(d_x*d_x+d_y*d_y);
                                                  if(d <= 15){
                                                          console.log('player hit, d:'+d);
                                                          if(!p.cmdQueue){
                                                                  p.cmdQueue = [];
                                                          }
                                                          p.cmdQueue.push(['die',bombs[bomb_uid].time]);
                                                          p.dies++;

                                                          if(players[bombs[bomb_uid].owner]){
                                                            players[bombs[bomb_uid].owner].hits++;
                                                            players[bombs[bomb_uid].owner].cmdQueue.push(['hit',bombs[bomb_uid].time]);

                                                          }
                                                  }

                                          });
                                          delete(bombs[bomb_uid]);
                                        } catch(e){
                                          console.log(e);
                                        }
                                  },duration);
                                  break;
                    }
            }
    }

    /*concat(request, function(buffer){
    const data = JSON.parse(buffer.toString());
    console.log('Data: ', data);
    });*/

    //console.log(r);
    response.setHeader('Access-Control-Allow-Origin','*');
    response.setHeader('Content-Type','application/json');
    response.writeHead(200);
    var response_data = {players:players,bombs:bombs,t:t,rt:new Date().getTime() - t};
    if(player.cmdQueue && player.cmdQueue.length){
            response_data.cmdQueue = player.cmdQueue;
            player.cmdQueue = [];
            //delete(player.cmdQueue);
    }
    response.write(JSON.stringify(response_data));
    response.end();
} catch(e) {
 response.writeHead(500)
 response.end()     // end the response so browsers don't hang
 console.log(e.stack)
}
}).listen(port)

console.log("listening on port "+port)
