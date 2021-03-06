/**
 * Basic objects
 */

 //Client game engine

 /* Simple JavaScript Inheritance
  * By John Resig https://johnresig.com/
  * MIT Licensed.
  */
 // Inspired by base2 and Prototype
 (function(){
   var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

   /**
     * JavaScript Rename Function
     * @author Nate Ferrero
     * @license Public Domain
     * @date Apr 5th, 2014
     */
    /*var renameFunction = function (name, fn) {
        return (new Function("return function (call) { return function " + name +
            " () { return call(this, arguments) }; };")())(Function.apply.bind(fn));
    };*/

   // The base Class implementation (does nothing)
   this.Class = function(){};

   var top = this;

   // Create a new Class that inherits from this class
   Class.extend = function(className,prop) {
     var _super = this.prototype;

     // Instantiate a base class (but only create the instance,
     // don't run the init constructor)
     initializing = true;
     Class._init = true;
     var prototype = new this();
     initializing = false;
     Class._init = false;

     // Copy the properties over onto the new prototype
     for (var name in prop) {

       // Check for getters and setters
       var propertyDescriptor = Object.getOwnPropertyDescriptor(prop,name);
       if(typeof propertyDescriptor.get == "function"){

       }
       // Check if we're overwriting an existing function
       prototype[name] = typeof prop[name] == "function" &&
         typeof _super[name] == "function" && fnTest.test(prop[name]) ?
         (function(name, fn){
           return function() {
             var tmp = this._super;

             // Add a new ._super() method that is the same method
             // but on the super-class
             this._super = _super[name];

             // The method only need to be bound temporarily, so we
             // remove it when we're done executing
             var ret = fn.apply(this, arguments);
             this._super = tmp;

             return ret;
           };
         })(name, prop[name]) :
         prop[name];
     }

     // The dummy class constructor
     /*Class = function() {
         // All construction is actually done in the init method
         if(!Class._init && this.init)
         //if ( !initializing && this.init )
           this.init.apply(this, arguments);
       }*/
       eval(className+" = function(){\n"+
        "if(!Class._init && this.init)\n"+
        "this.init.apply(this, arguments);\n"+
        "}"
      );

      var c = top[className];
      c.prototype = prototype;

      // Enforce the constructor to be what we expect
      c.prototype.constructor = c;

      // And make this class extendable
      c.extend = arguments.callee;
      return;
      /*var f = new Function(
      "return function " + className + "() {\n" +
      "if(!Class._init && this.init)\n" +
      "//if ( !initializing && this.init )\n"+
        "this.init.apply(this, arguments);\n"+
      //"}\n"+
      "};"
  )();*/
     //Class2 =Class;
     // Populate our constructed prototype object
     Class.prototype = prototype;

     // Enforce the constructor to be what we expect
     Class.prototype.constructor = Class;

     // And make this class extendable
     Class.extend = arguments.callee;

     // Set the name
     //renameFunction(className,Class);

     //Object.defineProperty(Class2, 'name', { writable: true });
     //Object.defineProperty(Class2, "name", { value: className });
     //Class2.name = className;

     top[className] = Class;
     return Class;
   };
 })();

Array.prototype.remove = function(v) { this.splice(this.indexOf(v) == -1 ? this.length : this.indexOf(v), 1); }
// Hide method from for-in loops
Object.defineProperty(Array.prototype, "remove", {enumerable: false});

Array.prototype.shuffle = function(){
  var currentIndex = this.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = this[currentIndex];
    this[currentIndex] = this[randomIndex];
    this[randomIndex] = temporaryValue;
  }
};
// Hide method from for-in loops
Object.defineProperty(Array.prototype, "shuffle", {enumerable: false});

