'use strict';

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

window.RTCIceCandidate = window.RTCIceCandidate || window.webkitRTCIceCandidate || window.mozRTCIceCandidate;
window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
window.RTCSessionDescription = window.RTCSessionDescription || window.webkitRTCSessionDescription || window.mozRTCSessionDescription;

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
      }, function(){}, darkStar.chat.mediaConstraints);
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
darkStar.chat.pc = new RTCPeerConnection({"iceServers": [{"url": "stun:" + darkStar.chat.stunServer + ":3478"}]});
darkStar.chat.stream = null;
darkStar.chat.connected = false;
darkStar.chat.mediaConstraints = {
  'mandatory': {
    'OfferToReceiveAudio':true, 
    'OfferToReceiveVideo':true
  }
};
darkStar.chat.textChannel = null;

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
  videoEl.src = URL.createObjectURL(e.stream);
  videoEl.play();
};

darkStar.chat.setupChat = function() {
  darkStar.chat.textChannel.onopen = function() {
    console.log("text channel opened!");
  }

  var messagesEl = document.getElementById("messages-div");
  darkStar.chat.textChannel.onmessage = function(event) {
    messagesEl.value += "< " + event.data + "\n";
    darkStar.main.speak(event.data);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  var messageInputEl = document.getElementById("message-div");
  messageInputEl.onchange = function() {
    darkStar.chat.textChannel.send(messageInputEl.value);
    messagesEl.value += "> " + messageInputEl.value + "\n";
    messagesEl.scrollTop = messagesEl.scrollHeight;
    messageInputEl.value = "";
  }
}

darkStar.chat.broadcast = function() {
  if (!darkStar.chat.textChannel) {
    darkStar.chat.textChannel = darkStar.chat.pc.createDataChannel('chat');
    darkStar.chat.setupChat();
  }
  darkStar.chat.pc.ondatachannel = function(event) {
    darkStar.chat.textChannel = event.channel;
    darkStar.chat.setupChat();
  }
  navigator.getUserMedia({audio: true, video: true}, function(s) {
    darkStar.chat.stream = s;
    darkStar.chat.pc.addStream(s);
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
  }, function(){}, darkStar.chat.mediaConstraints);
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
