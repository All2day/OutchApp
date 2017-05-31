/* Notes:
 * - History management is currently done using window.location.hash.  This could easily be changed to use Push State instead.
 * - jQuery dependency for now. This could also be easily removed.
 */

function PageSlider(container) {

    var container = container,
        currentPage,
        stateHistory = [],
        goBackGoal;

		this.isLastPage = function(state){
			return stateHistory.length > 1 && stateHistory[stateHistory.length-2].hash == state;
		};

		this.getLastPage = function(){
			return stateHistory[stateHistory.length-2].page;
		}

    //when going back multiple pages some devices can mess around with the history. To make sure that user is not stuck in wrong page, we keep going back until the goal is reached
    this.checkPage = function(hash){
      if(!goBackGoal){
        return true;
      }
      if(goBackGoal == hash){
        goBackGoal = null;
        return true;
      }
      this.goBackTo(goBackGoal);
    }

    // Use this function if you want PageSlider to automatically determine the sliding direction based on the state history
    this.slidePage = function(page) {

        var l = stateHistory.length,
            state = window.location.hash || '#';

        page._state = state;
        if (l === 0) {
        		console.log('First page, not sliding:'+state);
            stateHistory.push({page:page,hash:state});
            this.slidePageFrom(page);
            return;
        }
        if (l > 1 && state === stateHistory[l-2].hash) {
           	console.log('matching page from before, sliding from left:'+state);
           	stateHistory.pop();
            this.slidePageFrom(page, 'left');
        } else {
            console.log('NOT matching page from before, sliding from right:'+state);
            stateHistory.push({page:page,hash:state});
            this.slidePageFrom(page, 'right');
        }

        var s = [];
        for(var i = 0; i < stateHistory.length;i++){
        	s.push(stateHistory[i].hash);
        }
				console.log('stateHistory:'+s.join());
    };

    // Use this function directly if you want to control the sliding direction outside PageSlider
    this.slidePageFrom = function(page, from) {
				container.append(page.el);

				if(!page.el.children().length){
          console.log('rendering');
          var t = Date.now();
					page.render();
          var t2 = Date.now();
          console.log('rendering done:'+(t2 - t));
				} else {
					if(from === "left" && $.isFunction(page.reUsed)){
            console.log('calling page reUsed');
            try{
						  page.reUsed();
            } catch(e){
              console.log('Error in page reUsed:'+e);
            }
					}
				}


        if (!currentPage || !from) {
            //page.el.attr("class", "page center");
            $(page.el).addClass("page center");
            currentPage = page;

            if($.isFunction(currentPage.ready)){
              console.log('calling page ready:'+currentPage.constructor.name);
          		try{
                currentPage.ready();
              } catch(e){
                console.log('Error in page ready:'+e);
              }
          	}
            return;
        }

        // Position the page at the starting position of the animation
        //page.el.attr("class", "page " + from);
        $(page.el).addClass("page "+from);

        var onTransitionEnd = function(e) {
          if(e.target == currentPage.el[0]){
            console.log('same page, not detaching');
            return;
          }
          if($(e.target).hasClass('page')){
            $(e.target).detach();
            currentPage.el.off('webkitTransitionEnd', onTransitionEnd);
            if(from && $.isFunction(currentPage.ready)){
              console.log('calling page ready:'+currentPage.constructor.name);
              try{
                currentPage.ready();
              } catch(e){
                console.log('Error in page ready (transition end):'+e);
              }
            }
          } else {
            //console.log('child of page, not detaching');
            //just ignore
          }
        };

        currentPage.el.on('webkitTransitionEnd', onTransitionEnd);


        if(from === "left"){
        	if($.isFunction(currentPage.destroy)){
            console.log('calling page destroy');
            try{
        		  currentPage.destroy();
            } catch(e){
              console.log('Error in page destroy:'+e);
            }
        	}
        } else
        if(from === "right"){
        	if($.isFunction(currentPage.removed)){
            console.log('calling page removed');
            try{
              currentPage.removed();
            } catch(e){
              console.log('Error in page removed:'+e);
            }
        	}
        }


        // Force reflow. More information here: http://www.phpied.com/rendering-repaint-reflowrelayout-restyle/
        container[0].offsetWidth;

        // Position the new page and the current page at the ending position of their animation with a transition class indicating the duration of the animation
        //page.el.attr("class", "page transition center");
        $(page.el).removeClass("left right").addClass("page transition center");
        //currentPage.el.attr("class", "page transition " + (from === "left" ? "right" : "left"));
        $(currentPage.el).removeClass('center').addClass("page transition " + (from === "left" ? "right" : "left"));
        currentPage = page;
    };

    //add extra internal pages to skip when skipping current page going back
    this.addInternal = function(n){
      stateHistory[stateHistory.length-1].extra = n;
    };

    // Set the current page (for sliding in the same page)
    this.setPage = function(page){
    	state = window.location.hash || '#';
    	stateHistory.pop();
    	stateHistory.push({page:page,hash:state});
    };

    this.resetStateHistory = function(){
      state = window.location.hash || '#';
      stateHistory = [];
      stateHistory.push({page:currentPage,hash:state});
    };

		/*this.setPage = function(page){
			stateHistory.pop();
			stateHistory.push({page:page,hash:window.location.hash || '#'});
		}*/

    // Goes back through history until a match in hash is found and slides that in from left
    this.goBackTo = function(hash){
      console.log('going back to:'+hash);
      goBackGoal = hash;

      //To change the actual history count the number of steps to go back and use that
      var go = -1;

      while(stateHistory.length > 1){
        if(stateHistory[stateHistory.length - 2].hash == hash){
          //window.location = stateHistory[stateHistory.length - 2].hash;
          console.log('going back:'+go);
          window.history.go(go);

          return;
        } else {
          var sh = stateHistory.pop();
          //if extra internal pages is registered, go through these as well
          if(sh.extra){
            go = go - sh.extra;
          }

          go = go -1;

        }
      }

      console.log('could not find goal');
      window.location = hash;

      //this.resetStateHistory();
    };

    //get the history primarily to debug
    this.getHistory = function(){
      return stateHistory;
    };

}
