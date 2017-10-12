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
  registerProp(name,s,d/*default*/,t/*type*/){
    //only clients should register properties
    if(!(window||global)._client){
      return;
    }

    this._props[name] = new GameProperty(s,d,t);
  },
  _update:function(name){ //internal update
    if(this._destroyed){
      //console.log('destroyed, not updating:'+name);
      return;
    }
    var val = this.getProp(name);

    this.update({[name]:val});
  },
  attachHooks:function(){
    //Check for special types of hooks
    if(this._hooks && this._hooks['volumeup']){
      var ah = {
        v:ScopeRef._gs.currentPlayer, //the variable
        t:'volumeup',
        h:function(){
          if(this._inside){
            this.triggerHook('volumeup');
          }
        }.bind(this)
      };
      ScopeRef._gs.currentPlayer.addHook(ah.t,ah.h);
      this._attachedHooks.push(ah);
    }
  },
  update:function(props){

  },
  updateAllProps: function(){
    var that = this;
    $.each(this._props,function(k,p){
      that._update(k);
    });
  },
  getProp:function(name,primitive /* is the returned value forced to be primitive */){

    var val = null;
    var gp = this._props[name]; //the game property

    if(gp instanceof GameProperty && gp.r !== null){
      if(gp.r instanceof ScopeRef){
        ScopeRef._setScope(this);
        val = gp.r.eval();
      } else {
        val = gp.r;
      }
    } else
    if(gp instanceof GameProperty){ //if first time and reference (r) not set
      //evaluate the string
      //if(name=='pos') debugger;
      ScopeRef._setScope(this);

      if(gp.s === null || gp.s === undefined){
        val = gp.r = gp.d; //default
      } else {
        var r = ScopeRef._evalString(gp.s, gp.t);

        if(r.inf.vars.length == 0 && r.inf.constant){
          if(r.value !== undefined && r.value !== null){
            gp.r = r.value;
            val =  r.value;
          } else {
            ScopeRef._evalString(gp.s, gp.t);
            val = gp.r = gp.d; //default

          }
        } else {
          gp.r = r.ref;
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

    if(primitive && val instanceof Variable){
      val = val._value;
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
    //console.log('get on ClientElement:'+ref);
  },
  clone:function(){

    //clone basic properties
    var c = $.extend(Object.create(Object.getPrototypeOf(this)),this);

    //now c.elements == this.elemnets, create a new list_var
    c.elements = new GameStateList();
    $.each(this.elements._value || {},function(k,el){
      c.elements._value[k] = el.clone();
    });
    c.elements.owner = c;

    //handle hooks
    //TODO: check if it is a problem that hooks are actually the same
    //it matches the idea that the ids are the same


    c._attachedHooks = [];
    var props = {};
    $.each(c._props || {},function(k,p){
      props[k] = $.extend(Object.create(Object.getPrototypeOf(c._props[k])),c._props[k]);

      delete(props[k].r);
    });
    c._props = props;

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
    this._super(obj);

    this.type = obj.type;
    var els = [];
    var that = this;
    $.each(obj.elements||{},function(k,el){
      var element = ViewElement.fromObject(el);
      element.owner = that;
      els.push(element);
    });
    this.elements = {_value:els};//new GameStateList(obj.elements || {},ViewElement);

    this.registerProp('show',obj.show,true);
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
  },
  update:function(props){
    if(this._dom && props['show'] != undefined){
      if(props['show']){
        this._dom.show();
      } else {
        this._dom.hide();
      }
    }
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
  init:function(obj){
    this._super(obj);
    this.registerProp('title',obj.title || 'game.name');
  },
  draw:function(c){
    if(!this._dom){
      this.attachHooks();
      var dom = $('<div class="page"><header class="header"><a class="left exit">&lt</a><div class="title"></div></header><content class="inner"></content><footer class="footer"></footer></div>').css({

      }).addClass('page');

      this._dom = dom;
      c.append(this._dom);

      var title = this.getProp('title');
      if($.type(title)== 'object'){
        title = title._value;
      }
      dom.find('.header .title').text(title);
      dom.find('.header .exit').on('click',function(){
        if(confirm('sure exit?')){
          //todo: add nice exit
          app.exitGame();
        }
      });
      var inner = dom.find('.inner');
      $.each(this.elements ? this.elements._value ||{}: {},function(n,el){
        if(el instanceof BottombuttonElement){
          el.draw(dom.find('.footer'));
        } else {
          el.draw(inner);
        }
      });

    }
  },
  update:function(props){ //update the following properties by looking up the values

    if(!this._dom) return;
    var that = this;
    $.each(props,function(prop,val){

      val = $.type(val) == 'object' ? val._value : val;
      switch(prop){
        case 'title':
          if(that._dom.find('.header .title').text() != val)
            that._dom.find('.header .title').text(''+val);
      }
    });
    this._super(props);
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

      val = ($.type(val) == 'object' ? val._value : val);

      switch(prop){
        case 'text':
          if(that._dom.text() != val){
            that._dom.text(val);
          }
      }
    });
  },
  draw:function(c){
    if(!this._dom){
      this.attachHooks();
      var dom = $('<span></span>').addClass('label').css({

      });
      var val = this.getProp('text');
      val = ($.type(val) == 'object' ? val._value : val);
      dom.text(val);

      if(!this.getProp('show',true)){
        dom.hide();
      }

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
    //delete(obj.elements);
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
      this.attachHooks();
      var dom = $('<div></div>').css({

      }).addClass('list');

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
    //this._super({elements:list._elements_obj});
    this._super({});
    this.elements = list.elements;
    this.listel = listel;
    this.list = list;
  },
  draw:function(c){
    if(!this._dom){
      this.attachHooks();
      this._dom = $('<div></div>').addClass('listel');
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
      this.attachHooks();
      var dom = $('<button></button>').css({
        width:'80vw',
        display:'inline-block'
        //height:'100vh',
      }).text(this.getProp('text'));
      if(!this.getProp('show',true)){
        dom.hide();
      }
      var that = this;
      dom.on('click',function(e){
        that.triggerHook('click');
      });
      this._dom = dom;
    }

    c.append(this._dom);
  }
});

ViewElement.extend('BottombuttonElement',{
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
      this.attachHooks();
      var dom = $('<button></button>').css({

      }).addClass('bottom-button')
        .text(this.getProp('text'));
      if(!this.getProp('show',true)){
        dom.hide();
      }
      var that = this;
      dom.on('click',function(e){
        that.triggerHook('click');
      });
      this._dom = dom;
    }

    c.append(this._dom);
  }
});

