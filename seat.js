const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const channel = urlParams.get('channel');

navigator.mediaDevices.getUserMedia({ audio: false, video: true })
      .then(function(stream) {
        console.log('You let me use your mic!')
      })
      .catch(function(err) {
        console.log('No mic for you!')
      });

var client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });

var localTracks = {
    videoTrack: null,
    audioTrack: null
};

var remoteUsers = {};

var options = {
    appid: 'f002e5dd51c847559691ca747943a399',
    channel: channel,
    uid: null,
    token: null
};

join();

async function join() {

    // Add an event listener to play remote tracks when remote user publishes.
    client.on("user-published", handleUserPublished);
    client.on("user-unpublished", handleUserUnpublished);

    // Join a channel and create local tracks. Best practice is to use Promise.all and run them concurrently.
    [options.uid, localTracks.audioTrack, localTracks.videoTrack] = await Promise.all([
        // Join the channel.
        client.join(options.appid, options.channel, options.token || null, options.uid || null),
        // Create tracks to the local microphone and camera.
        AgoraRTC.createMicrophoneAudioTrack(),
        AgoraRTC.createCameraVideoTrack()
    ]);

    // Play the local video track to the local browser and update the UI with the user ID.
    localTracks.videoTrack.play("local-player");

    // Publish the local video and audio tracks to the channel.
    await client.publish(Object.values(localTracks));
    console.log("publish success");
}

async function subscribe(user, mediaType) {
    await client.subscribe(user, mediaType);
    console.log("subscribe success");
}

function handleUserPublished(user, mediaType) {
    const id = user.uid;
    remoteUsers[id] = user;
    subscribe(user, mediaType);
}

function handleUserUnpublished(user) {
    const id = user.uid;
    delete remoteUsers[id];
}