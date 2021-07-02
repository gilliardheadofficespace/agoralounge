var client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

var localTracks = {
  videoTrack: null,
  audioTrack: null
};

var localTrackState = {
  audioTrackEnabled: true
}

var remoteUsers = {};

var options = {
  appid: 'f002e5dd51c847559691ca747943a399',
  channel: 'teste',
  uid: null,
  token: null
};

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
})

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

function showMuteButton(show) {
  document.querySelector("#mute-audio").style.display = show ? "block" : "none";
}