ViewElement.extend('InputElement',{
  init:function(obj){
    this._super(obj);
    this.registerProp('default',obj.default,'');
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
      this.attachHooks();
      var dom = $('<input type="text" />').css({
        width:'80vw',
        display:'inline-block'

      });

      if(!this.getProp('show',true)){
        dom.hide();
      }

      var that = this;
      dom.on('change keyup',function(e){
        that.triggerHook('change');
      });
      this._dom = dom;
    }

    c.append(this._dom);
    var d = this.getProp('default',true);
    if(d!==null && this.getProp('show',true)){
      this._dom.val(d);
      this.triggerHook('change');
    }
  },
  get:function(ref){
    if(ref == 'value'){
      return this._dom.val();
    }
    return this._super(ref);
  }
});

/**
 * Element displaying a timer and how far it is
 */
ViewElement.extend('TimerElement',{
  _timer:null,
  _barDiv:null,
  init:function(obj){
    this._super(obj);
    this.registerProp('timer',obj.timer);
  },
  draw:function(c){

    if(!this._dom){
      this.attachHooks();
      var dom = $('<div></div>').addClass('timer').css({

      });
      if(!this.getProp('show',true)){
        dom.hide();
      }

      this._barDiv = $('<div></div>').addClass('bar').css({

      });
      dom.append(this._barDiv);

      this._timer = this.getProp('timer');
      this._dom = dom;
    }
    this.updateBar();
    c.append(this._dom);
  },
  updateBar:function(){
    if(!this._timer){
      this._barDiv.css({
        width:'100%',
        background:'gray'
      });
      this._barDiv.addClass('disabled');
    } else {
      this._barDiv.removeClass('disabled');
      //debugger;
      var ratioDone = this._timer.get('ratioDone');
      //console.log(''+(100*ratioDone)+'%');
      this._barDiv.stop().css({
        width:''+(100*ratioDone)+'%',
        //background:'blue'
      }).animate({
        width:'100%'
      },(1-ratioDone)*this._timer.get('duration'),'linear');

    }
  },
  update:function(props){
    if(props['timer'] !== undefined){
      this._timer = props['timer'];
      this.updateBar();
      delete(props['timer']);
    }
    this._super(props);
  }
});


/**
 * Element displaying a slider to choose a number
 */
