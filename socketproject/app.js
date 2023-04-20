require('dotenv').config();
var mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/dynamic-chat-app');


const app = require('express')();

const http = require('http').Server(app);
const userRoute = require('./routes/userRoute');

const User = require('./models/userModel');
const Chat = require('./models/chatModel');
app.use('/',userRoute);
const io = require('socket.io')(http);
var usp = io.of('/user-namespace');
usp.on('connection',async function(socket){
    console.log('user connected');
    var user_id = socket.handshake.auth.token;
    await User.findByIdAndUpdate({_id: user_id},{$set:{is_online:'1'}});
    socket.broadcast.emit('getOnlineuser',{user_id:user_id});

    socket.on('disconnect', async function(){
        console.log('user disconnected',socket.id);
        await User.findByIdAndUpdate({_id: user_id},{$set:{is_online:'0'}});
        socket.broadcast.emit('getOfflineuser',{user_id:user_id});
    });
  //load old chat
    socket.on('existsChat',async function(data){
        var chats = await Chat.find({ $or:[
            {sender_id:data.sender_id,receiver_id:data.receiver_id},
            {sender_id:data.receiver_id,receiver_id:data.sender_id}
        ]});
        socket.emit('loadexistsChat',{chats:chats});
    });


    //chatting implementation
    socket.on('newChat', function(data) {
       socket.broadcast.emit('loadNewChat',data);
     

    });
});

//chatting implementation


http.listen(3000,function(){
    console.log('server is running')
});