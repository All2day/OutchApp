require('./gamestate');

Class.extend('GameClient',{
  gs:null,
  server:null,
  time_offset: 0,
  min_send_frequency:100,
  UUID:'mads',
  remoteTriggerQueue:{nextId:1}, //using integers for indexing
  init:function(gameobject,id){
    //read the gameobject and create a game state
    this.gs = new GameState(gameobject);

    this.gs.currentPhase.addHook('change',function(){

      this.gs.currentPhase.load();
      //get the first view
      var view_name = this.gs.currentPhase.views.firstKey();
      var view = this.gs.currentPhase.views[view_name];

      view.draw($(document.body));
    }.bind(this))
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

    //set the value of all variables
    $.each(update,function(id,u){

      if(u.p){
        //TODO: check how it will work if setting pointer to object as it defines its own set method
        Variable._vars[id].set(Variable._vars[u.p]);
      } else
      if($.type(u.value) == 'object'){
        if(Variable._vars[id]._value == null){
          Variable._vars[id]._value = {};
        }
        $.each(u.value,function(n,p){
          Variable._vars[id]._value[n] = Variable._vars[p];
        });
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

    //Trigger hooks affected by the update
    Hookable._handleTriggerQueue();
  },
  startPinging:function(){
    //console.log('starting ping');
    var d = {
      UUID:this.UUID
    };

    $.each(this.remoteTriggerQueue,function(i,h){
      //TODO: register the remote trigger
    });

    var t = new Date().getTime();
    $.ajax({
      dataType: "json",
      url: this.server+'?'+JSON.stringify(d),
      success: function(r){
        this.fullUpdate(r.u);
        console.log('got update');
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
  }
});