ViewElement.extend('SliderElement',{
  _min:null,
  _max:null,
  _knobDiv:null,
  _val:null,
  init:function(obj){
    this._super(obj);

    this._min = obj.min;
    this._max = obj.max;

    this.registerProp('default',obj.default,0);

  },
  draw:function(c){

    if(!this._dom){
      this.attachHooks();
      var dom = $('<div></div>').addClass('slider').css({
      });
      if(!this.getProp('show',true)){
        dom.hide();
      }

      var that = this;
      this._knobDiv = $('<div></div>').addClass('knob').css({

      }).on('touchstart',this.startDrag.bind(this));

      dom.append(this._knobDiv);

      this._dom = dom;
    }
    this._val = this.getProp('default');
    this.updateSlider();
    c.append(this._dom);
  },
  startDrag:function(e){
    if(e.originalEvent.touches.length != 1){
      return;
    }

    this._dragging = e.originalEvent.touches[0].clientX - this._knobDiv.position().left;

    $(document.body).on('touchend.drag touchcancel.drag',this.stopDrag.bind(this));

    $(document.body).on('touchmove.drag',this.handleDrag.bind(this));
  },
  stopDrag:function(e){
    $(document.body).off('.drag');
  },
  handleDrag:function(e){
    var d = e.originalEvent.touches[0].clientX;

    var left = (d - this._dragging);

    var total_width = this._dom.width() - this._knobDiv.width();

    left = Math.max(left,0);
    left = Math.min(left,total_width);

    var val = this._min + (left/total_width)*(this._max - this._min);

    this._val = val;
    this._knobDiv.css({
      left:left
    });

    this.triggerHook('change');

    //this.updateSlider();
    //debugger;
  },
  updateSlider:function(){
    this._knobDiv.css({
      left:100*(this._val - this._min)/(this._max - this._min)+'%'
    });
  },
  update:function(props){
    if(props['timer'] !== undefined){
      this._timer = props['timer'];
      this.updateBar();
      delete(props['timer']);
    }
    this._super(props);
  },
  get:function(ref){
    switch(ref){
      case 'value':
        return ~~this._val;
    }
  }
});


