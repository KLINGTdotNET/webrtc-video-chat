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

    return {
        'resizeChatDiv': resizeChatDiv
    }
}();

// initial resize
darkStar.main.resizeChatDiv();