/***********************************
 * View stuff
 ***********************************/

Hookable.extend('ClientElement',{
  _props:{},
  _attachedHooks:null,
  init:function(obj){
    this._super(obj);
    this._props = {};
    this._attachedHooks = [];
  },
  registerProp(name,s,d/*default*/){
    //only clients should register properties
    if(!(window||global)._client){
      return;
    }

    this._props[name] = new GameProperty(s,d);

    /*if(this._props[name] === null){
      this._props[name] = new GameProperty(s,d);
    }*/

    //evaluate the string
    /*ScopeRef._setScope(this);
    var r = ScopeRef._evalString(s);

    if(r.inf.vars.length == 0 && r.inf.constant){
      this._props[name] = r.value;
    } else {
      this._props[name] = r.ref;
      var that = this;
      $.each(r.inf.vars,function(k,v){
        v.addHook('change',that._update.bind(that,name));
      });
    }
    if(this._props[name] === null){
      this._props[name] = d;
    }*/
  },
  _update:function(name){ //internal update
    if(this._destroyed){
      console.log('destroyed, not updating:'+name);
    }
    var val = this.getProp(name);

    this.update({[name]:val});
  },
  update:function(props){

  },
  updateAllProps: function(){
    var that = this;
    $.each(this._props,function(k,p){
      that._update(k);
    });
  },
  getProp:function(name){
    var val = null;
    if(this._props[name] instanceof GameProperty){
      //evaluate the string
      //if(name=='pos') debugger;
      ScopeRef._setScope(this);
      if(this._props[name].s === null || this._props[name].s === undefined){
        val = this._props[name] = this._props[name].d; //default

      } else {
        var r = ScopeRef._evalString(this._props[name].s);

        if(r.inf.vars.length == 0 && r.inf.constant){
          if(r.value !== undefined && r.value !== null){
            this._props[name] = r.value;
            val =  r.value;
          } else {
            val = this._props[name] = this._props[name].d; //default
          }
        } else {
          this._props[name] = r.ref;
          var that = this;
          $.each(r.inf.vars,function(k,v){
            var ah = {
              v:v, //the variable
              t:'change',
              h:that._update.bind(that,name)
            };
            v.addHook(ah.t,ah.h);
            that._attachedHooks.push(ah);
          });
          val = r.value !== null ? r.value : this._props[name].d;
        }
      }
      //return this._props[name].d;
    } else
    if(this._props[name] instanceof ScopeRef){
      //ScopeRef._pushScope(this);
      ScopeRef._setScope(this);
      val = this._props[name].eval();
      //ScopeRef._popScope();
    } else {
      val = this._props[name];
    }
    return val;

    /*if(this._props[name] instanceof ScopeRef){
      return this._props[name].eval();
    }
    return this._props[name];*/
  },
  /**
   * Totally remove this object
   */
  destroy:function(){
    //go through the hooks attached by this elemnet and remove them
    $.each(this._attachedHooks,function(i,ah){
      ah.v.removeHook(ah.t,ah.h);
    });
    this._attachedHooks = [];
    this._destroyed = true;
  },
  get:function(ref){
    console.log('get on ClientElement:'+ref);
  },
  clone:function(){

    var c = $.extend(Object.create(Object.getPrototypeOf(this)),this);
    //c.constructor = this.constructor;
    //c.elements = c.elements.clone();

    $.each(c.elements._value || {},function(k,el){
      c.elements._value[k] = el.clone();
    });
    c._attachedHooks = [];
    //debugger;
    return c;
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
    var els = [];

    $.each(obj.elements||{},function(k,el){
      els.push(ViewElement.fromObject(el));
    });
    this.elements = {_value:els};//new GameStateList(obj.elements || {},ViewElement);
  },
  destroy:function(){
    this._super();
    $.each(this.elements._value,function(key,element){
      element.destroy();
      element.owner = null;
    });
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
        alignContent:'center',
        flexWrap:'wrap'
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

      val = val._value || val;
      switch(prop){
        case 'text':
          that._dom.text(val);
      }
    });
  },
  draw:function(c){
    if(!this._dom){
      var dom = $('<span></span>').css({

      }).text(this.getProp('text'));

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
  _wrapperels:null,
  _elements_obj:null,
  init:function(obj){
    this._elements_obj = obj.elements;
    delete(obj.elements);
    this._super(obj);
    this.registerProp('list',obj.list);

    this._wrapperels = [];
  },
  update:function(props){
    this._super(props);
    if(props['list'] !== undefined){
      this.redraw(props['list']);
    }
  },
  draw:function(c){
    if(!this._dom){
      var dom = $('<div></div>').css({

      });

      this._dom = dom;
      this._update('list');
    }

    c.append(this._dom);
  },
  redraw:function(new_list){
    if(!this._dom) return;
    if(this.list){
      $.each(this._wrapperels,function(i,k){
        //TODO:destroy it unhooking etc.
      });

      this._wrapperels = [];
      //clear the list
      this._dom.empty();
    }

    this.list = new_list;

    if(this.list){
      var that = this;

      $.each(this.list._value,function(i,k){
        //TODO: somehow the elements inside needs to have access to the list element.
        //TODO: how to describe multilevel list elements?
        var wrapper = new ListElElement(k,that);
        wrapper.draw(that._dom);
        /*$.each(that.elements._value,function(j,el){
          var e = el.clone();
          e.draw(that._dom);
        });*/
        that._wrapperels.push(wrapper);
      });
    }
  }
});