ViewElement.extend('MapElement',{
  geoElements:[],
  _realPos: null, //x,y,r clockwise in radians
  init: function(obj){
    this._realPos = [0,0,0];
    this._super(obj);
    this.geoElements = new GameStateList(obj.geoElements || {},GeoElement);
    this.geoElements.owner = this;
    this.registerProp('center',obj.center);
    this.registerProp('heading',obj.heading,0);
    this.registerProp('width',obj.width,100);
    this.registerProp('height',obj.height,100);
    this.registerProp('zoom',obj.zoom,20);
    //this.registerProp('minzoom',obj.minzoom,19);
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
      val = val ? (val._value || val) : null;
      switch(prop){
        case 'center':
          var s = that._map.getSize();
          //that._map.getView().centerOn([val.x,val.y],s,[s[0]*.5,s[1]*0.66]);
          if(!val){
            break;
          }
          that._map.getView().centerOn([val.x,val.y],s,[s[0]*.5,s[1]*0.5]);
          break;
        case 'heading':
          that._map.getView().setRotation(val);
          break;
        case 'zoom':
          if(val == 'fit'){
            //debugger;
            var ext = ol.extent.createEmpty();
            that._vectorSource.forEachFeature(function(ft){
              var g = ft.getGeometry();
              if(g){

                ol.extent.extend(ext,g.getExtent());
                //console.log('added:'+ft.el._name,ext);
              }
            });
            if(window.draw_extent){
              var new_g = new ol.geom.Polygon(
                [[[ext[0],ext[1]],
                [ext[0],ext[3]],
                [ext[2],ext[3]],
                [ext[2],ext[1]],
                [ext[0],ext[1]]]]);
              //debugger;
              if(!that._extentfeature){
                that._extentfeature = new ol.Feature({
                  geometry:new_g
                });
                that._vectorSource.addFeature(that._extentfeature);
              }

              that._extentfeature.setGeometry(
                new_g
              );
            }

            //only apply if not infinity
            if(ext.filter(isFinite).length == 4){
              that._map.getView().fit(ext,{
                maxZoom: 19,
                constrainResolution:false,
                size:that._map.getSize()
              });
            }
          } else
          if($.type(val) == 'object' && val.x !== undefined && val.y !== undefined){

            //var ext = ol.extent.createEmpty();
            var center = that._map.getView().getCenter();

            var ext = ol.extent.boundingExtent([
              [center[0] - 0.5*val.x,center[1] - 0.5*val.y],
              [center[0] + 0.5*val.x,center[1] + 0.5*val.y]
            ]);
            //ol.extent.extend(ext,[center[0] - 0.5*val.x,center[1] - 0.5*val.y]);
            //ol.extent.extend(ext,[center[0] + 0.5*val.x,center[1] + 0.5*val.y]);
            that._map.getView().fit(ext,{
              constrainResolution:false,
              size:that._map.getSize()
            });
          } else {


            that._map.getView().setZoom(val);
          }
          break;
      }
    });
  },
  draw:function(c){
    if(!this._dom){
      this.attachHooks();
      var dom = $('<div></div>');
      dom.css({
        verticalAlign:'middle',
        textAlign:'center',
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        alignContent:'center',
        flexWrap:'wrap'
      });
      if(this.owner instanceof ViewElement){
        var w = this.getProp('width');
        var h = this.getProp('height');
        dom.css({
          width:''+w+'vw',
          height:''+h+'vh'
        });
      } else {
        dom.css({
          position:'absolute',
          top:0,
          left:0,
          width:'100vw',
          height:'100vh',
        });
      }

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
        controls: new ol.Collection([]),
        interactions:new ol.Collection([new ol.interaction.PinchZoom()])/*ol.interaction.defaults({
          dragPan:false
        })*/
      });

      //TODO:remove this, as it is for debug
      window.m = this;

      //create the vector layers
      this._vectorSource = new ol.source.Vector({
        //TODO:cannot dissable the spatial index? This is caused byt the call to getExtend, that does not work correctly:-)
        //useSpatialIndex:false //sometimes the rbush used for the spatial tree fails
      });
      this._vectorLayer = new ol.layer.Vector({
        source:this._vectorSource,
        style:function(feature,resolution){
          if(feature.el instanceof SvgElement){
            var scale = feature.el.getProp('scale');
            feature.el._style.getImage().setScale(scale/resolution);
            return feature.el._style;
          }
        }
      });
      map.addLayer(this._vectorLayer);
      this._map = map;
      c.append(dom);

      this._vectorLayer.on('precompose',function(event){
        //let all timers change their value

        $.each(ScopeRef._getGameState().currentPhase._value._runningTimers,function(k,t){
          t.triggerHook('change');
        });

        Hookable._handleTriggerQueue();
      });

      /* Test feature
      var test_c = new ol.geom.Circle([0,0],10);
      var test_f = new ol.Feature({
        geometry:test_c
      });
      this._vectorSource.addFeature(test_f);
      */
      this._map.updateSize();

      var that = this;

      $.each(this.geoElements ? this.geoElements._value ||{}: {},function(n,el){
        el.draw(that._vectorSource);
        el.redraw(); //fire twice, the first on initialises geometries, the second the position
      });


      /*$.each(this.elements ? this.elements._value ||{}: {},function(n,el){
        el.draw(dom);
      });*/
      this._dom = dom;

      //TODO: why is it needed to update all props here?
      this.updateAllProps();

      this.triggerHook('change');

      //register method for checking if inside any elements
      ScopeRef._gs.currentPlayer.get('pos').addHook('change',function(){
        that.checkInside(this);
      }); //End of enter leave tracking

      //fire it the first time
      this.checkInside(ScopeRef._gs.currentPlayer.get('pos'));


      //draw normal elements
      var d = $('<div></div>').css({
        position:'absolute',
        top:0
      });
      $.each(this.elements ? this.elements._value ||{}: {},function(n,el){
        el.draw(d);
      });
      var c = new ol.control.Control({element: d[0]});
      that._map.addControl(c);
    }


    var c = this.getProp('center');
    this.update({center:c});

  },
  /**
   * Method for tracking enter and leaves on elements. Currently only actual elements can be tracked thus fx entering a child element is not the same as entering an element.
   Every time the pos of the player is changing, a list of features at the new coordinate is used to trigger "enter" hooks. A _inside attr on all the elements is set to a time variable used for all checks in this update. All inside elements are stored in a container array.
   When done all elements in the this container is checked, and if the _inside attr is less than the current time "leave" hooks are triggered and the inside_elements are updated.

   forEachFeatureInExtent - can be used with the last point to find all elements that has been touched since.

   getFeaturesAtCoordinate
   forEachFeatureAtCoordinateDirect
   forEachFeatureInExtent
   gets the geometry and:
   intersectsCoordinate (geometry)
   calls containsXY
   on circle this seems to be correct?

   */
  _inside_elements :null,
  checkInside: function(pos){
    if(this._inside_elements === null){
      this._inside_elements = [];
    }
    //console.log('checking inside for pos:',pos);
    var t = ScopeRef._gs.getTime(); //use current milliseconds to check if still inside an element

    //Fix since it seems that the rbush algorithm does not correctly find all elements
    //var fts = this._vectorSource.getFeaturesAtCoordinate([pos._value.x,pos._value.y]);
    var fts = [];
    var all_fts = this._vectorSource.getFeatures();
    for(var i = 0;i<all_fts.length;i++){
      var g = all_fts[i].el && all_fts[i].el._hitGeom ? all_fts[i].el._hitGeom : all_fts[i].getGeometry();
      if(!g){
        //TODO:this can happen for wrapper elements. They should not create features, but it does not matter that much
        //console.log('no geometry for feature');

      } else
      if (g.intersectsCoordinate([pos._value.x,pos._value.y])) {
        fts.push(all_fts[i]);
        //console.log('intersects:'+fts[i].el._name);
      } else {
        //console.log('not intersects:'+fts[i].el._name);
      }
    }

    //use source.vector.forEachFeatureInExtent
    //or source.vector.forEachFeatureIntersectingExtent


    var that = this;
    $.each(fts,function(i,ft){
      if(!ft.el){
        console.log('feature without el');
        return;
      }
      if(!ft.el._inside){
        //console.log('entering feature:'+ft.el._name);
        ft.el.triggerHook('enter');
        ft.el.triggerHook('change');
        that._inside_elements.push(ft.el);
      } else {
        //console.log('moving inside feature:'+ft.el._name);
      }
      ft.el._inside = t; //update inside time
    });

    var new_inside_els = [];
    $.each(this._inside_elements,function(i,el){
      if(el._inside < t){
        el._inside = false;
        //console.log('leaving feature:'+el._name);
        el.triggerHook('leave');
        el.triggerHook('change');
      } else {
        new_inside_els.push(el);
      }
    });
    this._inside_elements = new_inside_els;
    Hookable._handleTriggerQueue();
  },
  get:function(ref){
    switch(ref){
      case 'dragging':
        if(!this._drag && this._dom){
          //add events:
          this._drag = true;
          this._dom.on('touchstart touchmove touchend',function(event){
            console.log(event.type);
            var _dragging = event.type != 'touchend';

            if(_dragging){
              this._drag = [event.originalEvent.touches[0].pageX,event.originalEvent.touches[0].pageY];
            } else {
              this.triggerHook('dragend');
              Hookable._handleTriggerQueue();
            }


            this._dragging = _dragging;
            this.triggerHook('change');
            Hookable._handleTriggerQueue();
          }.bind(this));
        }
        return !!this._dragging;
        break;
      case 'dragpos':
        if(!this.get('dragging')){
          return null;
        }

        var p = this._map.getCoordinateFromPixel(this._drag);
        //console.log(p);
        return {x:p[0],y:p[1]};
        break;
      default:
        this._super(ref);
    }
  },
  destroy:function(){
    this._super();
    $.each(this.geoElements._value,function(key,element){
      element.destroy();
      element.owner = null;
    });
  }
});

