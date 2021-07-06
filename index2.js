var client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

var localTracks = {
  videoTrack: null,
  audioTrack: null
};

var localTrackState = {
  videoTrackEnabled: true,
  audioTrackEnabled: true
}

var remoteUsers = {};

var options = {
  appid: null,
  channel: null,
  uid: null,
  token: null
};

document.addEventListener("DOMContentLoaded", function(event) { 
  var urlParams = new URL(location.href).searchParams;
  options.appid = urlParams.get("appid");
  options.channel = urlParams.get("channel");
  options.token = urlParams.get("token");
  options.uid = urlParams.get("uid");
});

document.querySelector("#join").addEventListener("click", function (e) {
  e.preventDefault();
  this.setAttribute("disabled", true);
  try {
    join();
  } catch (error) {
    console.error(error);
  } finally {
    document.querySelector("#leave").removeAttribute("disabled");
  }
})


document.querySelector("#leave").addEventListener("click", function (e) {
  leave();
})

document.querySelector("#mute-audio").addEventListener("click", function (e) {
  if (localTrackState.audioTrackEnabled) {
    muteAudio();
  } else {
    unmuteAudio();
  }
});

document.querySelector("#mute-video").addEventListener("click", function (e) {
  if (localTrackState.videoTrackEnabled) {
    muteVideo();
  } else {
    unmuteVideo();
  }
});

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

  showMuteButton(true);

  // Play the local video track to the local browser and update the UI with the user ID.
  localTracks.videoTrack.play("local-player");

  // Publish the local video and audio tracks to the channel.
  await client.publish(Object.values(localTracks));
  console.log("publish success");
}

async function leave() {
  for (trackName in localTracks) {
    var track = localTracks[trackName];
    if (track) {
      track.stop();
      track.close();
      localTracks[trackName] = undefined;
      showMuteButton(false);
    }
  }

  // Remove remote users and player views.
  remoteUsers = {};

  // leave the channel
  await client.leave();
  document.querySelector("#join").removeAttribute("disabled");
  document.querySelector("#leave").setAttribute("disabled", true);
  console.log("client leaves channel success");

  document.querySelectorAll('.remote-camera').forEach(e => e.remove());
}

async function subscribe(user, mediaType) {
  const uid = user.uid;
  // subscribe to a remote user
  await client.subscribe(user, mediaType);
  console.log("subscribe success");
  if (mediaType === 'video') {
    const camera = `
      <div class="camera remote-camera" id="player-${uid}">
      </div>
    `;
    document.querySelector("#dish").insertAdjacentHTML('beforeend', camera);
    user.videoTrack.play(`player-${uid}`);
  }
  if (mediaType === 'audio') {
    user.audioTrack.play();
  }
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


async function muteAudio() {
  if (!localTracks.audioTrack) return;
  await localTracks.audioTrack.setEnabled(false);
  localTrackState.audioTrackEnabled = false;
  document.querySelector("#mute-audio > i").classList.remove('fa-microphone');
  document.querySelector("#mute-audio > i").classList.add('fa-microphone-slash');
}

async function unmuteAudio() {
  if (!localTracks.audioTrack) return;
  await localTracks.audioTrack.setEnabled(true);
  localTrackState.audioTrackEnabled = true;
  document.querySelector("#mute-audio > i").classList.remove('fa-microphone-slash');
  document.querySelector("#mute-audio > i").classList.add('fa-microphone');
}

async function muteVideo() {
  if (!localTracks.videoTrack) return;
  await localTracks.videoTrack.setEnabled(false);
  localTrackState.videoTrackEnabled = false;
  document.querySelector("#mute-video > i").classList.remove('fa-video');
  document.querySelector("#mute-video > i").classList.add('fa-video-slash');
}

async function unmuteVideo() {
  if (!localTracks.videoTrack) return;
  await localTracks.videoTrack.setEnabled(true);
  localTrackState.videoTrackEnabled = true;
  document.querySelector("#mute-video > i").classList.remove('fa-video-slash');
  document.querySelector("#mute-video > i").classList.add('fa-video');
}

function showMuteButton(show) {
  var buttons = document.querySelectorAll('.mute-button');
  [].forEach.call(buttons, function(button) {
    button.style.display = show ? "block" : "none";
  });
}