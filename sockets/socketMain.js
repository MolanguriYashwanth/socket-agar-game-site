// import {io} from "../server";

const io = require('../server').io;
const checkForOrbCollisions = require('./checkCollisions').checkForOrbCollisions;
const checkForPlayerCollisions = require('./checkCollisions').checkForPlayerCollisions;

const Orb = require('./classes/Orb');

// =============CLASSES==========
const Player = require('./classes/Player')
const PlayerData = require('./classes/PlayerData')
const PlayerConfig = require('./classes/PlayerConfig');

let orbs = [];
let players = [];
let settings = {
    defaultOrbs: 50,
    defaultSpeed: 6,
    defaultSize: 6,
    // as player gets bigger, the zoom needs to go out
    defaultZoom: 1.5,
    worldWidth: 500,
    worldHeight: 500
}

initGame()

// issue a message to EVERY connected socket 30 fps
setInterval(()=>{
    if(players.length > 0){
        io.to('game').emit('tock',{
            players,
        });
    }
},33);

io.sockets.on('connect', (socket) => {
    let player = {};
    socket.on('init', (data) => {
        // add the player to the game namespace
        socket.join('game');
        // make a playerConfig object
        let playerConfig = new PlayerConfig(settings);
        // make a playerData object
        let playerData = new PlayerData(data.playerName,settings);
        console.log(playerConfig)
        // make a master player object to hold both
        player = new Player(socket.id,playerConfig, playerData);
        //console.log("Player full Object",player)
        // // issue a message to EVERY connected socket 30 fps
        //there are 30 33s in 1000 milliseconds, or 1/30th of a second, or 1 of 30fps
        setInterval(() => {
            console.log("Player full Object",player.playerData)
                socket.emit('tickTock',{
                    playerX:player.playerData.locX,
                    playerY:player.playerData.locY
                });
        }, 33);


        socket.emit('initReturn', {
            orbs
        });

        players.push(playerData)

    })

    // the client sent over a tick. That means we know what direction to move the socket
    socket.on('tick', (data) => {
        if (data.xVector && data.yVector) {
        speed = player.playerConfig.speed
        // update the playerConfig object with the new direction in data
        // and at the same time create a local variable for this callback for readability
        xV = player.playerConfig.xVector = data.xVector;
        yV = player.playerConfig.yVector = data.yVector;

        if ((player.playerData.locX < 5 && player.playerData.xVector < 0) || (player.playerData.locX > settings.worldWidth) && (xV > 0)) {
            player.playerData.locY -= speed * yV;
        } else if ((player.playerData.locY < 5 && yV > 0) || (player.playerData.locY > settings.worldHeight) && (yV < 0)) {
            player.playerData.locX += speed * xV;
        } else {
            player.playerData.locX += speed * xV;
            player.playerData.locY -= speed * yV;
        }
        
        // ORB COLLISION!!
        let capturedOrb = checkForOrbCollisions(player.playerData,player.playerConfig,orbs,settings);
        capturedOrb.then((data)=>{
            // then runs if resolve runs! a collision happened!
            // emit to all sockets the orb to replace
            const orbData = {
                orbIndex: data,
                newOrb: orbs[data]
            }
            // console.log(orbData)
            // every socket needs to know the leaderBoard has changed
            io.sockets.emit('updateLeaderBoard',getLeaderBoard());
            io.sockets.emit('orbSwitch',orbData)
        }).catch(()=>{
            // catch runs if the reject runs! no collision
            // console.log("No collision!")
        })

          // PLAYER COLLISION!!
          let playerDeath = checkForPlayerCollisions(player.playerData,player.playerConfig,players,player.socketId)
          playerDeath.then((data)=>{
              // console.log("Player collision!!!")
              // every socket needs to know the leaderBoard has changed
              io.sockets.emit('updateLeaderBoard',getLeaderBoard());
              // a player was absorbed. Let everyone know!
              io.sockets.emit('playerDeath',data);
          }).catch(()=>{
              // console.log("No player collision")
          })

    }
    });

    socket.on('disconnect',(data)=>{
        // console.log(data)
        // find out who just left... which player in players
        // make sure the player exists
        if(player.playerData){
            players.forEach((currPlayer,i)=>{
                // if they match...
                if(currPlayer.uid == player.playerData.uid){
                    // these are the droids we're looking for
                    players.splice(i,1);
                    io.sockets.emit('updateLeaderBoard',getLeaderBoard());
                }
            });
            const updateStats = `
            UPDATE stats
                SET highScore = CASE WHEN highScore < ? THEN ? ELSE highScore END,
                mostOrbs = CASE WHEN mostOrbs < ? THEN ? ELSE mostOrbs END,
                mostPlayers = CASE WHEN mostPlayers < ? THEN ? ELSE mostPlayers END
            WHERE username = ?
            `
        }
    })
})
// Run at the beginning of a new game
function initGame() {
    for (let i = 0; i < settings.defaultOrbs; i++) {
        orbs.push(new Orb(settings))
    }
}
function getLeaderBoard(){
    // sort players in desc order
    players.sort((a,b)=>{
        return b.score - a.score;
    });
    let leaderBoard = players.map((curPlayer)=>{
        return{
            name: curPlayer.name,
            score: curPlayer.score
        }
    })
    return leaderBoard
}
module.exports = io

