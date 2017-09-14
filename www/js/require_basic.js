/* Simulate basic require functionality to allow both uses within cordova and node*/
window.require = function(file){

  if(!file.match(/.js$/)){
    file = file+'.js';
  }
  var m = file.match(/^\.\/(.*)/);
  if(m){
    file = 'js/'+m[1];
  }
  if(!require.cache){
    require.cache = {};
  }
  if(require.cache[file]){
    //do nothing
    return require.cache[file];
  }
  console.log('loading file:'+file);
  //debugger;
  window.global = null;

  window.exports = {};
  window.module = {

  };
  $('<script>')
    .attr('type', 'text/javascript')
    .attr('src',file)
    .appendTo('head');
  //$.getScript(file);
  require.cache[file] = exports;
  return exports;
};
