require('js/log.js');
require('js/client.js');


/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    server: 'http://geogames.localhost',
    //server: 'http://geogames.all2day.dk',//'http://52.208.48.54:9615',

    // Application Constructor
    initialize: function() {
      if(navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)) { //removed |IEMobile

        console.log('registering deviceready');
        document.addEventListener("deviceready", function(){
          console.log('Got deviceready');

          try{
            if(window.console_reinsert){
              console_reinsert();
            }
          } catch(e){
            alert('error in console reinsert:'+e.message + ' in '+e.fileName + '['+e.lineNumber+']');
          }
          try{
            app.onDeviceReady();
          } catch(e){
            alert('error in init:'+e.message + ' in '+e.fileName + '['+e.lineNumber+']');
          }
        }, false);


        } else {
          console.log('NOT registering deviceready');
          app.onDeviceReady();
        }

    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: function() {
        console.log('device ready');

        var qs = (function(a) {
            if (a == "") return {};
            var b = {};
            for (var i = 0; i < a.length; ++i)
            {
                var p=a[i].split('=', 2);
                if (p.length == 1)
                    b[p[0]] = "";
                else
                    b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
            }
            return b;
        })(window.location.search.substr(1).split('&'));



        $.each(qs,function(k,v){
          window[k] = v;
        });

        if(qs['UUID']){
          app.player_name = qs['UUID'];

        }

        /*if(qs['port']){
          this.server = this.server+':'+qs['port'];
        }

        window._client = new GameClient(uno.game,qs['UUID']||'mads');

        _client.server = this.server; //'http://52.208.48.54:9615'; //'http://localhost:9615';
        _client.startPinging();

        window._client = this._client = _client;
        */
        //register volume buttons
        window.addEventListener("volumebuttonslistener", this.onVolumeButtonsListener.bind(this), false);

        //fake volume button
        //if(navigator.userAgent.match(/(iPhone|iPod|iPad)/)){
          $(document.body).on('touchstart',function(e){
        		if(e.originalEvent.touches.length == 2){
        			this.onVolumeButtonsListener.call(this,{signal:'volume-up'});
        			e.stopPropagation();
        		}
        	}.bind(this));
        //}


        //perhaps: http://phonegap-plugins.com/plugins/rja235/volumebuttons
        //using https://github.com/manueldeveloper/cordova-plugin-volume-buttons.git
        //create our own plugin, perhaps using: https://github.com/jpsim/JPSVolumeButtonHandler

        this.setupTemplates();
        this.showGames();
    },


    _currentGame:null,
    showGames:function(){
      var f = $('#front');
      var that = this;
      if(!f.length){
        f = $('<div id="front"></div>').appendTo("body");
        f.on('click','.stop',function(){
          $.getJSON(that.server+'/index/stop',{instance_id:$(this).attr('data-instance_id')},function(data){
            this.showGames();
          }.bind(that));
        });

        f.on('click','.open',function(){
          $.getJSON(that.server+'/index/game',{game_id:$(this).attr('data-game_id')},function(data){

            that._currentGame = data.game;
            that.showGames();
          });
        });

        f.on('click','.start',function(){
          $.getJSON(that.server+'/index/start',{game_id:that._currentGame.game_id},function(data){
            this.showGames();
          }.bind(that));
        });

        f.on('click','.back',function(){
          that._currentGame = null;
          that.showGames();
        });

        f.on('click','.join',function(){
          var url = $(this).attr('data-url');
          that.startGame(url);
        });
      }
      //$("#front").html(this.frontTmpl()).show();
      //get current games from server

      if(this._currentGame){
        $("#front").html(this.gameTmpl(this._currentGame));
        //update data
        $.getJSON(that.server+'/index/game',{game_id:this._currentGame.game_id},function(data){
          this._currentGame = data.game;
          $("#front").html(this.gameTmpl(this._currentGame));
        }.bind(this));
      } else {
        $.getJSON(this.server+'/index/listgames',function(data){
          $("#front").html(this.frontTmpl(data));
        }.bind(this));
      }
    },

    startGame:function(url){
      $('#front').hide();
      this.startLocationService();

      if(!this.player_name){
        this.player_name = prompt('Player name');
      }


      var g = require(this._currentGame.src);
      //var uno = require('js/uno.js');

      this._client = window._client = new GameClient(g.game,this.player_name);

      _client.server = url; //'http://52.208.48.54:9615'; //'http://localhost:9615';
      _client.startPinging();

    },
    exitGame:function(){
      if(this._client){
        this._client.exit();
        this._client = null;
      }
      $("body").children().each(function(){
        $(this).remove();
      });
      this.showGames();
      this.stopLocationService();
    },
    setupTemplates:function(){
      var templates = $('script[type="text/x-handlebars-template"]');

      templates.each(function(i,t){
        t = $(t);
        this[t.attr('id')+'Tmpl'] = 							Handlebars.compile(t.remove().html());
      }.bind(this));

    },
    onVolumeButtonsListener:function(info){
    	console.log("Button pressed: " + info.signal);
      switch(info.signal){
        case 'volume-up':
          if(this._client){
            this._client.triggerVolumeUp();
          }
          break;
        case 'volume-down':
          break;
      }
    },
    startLocationService: function(){
      console.log('starting location service');
      if(!navigator.geolocation){
        console.log('no gps, using html5 geolocation');
        var geolocation = new ol.Geolocation({
          tracking: true
        });

        this._onLocationUpdate = function(evt){
          //TODO: this is for tesing, should be removes
          window.loc = geolocation.getPosition();

          var pp = new ol.geom.Point(ol.proj.transform(geolocation.getPosition(), 'EPSG:4326', 'EPSG:3857'));
          var c = pp.getCoordinates();
          console.log('got pos change:'+c[0]+','+c[1]);
          if(this._client && !window.pos){

            this._client.updatePosition(c);
          } else {
            console.log('got location update, but no client or ',window.pos);
          }

        };

        //console.log(geolocation.getPosition());
        geolocation.on('change',this._onLocationUpdate,this);

        this._geolocation = geolocation;
      } else { //End of no gps, now setup the gps

        this._smoothPosUpdates = function(){
          this._smoothPosUpdates._run_count = (this._smoothPosUpdates._run_count || 0)+1;
          //console.log('smooth update');
          //calculate best position based on time
          var delay = 200;
          var expected_frequency = 1200; //The expected ms between updates
          var t = new Date().getTime();

          //when there is only one point in history, simply send that
          if(this._posHist.length == 1){
            //set the last pos to be the current pos
            this._lastPos = {
              c:this._posHist[0].c,
              t:t
            };
          } else {

            //if multiple points define new_pos to be the newest and old_pos to be the next to newest
            var old_pos = this._posHist[this._posHist.length-2];
            var new_pos = this._posHist[this._posHist.length-1];

            if(Number.isNaN(new_pos.c[0])){
              console.log('1new_pos is nan');
            }
            if(Number.isNaN(old_pos.c[0])){
              console.log('1old_pos is nan');
            }
            if(Number.isNaN(this._lastPos.c[0])){
              console.log('1last_pos is nan');
            }

            //if the current time is before the new pos time (+ delay), the goal is to go towards the new_pos (vector from last position to new position)
            var delta, delta_length_sq, this_t, f, new_point, method;

            if(new_pos.t == old_pos.t){
              //if no time has passed simply add the newest pos
              console.log('no time passed, ignoring');
              console.log('old_pos:['+old_pos.c[0]+','+old_pos.c[1]+","+old_pos.t+"]");
              console.log('new_pos:['+new_pos.c[0]+','+new_pos.c[1]+","+new_pos.t+"]");

              //store the new point in last pos
              this._lastPos = {
                c:[new_pos.c[0],new_pos.c[1],0],
                t: t
              };
            } else
            if(t < new_pos.t + delay){
              method = 'before_new_pos';
              delta =  [
                new_pos.c[0]-this._lastPos.c[0], //delta x
                new_pos.c[1]-this._lastPos.c[1], //delta y
                new_pos.t +delay - this._lastPos.t //delta time
              ];
              delta_length_sq = delta[0]*delta[0]+delta[1]*delta[1];

              //calculate the time since last pos
              this_t = t-this._lastPos.t;
              //calculate a factor based on the amount of time since last pos compared to the time to new_pos
              f = this_t/delta[2];

              if(Number.isNaN(f)){
                console.log('got nan before new_pos');
              }


              //calculate a new point using last_pos the vector and the factor
              new_point = [
                this._lastPos.c[0] + f*delta[0],
                this._lastPos.c[1] + f*delta[1],
                delta_length_sq>0.5 ? Math.atan2(delta[1], delta[0])-Math.PI*.5 : this._lastPos.c[2]
              ];

              //store the new point in last pos
              this._lastPos = {
                c:new_point,
                t: t
              };

            } else {
              method = 'after_new_pos';
              //if the time is after the new pos (+ delay) use a vector between the old and new pos as a guide
              delta =  [new_pos.c[0]-old_pos.c[0],new_pos.c[1]-old_pos.c[1],new_pos.t - old_pos.t];



              delta_length_sq = delta[0]*delta[0]+delta[1]*delta[1];


              //calculate the amount of time after the new pos
              this_t = t - (new_pos.t +delay);

              //a new position is expected after ~1000ms - delay, thus if larger than this slow down
              if(this_t + delay > expected_frequency){
                this_t = (expected_frequency - delay) + Math.sqrt(this_t + delay - expected_frequency);
              }


              //calculate a factor based on the time after new pos compared to the time bewteen the old pos and new pos
              var f = this_t/delta[2];
              if(Number.isNaN(f)){
                console.log('got nan after new_pos');
              }
              if(Number.isNaN(new_pos.c[0])){
                console.log('new_pos is nan');
              }

              //use the new pos as the base and the vecor as the guide with factor length to calculate the new position
              new_point = [
                new_pos.c[0] + f*delta[0],
                new_pos.c[1] + f*delta[1],
                delta_length_sq>0.5 ? Math.atan2(delta[1], delta[0])-Math.PI*.5 : this._lastPos.c[2]
              ];

              //store the new point in the last pos
              this._lastPos = {
                c:new_point,
                t: t
              };

            }

            if(!this._lastPos || !this._lastPos.c || Number.isNaN(this._lastPos.c[0]) || Number.isNaN(this._lastPos.c[1])){
              console.log('got bad last pos:'+method);

              console.log('this_t:'+this_t);
              console.log('delta:['+delta[0]+','+delta[1]+","+delta[2]+"]");
              console.log('f:'+f);
            }
          }

          if(!this._lastPos || !this._lastPos.c || Number.isNaN(this._lastPos.c[0]) || Number.isNaN(this._lastPos.c[1])){
            console.log('got bad last pos:'+first);
          }

          //overwrite with compass if available
          if(this._lastHeading !== undefined){
            this._lastPos.c[2] = this._lastHeading;
          }

          //if a client is available, use the position of the last pos and update
          if(this._client){
            //console.log('updating client pos', this._lastPos.c);
            this._client.updatePosition(this._lastPos.c);
          }

          if(this._smoothPosUpdates._run_count % 100 == 99){
            console.log('GPS STAT:');
            console.log('history count:'+this._posHist.length);
            var total_time = this._posHist[this._posHist.length-1].t - this._posHist[0].t;
            console.log('avg second between:'+(total_time/(this._posHist.length-1)));
            var total_delay =0;
            for(var i=0;i<this._posHist.length;i++){
              total_delay+=this._posHist[i].rt - this._posHist[i].t;
            }
            console.log('avg delay:'+(total_delay/(this._posHist.length)));
          }

          //restart the smooth timer
          this._smoothPosUpdates.timer_id = setTimeout(this._smoothPosUpdates,100);
        }.bind(this);

        this._navigator_watchId = navigator.geolocation.watchPosition(function(pos){
          //console.log(pos.coords.longitude+","+pos.coords.latitude+","+pos.coords.heading);

          var pp = new ol.geom.Point(ol.proj.transform([pos.coords.longitude, pos.coords.latitude], 'EPSG:4326', 'EPSG:3857'));

          var c = pp.getCoordinates();

          var pos_obj = {
            c:c,
            t:pos.timestamp,
            rt: new Date().getTime()
          };

          if(!this._posHist){
            this._posHist = [];
            this._posHist.push(pos_obj);
            console.log('starting smoothing');
            this._smoothPosUpdates(); //fire first time
          } else {
            //if matching the one before, ignore it
            var last_pos = this._posHist[this._posHist.length-1];
            if(pos_obj.c[0] == last_pos.c[0] && pos_obj.c[1] == last_pos.c[1] && pos_obj.t == last_pos.t){
              console.log('got location update duplicate, ignoring');
              var t = new Date().getTime();
              console.log('current time is:'+t+' and timestamp of pos is:'+pos_obj.t);
              return;
            }

            this._posHist.push(pos_obj);
            if(this._posHist.length >= 100){
              this._posHist.shift();
            }
          }

          return;
          /*if(this._client && !window.pos){
            this._client.updatePosition(c);
          } else {
            console.log('got location update, but no client or '+window.pos);
          }*/
        }.bind(this),
          function(err){
            console.log('error in gps:'+err.code +' '+err.message);
            //console.log('restarting location service');
            //this.stopLocationService();
            //this.startLocationService();
          }.bind(this),
          {enableHighAccuracy: true, timeout:5000,maximumAge:0});


        //Keep track of compass heading if available
        if(navigator.compass){
          console.log('getting heading');
          this._compass_watch_id = navigator.compass.watchHeading(function(heading){
            //console.log('heading:'+heading.magneticHeading);
            this._lastHeading = -heading.magneticHeading*Math.PI/180;
          }.bind(this), function(e){
            console.log('error while getting compass heading');
          });
        }
      }

      //manual control of position
      that = this;
      if(!window._keyeventhandler){
        console.log('adding window key event handler');
        window._keyeventhandler = $(window).on('keydown',function(e){
          if(!this._posHist){
            console.log('no pos hist');
            return;
            /*
            console.log('fetching pos from client to overwrite it')
            var p = that._client.gs.currentPlayer.pos._value;
            window.pos = [p.x,p.y];*/
          }
          var pos = this._posHist[this._posHist.length-1].c;

          switch(e.key){
            case 'ArrowUp':
              pos[1]+=1;
              break;
            case 'ArrowDown':
              pos[1]-=1;
              break;
            case 'ArrowLeft':
              pos[0]-=1;
              break;
            case 'ArrowRight':
              pos[0]+=1;
              break;
            case ' ':
              if(this._client){
                this._client.triggerVolumeUp();
              }
              //console.log('space');
              break;
            default:
              //console.log('e'+e.key);
              return;
          }

          var pos_obj = {
            c:pos,
            t:new Date().getTime()
          };

          if(!this._posHist){
            this._posHist = [];
            this._posHist.push(pos_obj);
            this._smoothPosUpdates(); //fire first time
          } else {
            this._posHist.push(pos_obj);
            if(this._posHist.length >= 10){
              this._posHist.shift();
            }
          }

          return;
          /*
          if(this._client){
            this._client.updatePosition(window.pos);
          }*/
        }.bind(this));
      }
    }, //end of startLocationService

    stopLocationService:function(){
      if(this._geolocation){
        this._geolocation.un('change',this._onLocationUpdate,this);
        delete(this._geolocation);
      }
      if(this._navigator_watchId){
        navigator.geolocation.clearWatch(this._navigator_watchId);
        this._navigator_watchId = null;
      }
      if(this._smoothPosUpdates.timer_id){
        clearTimeout(this._smoothPosUpdates.timer_id);
      }
      if(this._compass_watch_id){
        navigator.compass.clearWatch(this._compass_watch_id);
      }
      delete(this._posHist);
    },

    /**
  	 * Returns the UUID for this device
  	 */
  	getUUID: function(){
  		if(window.device){
  			return window.device.uuid;
  		}
  		return 24234234234433;
  	}
};

app.initialize();
