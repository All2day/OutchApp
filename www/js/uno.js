//The Uno Game
exports.game = {
  prototypes:{
    player: {
      hand: {
        type: "list",
        prototype: "card"
      },
      currentCard: {
        type: "card"
      },
      dir: {
        type:"number" //The rotation of this player, either 0 or 180 degrees
      }
    },
    card: {
      color: {
        type: "string" //red, green, blue, yellow or none. When using a color changing card and selecting a color, the color is set here
      },
      value: {
        type: "number" //special numbers are used for special cards, thus 10 means "stop", 11 means "+2", -1 means "change color" and -2 means "change color +4"
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
      els:["red","blue","green","yellow"]
    },
    cardtypes: { //card types in each color
      type: "list",
      prototype: "number",
      els: [11,11,11,11,11]//[1,2,3,4,5,6,7,8,9,10,11]
    }
  },
  phases:{
    /*create:{
      //goal is to choose a center (and heading) of the game together with a game name

    },*/
    join:{
      //normal join phase, though there should be exactly two players
      views:{
        '_1':{
          type:'page',
          elements:{
            'exit':{
              type:'button',
              text:'"exit"',
              hooks:{
                click:{
                  actions:{
                    '_1':{
                      type:"exit"
                    }
                  }
                }
              }
            },
            'players':{
              type:'list',
              list:'players',
              elements:{
                0:{
                  type:"label",
                  text:"listel.id"
                }
              }
            },
            '_0':{
              type:'button',
              text:"'restart'",
              hooks:{
                click:{
                  actions:{
                    '_1':{
                      type:"set",
                      target:"phase.test_var",
                      source:"0"
                    }
                  }
                }
              }
            },
            '_1':{
              type:'button',
              text:"'Start game in '+phase.test_var",
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
              type:'label',
              text:"'hej'+phase.test_var"
            }
          }

        }
      },
      vars:{
        test_var:{
          type:"number",
          value:0
        },
        test_timer:{
          type:"timer",
          duration:2000,
          hooks:{
            end:{
              actions:{
                '_1':{
                  type:"set",
                  target:"phase.test_var",
                  source:"phase.test_var+1"
                },
                '_2':{
                  type:"start",
                  timer:"phase.test_timer"
                }
              }
            }
          }
        }
      },
      hooks:{
        start:{
          actions:{
            '_sta':{
              type:"start",
              timer:"phase.test_timer"
            }
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
        waitforrevengetimer:{
          type:"timer",
          duration:"1000",
          hooks:{
            start:{
              actions:{
                1:{
                  type:"if",
                  condition:"phase.revenge_target!=player",
                  actions:{
                    1:{
                      type:"show",
                      view:"waitforrevenge"
                    }
                  }
                }
              }
            },
            stop:{
              actions:[
                {
                  type:"if",
                  condition:"phase.revenge_target!=player",
                  actions:{
                    1:{
                      type:"hide",
                      view:"waitforrevenge"
                    }
                  }
                }
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
                }
              }
            }
          }
        },
        revenge_target:{ //the one that must respond with the same card
          type:"player"
        },
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
          type:"MapView",
          //center:"game.center",
          center:"game.center",
          rotation:"game.center.heading + player.dir",
          geoElements:{
            'player':{
              type:"circle",
              radius:"2",
              pos:"player.pos"
            },
            'list of players':{ //The player cards
              type:"geolist",
              list:"players.others",
              elements:{
                1:{
                  type:"circle",
                  radius:"1",
                  pos:"listel.pos"
                }
              }
            },
            'outer':{
              type:"circle",
              //stroke:"5px rgba(100,100,100,0.5)",
              radius:"25",
              rotation:0,
              pos:"game.center",
              geoElements:{
                /*'box':{
                  type:"box",
                  pos:[-5,25], //go half the card to the left, and the radius of the circle down
                  width:"10",
                  height:"15"
                  //stroke:"5px rgba(100,100,100,0.5)",
                  //fill:"color",
                  //text:"value",
                  //textColor:"white",
                },*/
                '_playercards':{ //The player cards
                  type:"geolist",
                  list:"player.hand",
                  elements:{
                    'box':{
                      type:"box",
                      pos:[-10,25], //go half the card to the left, and the radius of the circle down
                      width:"10",
                      height:"15"
                      //stroke:"5px rgba(100,100,100,0.5)",
                      //fill:"color",
                      //text:"value",
                      //textColor:"white",
                    },
                  }
                },
                'inner':{
                  type:"circle",
                  pos:[10,10],
                  //stroke:"5px rgba(100,100,100,0.5)",
                  radius:"7"/*,
                  fill:null,
                  hooks:{
                    enter:{
                      actions:{
                        1:{
                          type:"set",
                          target:"element.fill",
                          source:"rgba(255,255,255,0.5)"
                        },
                        2:{
                          type:"vibrate",
                          duration:500 //ms
                        }
                      }
                    },
                    leave:{
                      actions:{
                        1:{
                          type:"set",
                          target:"element.fill",
                          source:null
                        }
                      }
                    },
                    volumeup:{
                      putdown:{ //named hook
                        actions:{
                          1:{
                            type:"if",
                            //condition is based on the color must match, possibly with a color changing card underneath OR the value must match OR it is a color changing card
                            condition:"player.currentCard.color = phase.stack.last.color || player.currentCard.value = phase.stack.last.value || player.currentCard.value < 0",
                            actions:{
                              1:{//remove the card from the user
                                type:"remove",
                                list:"player.hand",
                                target: "player.currentCard"
                              },
                              '_2':{//add the card to the stack
                                type:"add",
                                list:"phase.stack",
                                target:"player.currentCard"
                              },
                              '_3':{ //check if this player has removed all but this card
                                type:"if",
                                condition:"player.hand.count = 0",
                                actions:{
                                  1:{
                                    type:"startphase",
                                    phase:"'scoreboard'"
                                  }
                                }
                              },
                              '_4':{ //if the card is a color choosing card ask for the color
                                type:"if",
                                condition:"phase.stack.last.value < 0",
                                actions:{
                                  1:{
                                    type:"show",
                                    view:"choosecolor"
                                  }
                                }
                              },
                              '_5':{ //if the card is a plus card,
                                type:"if",
                                condition:"phase.stack.last.value = -2 || phas.stack.last.value = 11",
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
                                    source:"players[el!=player].any"
                                  },
                                  '_2.3':{
                                    type:"set",
                                    target:"phase.revenge_sender",
                                    source:"player"
                                  },
                                  '_3':{
                                    type:"start",
                                    timer:"phase.waitforrevengetimer"
                                  },
                                  '_4':{
                                    type:"if",
                                    condition:"phase.stack.last.value=-2",
                                    actions:{
                                      1:{
                                        type:"set",
                                        target:"phase.revenge_amount",
                                        source:"phase.revenge_amount+4"
                                      }
                                    },
                                    else:{
                                      1:{
                                        type:"set",
                                        target:"phase.revenge_amount",
                                        source:"phase.revenge_amount+2"
                                      }
                                    }
                                  }
                                }
                              },
                              '_6':{//reset the current card in the players hand by not setting a source
                                type:"set",
                                target:"player.currentCard"
                              },
                            }, // end of if actions
                            else:{
                              '_1':{
                                type:"alert",
                                text:"'does not match'"
                              }
                            }
                          }
                        }
                      }//volume up handling
                    }*/
                  }
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
                }
              } //end of circel geo elements
              */
            } // end of circle

          } //end of geo elements
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

            /*'_0':{
              type:"alert",
              text:"'setting up deck'"
            },*/
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
                          target:"color",
                          source:"color_loop.el"
                        },
                        2:{
                          type:"set",
                          target:"value",
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
            /*'_4':{
              //add the first card to stack
              type:"add",
              list:"phase.stack",
              target:"phase.deck.pop"
            },*/
            '_add first to stack':{
              type:"add",
              list:"phase.stack",
              target:"phase.deck.pop"
            },
            '_5':{ // add cards to player hands
              type:"each",
              list:"game.players",
              actions:{
                'card_loop':{
                  type:"each",
                  list:"1:1",
                  prototype:"number",
                  actions:{
                    1:{
                      type:"add",
                      list:"hand",
                      target:"phase.deck.pop"
                    }
                  }
                }
              }
            }
          }
        } //end of start hook
      }
    },
    scoreboard:{

    }
  }
};
