# Video chat for [Dark Star](http://www.visionbakery.com/dark-star)

## Requirements

## Installation

## WebRTC

```javascript
conn = new RTCPeerConnection();
channel = conn.createDataChannel();

conn.createOffer(function(offer) {
	conn.setLocalDescription(offer);
	// send offer to peer
}, function(error) {
	console.error(error);
});

function withAnswer(answer) {
	conn.setRemoteDescription(answer);
	// good to go?
}

// on peer
conn = new RTCPeerConnection();
channel = conn.createDataChannel();

function withOffer(offer) {
	conn.setRemoteDescription(offer);
	conn.createAnswer(function(answer) {
		conn.setLocalDescription(answer);
		// send answer to peer
	}, function(error) {
		console.error(error);
	});
}
```