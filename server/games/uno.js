//The Uno Game 2
exports.game = {
  prototypes:{
    player: {
      hand: {
        type: "list",
        prototype: "card",
        hooks:{
          change:{
            actions:{
              '_1':{
                type:"if", // does not work!
                condition:"(list.length+1)*game.cardWidth > (2*3.1415)",
                actions:{
                  1:{
                    type:"startphase",
                    phase:"scoreboard"
                  }
                }
              }
            }
          }
        }
      },
      droppedCards: {
        type:"number"
      },
      currentCard: {
        type: "card"
      },
      dir: {
        type:"number" //The rotation of this player, either 0 or 180 degrees
      },
      nextCard: {
        type:"timer",
        duration:"game.newCardDelay*1000",
        hooks:{
          end:{
            actions:{
              '_1':{
                type:"add",
                list:"player.hand",
                target:"phase.deck.pop"
              },
              '_2':{
                type:"start",
                timer:"timer"
              }
            }
          }
        }
      }
    },
    card: {
      color: {
        type: "string" //red, green, blue, yellow or none. When using a color changing card and selecting a color, the color is set here
      },
      value: {
        type: "string" //special numbers are used for special cards, thus 10 means "stop", 11 means "+2", -1 means "change color" and -2 means "change color +4"
      }
    }
  },
  vars: {
    name: {
      type:"string"
    },
    center: {
      type: "pos"
    },
    colors: { // colors available in the game, except the none color
      type: "list",
      prototype: "string",
      els:["#bf080f",//"[191,8,15]", //red
          "#1c3d59",//"[28,61,89]", //blue
          //"#2c5e2f",//"[44,94,47]" //green
          "#ffac28"//,"[255,172,40]"] //yellow
        ]
    },
    cardtypes: { //card types in each color
      type: "list",
      prototype: "text",//"number",
      els: ['+2','+2','+2',1,1,1,2,2,2,3,3,3,4,4,4,5,5,5,6,6,6]//,7,7,7,8,8,8,9,9,9]//[11,11,11,11,11]//[1,2,3,4,5,6,7,8,9,10,11]
    },
    cardHeight:0.6, //card height relative to size, realCardHeight = cardHeight*size
    cardWidth:0.4,// card width relative to size, rezlCardWidth = cardWidth*size
    centerRadius:0.4, //radius of center
    size:{
      type:"number",
      value:25,
      setting:true
    }, //radius
    newCardDelay:{
      type:"number",
      value:80,
      setting:true
    },
    maxtime:{
      type:"number",
      value:600,
      setting:true
    },
    playtime:0
  },
  ranking:'-el.hand.length', //rank function, heigher is better, defined on a player in scope
  //possibly multiple rankings could be used in array form [el.points, -el.finish_time], where a tie in the fist would then take the second into account
  //we could here define the type of ranking between the ones defined in https://en.wikipedia.org/wiki/Ranking
  phases:{
    /*create:{
      //goal is to choose a center (and heading) of the game together with a game name

    },*/
    join:{
      //normal join phase, though there should be exactly two players
      views:{
        '_1':{
          type:'page',
          title:"'Setup'",
          elements:{
            'title':{
              type:"gamebar"
            },
            'gamesize_':{
              type:'setting',
              elements:{
                'map':{
                  type:'MapView',
                  height:20,
                  zoom:"[game.size+game.cardHeight*game.size,game.size+game.cardHeight*game.size]*2",//"'fit'",
                  center:"players.gameowner.pos",
                  heading:"players.gameowner.heading",
                  geoElements:{
                    'outer':{
                      type:"circle",
                      radius:"game.size+game.cardHeight*game.size",
                      fill:[255,255,255,0.5],
                      color:[0,0,0,0],
                      rotation:"game.gameowner.heading+player.dir*2*3.1415/players.count",
                      pos:"players.gameowner.pos",
                      //The player direction is not calculated before starting the game and should be updated every time the playrs change, thus dont add this now
                      /*geoElements:{
                        '_playercards':{ //The player cards
                          type:"geolist",
                          list:"1:7",
                          elements:{
                            'boxlist':{
                              type:"GeoElement",
                              pos:[0,0],
                              rotation:"index*(game.cardWidth)+list.count-list.count",//"((1/2) + index - list.count/2)*2/5", //*20
                              geoElements:{
                                'box':{
                                  type:"svgbox",
                                  //TODO:make it possible to have position referenced to the game
                                  pos:"[0,game.size+0.5*game.cardHeight*game.size]", //go half the card to the left, and the radius of the circle down
                                  width:"game.cardWidth*game.size",
                                  //height:"15",
                                  height:"game.cardHeight*game.size",
                                  fill:"[0,0,0,0]",
                                  //textColor:"[255,255,255]",
                                  color:"[0,0,0]"
                                }
                              }
                            }
                          }
                        }
                      }*/
                    }, //end of outer
                    'inner':{
                      type:"circle",
                      radius:"10",
                      fill:[0,0,0,0],
                      pos:"players.gameowner.pos",
                    },
                    'players':{
                      type:"geolist",
                      list:"players[el!=game.owner]",
                      elements:{
                        'p':{
                          type:"circle",
                          radius:"2",
                          fill:"'blue'",
                          pos:"listel.pos"
                        }
                      }
                    }
                  }
                },//end of map
                'radius':{
                  type:"label",
                  text:"'Game radius:'+game.size+'m'"
                },
                'gameSize':{
                  show:"player = players.gameowner",
                  type:"slider",
                  min:25,
                  max:100,
                  default:"game.size",
                  hooks:{
                    change:{
                      actions:{
                        '_1':{
                          type:"set",
                          target:"game.size",
                          source:"element.value"
                        }
                      }
                    }
                  }
                }
              }
            }, //end of game size setting
            'delay':{
              type:'setting',
              elements:{
                'delay':{
                  type:"label",
                  text:"'Time before extra card:'+game.newCardDelay+'s'"
                },
                'newCardDelay':{
                  show:"player = players.gameowner",
                  type:"slider",
                  default:"game.newCardDelay",
                  min:10,
                  max:300,
                  hooks:{
                    change:{
                      actions:{
                        '_1':{
                          type:"set",
                          target:"game.newCardDelay",
                          source:"element.value"
                        }
                      }
                    }
                  }
                }
              }
            },
            'speed':{
              type:'setting',
              elements:{
                'speed':{
                  type:"label",
                  text:"'Play time:'+game.maxtime+'s'"
                },
                'speedinput':{
                  show:"player = players.gameowner",
                  type:"slider",
                  default:"game.maxtime",
                  min:1,
                  max:1200,
                  hooks:{
                    change:{
                      actions:{
                        '_1':{
                          type:"set",
                          target:"game.maxtime",
                          source:"element.value"
                        }
                      }
                    }
                  }
                }
              }
            },
            'players2':{
              type:'playerlist'
            },
            '_1':{
              type:'bottombutton',
              text:"players.length > 1 ? 'Start game' : 'Wait for all players to join'",
              show:"player = players.gameowner",
              hooks:{
                click:{
                  actions:{
                    '_0':{
                      type:"set",
                      target:"game.center",
                      source:"player.pos"
                    },
                    '_1':{
                      type:"startphase",
                      phase:"play"

                    }
                  }
                }
              }
            },
            '_2':{
              type:'bottombutton',
              text:"'Waiting'",
              show:"player != players.gameowner",

            }
          }

        }
      },
      vars:{

      },
      hooks:{
        start:{
          actions:{

          }
        }
      }
    },
    play:{ //play phase
      vars:{
        deck: { //The face down cards waiting to be played
          type:"list",
          prototype:"card"
        },
        stack: { //The current stack of cards. The last added is the current card, which the next card must match
          type:"list",
          prototype:"card"
        },
        stopTimer:{
          type:"timer",
          duration:'game.maxtime*1000', // 10 min
          hooks:{
            end:{
              actions:{
                '_1':{
                  type:'startphase',
                  phase:'scoreboard'
                }
              }
            }
          }
        },
        waitforrevengetimer:{
          type:"timer",
          duration:"game.newCardDelay*1000*0.5",
          hooks:{
            start:{
              actions:{
                1:{
                  type:"each",
                  list:"game.players",
                  actions:{
                    1:{
                      type:"stop",
                      timer:"el.nextCard"
                    }
                  }
                }
              }
            },
            stop:{
              actions:[
              ]
            },
            end:{
              actions:{
                '_1':{
                  type:"repeat",
                  times:"phase.revenge_amount",
                  actions:{
                    '_1':{
                      type:"add",
                      list:"phase.revenge_target.hand",
                      target:"phase.deck.pop"
                    }
                  }
                },
                '_2':{ //restart nextCard timers
                  type:"each",
                  list:"game.players",
                  actions:{
                    1:{
                      type:"start",
                      timer:"el.nextCard"
                    }
                  }
                }
              }
            }
          }
        },
        revenge_target:{ //the one that must respond with the same card
          type:"player"
        },/*
        revenge_stack:{ //the cards to deal to the looser
          type:"list",
          prototype:"card"
        },*/
        revenge_sender:{ //the one that played the last revenge card
          type:"player"
        },
        revenge_amount:{ //how many cards to deal to the looser
          type:"number",
          value:0
        }
      },
      views:{
        1:{
          type:"MapPage",
          zoom:"[game.size+game.cardHeight*game.size,game.size+game.cardHeight*game.size]*2.0",//"'fit'",
          center:"game.center",
          heading:"(game.center.heading) +(player.dir)*2*3.1415/(players.count)",
          elements:{//overlayed elements in top
            'left':{
              type:"roundtimer",
              timer:"player.nextCard",
              warning:"5s",
              elements:{
                'img':{
                  type:"image",
                  src:"'img/NextCard2.svg'"
                }
              }
            },
            'center':{
              type:"label",
              //text:"formattime(phase.stopTimer.timeleft)"
              text:"'GeoPlay'"
            },
            'ends':{
              type:"timer",
              timertype:"'headerbartimer'",
              timer:"phase.stopTimer"
            },
            'currentCard':{
              show:"player.currentCard",
              type:"label",
              text:"player.currentCard ? player.currentCard.value : ''",
              css:{
                border:"'2px solid black'",
                background: "player.currentCard.color",
                display:"player.currentCard ? 'flex' : 'none'",
                position:"'fixed'",
                width:"'10vh'",
                height:"'15vh'",
                color:"'white'",
                right:"'5vh'",
                bottom:"'-0.7em'",
                transform:"'rotate(17deg)'",
                fontSize:"'5vh'",
                fontWeight:"'bold'",
                margin:"'0'",
                alignItems:"'center'",
                justifyContent:"'center'",
                borderRadius:"'7px'"
              }
            },
            'revenge':{
              type:"timer",
              show:"phase.waitforrevengetimer.isRunning",
              timer:"phase.waitforrevengetimer",
              timertype:"'bartimer'",
              css:{ //place at bottom
                width:"'auto'",
                position:"'fixed'",
                left:"'0'",
                right:"'0'",
                bottom:"'0'",
                opacity:"player = phase.revenge_target ? 1 : 0.3"
              }
            }
          },
          geoElements:{
            'player':{
              type:"circle",
              radius:"2",
              pos:"player.pos",
              rotation:"player.heading",
              color:[255,255,255,1],
              zIndex:2,
              fill:[45,168,199,1],
              //fill:"player.currentCard ? player.currentCard.color : [0,0,0,0]",
              //text:"player.currentCard ? player.currentCard.value : ''",
              geoElements:{
                'svg':{
                  type:"SVG",
                  zIndex:1,
                  scale:1,
                  post:[0,0],
                  svg:'<svg width="10" height="10" version="1.1" xmlns="http://www.w3.org/2000/svg">'+
                  '<path stroke="none" fill="#00d1ef" style="opacity:0.5" d="M 8.213938048432697 1.16977778440511 A 5 5 0 0 0 1.7860619515673033 1.16977778440511 L 5 5 L 8.213938048432697 1.16977778440511"/>'
                  +'</svg>'
                }
              }
            },
            'list of players':{ //The player cards
              type:"geolist",
              list:"players.others",
              elements:{
                1:{
                  type:"circle",
                  radius:"1",
                  zIndex:1,
                  pos:"listel.pos",
                  color:[0,255,0,1],
                  fill:[0,255,0,0.4]
                }
              }
            },
            'outer':{
              type:"circle",
              //stroke:"5px rgba(100,100,100,0.5)",
              radius:"game.size",
              rotation:"game.center.heading+player.dir*2*3.1415/players.count",
              fill:"players[el.hand.length=1 && el != player].length>0 ? '[255,0,0,.5]' : '[255,255,255,.5]'",
              //if there is a player with only one card show red and big
              //color:"players[el.hand.length=1].length>0 ? 'red' : 'black'",
              color:"'transparent'",
              //stroke:"players[el.hand.length=1].length>0 ? 10 : 2",
              zIndex:-1,
              pos:"game.center",
              geoElements:{
                '_newcard':{
                  type:"GeoElement",
                  pos:[0,0],
                  rotation:"player.hand.length*game.cardWidth+list.count-list.count",
                  geoElements:{
                    'box':{
                      type:"svgbox",
                      pos:"[0,game.size+0.5*game.cardHeight*game.size]",
                      width:"game.cardWidth*game.size",
                      //height:"15",
                      height:"game.cardHeight*game.size",
                      text:"'+'",
                      fill:[0,0,0,.5],
                      color:"element.isinside ? 'black' : [244,240,241]",
                      textColor:"'white'",
                      hooks:{
                        enter:{
                          actions:{
                            1:{
                              type:"vibrate",
                              duration:100
                            }
                          }
                        },
                        volumeup:{
                          actions:{
                            1:{
                              type:"vibrate",
                              duration:100
                            },
                            '_1':{
                              type:"add",
                              list:"player.hand",
                              target:"phase.deck.pop"
                            },
                            '_2':{
                              type:"reset",
                              timer:"player.nextCard"
                            },
                            '_3':{
                              type:"set",
                              target:"player.currentCard",
                              source:"player.hand.last"
                            }
                          }
                        }
                      }
                    }
                  }
                },
                '_playercards':{ //The player cards
                  type:"geolist",
                  list:"player.hand",
                  elements:{
                    'boxlist':{
                      type:"GeoElement",
                      pos:[0,0],
                      rotation:"index*(game.cardWidth)+list.count-list.count",//"((1/2) + index - list.count/2)*2/5", //*20
                      geoElements:{
                        'box':{
                          type:"svgbox",
                          //TODO:make it possible to have position referenced to the game
                          pos:"[0,game.size+0.5*game.cardHeight*game.size]", //go half the card to the left, and the radius of the circle down
                          width:"game.cardWidth*game.size",
                          //height:"15",
                          height:"game.cardHeight*game.size",
                          show:"player.currentCard = listel ? 0 : 1", //showcard opacity?
                          text:"listel.value",
                          fill:"listel.color",
                          textColor:"[255,255,255]",
                          color:"element.isinside ? [0,0,0] : (player.currentCard = listel ? 'red' : [244,240,241])",
                          hooks:{
                            enter:{
                              actions:{
                                1:{
                                  type:"vibrate",
                                  duration:100
                                }
                              }
                            },
                            volumeup:[{
                              actions:{

                                2:{
                                  type:"set",
                                  target:"player.currentCard",
                                  source:"listel"
                                }
                              }
                            },{
                              actions:{
                                1:{
                                  type:"vibrate",
                                  duration:100
                                },
                              }
                            }]
                          }
                        },
                      }
                    }
                  }
                },
                'inner':{
                  type:"circle",
                  pos:[0,0],
                  //stroke:"5px rgba(100,100,100,0.5)",
                  radius:"game.size*game.centerRadius",

                  //fill:[0,0,0,0],
                  color:"element.isinside?'black':[244,240,241]",
                  fill:"phase.waitforrevengetimer.isRunning && phase.revenge_target != player ? [255,255,255,0.8] : phase.stack.last.color",
                  textColor:"'white'",
                  text:"phase.stack.last.value",
                  hooks:{
                    enter:{
                      actions:{
                        /*1:{
                          type:"set",
                          target:"element.fill",
                          source:"rgba(255,255,255,0.5)"
                        },*/
                        2:{
                          type:"vibrate",
                          duration:500 //ms
                        }
                      }
                    },
                    leave:{
                      actions:{
                        /*1:{
                          type:"set",
                          target:"element.fill",
                          source:null
                        }*/
                      }
                    },
                    volumeup:{
                      vibrate:{
                        actions:{
                          1:{
                            type:"vibrate",
                            duration:100
                          }
                        }
                      },
                      putdown:{ //named hook
                        actions:{
                          1:{
                            type:"if",
                            //condition is based on the color must match, possibly with a color changing card underneath OR the value must match OR it is a color changing card
                            //Furthermore it is required that if the revenge timer is running, one cannot add cards unless it is a + card
                            condition:"(player.currentCard.value = '+2' || !phase.waitforrevengetimer.isRunning) && (player.currentCard.color = phase.stack.last.color || player.currentCard.value = phase.stack.last.value || player.currentCard.value < 0)",
                            actions:{
                              '_1':{//remove the card from the user
                                type:"remove",
                                list:"player.hand",
                                target: "player.currentCard"
                              },
                              '_2':{//add the card to the stack
                                type:"add",
                                list:"phase.stack",
                                target:"player.currentCard"
                              },
                              '_25':{
                                type:"set",
                                target:"player.droppedCards",
                                source:"player.droppedCards+1"
                              },
                              '_3':{ //check if this player has removed all but this card
                                type:"if",
                                condition:"player.hand.count = 0",
                                actions:{
                                  1:{
                                    type:"startphase",
                                    phase:"scoreboard"
                                  }
                                }
                              },
                              '_4':{//reset the timer for this player
                                type:"reset",
                                timer:"player.nextCard"
                              },
                              /*'_4':{ //if the card is a color choosing card ask for the color
                                type:"if",
                                condition:"phase.stack.last.value < 0",
                                actions:{
                                  1:{
                                    type:"show",
                                    view:"choosecolor"
                                  }
                                }
                              },*/
                              '_5':{ //if the card is a plus card,
                                type:"if",
                                condition:"phase.stack.last.value = '+2' && players.count > 1",
                                actions:{
                                  '_1':{
                                    type:"stop", //if already started, will trigger the stop hook
                                    timer:"phase.waitforrevengetimer"
                                  },
                                  '_2':{
                                    type:"reset",
                                    timer:"phase.waitforrevengetimer"
                                  },
                                  '_2.2':{
                                    type:"set",
                                    target:"phase.revenge_target",
                                    source:"players.others.any"//"players[el!=player].any" //does not work if single player
                                  },
                                  '_2.3':{
                                    type:"set",
                                    target:"phase.revenge_sender",
                                    source:"player"
                                  },
                                  '_4':{
                                    type:"if",
                                    condition:"phase.stack.last.value='+2'",
                                    actions:{
                                      1:{
                                        type:"set",
                                        target:"phase.revenge_amount",
                                        source:"phase.revenge_amount+2"
                                      }                                    },
                                    else:{

                                    }
                                  }

                                }
                              }, //end of +2 card
                              '_6':{//reset the current card in the players hand by not setting a source
                                type:"set",
                                target:"player.currentCard"
                              }
                            }, // end of if true actions
                            else:{
                              '_1':{
                                type:"alert",
                                text:"'does not match'"
                              }
                            }
                          } //end of IfAction
                        } //actions
                      }//end of put down named hook
                    } //end of vulume up
                  } //end of inner hooks
                }, //end of center element
                /*'_playercards':{ //The player cards
                  type:"geolist",
                  source:"player.hand",
                  elements:{
                    1:{
                      type:"GeoElement",
                      rotation:"(list.index - list.count/2)*20",
                      geoElements:{
                        1:{
                          type:"box",
                          pos:[-5,25], //go half the card to the left, and the radius of the circle down
                          width:"10m",
                          height:"15m",
                          stroke:"5px rgba(100,100,100,0.5)",
                          fill:"color",
                          text:"value",
                          textColor:"white",
                          hooks:{
                            enter:{
                              actions:{
                                1:{
                                  type:"set",
                                  target:"element.stroke",
                                  source:"'7px rgba(255,0,0,1)'"
                                },
                                2:{
                                  type:"vibrate",
                                  duration:500
                                }
                              }
                            },
                            leave:{
                              actions:{
                                1:{
                                  type:"set",
                                  target:"element.stroke",
                                  source:"'5px rgba(100,100,100,0.5)'"
                                }
                              }
                            },
                            volumeup:{
                              pickup:{
                                actions:{
                                  1:{
                                    type:"set",
                                    target:"player.currentCard",
                                    source:"list_el"
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }, //end listing of player cards
                3:{
                  visibility: "phase.stack.count > 0",
                  type:"box",
                  anchor:[5,7.5],
                  width:"10m",
                  height:"10m",
                  fill:"phase.stack.last.color",
                  text:"phase.stack.last.value",
                  textColor:"white"
                }*/
              } //end of circel geo elements

            } // end of outer circle

          } //end of map view geo elements
        }, //End of map view
        /*choosecolor:{
          type:"dialog",
          elements:{
            1:{
              type:"listElement",
              list:"game.colors",
              elements:{
                1:{
                  type:"button",
                  color:"el",
                  text:"el",
                  hooks:{
                    click:{
                      actions:{
                        1:{
                          type:"set",
                          target:"player.currentCard.color",
                          source:"element.text"
                        },
                        2:{
                          type:"hide",
                          target:"view"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },*/ //End of choosecolor view
        /*waitforrevenge:{
          type:"dialog",
          elements:{
            1:{
              type:"timerElement",
              timer:"phase.waitforrevengetimer"
            }
          }
        }*/
      }, // End of views
      hooks:{
        start:{
          actions:{

            '_0':{
              type:"alert",
              text:"'setting up deck'"
            },
            //add playercards
            color_loop: {
              type:"each",
              list:"game.colors",
              actions:{
                value_loop:{
                  type:"each",
                  list:"game.cardtypes",
                  actions:{
                    1:{
                      type:"create",
                      prototype:"card",
                      target:"phase.deck",
                      actions:{
                        1:{
                          type:"set",
                          target:"card.color",
                          source:"color_loop.el"
                        },
                        2:{
                          type:"set",
                          target:"card.value",
                          source:"value_loop.el"
                        }
                      }
                    }
                  }
                }
              }
            },
            /*'_1':{
              //add 3 special cards of value -1
              type:"each",
              list:"0:3",
              actions:{
                1:{
                  type:"create",
                  prototype:"card",
                  target:"phase.deck",
                  actions:{
                    1:{
                      type:"set",
                      target:"color",
                      source:"none"
                    },
                    2:{
                      type:"set",
                      target:"value",
                      source:"value-1"
                    }
                  }
                }
              }
            },
            '_2':{
              //add two color changing cards with value -2
              type:"each",
              list:"0:1",
              actions:{
                1:{
                  type:"create",
                  prototype:"card",
                  target:"phase.deck",
                  actions:{
                    1:{
                      type:"set",
                      target:"color",
                      source:"none"
                    },
                    2:{
                      type:"set",
                      target:"value",
                      source:"value-2"
                    }
                  }
                }
              }
            },*/
            '_3':{
              //shuffle the deck
              type:"shuffle",
              list:"phase.deck"
            },
            '_add first to stack':{
              type:"add",
              list:"phase.stack",
              target:"phase.deck.pop"
            },
            '_player_loop':{ // add cards to player hands
              type:"each",
              list:"game.players",
              actions:{
                'card_loop':{
                  type:"each",
                  list:"1:7",
                  prototype:"number",
                  actions:{
                    1:{
                      type:"add",
                      list:"_player_loop.el.hand",
                      target:"phase.deck.pop"
                    }
                  }
                },
                'set_dir':{
                  type:"set",
                  target:"_player_loop.el.dir",
                  source:"_player_loop.index"
                },
                'set_droppedcards':{
                  type:"set",
                  target:"_player_loop.el.droppedCards",
                  source:"0"
                },
                //start without a card
                /*'asdf':{
                  type:"set",
                  target:"_player_loop.el.currentCard",
                  source:"_player_loop.el.hand.last"

                },*/
                'start timer for next card':{
                  type:"start",
                  timer:"_player_loop.el.nextCard"
                }

              }
            },//end of player loop
            '_stoptimer':{
              type:'start',
              timer:'phase.stopTimer'
            }
          }
        }, //end of start hook
        end:{
          actions:{
            '_settime':{
              type:'set',
              target:'game.playtime',
              source:'^phase.stopTimer.time'
            }
          }
        } //end of end hook
      }
    },
    scoreboard:{
      views:{
        '_1':{
          type:'page',
          elements:{
            /*'gamename':{
              type:"label",
              text:"'spillets navn:'+game.name"
            },*/
            'sb':{
              type:'scoreboard'
            },
            'players':{
              type:'list',
              list:'players',
              elements:{
                0:{
                  type:"label",
                  text:"listel.name+': total distance:'+listel.total_distance+'m dropped:'+listel.droppedCards+' left:'+listel.hand.length+(listel.status = 'joined'?'':' player left')",
                }
              }
            },
            '_play time':{
              type:'label',
              text:"'Playtime:'+formattime(game.playtime)"
            },
            '_1':{
              type:'bottombutton',
              text:"'Back'",
              hooks:{
                click:{
                  actions:{
                    '_0':{
                      type:"exit",
                    }
                  }
                }
              }
            },
          },


        }//end of page
      }
    }
  }
}; //end of game
