//The Uno Game
{
  prototypes:{
    player: {
      hand: {
        type: "list",
        prototype: "card"
      },
      currentCard: {
        type: "card"
      }
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
      els:{"red","blue","green","yellow"}
    },
    cardtypes: { //card types in each color
      type: "list",
      prototype: "number",
      els: {1,2,3,4,5,6,7,8,9,10,11}
    }
  },
  phases:{
    create:{
      //goal is to choose a center (and heading) of the game together with a game name

    },
    join:{
      //normal join phase, though there should be exactly two players
    },
    play:{
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
          duration:"30s",
          hooks:{
            start:{
              actions:{
                {
                  type:"if",
                  condition:"phase.revenge_target!=player",
                  actions:{
                    {
                      type:"show",
                      view:"waitforrevenge"
                    }
                  }
                }
              }
            },
            stop:{
              actions:{
                {
                  type:"if",
                  condition:"phase.revenge_target!=player",
                  actions:{
                    {
                      type:"hide",
                      view:"waitforrevenge"
                    }
                  }
                }
              }
            },
            end:{
              actions:{
                {
                  {
                    set................
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
        {
          type:"MapView",
          center:"game.center",
          rotation:"game.center.heading + player.dir",
          geoElements:{
            {
              type:"circle",
              stroke:"5px rgba(100,100,100,0.5)",
              radius:"25m",
              geoElements:{
                {
                  type:"circle",
                  stroke:"5px rgba(100,100,100,0.5)",
                  radius:"7.5m",
                  fill:null,
                  hooks:{
                    enter:{
                      actions:{
                        {
                          type:"set",
                          target:"element.fill",
                          source:"rgba(255,255,255,0.5)"
                        },
                        {
                          type:"vibrate",
                          duration:500 //ms
                        }
                      }
                    },
                    leave:{
                      actions:{
                        {
                          type:"set",
                          target:"element.fill",
                          source:null
                        }
                      }
                    },
                    volumeup:{
                      actions:{
                        {
                          type:"if",
                          //condition is based on the color must match, possibly with a color changing card underneath OR the value must match OR it is a color changing card
                          condition:"player.currentCard.color = phase.stack.last.color || player.currentCard.value = phase.stack.last.value || player.currentCard.value < 0",
                          actions:{
                            {//remove the card from the user
                              type:"remove",
                              list:"player.hand"
                            },
                            {//add the card to the stack
                              type:"add",
                              list:"phase.stack",
                              target:"player.currentCard"
                            },
                            { //check if this player has removed all but this card
                              type:"if",
                              condition:"player.hand.count = 1",
                              actions:{
                                {
                                  type:"startphase",
                                  phase:"scoreboard"
                                }
                              }
                            },
                            { //if the card is a color choosing card ask for the color
                              type:"if",
                              condition:"phase.stack.last.value < 0",
                              actions:{
                                {
                                  type:"show",
                                  view:"choosecolor"
                                }
                              }
                            },
                            { //if the card is a plus card,
                              type:"if",
                              condition:"phase.stack.last.value = -2 || phas.stack.last.value = 11",
                              actions:{
                                {
                                  type:"stop", //if already started, will trigger the stop hook
                                  target:"phase.waitforrevengetimer"
                                },
                                {
                                  type:"reset",
                                  target:"phase.waitforrevengetimer"
                                },
                                {
                                  type:"start",
                                  target:"phase.waitforrevengetimer"
                                },
                                {
                                  type:"if",
                                  condition:"phase.stack.last.value=-2",
                                  actions:{
                                    {
                                      type:"set",
                                      target:"phase.revenge_amount",
                                      source:"+4"
                                    }
                                  },
                                  else:{
                                    {
                                      type:"set",
                                      target:"phase.revenge_amount",
                                      source:"+2"
                                    }
                                  }
                                }
                              }
                            },
                            {//reset the current card in the players hand by not setting a source
                              type:"set",
                              target:"player.currentCard"
                            },
                          }, // end of if actions
                          else:{
                            {
                              type:"vibrate",
                              duration:1000
                            }
                          }
                        }
                      }
                    }//volume up handling
                  }
                }, //end of center element
                { //The player cards
                  type:"list",
                  source:"player.hand",
                  elements:{
                    type:"GeoElement",
                    rotation:"(list.index - list.count/2)*20",
                    geoElements:{
                      {
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
                              {
                                type:"set",
                                target:"element.stroke",
                                source:"7px rgba(255,0,0,1)"
                              },
                              {
                                type:"vibrate",
                                duration:500
                              }
                            }
                          },
                          leave:{
                            actions:{
                              {
                                type:"set",
                                target:"element.stroke",
                                source:"5px rgba(100,100,100,0.5)"
                              }
                            }
                          },
                          volumeup:{
                            actions:{
                              {
                                type:"set",
                                target:"player.currentCard",
                                source:"el"
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }, //end listing of player cards
                {
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
            } // end of circle
          } //end of geo elements
        }, //End of map view
        choosecolor:{
          type:"dialog",
          elements:{
            {
              type:"listElement",
              list:"game.colors",
              elements:{
                {
                  type:"button",
                  color:"el",
                  text:"el",
                  hooks:{
                    click:{
                      actions:{
                        {
                          type:"set",
                          target:"player.currentCard.color",
                          source:"element.text"
                        },
                        {
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
        }, //End of choosecolor view
        waitforrevenge:{
          type:"dialog",
          elements:{
            type:"timeElement",
            timer:"phase.waitforrevengetimer"
          }
        }
      }, // End of views
      hooks:{
        start:{
          actions:{
            //add playercards
            color_loop: {
              type:"each",
              list:"game.colors",
              actions:{
                value_loop:{
                  type:"each",
                  list:"game.values",
                  actions{
                    {
                      type:"create",
                      prototype:"card",
                      target:"phase.deck",
                      actions:{
                        {
                          type:"set",
                          target:"color",
                          source:"color_loop.el"
                        },
                        {
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
            {
              //add 3 special cards of value -1
              type:"each",
              list:"0:3",
              actions:{
                {
                  type:"create",
                  prototype:"card",
                  target:"phase.deck",
                  actions:{
                    {
                      type:"set",
                      target:"color",
                      source:"none"
                    },
                    {
                      type:"set",
                      target:"value",
                      source:"-1"
                    }
                  }
                }
              }
            },
            {
              //add two color changing cards with value -2
              type:"each",
              list:"0:1",
              actions:{
                {
                  type:"create",
                  prototype:"card",
                  target:"phase.deck",
                  actions:{
                    {
                      type:"set",
                      target:"color",
                      source:"none"
                    },
                    {
                      type:"set",
                      target:"value",
                      source:"-2"
                    }
                  }
                }
              }
            },
            {
              //shuffle the deck
              type:"shuffle",
              list:"phase.deck"
            },
            {
              //add the first card to stack
              type:"add",
              list:"phase.stack",
              target:"phase.deck.pop"
            },
            { // add cards to player hands
              type:"each",
              list:"game.players",
              actions:{
                {
                  type:"add",
                  list:"phase.stack",
                  target:"phase.deck.pop"
                }
              }
            }
          }
        }
      }
    },
    scoreboard:{

    }
  }
}
