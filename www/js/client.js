require('./gamestate');

Class.extend('GameClient',{
  gs:null,
  server:null,
  time_offset: 0,
  min_send_frequency:1000,
  UUID:'mads',
  remoteTriggerQueue:[],//{nextId:1}, //using integers for indexing
  currentPhase:null,
  init:function(gameobject,id){
    this.UUID = id;
    //read the gameobject and create a game state
    this.gs = new GameState(gameobject);
    //this.gs.getFullState();
    this.gs.currentPhase.addHook('change',function(){
      if(this.currentPhase){
        console.log('unloading phase');
        //if there is an existing phase handle it
        this.currentPhase.triggerHook('end');
        var view_name = this.currentPhase.views.firstKey();
        var view = this.currentPhase.views[view_name];

        view._dom.hide(); //hide the dom of the phase
      }

      this.currentPhase = this.gs.currentPhase._value;
      console.log('loading phase');
      this.gs.currentPhase.load();
      //get the first view
      var view_name = this.gs.currentPhase.views.firstKey();
      var view = this.gs.currentPhase.views[view_name];

      if(view._dom){
        view._dom.show(); //if hidden ensure that it is shown
      }
      view.draw($(document.body));

    }.bind(this))
  },
  startLocationService: function(){
    var geolocation = new ol.Geolocation({
      tracking: true
    });
    geolocation.on('change',function(evt){

      var pp = new ol.geom.Point(ol.proj.transform(geolocation.getPosition(), 'EPSG:4326', 'EPSG:3857'));
      //console.log('got pos change');
      //TODO: update current player position
      if(this.gs.currentPlayer){
        var c = pp.getCoordinates();
        this.gs.currentPlayer.updatePosition(c);
        //Trigger hooks affected by the changed position
        Hookable._handleTriggerQueue();
      }
    }.bind(this));

  },
  getServerTime: function(){
    return new Date().getTime() + this.time_offset;
  },
  gsUpdate:function(update){
    //apply the update to the game state

    //1. go through the list of updates and register new variables
    $.each(update,function(id,u){
      if(u.type){
        Variable.fromUpdate(id,u);
      }
    });

    $.each(update,function(id,u){
      if(u.type){
        Variable.fromUpdate(id,u);
      }
    });
  },
  fullUpdate:function(update){
    //first go is simply to check the existance of all the variables
    $.each(update,function(id,u){
      if(Variable._vars[id] === undefined){
        Variable._nextId = id;
        var val = u.value;
        delete u.value;
        var v = Variable.fromObject(u);
        if(!v){
          debugger;
        }
        if(val !== undefined){
          u.value =val;
        }
      }
    });

    //TODO:Make sure that client variables dont fill up the variable index space
    var p = this.gs.currentPlayer;

    //set the value of all variables
    $.each(update,function(id,u){
      //if(id==54) debugger;
      if(p && id == p.pos._id){
        return; //ignore updates of position
      }

      if(u.p){
        //TODO: check how it will work if setting pointer to object as it defines its own set method
        Variable._vars[id].set(Variable._vars[u.p]);
      } else
      if($.type(u.value) == 'object'){ //used for pointer objects and compound data
        if(Variable._vars[id]._value == null){
          Variable._vars[id]._value = {};
        }
        if(Variable._vars[id] instanceof PosVariable){
          Variable._vars[id].set(u.value);
        } else {
          var old_keys = Object.keys(Variable._vars[id]._value);

          $.each(u.value,function(n,p){

            old_keys.remove(n);
            if(Variable._vars[id]._value[n] === undefined){
              //new variable, use the adder function
              Variable._vars[id].add(n,Variable._vars[p]);
            } else {
              //existing variable, set using the set function
              Variable._vars[id]._value[n] = Variable._vars[p];
            }
          });
          //add cleanup removing nonexisting entries
          $.each(old_keys,function(i,n){
            Variable._vars[id].remove(n);
          })
        }
      } else
      if($.type(u.value) == 'array'){
        if(Variable._vars[id]._value == null){
          Variable._vars[id]._value = [];
        }
        var max_i = 0;
        $.each(u.value,function(i,p){
          if(i == Variable._vars[id]._value.length){
            Variable._vars[id].add(Variable._vars[p]);
          } else {
            Variable._vars[id].set(i,Variable._vars[p]);
          }
          max_i = Math.max(max_i,i);
        });
        if(max_i < Variable._vars[id]._value.length-1){
          Variable._vars[id]._value = Variable._vars[id]._value.slice(0,max_i);
        }

      } else {
        Variable._vars[id].set(u.value);
        //Variable._vars[id]._value = null;
      }
    });

    //if first time update the current player in gs
    if(!this.gs.currentPlayer){
      this.gs.currentPlayer = this.gs.players.get(this.UUID);
      this.startLocationService();
    }

    //Trigger hooks affected by the update
    Hookable._handleTriggerQueue();
  },
  startPinging:function(){
    //console.log('starting ping');

    var d = {
      UUID:this.UUID
    };

    if(this.remoteTriggerQueue.length){
      console.log('adding remote triggers');
      d.rt = this.remoteTriggerQueue;
      this.remoteTriggerQueue = [];
    }

    if(this.gs.currentPlayer && this.gs.currentPlayer.pos._value){
      d.p = this.gs.currentPlayer.pos._value;
    }

    /*$.each(this.remoteTriggerQueue,function(i,h){
      //TODO: register the remote trigger
    });*/

    var t = new Date().getTime();
    $.ajax({
      dataType: "json",
      url: this.server+'?'+JSON.stringify(d),
      success: function(r){
        this.fullUpdate(r.u);
        //console.log('got update');
        var this_t = new Date().getTime();
        var time_offset = (this_t - t - r.rt)/2 + r.t + r.rt - this_t;
        this.time_offset = Math.round(0.9*this.time_offset + 0.1*time_offset);

        setTimeout(this.startPinging.bind(this),Math.max(0,this.min_send_frequency - (this_t-t)));
        //this.startStatePinging();
      }.bind(this),
      error:function(r,status,error) {
        //debugger;
        console.log('status:'+status+' error:'+error);
        //alert(error);

        setTimeout(this.startPinging.bind(this),1000);
      }.bind(this),
      timeout:2000
    });
  },
  registerRemoteTrigger: function(hook_id,vars){
    //add to remote trigger queue
    this.remoteTriggerQueue.push({
      t:this.getServerTime(),
      h:hook_id,
      v:vars
    });
    //dont wait for the next ping, send right away or wait a bit for the current ping to get back and then send
    //TODO:diret triggering
  }
});
