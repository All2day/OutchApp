//The Slither Game
exports.game = {
  prototypes:{
    player: {
      size:{
        type:"number",
        value:2 /*number of seconds the tail follows you*/
      },
      tail:{
        type:"list",
        prototype:"point"
      },
      pos:{
        type:"pos",
        hooks:{
          change:{
            actions:{
              /*'_d':{
                type:"alert",
                text:"'pos changed'"
              },*/
              '_1':{
                type:"create",
                prototype:"point",
                target:"player.tail",
                actions:{
                  '_1':{
                    type:"set",
                    target:"point.pos",
                    source:"player.pos*1"
                  },
                  '_2':{
                    type:"set",
                    target:"point.t",
                    source:"now"
                  }
                }
              },
              '_remove':{
                type:"each",
                list:"player.tail[el.t < now - player.size*1000]",
                actions:{
                  '_1':{
                    type:"remove",
                    list:"player.tail",
                    target:"_remove.el"
                  }
                }
              },
              /*'_d2':{
                type:"alert",
                text:"'tail length:'+player.tail.count"
              },*/
            }
          }
        }
      }
    },
    point:{
      pos:{
        type: "pos"
      },
      t:{
        type: "number"
      }
    },
    food:{
      pos:{
        type:"pos"
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
  },
  phases:{
    join:{
      //normal join phase, though there should be exactly two players
      views:{
        '_1':{
          type:'page',
          elements:{
            'gamename':{
              type:"label",
              text:"'spillets navn:'+game.name"
            },
            'input':{
              show:"player = players.gameowner",
              type:"input",
              default:"'fedt navn'",
              hooks:{
                change:{
                  actions:{
                    '_1':{
                      type:"set",
                      target:"game.name",
                      source:"element.value"
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
                  text:"listel.id",
                }
              }
            },

            '_1':{
              type:'bottombutton',
              text:"'Start game'",
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
            }

          }

        }
      }
    },
    play:{ //play phase
      vars:{
        center:{
          type:"pos"
        },
        foods:{
          type:"list",
          prototype:"food"
        },
        morefood:{
          type:"timer",
          duration:"1000",
          hooks:{
            end:{
              actions:{
                '_1':{
                  type:"set",
                  target:"phase.center",
                  source:"players.gameowner.pos*1"
                },
                'makefood':{
                  type:"each",
                  list:"1:100",
                  actions:{
                    '_1':{
                      type:"create",
                      prototype:"food",
                      target:"phase.foods",
                      actions:{
                        1:{
                          type:"set",
                          target:"food.pos",
                          source:"phase.center + 100*[rand,rand] - [50,50]"
                        }
                      }
                    }
                  }
                },
                //restart
              }
            }
          }
        }
      },
      views:{
        1:{
          type:"MapView",
          zoom:"19",//"'fit'",
          center:"player.pos",
          elements:{
            /*'test':{
              type:"timer",
              timer:"player.nextCard"
            }*/
          },
          geoElements:{
            'player':{
              type:"circle",
              radius:"2",
              pos:"player.pos",
              rotation:"player.heading",
              color:[0,0,255,1],
              zIndex:2,
              //fill:[0,0,255,0.4]
              fill:"'blue'",
              geoElements:{
                'tri':{
                  type:"box",
                  pos:[0,3],
                  width:1,
                  height:2,
                  color:[0,0,255,1],
                  zIndex:2
                }
              }
            },
            'tail':{
              type:"geolist",
              list:"player.tail",
              elements:{
                1:{
                  type:"circle",
                  radius:"1",
                  pos:"listel.pos",
                  color:[0,255,0,1]
                }
              }
            },
            'food':{
              type:"geolist",
              list:"phase.foods",
              elements:{
                '_1':{
                  type:"circle",
                  radius:"5",
                  pos:"listel.pos",
                  color:[0,0,0,0],
                  fill:[0,0,0,0],
                  geoElements:{
                    '_innerfood':{
                      type:"circle",
                      radius:"1",
                      color:[0,255,0,1],
                      fill:[0,255,0,1]
                    }
                  },
                  hooks:{
                    enter:{
                      actions:{
                        //remove it
                        'remove':{
                          type:"remove",
                          target:"^listel",
                          list:"phase.foods"
                        },
                        'grow':{
                          type:"set",
                          target:"player.size",
                          source:"player.size+1"
                        }
                      }
                    }
                  }
                }
              }
            },
            'list of players':{ //The player cards
              type:"geolist",
              list:"players.others",
              elements:{
                'head':{
                  type:"circle",
                  radius:"1",
                  zIndex:1,
                  pos:"listel.pos",
                  color:[0,255,0,1],
                  fill:[0,255,0,0.4]
                },
                'tail':{
                  type:"geolist",
                  list:"listel.tail",
                  elements:{
                    1:{
                      type:"circle",
                      radius:"1",
                      pos:"listel.pos",
                      color:[0,255,0,1],
                      hooks:{
                        enter:{
                          actions:{
                            '_1':{
                              type:"alert",
                              text:"'die'"
                            }
                          }
                        }
                      }

                    }
                  }
                }
              }
            }
          } //end of map view geo elements
        }, //End of map view
      }, // End of views
      hooks:{
        start:{
          actions:{
            '_1':{
              type:"set",
              target:"phase.center",
              source:"players.gameowner.pos*1"
            },
            /*'makefood':{
              type:"each",
              list:"1:100",
              actions:{
                '_1':{
                  type:"create",
                  prototype:"food",
                  target:"phase.foods",
                  actions:{
                    1:{
                      type:"set",
                      target:"food.pos",
                      source:"phase.center + 100*[rand,rand] - [50,50]"
                    }
                  }
                }
              }
            },*/
            'start_morefood':{
              type:"start",
              timer:"phase.morefood"
            }
          }
        } //end of start hook
      }
    },
    scoreboard:{
      views:{
        '_1':{
          type:'page',
          elements:{
            'players':{
              type:'list',
              list:'players',
              elements:{
                0:{
                  type:"label",
                  text:"listel.id+':'+(listel.hand.count=0 ? ' winner!!!':' looser:'+listel.hand.count) + ' total distance:'+listel.total_distance+'m'",
                }
              }
            },
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
            }
          }

        }//end of page
      }
    }
  }
}; //end of game
