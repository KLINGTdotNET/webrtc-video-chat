# Video chat for [Dark Star](http://www.visionbakery.com/dark-star)

## Requirements

## Ideas

- play received text using [mespeak.js](http://www.masswerk.at/mespeak/) or similar
- console using green-on-black "hacker" style

## Installation

- install node
- `npm install`
- `node server`

now go to <http://localhost:3002> and have fun!

if it doesn't work, try it with a recent chrome and/or install [Stuntman](http://www.stunprotocol.org/)
and change the ip address in `main.js` (`darkStar.chat.stunServer = "YOUR_IP_HERE";`).

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