/**
 * General definition of vector based geo element
 */
ViewElement.extend('GeoElement',{
  geoElements:[],
  _feature:null, //The actual feature being displayed for this geoelement, added to the vector layer
  _geom:null, //The original geometry (or geometry collection) that is cloned and set as the geometry of the feature when changed
  _pos:null, //The relative position based on translation and rotation, relative to its parent, format [x,y,r]
  _realPos:null, //The real position and rotation on the map. This is applied to the original _geom
  _style:null,
  init: function(obj){
    this._super(obj);
    this.geoElements = new GameStateList(obj.geoElements || {},GeoElement);
    this.geoElements.owner = this;
    this._pos = [0,0,0];
    this.registerProp('pos',obj.pos);
    this.registerProp('rotation',obj.rotation,0);
    this.registerProp('text',obj.text,null);
    this.registerProp('color',obj.color,[0,0,0,0.5],ScopeColor);
    this.registerProp('fill',obj.fill,[255,0,0,0.3],ScopeColor);
    this.registerProp('zIndex',obj.zIndex,0);
  },
  getClientHooks: function(hooks){
    this._super(hooks);
    $.each(this.geoElements._value,function(key,element){
      element.getClientHooks(hooks);
    });
  },
  destroy:function(){
    this._super();
    if(this._feature && this._vl){
      //remove it
      //console.log('removing feature');
      this._vl.removeFeature(this._feature);
      delete(this._feature.el);
      this._feature = null;
      this._geom = null;
    }

    $.each(this.geoElements._value,function(key,element){
      element.destroy();
      element.owner = null;
    });
  },
  draw:function(vl /* vector layer*/){
    if(!this._feature){
      this.attachHooks();
      this._feature = new ol.Feature();
      this._feature.el = this;
      if(this._style){
        this._feature.setStyle(this._style);
      }
      this._vl = vl;
      vl.addFeature(this._feature);
      //this.updateAllProps();
    }

    $.each(this.geoElements._value,function(key,element){
      element.draw(vl);
    });
  },
  redraw:function(){
    /*if(!this._geom){
      console.log('redrawing without _geom')
      return;
    }*/
    /*if(!this._feature){
      return;
    }*/
    //update the position of this geoelement
    var new_pos = [0,0,0];
    //In tree structure, the owner of this element is a gamestatelist, and thus the real owner is the owner of the gamestatelist
    if(!this.owner || !this.owner.owner || ! this.owner.owner._realPos){
      //debugger;
      return;
    }
    this.updateStyle();

    var p = this.getProp('pos');
    var r = this.getProp('rotation');
    if(p !== undefined && p !== null){
      if(p._value){
        p = p._value;
      }
      this._pos[0] = p.x;
      this._pos[1] = p.y;

    }
    if(r !== undefined && r !== null){
      this._pos[2] = r;
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

      if(window.draw_extent){
        //overwrite the geometry with its extent
        var ext = g.getExtent();
        var new_g = new ol.geom.Polygon(
          [[[ext[0],ext[1]],
          [ext[0],ext[3]],
          [ext[2],ext[3]],
          [ext[2],ext[1]],
          [ext[0],ext[1]]]]);
        //debugger;
        this._feature.setGeometry(
          new_g
        );
      }
    }

    $.each(this.geoElements._value,function(key,element){
      element.redraw();
    });
  },
  updateStyle:function(){
    var text = this.getProp('text');
    var color = this.getProp('color');
    var fill = this.getProp('fill');
    var zIndex = this.getProp('zIndex');

    if(text && text._value){
      text = text._value;
    }
    if(fill && fill._value && $.type(fill._value) == 'string'){
      fill = new ScopeColor(fill._value);
      fill = fill._value;
    }
    if(fill && fill._value){
      fill = fill._value;
    }


    this._style = new ol.style.Style({
      fill: new ol.style.Fill({color:fill}),
      stroke: new ol.style.Stroke({
        color:color,
        width:2
      }),
      zIndex:zIndex
    });


    if(text !== null){
      this._style.setText(new ol.style.Text({
        text:''+text,
        font: 'Courier New, monospace',
        scale:'2.0',
        fill:{
          color:"black"
        }/*,
        stroke:{
          color:"black",
          width:0.0
        }*/
      }));
    } else {
      this._style.setText(new ol.style.Text({

        font: 'Courier New, monospace',
        scale:'1'
      }));
    }

    if(this._feature){
      this._feature.setStyle(this._style);
    }

  },
  update:function(props){ //update the following properties by looking up the values

    //if(!this._feature) return;
    //this._super(props);
    var that = this;
    $.each(props,function(prop,val){
      if(val === undefined || val === null){
        //debugger;
        console.log('prop:'+prop+' is '+val+' in '+that._name);
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
        case 'text':
          that.updateStyle();
          break;
      }
    });
    this.redraw();
  },
  clone: function(){
    var c = this._super();
    c.geoElements = new GameStateList();
    c.geoElements.owner = c;
    $.each(this.geoElements._value || {},function(k,el){
      c.geoElements._value[k] = el.clone();
      c.geoElements._value[k].owner = c.geoElements;
    });

    return c;
  },
  get:function(ref){
    switch(ref){
      case 'isinside':
        return !!this._inside;
    }
    return this._super(ref);
  }
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
    //delete(obj.elements);
    this._super(obj);
    this.registerProp('list',obj.list);

    this._wrapperels = [];
  },
  //TODO: should contain a copy of the internal elements to register hooks
  //This creates a problem if the hooks are recreated when creating a new list element, as these hooks will have new id's not triggerable on the server
  getClientHooks: function(hooks){
    this._super(hooks);

    var temp = new GameStateList(this._elements_obj || {},GeoElement);
    $.each(temp._value,function(key,element){
      element.getClientHooks(hooks);
    });
  },
  update:function(props){

    if(props['list'] !== undefined){
      this.setList(props['list']);
    }
    this._super(props);
  },
  setList: function(new_list){
    if(this.list && this.list != new_list){
      //a new list, clean it all
      $.each(this._wrapperels,function(i,k){
        k.destroy();
        k.owner = null;
      });
      this._wrapperels = [];
      //clear the list
    }

    this.list = new_list;
    var t = ScopeRef._gs.getTime();
    var that = this;
    $.each(this.list._value || {},function(i,k){
      //if already existing, dont create a new wrapper element
      for(var l = 0; l < that._wrapperels.length; l++){
        if(that._wrapperels[l].listel == k){
          that._wrapperels[l].updated_time = t;
          that._wrapperels[l].index = i; //update the index to the position in the list
          that._wrapperels[l].redraw(); //redraw:-)
          //By returning this wrapper el will stay the same
          return;
        }
      };

      //TODO: how to describe multilevel list elements?

      var wrapper = new GeolistElElement(k,that,i);
      wrapper.owner = that;
      wrapper.draw(that._geom /*the vector source*/);
      /*$.each(that.elements._value,function(j,el){
        var e = el.clone();
        e.draw(that._dom);
      });*/
      wrapper.updated_time = t;
      that._wrapperels.push(wrapper);
    });

    //clean out old wrapper els not used
    var new_wrapper_els = [];
    for(var l = 0; l < this._wrapperels.length; l++){
      if(this._wrapperels[l].updated_time < t){
        //remove it
        this._wrapperels[l].destroy();
      } else {
        new_wrapper_els.push(this._wrapperels[l]);
      }
    }
    this._wrapperels = new_wrapper_els;
  },
  draw:function(vl){
    //console.log('drawing geolist', this.list);
    //Dont call super, as this element in itself should NOT have a feature
    if(!this._geom){
      this.attachHooks();
      this._geom = vl; //Use geom to store vector layer
      this.setList(this.getProp('list')); //trigger setting the list
    }
  },
  redraw:function(){
    //console.log('redrawing geolist', this.list);
    if(!this._geom) return;

    //recalculate the position of the list object
    this._super();

    $.each(this._wrapperels || [],function(i,w){
      w.redraw();
    });
  },
  get:function(ref){
    switch(ref){
      case 'count':
        return this.list ? this.list.get('count') : null;
    }
    return this._super(ref);
  },
  destroy:function(){
    this._super();

    for(var i = 0;i<this._wrapperels.length;i++){
      this._wrapperels[i].destroy();
    }
    this._wrapperels = null;
  }
});
/**
 * Invisible wrapper for the elements of geo list elements
 */
