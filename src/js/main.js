'use strict';

var darkStar = {};

darkStar.main = function(){
    window.onresize = resizeChatDiv;

    function resizeChatDiv() {
        var chatDiv = document.getElementById('chat-div');
        var videoDiv = document.getElementById('video-div');
        var msgDiv = document.getElementById('message-div');
        var msgsDiv = document.getElementById('messages-div');

        if(videoDiv && chatDiv && msgDiv && msgsDiv) {
            var chatHeight = window.innerHeight - videoDiv.clientHeight;
            if(chatHeight > 0) {
                console.log(chatHeight);
                chatDiv.style.height = chatHeight+"px";
                var msgDivHeight = msgDiv.clientHeight;
                var msgsDivHeight = (chatHeight - msgDivHeight) * 0.70;
                msgsDiv.style.height = Math.floor(msgsDivHeight)+"px";
            }
        }
    }

    function speechSynth(textMsg) {
        if ('speechSynthesis' in window) {
            var msg = new SpeechSynthesisUtterance(textMsg);
            msg.lang = "de-DE";
            msg.volume = 1;
            window.speechSynthesis.speak(msg);
        }
    }

    return {
        'resizeChatDiv': resizeChatDiv,
        'speak': speechSynth
    }
}();

// initial resize
darkStar.main.resizeChatDiv();

darkStar.chat = {};

// the socket handles sending messages between peer connections while they are in the 
// process of connecting
darkStar.chat.socket = new WebSocket('ws://' + window.location.host + window.location.pathname);

darkStar.chat.socket.onmessage = function(message) {
  var msg = JSON.parse(message.data);

  switch(msg.type) {
    case 'assigned_id' :
      darkStar.chat.socket.id = msg.id;
      break;
    case 'received_offer' : 
      console.log('received offer', msg.data);
      darkStar.chat.pc.setRemoteDescription(new RTCSessionDescription(msg.data));
      darkStar.chat.pc.createAnswer(function(description) {
        console.log('sending answer');
        darkStar.chat.pc.setLocalDescription(description); 
        darkStar.chat.socket.send(JSON.stringify({
          type: 'received_answer', 
          data: description
        }));
      }, null, darkStar.chat.mediaConstraints);
      break;
    case 'received_answer' :
      console.log('received answer');
      if(!darkStar.chat.connected) {
        darkStar.chat.pc.setRemoteDescription(new RTCSessionDescription(msg.data));
        darkStar.chat.connected = true;
      }
      break;

    case 'received_candidate' :
      console.log('received candidate');
      var candidate = new RTCIceCandidate({
        sdpMLineIndex: msg.data.label,
        candidate: msg.data.candidate
      });
      darkStar.chat.pc.addIceCandidate(candidate);
      break;
  }
};

darkStar.chat.stunServer = "172.24.83.128";
darkStar.chat.pc = new webkitRTCPeerConnection({"iceServers": [{"url": "stun:" + darkStar.chat.stunServer + ":3478"}]});
darkStar.chat.stream = null;
darkStar.chat.connected = false;
darkStar.chat.mediaConstraints = {
  'mandatory': {
    'OfferToReceiveAudio':true, 
    'OfferToReceiveVideo':true
  }
};

darkStar.chat.pc.onicecandidate = function(e) {
  if(e.candidate) {
    darkStar.chat.socket.send(JSON.stringify({
      type: 'received_candidate',
      data: {
        label: e.candidate.sdpMLineIndex,
        id: e.candidate.sdpMid,
        candidate: e.candidate.candidate
      }
    }));
  }
};

darkStar.chat.pc.onaddstream = function(e) {
  console.log('start remote video stream');
  var videoEl = document.getElementById("video");
  videoEl.src = webkitURL.createObjectURL(e.stream);
  videoEl.play();
};

darkStar.chat.broadcast = function() {
  // gets local video stream and renders to vid1
  navigator.webkitGetUserMedia({audio: true, video: true}, function(s) {
    darkStar.chat.stream = s;
    darkStar.chat.pc.addStream(s);
    // vid1.src = webkitURL.createObjectURL(s);
    // vid1.play();
    // initCall is set in views/index and is based on if there is another person in the room to connect to
    // if(initCall)
      darkStar.chat.start();
  }, function (error) {
    try {
      console.error(error);
    } catch (e) {}
  });
}

darkStar.chat.start = function() {
  // this initializes the peer connection
  darkStar.chat.pc.createOffer(function(description) {
    darkStar.chat.pc.setLocalDescription(description);
    darkStar.chat.socket.send(JSON.stringify({
      type: 'received_offer',
      data: description
    }));
  }, null, darkStar.chat.mediaConstraints);
}

window.onload = function() {
  darkStar.chat.broadcast();
};

window.onbeforeunload = function() {
  darkStar.chat.socket.send(JSON.stringify({
    type: 'close'
  }));
  darkStar.chat.pc.close();
  darkStar.chat.pc = null;
};