// Warn if overriding existing method
if(Array.prototype.equals)
    console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time
    if (this.length != array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;
        }
        else if (this[i] != array[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
}
// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", {enumerable: false});


Number.isNaN = Number.isNaN || function(value) {
    return value !== value;
}

 /**
  * Start of our Objects
  */


 /**
  * Almost everything is a tree object with an owner to navigate downwards
  */
Class.extend('TreeObject',{
   owner:null,
   _type:'TreeObject',
   add:function(treeEl){
     treeEl._owner = this;
   }
 });

/**
 * A Hookable is an object that can have hooks. A hook is either a Hook object, or a function.
 * Functions are used internally as events, while Hook objects executes a set of actions defined by the user.
 */
TreeObject.extend('Hookable',{
   _hooks:null,
   _type:'Hookable',
   init:function(obj){
     this._hooks = {};
     if(obj){
       this.fromObject(obj);
     }
   },
   fromObject:function(obj){
     this._hooks = new GameStateList();
     this._hooks._owner = this;
     if(!obj){return;}
     var that = this;
     $.each(obj.hooks || {},function(type,hooks){
       var hook_list = new GameStateList();

       if($.type(hooks) == 'array'){
         $.each(hooks,function(key,h){
           hook_list.add(Hookable._nextHookId++, new Hook(h));
         });
       } else
       if(hooks.actions){
         hook_list.add(Hookable._nextHookId++, new Hook(hooks));
       }
       else {
         $.each(hooks,function(key,h){
           hook_list.add(key, new Hook(h));
         });

       }
       that._hooks.add(type,hook_list);
     });
     //this.hooks = new GameStateList(obj.hooks || {},);
   },
   addHook:function(type,hook){
     if(!this._hooks[type]){
       this._hooks[type] = [];
     }
     this._hooks[type].push(hook);
     hook._owner = this;
   },
   removeHook:function(type,hook){
     if(this._hooks[type]){
       this._hooks[type].remove(hook);
     }
   },
   triggerHook:function(type){

     if(this._hooks[type]){
       var hs = this._hooks[type]._value || ($.type(this._hooks[type]) == 'array' ? this._hooks[type] : [this._hooks[type]]);

       var that = this;
       $.each(hs, function(k,hook){
         if($.type(hook) == "function"){
           Hookable._triggerQueue.push([hook,that]);//Not done right away
           //hook.apply(that); //should always be done right away
         } else {
           if((window||global)._client && hook.hasServerActions()){
             //This is a client hook that should trigger on the server to change the server state
             //collect data and send

             //Data collection
             var data = [];
             $.each(hook.vars,function(i,d){
               ScopeRef._setScope(that);

               var inf = {
                 vars:[]
               };
               var res = d.r.eval(null,inf);
               var p_id = null;
               for(var j=0;j<inf.vars.length;j++){
                 if(inf.vars[j]._id){
                   p_id = inf.vars[j]._id;
                   break;
                 }
               }
               if(p_id !== null){
                 data[i] = {
                   p:p_id
                 };
               } else {
                 data[i] = {
                   v: res
                 };
               }
             });

             //console.log(data);
             //debugger;

             (window||global)._client.registerRemoteTrigger(hook,data);
             //(window||global)._client.addCmd(hook, that);
           } else {
             Hookable._triggerQueue.push([hook,that]);
           }
         }

       });
     }
   },
   evaluate: function(scope){

   },
   getClientHooks: function(hooks){
     //debugger;
     //console.log(this.hooks);
     if(this instanceof ClientElement){
       //go through the hooks

       $.each(this._hooks._value,function(key,hook){
         $.each(hook._value,function(k,h){
           //The hasServerActions traverse should on its way collect client based references to send to the server when triggering the hook.
           if(h.hasServerActions()){

             //debugger;
             //hooks[Hookable._nextHookId++] = h;
             hooks.push(h); //now pushes so that it will be reset each time a phase is reloadet.
           }
         });
       });
     }
   }
 });
 Hookable._nextHookId = 1;
 Hookable._triggerQueue = [];
 Hookable._handleTriggerQueue = function(){
   //console.log('handling trigger queue:'+Hookable._triggerQueue.length);
   while(Hookable._triggerQueue.length){
     var h = Hookable._triggerQueue.shift();
     try{
       if($.type(h[0]) == 'function'){
          h[0].apply(h[1]);
       } else {
         h[0].trigger(h[1]);
       }
     } catch(e){
       console.log('Caught exception while handling trigger queue:',e);
     }
   }
 };


 Hookable.extend('Hook',{
   actions:null, //Action
   vars:null,
   _type:'Hook',
   init:function(obj){
     this.actions = [];
     this._super();
     this.vars = [];

     //Set this as scope root
     ScopeRef._setScope(this);
     this.fromObject(obj);


     //When creating a hook all the client based variables should be registered
     //This hook should be set as root scope and while building for all sub actions named containers should be pushed to the scope and popped.
     //From inside the _prepareScopeRef it should check references are based on client references and register them possibly multiple per scope reference
   },
   fromObject:function(obj){
     var actions = obj.actions || {};
     var that = this;
     $.each(actions,function(key,val){
       that.addAction(Action.fromObject(val,key));
     });
   },
   addAction:function(a){
     if(!a){return;}
     this.actions.push(a);
     a._owner = this;
   },
   trigger:function(scope){
     ScopeRef._setScope(scope);
     ScopeRef._pushScope(this);
     for(var i=0;i<this.actions.length;i++){
       this.actions[i].do();
     }
     ScopeRef._popScope();
   },
   hasServerActions: function(){
     for(var i=0;i<this.actions.length;i++){
       if(this.actions[i] instanceof ServerAction || this.actions[i].hasServerActions && this.actions[i].hasServerActions()){
         return true;
       }
     }
     return false;
   },
   get:function(ref){
     return this.vars[ref];
   },
   clone:function(){
     var h = $.extend(Object.create(Object.getPrototypeOf(this)),this);
     return h;
   }
 });
