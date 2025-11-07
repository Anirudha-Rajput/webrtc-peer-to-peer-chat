const peer = new Peer();

// select all the elements
const peerIdDisplay = document.getElementById("peer-id");
const connectInput = document.getElementById("connect-to-id");
const callBtn = document.getElementById("call-btn");
const endCallBtn = document.getElementById("end-call-btn");
const myVideo = document.getElementById("my-video");
const partnerVideo = document.getElementById("partner-video")
let localStream;
let call;
// 1st step -->op
peer.on("open",function(id){
    peerIdDisplay.textContent=id;
    console.log(id)
})




async function getMediaStream() {
    try {
        localStream =await navigator.mediaDevices.getUserMedia({
            video:true,
            audio:true
        });
    myVideo.srcObject=localStream;
    } 
    catch (error) {
        console.error(error)
    }
}

getMediaStream();

// sender side
callBtn.addEventListener("click",function(){
    let friendId=connectInput.value;
    call=peer.call(friendId,localStream)
    call.on("stream",(friendStream)=>{
        partnerVideo.srcObject=friendStream;
    })
      call.on("close",()=>{
        partnerVideo.srcObject=null 
    })
})
//receiver calll
peer.on("call",(incomingCall)=>{
    // console.log("incoming call from:",incomingCall)
    incomingCall.answer(localStream);
    incomingCall.on("stream",(friendStream)=>{
        partnerVideo.srcObject=friendStream;
    })
    incomingCall.on("close",()=>{
        partnerVideo.srcObject=null
    })
})
endCallBtn.addEventListener("click",()=>{
    if(call){
        call.close();   
    }
})
