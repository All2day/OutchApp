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

        var uno = require('js/uno');

        $.each(qs,function(k,v){
          window[k] = v;
        });

        if(!qs['UUID']){
          qs['UUID'] = prompt('Player name');
        }
        if(qs['port']){
          this.server = this.server+':'+qs['port'];
        }

        window._client = new GameClient(uno.game,qs['UUID']||'mads');

        _client.server = this.server; //'http://52.208.48.54:9615'; //'http://localhost:9615';
        _client.startPinging();

        window._client = this._client = _client;
        //register volume buttons
        window.addEventListener("volumebuttonslistener", this.onVolumeButtonsListener.bind(this), false);
    },

    onVolumeButtonsListener:function(info){
    	console.log("Button pressed: " + info.signal);
      switch(info.signal){
        case 'volume-up':
          this._client.triggerVolumeUp();
          break;
        case 'volume-down':
          break;
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