/**
 * Invisible wrapper for the elemnet sof list elements
 */
ViewElement.extend('ListElElement',{
  listel:null, //the input object, this element wraps
  list:null, //the listelement containing this element (same as owner)
  init:function(listel, list){
    this._super({elements:list._elements_obj});
    this.listel = listel;
    this.list = list;
  },
  draw:function(c){
    if(!this._dom){

      this._dom = $('<div></div>');
      var that = this;
      $.each(this.elements._value,function(j,el){

        var e = el.clone();
        e.owner = that;

        e.draw(that._dom);
      });

      c.append(this._dom);
    }
  },
  get:function(name){
    switch(name){
      case 'listel':
        return this.listel;
    }
  }
});


ViewElement.extend('ButtonElement',{
  init:function(obj){
    this._super(obj);
    this.registerProp('text',obj.text || 'init');
  },
  update:function(props){ //update the following properties by looking up the values
    if(!this._dom) return;
    var that = this;
    $.each(props,function(prop,val){
      val = val._value || val;
      switch(prop){
        case 'text':
          that._dom.text(val);
      }
    });
  },
  draw:function(c){
    if(!this._dom){
      var dom = $('<button></button>').css({
        width:'80vw',
        display:'inline-block'
        //height:'100vh',
      }).text(this.getProp('text'));

      var that = this;
      dom.on('click',function(e){
        that.triggerHook('click');
      });
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
  _realPos: [0,0,0], //x,y,r clockwise in radians
  init: function(obj){
    this._super(obj);
    this.geoElements = new GameStateList(obj.geoElements || {},GeoElement);
    this.geoElements.owner = this;
    this.registerProp('center',obj.center);
  },
  getClientHooks: function(hooks){
    this._super(hooks);
    $.each(this.geoElements._value,function(key,element){
      element.getClientHooks(hooks);
    });
  },
  update:function(props){ //update the following properties by looking up the values
    if(!this._dom) return;
    var that = this;
    $.each(props,function(prop,val){
      val = val._value || val;
      switch(prop){
        case 'center':
          var s = that._map.getSize();
          that._map.getView().centerOn([val.x,val.y],s,[s[0]*.5,s[1]*0.66]);
          break;
      }
    });
  },
  draw:function(c){
    if(!this._dom){
      var dom = $('<div></div>').css({
        position:'absolute',
        top:0,
        left:0,
        //background:'white',
        width:'100vw',
        height:'100vh',
        /*verticalAlign:'middle',
        textAlign:'center',
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        alignContent:'center',
        flexWrap:'wrap'*/
      });

      var map = new ol.Map({
        layers: [
          new ol.layer.Tile({
            source: new ol.source.OSM()
          })
        ],
        target: dom[0],
        view: new ol.View({
          center: [0,0],
          zoom: 20
        }),
        interactions:new ol.Collection([])/*ol.interaction.defaults({
          dragPan:false
        })*/
      });

      //create the vector layers
      this._vectorSource = new ol.source.Vector();
      this._vectorLayer = new ol.layer.Vector({
        source:this._vectorSource
      });
      map.addLayer(this._vectorLayer);
      this._map = map;

      //add the players point as a geom.circle

      /*this._geomCollection = new ol.geom.GeometryCollection([      ]);
      //var t1 = new ol.geom.GeometryCollection([new ol.geom.Circle([1,1],100000)]);
      //var gs = this._geomCollection.getGeometries();
      //this._geomCollection.setGeometries(gs);
      var test_c = new ol.geom.Circle([0,0],100000);

      var test_f = new ol.Feature({
        geometry:test_c
      });
      this._vectorSource.addFeature(test_f);

      this._vectorLayer.on('precompose',function(evt){
        //console.log('precompose');
        //this._map.render();
        //test_c.translate(100,100);
      },this);

      this._vectorSource.addFeature(new ol.Feature({
        geometry: this._geomCollection
      }));*/

      var that = this;
      //debugger;
      $.each(this.geoElements ? this.geoElements._value ||{}: {},function(n,el){
        //debugger;
        //el.draw(that._vectorSource);
        el.draw(that._vectorSource);
        el.redraw(); //fire twice, the first on initialises geometries, the second the position
      });



      /*$.each(this.elements ? this.elements._value ||{}: {},function(n,el){
        el.draw(dom);
      });*/
      this._dom = dom;

      //TODO: why is it needed to update all props here?
      this.updateAllProps();

    }
    c.append(this._dom);
    this._map.updateSize();
  }
});

ViewElement.extend('GeoElement',{
  geoElements:[],
  _feature:null, //The actual feature being displayed for this geoelement, added to the vector layer
  _geom:null, //The original geometry (or geometry collection) that is cloned and set as the geometry of the feature when changed
  _pos:null, //The relative position based on translation and rotation, relative to its parent, format [x,y,r]
  _realPos:null, //The real position and rotation on the map. This is applied to the original _geom
  init: function(obj){
    this._super(obj);
    this.geoElements = new GameStateList(obj.geoElements || {},GeoElement);
    this.geoElements.owner = this;
    this._pos = [0,0,0];
    this.registerProp('pos',obj.pos);
    this.registerProp('rotation',obj.rotation,0);
  },
  getClientHooks: function(hooks){
    this._super(hooks);
    $.each(this.geoElements._value,function(key,element){
      element.getClientHooks(hooks);
    });
  },
  destroy:function(){
    this._super();
    $.each(this.geoElements._value,function(key,element){
      element.destroy();
      element.owner = null;
    });
  },
  draw:function(vl /* vector layer*/){
    if(!this._feature){
      this.updateAllProps();
      this._feature = new ol.Feature();
      vl.addFeature(this._feature);
    }

    $.each(this.geoElements._value,function(key,element){
      element.draw(vl);
    });
  },
  redraw:function(){
    /*if(!this._feature){
      return;
    }*/
    //update the position of this geoelement
    var new_pos = [0,0,0];
    //In tree structure, the owner of this element is a gamestatelist, and thus the real owner is the owner of the gamestatelist
    if(!this.owner || !this.owner.owner || ! this.owner.owner._realPos){
      return;
    }
    var p_pos = this.owner.owner._realPos;
    //if(this._name=='inner') debugger;
    //1: transform the relative position by the rotaiton of the parent
    var cosAngle = Math.cos(p_pos[2]);
    var sinAngle = Math.sin(p_pos[2]);
    new_pos[0] = this._pos[0]*cosAngle - this._pos[1]*sinAngle;
    new_pos[1] = this._pos[1]*cosAngle + this._pos[0]*sinAngle;
    //2: add the parents position
    new_pos[0]+= p_pos[0];
    new_pos[1]+= p_pos[1];
    //adjust the final rotation to be the sum of the two rotations
    new_pos[2] = this._pos[2] + p_pos[2];

    this._realPos = new_pos;
    //console.log('realpos:'+this._name,this._realPos);
    //if a geom exists, transform it cloned into the feature
    if(this._geom && this._feature){
      var g = this._geom.clone();
      g.translate(this._realPos[0],this._realPos[1]);
      g.rotate(this._realPos[2],this._realPos);
      this._feature.setGeometry(g);
    }

    $.each(this.geoElements._value,function(key,element){
      element.redraw();
    });
  },
  update:function(props){ //update the following properties by looking up the values
    //if(!this._feature) return;
    //this._super(props);
    var that = this;
    $.each(props,function(prop,val){
      if(val === undefined || val === null){
        console.log('prop:'+prop+' is '+val+' in '+this._name);
        return;
      }
      val = val._value || val;
      switch(prop){
        case 'pos':
          that._pos[0] = val.x;
          that._pos[1] = val.y;
          break;
        case 'rotation':
          that._pos[2] = val;
          break;
      }
    });
    this.redraw();
  },
});
GeoElement.fromObject = function(obj){
  switch(obj.type){
    case 'circle':
      return new CircleElement(obj);
    case 'GeoElement':
      return new GeoElement(obj);
    case 'listElement':
      return new ListElement(obj);
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

GeoElement.extend('GeolistElement',{
  list:null,
  _wrapperels:null,
  _elements_obj:null,
  init:function(obj){
    this._elements_obj = obj.elements;
    delete(obj.elements);
    this._super(obj);
    this.registerProp('list',obj.list);

    this._wrapperels = [];
  },
  update:function(props){
    this._super(props);
    if(props['list'] !== undefined){
      this.redraw(props['list']);
    }
  },
  draw:function(vl){
    //Dont call super, as this element in itself should NOT have a feature
    if(!this._geom){
      this._geom = vl; //Use geom to store vector layer
      this._update('list');
    }
  },
  redraw:function(new_list){

    if(!this._geom) return;
    //recalculate the position of the list object
    this._super();

    if(this.list && this.list != new_list){

      $.each(this._wrapperels,function(i,k){
        k.destroy();
        k.owner = null;
      });
      this._wrapperels = [];
      //clear the list
    }

    if(new_list){
      this.list = new_list;
    }

    if(this.list){
      var that = this;

      $.each(this.list._value,function(i,k){

        //if already existing, dont create a new wrapper element

        for(var l = 0; l < that._wrapperels.length; l++){
          if(that._wrapperels[l].listel == k){
            debugger;
            return;
          }
        };

        //TODO: how to describe multilevel list elements?

        var wrapper = new GeolistElElement(k,that);
        wrapper.owner = that;
        wrapper.draw(that._geom /*the vector source*/);
        /*$.each(that.elements._value,function(j,el){
          var e = el.clone();
          e.draw(that._dom);
        });*/
        that._wrapperels.push(wrapper);
      });
    }
  }
});
/**
 * Invisible wrapper for the elements of geo list elements
 */
ViewElement.extend('GeolistElElement',{
  listel:null, //the input object, this element wraps
  list:null, //the listelement containing this element (same as owner)
  init:function(listel, list){
    this._super({elements:list._elements_obj});
    this.listel = listel;
    this.list = list;
  },
  draw:function(vl){
    if(!this._geom){
      this._geom = vl; //store it instead of geometry as we dont need an actual wrapper
      var that = this;
      $.each(this.elements._value,function(j,el){

        var e = el.clone();
        e.owner = that;

        e.draw(that._geom);
      });
    }
  },
  get:function(name){
    switch(name){
      case 'listel':
        return this.listel;
    }
  }
});



GeoElement.extend('CircleElement',{
  //radius:null,
  _geom:null,
  init:function(obj){
    /*if(!window.circles) window.circles = [];
    window.circles.push(this);*/
    //if(obj.pos.length ==2) debugger;
    this._super(obj);

    this.registerProp('radius',obj.radius,1);

    this._sourceObj = obj;
  },
  draw:function(vl /* vector layer*/){
    //if(this._name=='inner') debugger;
    this._super(vl);

    if(!this._geom){
      //var pos = this.getProp('pos');
      var r = this.getProp('radius');

      this._geom = new ol.geom.Circle([0,0],r);
    }
  },
  update:function(props){ //update the following properties by looking up the values

    this._super(props);

    var that = this;
    $.each(props,function(prop,val){
      //val = val !== null ? val._value || val : null;
      val = val && val._value ? val._value : val;
      switch(prop){
        /*case 'pos':
          that._geom.setCenter([val.x,val.y]);
          that._feature.changed();
          break;*/
        case 'radius':
          if(!this._geom) return;
          that._geom.setRadius(val);
          break;
      }
    });


  },
});


/**
 * GeoboxElement
 */
 GeoElement.extend('BoxElement',{
   //radius:null,
   _geom:null,
   init:function(obj){
     /*if(!window.circles) window.circles = [];
     window.circles.push(this);*/
     //if(obj.pos.length ==2) debugger;
     this._super(obj);

     this.registerProp('width',obj.width,10);
     this.registerProp('height',obj.height,10);

     this._sourceObj = obj;
   },
   draw:function(vl /* vector layer*/){
     //if(this._name=='inner') debugger;
     this._super(vl);

     if(!this._geom){
       //var pos = this.getProp('pos');
       var w = this.getProp('width');
       var h = this.getProp('height');
       this._geom = new ol.geom.Polygon(this._calculateCoordinates(w,h));
     }
   },
   update:function(props){ //update the following properties by looking up the values

     this._super(props);

     var that = this;

     if(props['width'] !== undefined || props['height'] !== undefined){
       var w = props['width'] || this.get('width');
       var h = props['height'] || this.get('height');

       if(this._geom){
         this._geom.setCoordinates(this._calculateCoordinates(w,h));
         this.redraw();
       }
     }

   },
   _calculateCoordinates:function(w,h){
     //returns an array of an array with array coordinates
     return [[[-.5*w,-.5*h],[.5*w,-.5*h],[.5*w,.5*h],[-.5*w,.5*h],[-.5*w,-.5*h]]];
   }
 })
