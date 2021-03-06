var client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

var localTracks = {
  videoTrack: null,
  audioTrack: null
};

var remoteUsers = {};

var options = {
  appid: 'f002e5dd51c847559691ca747943a399',
  channel: 'HeadOfficePublic',
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

async function leave() {
  for (trackName in localTracks) {
    var track = localTracks[trackName];
    if (track) {
      track.stop();
      track.close();
      localTracks[trackName] = undefined;
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
    // Dish();
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

  // Dish();
}


////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////

// Area:
// function Area(Increment, Count, Width, Height, Margin = 10) {
//   let i = w = 0;
//   let h = Increment * 0.75 + (Margin * 2);
//   while (i < (Count)) {
//     if ((w + Increment) > Width) {
//       w = 0;
//       h = h + (Increment * 0.75) + (Margin * 2);
//     }
//     w = w + Increment + (Margin * 2);
//     i++;
//   }
//   if (h > Height) return false;
//   else return Increment;
// }

// Dish:
// function Dish() {

//   // variables:
//   let Margin = 2;
//   let Scenary = document.getElementById('dish');
//   let Width = Scenary.offsetWidth - (Margin * 2);
//   let Height = Scenary.offsetHeight - (Margin * 2);
//   let Cameras = document.getElementsByClassName('camera');
//   let max = 0;

//   // loop (i recommend you optimize this)
//   let i = 1;
//   while (i < 5000) {
//     let w = Area(i, Cameras.length, Width, Height, Margin);
//     if (w === false) {
//       max = i - 1;
//       break;
//     }
//     i++;
//   }

//   // set styles
//   max = max - (Margin * 2);
//   setWidth(max, Margin);
// }

// Set Width and Margin 
// function setWidth(width, margin) {
//   let Cameras = document.getElementsByClassName('camera');
//   for (var s = 0; s < Cameras.length; s++) {
//     Cameras[s].style.width = width + "px";
//     Cameras[s].style.margin = margin + "px";
//     Cameras[s].style.height = (width * 0.75) + "px";
//   }
// }

// Load and Resize Event
// window.addEventListener("load", function (event) {
//   Dish();
//   window.onresize = Dish;
// }, false);