ViewElement.extend('GeolistElElement',{
  listel:null, //the input object, this element wraps
  list:null, //the listelement containing this element (same as owner)
  geoels:null, // list of actual geoelements belonging to this element
  index: null, // the index in the list of this elemets
  init:function(listel, list, index){

    //initially the elements is a reference to the parents elements. When drawn they will be cloned (hooks not)
    this._super({});
    this.elements = list.elements;

    //Old solution was to redo all the elements when creating a wrapper element here
    //this._super({elements:list._elements_obj});

    this.listel = listel;
    this.list = list;
    this.geoels = [];
    this.index = index;
  },
  draw:function(vl){
    if(!this._geom){
      this.attachHooks();
      this._geom = vl; //store it instead of geometry as we dont need an actual wrapper
      var that = this;
      $.each(this.elements._value,function(j,el){

        var e = el.clone();
        e.owner = that;

        e.draw(that._geom); //where _geom is a vector layer
        that.geoels.push(e);
      });

    }
  },
  redraw:function(){
    $.each(this.geoels,function(i,e){
      e.redraw();
    })
    //console.log('redrawing geolist el',this._geom);
  },
  get:function(name){
    switch(name){
      case 'listel':
        return this.listel;
      case 'index':
        return this.index;
      case 'list':
        return this.list;
    }
  },
  destroy:function(){

    //this._super(); // not normal element
    for(var i = 0;i<this.geoels.length;i++){
      this.geoels[i].destroy();
    }
    this.elements = null;
    this.geoels = null;
    this.listel = null;
    this.list = null;

  }
});



