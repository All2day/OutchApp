//require('js/handlebars-v2.0.0.js');
require('js/log');
require('js/client');

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
    //server: 'http://localhost:9615',
    server: 'http://geogames.all2day.dk',//'http://52.208.48.54:9615',

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
        this.setupTemplates();
        this.showGames();
    },

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

        f.on('click','.start',function(){
          $.getJSON(that.server+'/index/start',function(data){
            this.showGames();
          }.bind(that));
        });

        f.on('click','.join',function(){
          var url = $(this).attr('data-url');
          that.startGame(url);
        });
      }
      $("#front").html(this.frontTmpl()).show();
      //get current games from server
      $.getJSON(this.server+'/index/listinstances',function(data){
        $("#front").html(this.frontTmpl(data));
      }.bind(this));



    },

    startGame:function(url){
      $('#front').hide();
      this.startLocationService();

      if(!this.player_name){
        this.player_name = prompt('Player name');
      }

      var uno = require('js/uno');

      this._client = window._client = new GameClient(uno.game,this.player_name);

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


        this._navigator_watchId = navigator.geolocation.watchPosition(function(pos){
          //console.log(pos.coords.longitude+","+pos.coords.latitude+","+pos.coords.heading);

          //app.map.getView().setZoom(12);
          //console.log('got pos change');


          var pp = new ol.geom.Point(ol.proj.transform([pos.coords.longitude, pos.coords.latitude], 'EPSG:4326', 'EPSG:3857'));
          var c = pp.getCoordinates();
          if(this._client && !window.pos){
            this._client.updatePosition(c);
          } else {
            console.log('got location update, but no client');
          }
        }.bind(this),
          function(err){
            console.log('error in gps:'+err);
          },
          {enableHighAccuracy: true, timeout:1000,maximumAge:0});

        /*if(navigator.compass){
          //console.log('getting heading:'+heading.magneticHeading);
          var compass_watch_id = navigator.compass.watchHeading(function(heading){
            //console.log('heading:'+heading.magneticHeading);
            if(app.playerPoint){
              app.map.getView().rotate(-heading.magneticHeading*Math.PI/180,app.playerPoint.getCoordinates());
            }
          }, function(e){
            console.log('error while getting compass heading');
          });
        }*/
      }

      //manual control of position
      that = this;
      if(!window._keyeventhandler){
        window._keyeventhandler = $(window).on('keydown',function(e){
          if(!window.pos){
            console.log('fetching pos from client to overwrite it')
            var p = that._client.gs.currentPlayer.pos._value;
            window.pos = [p.x,p.y];
          }
          switch(e.key){
            case 'ArrowUp':
              window.pos[1]+=1;
              break;
            case 'ArrowDown':
              window.pos[1]-=1;
              break;
            case 'ArrowLeft':
              window.pos[0]-=1;
              break;
            case 'ArrowRight':
              window.pos[0]+=1;
              break;
            case ' ':
              if(that._client){
                that._client.triggerVolumeUp();
              }
              //console.log('space');
              break;
            default:
              //console.log('e'+e.key);
              return;
          }
          if(that._client){
            that._client.updatePosition(window.pos);
          }
        });
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
