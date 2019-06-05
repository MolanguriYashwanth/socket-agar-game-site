let socket = io.connect('http://localhost:8080')

function init() {
    draw()
    socket.emit('init',{
        playerName: player.name
    })
}

socket.on('initReturn',(data)=>{
    orbs=data.orbs
    setInterval(()=>{
        console.log("Player X Vector",player.xVector);
        socket.emit('tick',{
            xVector: player.xVector,
            yVector: player.yVector
        })
    },33)
})

socket.on('tock',(data)=>{
    //  console.log(data)
    players = data.players
})

socket.on('tickTock',(data)=>{
    player.locX = data.playerX
    player.locY = data.playerY
})