GeoElement.extend('CircleElement',{
  //radius:null,
  /*_geom:null,*/
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
      if(r instanceof Variable){
        r = r._value;
      }
      this._geom = new ol.geom.Circle([0,0],r);
    }
  },
  update:function(props){ //update the following properties by looking up the values

    var that = this;
    $.each(props,function(prop,val){
      //val = val !== null ? val._value || val : null;
      val = val && val._value ? val._value : val;
      switch(prop){
        case 'radius':
          if(!that._geom) return;
          that._geom.setRadius(val);
          break;
      }
    });
    this._super(props);
  },
});


GeoElement.extend('SvgElement',{
  //radius:null,
  /*_geom:null,*/
  _hitGeom:null,
  svg:null,
  init:function(obj){

    this._super(obj);

    this.svg = obj.svg;
    this.registerProp('radius',obj.radius,10);
    this.registerProp('scale',obj.scale,15/100);

    this._sourceObj = obj;
  },
  draw:function(vl /* vector layer*/){
    //if(this._name=='inner') debugger;

    this._super(vl);

    if(!this._geom){
      var radius = this.getProp('radius');
      this._hitGeom = new ol.geom.Circle([0,0],radius);
      this._geom = new ol.geom.Point([0,0]);
    }
  },
  updateStyle:function(){

    this._super();
    //NOT setting the style
    if(!this._feature){
      return;
    }
    this._feature.setStyle(null);

    /*var svg = '<svg width="100" height="100" version="1.1" xmlns="http://www.w3.org/2000/svg">'
      + '<path stroke="red" id="svg_1" fill="none" stroke-width="4" d="m42.2952,54.35156c0,0 -1.91882,0 -1.91882,0c0,4.36263 1.91882,8.72526 4.79705,8.72526c7.67528,0 14.39114,-4.36263 14.39114,-8.72526c0,-10.47031 -6.71587,-17.45052 -14.39114,-17.45052c-13.43173,0 -23.98524,6.98021 -23.98524,17.45052c0,13.96042 10.55351,26.17578 23.98524,26.17578c18.22878,0 33.57934,-12.21536 33.57934,-26.17578c0,-20.0681 -15.35055,-34.90104 -33.57934,-34.90104c-23.98524,0 -43.17343,14.83294 -43.17343,34.90104c0,23.5582 19.18819,43.6263 43.17343,43.6263c28.78229,0 52.76753,-20.0681 52.76753,-43.6263c0,-29.66588 -23.98524,-52.35156 -52.76753,-52.35156"/>'
      + '</svg>';
    */

    var scale = this.getProp('scale');
    var rotation = this._realPos ? this._realPos[2]: 0;

    //console.log(rotation);

    if(this._style.getImage()){
      this._style.getImage().setScale(scale);
      this._style.getImage().setRotation(rotation);
    } else {
      this._style.setImage(new ol.style.Icon({
        opacity: 1,
        src: 'data:image/svg+xml;utf8,' + this.svg,
        rotation:rotation,
        scale: scale,
        snapToPixel: false //removes jittering
      }));
    }
    if(this._feature){
      //this._feature.setStyle(this._style);
    }

  },
  update:function(props){ //update the following properties by looking up the values

    var that = this;
    $.each(props,function(prop,val){
      //val = val !== null ? val._value || val : null;
      val = val && val._value ? val._value : val;
      switch(prop){
        case 'radius':
          if(!that._geom) return;
          that._geom.setRadius(val);
          break;
      }
    });
    this._super(props);
  },
});



