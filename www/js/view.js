/***********************************
 * View stuff
 ***********************************/

Hookable.extend('ClientElement',{
  _props:{},
  init:function(obj){
    this._super(obj);
  },
  registerProp(name,s){
    //evaluate the string
    ScopeRef._setScope(this);
    var r = ScopeRef._evalString(s);

    if(r.inf.vars.length == 0){
      this._props[name] = r.v;
    } else {
      this._props[name] = r.ref;
      var that = this;
      $.each(r.inf.vars,function(k,v){
        v.addHook('change',that._update.bind(that,name));
      });
    }
  },
  _update:function(name){ //internal update
    ScopeRef._pushScope(this);
    var val = this._props[name].eval();
    ScopeRef._popScope();
    this.update({[name]:val});
  },
  update:function(props){

  },
  get:function(ref){
    debugger;
  }
});

//Basic view element acting as a parent for all other view elements
ClientElement.extend('ViewElement',{
  elements:[],
  type:null,
  dom:null,
  init: function(obj){
    /*if(obj.hooks){
      debugger;
    }*/
    this._super(obj);

    this.type = obj.type; //window[obj.type] || ViewElement;

    this.elements = new GameStateList(obj.elements || {},ViewElement);
  },

  getClientHooks: function(hooks){
    this._super(hooks);
    $.each(this.elements._value,function(key,element){
      element.getClientHooks(hooks);
    });
  }
});

ViewElement.fromObject = function(obj){
  switch(obj.type){
    case 'MapView':
      return new MapElement(obj);
    case 'circle':
      return new CircleElement(obj);
    case 'dialog':
      return new DialogElement(obj);
    case 'GeoElement':
      return new GeoElement(obj);
    case 'listElement':
      return new ListElement(obj);
    case 'button':
      return new ButtonElement(obj);
    case 'timerElement':
      return new TimerElement(obj);
    case 'page':
      return new PageElement(obj);
    default:
      //test that it exist in global scope
      var t = obj.type.toLowerCase().replace(/\b[a-z]/g, function(letter) {return letter.toUpperCase();})+'Element';
      var pt = (window || global)[t];
      if(pt){
        return new pt(obj);
      }
      console.log('unknown ViewElement type:'+obj.type);
  }
};




ViewElement.extend('PageElement',{
  draw:function(c){
    if(!this._dom){
      var dom = $('<div></div>').css({
        position:'absolute',
        top:0,
        left:0,
        background:'white',
        width:'100vw',
        height:'100vh',
        verticalAlign:'middle',
        textAlign:'center',
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        alignContent:'center'
      });

      $.each(this.elements ? this.elements._value ||{}: {},function(n,el){
        el.draw(dom);
      });
      this._dom = dom;
    }

    c.append(this._dom);
  }
});


ViewElement.extend('LabelElement',{
  init:function(obj){
    this._super(obj);
    this.registerProp('text',obj.text || 'hej');
  },
  update:function(props){ //update the following properties by looking up the values
    if(!this._dom) return;
    var that = this;
    $.each(props,function(prop,val){
      switch(prop){
        case 'text':
          that._dom.text(val._value);
      }
    });
  },
  draw:function(c){
    if(!this._dom){
      var dom = $('<span></span>').css({

      }).text('hej');

      $.each(this.elements ? this.elements._value ||{}: {},function(n,el){
        el.draw(dom);
      });
      this._dom = dom;
    }

    c.append(this._dom);
  }
});

ViewElement.extend('DialogElement',{
  init:function(obj){
    this._super(obj);
  }
});

ViewElement.extend('ListElement',{
  list:null,
  init:function(obj){
    this._super(obj);
  }
});


ViewElement.extend('ButtonElement',{
  init:function(obj){
    this._super(obj);
  },
  draw:function(c){
    if(!this._dom){
      var dom = $('<button></button>').css({
        width:'80vw',
        display:'inline-block'
        //height:'100vh',
      }).text('hej');


      this._dom = dom;
    }

    c.append(this._dom);
  }
});

ViewElement.extend('TimerElement',{
  timer:null,
  init:function(obj){
    this._super(obj);
  }
});


ViewElement.extend('MapElement',{
  geoElements:[],
  init: function(obj){
    this._super(obj);

    this.geoElements = new GameStateList(obj.geoElements || {},GeoElement);
  },
  getClientHooks: function(hooks){
    this._super(hooks);
    $.each(this.geoElements._value,function(key,element){
      element.getClientHooks(hooks);
    });
  }
});

ViewElement.extend('GeoElement',{
  geoElements:[],
  pos:null,
  rotation:null,
  init: function(obj){
    this._super(obj);
    this.geoElements = new GameStateList(obj.geoElements || {},GeoElement);
  },
  getClientHooks: function(hooks){
    this._super(hooks);
    $.each(this.geoElements._value,function(key,element){
      element.getClientHooks(hooks);
    });
  }
});

GeoElement.extend('CircleElement',{
  radius:null,

  init:function(obj){
    this._super(obj);

    this.radius = obj.radius;
  }
})