/**
 * GeoboxElement
 */
 GeoElement.extend('BoxElement',{
   //radius:null,
   /*_geom:null,*/
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
     //create the geom first
     if(!this._geom){
       //var pos = this.getProp('pos');
       var w = this.getProp('width');
       var h = this.getProp('height');
       this._geom = new ol.geom.Polygon(this._calculateCoordinates(w,h));
     }

     //call super to create the feature
     this._super(vl);


     //console.log('drawing box', this._geom, this._feature);
   },
   redraw:function(){

     this._super();
     //console.log('redrawing box', this._geom, this._feature);
   },
   update:function(props){ //update the following properties by looking up the values

     this._super(props);

     var that = this;

     if(props['width'] !== undefined || props['height'] !== undefined){
       var w = props['width'] || this.getProp('width');
       var h = props['height'] || this.getProp('height');
       //console.log('drawing');
       if(this._geom){
         this._geom.setCoordinates(this._calculateCoordinates(w,h));
         this.redraw();
       }
     }

   },
   _calculateCoordinates:function(w,h){
     if(w instanceof Variable){
       w = w._value;
     }
     if(h instanceof Variable){
       h = h._value;
     }
     //returns an array of an array with array coordinates
     return [[[-.5*w,-.5*h],[.5*w,-.5*h],[.5*w,.5*h],[-.5*w,.5*h],[-.5*w,-.5*h]]];
   }
 })
