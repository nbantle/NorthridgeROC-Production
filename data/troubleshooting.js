/*
  TROUBLESHOOTING
  ---------------------------------------------------------------
  One entry per problem. Fields:

  id:       unique, lowercase-with-dashes (used to link guides together)
  system:   groups guides into filters (Audio, Lighting, Video...)
  title:    the problem, the way someone would describe it
  symptoms: optional, what they will see or hear
  info:     optional, background or what "normal" looks like
  image:    optional picture for the info box: { src, alt, caption }
  steps:    what to try, in order. Each step is either plain text, or
            an object with any of:
              text:  the step (<b>bold</b> works)
              see:   id of another guide to check first (shows a link)
              warn:  a warning shown under the step
              image: { src, alt, caption }
  escalate: optional, who to call if the steps don't fix it

  Pictures go in assets/troubleshooting/.
*/
window.ROC = window.ROC || {};

ROC.troubleshooting = [

  /* ---------------------------------------------------------- AUDIO */
  {
    id: "dante-network",
    system: "Audio",
    title: "Dante network: devices missing",
    symptoms: "Audio is missing somewhere. Most missing audio comes from the Dante network needing a reset, so start here.",
    info: "Open <b>Dante Controller</b> on the producer computer. A healthy network shows <b>16 devices</b>: 15 receivers and 13 transmitters, with green checkmarks. If it matches, Dante is fine; go to the guide for your specific problem. If devices are missing, work through the steps below.",
    image: { src: "assets/troubleshooting/dante-controller.jpg", alt: "Dante Controller network view showing 16 devices, 15 receivers and 13 transmitters", caption: "What a healthy Dante network looks like" },
    steps: [
      { text: "Reset the <b>small network switch</b> in the tall production center rack. Wait 2 minutes, then check Dante Controller again. If the missing devices are still gone, go to step 2." },
      { text: "Reset the <b>large network switch</b> at the bottom right of FOH (top power rack). Wait 2 minutes, then check Dante Controller again.",
        warn: "This interrupts <b>all</b> audio. Only do it when no one needs audio." }
    ],
    escalate: "If devices are still missing after both resets, call Nate Bantle."
  },
  {
    id: "no-lobby-audio",
    system: "Audio",
    title: "No lobby audio",
    steps: [
      { see: "dante-network" },
      { text: "Check that the <b>AudacTouch 2</b> settings match the picture below.",
        image: { src: "assets/troubleshooting/audactouch-settings.jpg", alt: "AudacTouch 2 mixer: In 1 and In 2 at -90, In 3 and Bluetooth at -20, Spotify at -25, DiGiCo at -12 and unmuted, output DO1 at 0", caption: "Correct AudacTouch 2 settings" } },
      { text: "Make sure the <b>DiGiCo SD 21</b> is powered on and on the <b>Q225</b> scene." }
    ]
  },
  {
    id: "no-spotify-audio",
    system: "Audio",
    title: "No Spotify audio",
    steps: [
      { see: "dante-network" },
      { text: "On the producer computer, set the Mac's sound output to <b>Dante Virtual Soundcard</b> (Control Center → Sound).",
        image: { src: "assets/troubleshooting/mac-sound-output.jpg", alt: "macOS Sound menu with Dante Virtual Soundcard selected as the output", caption: "Mac sound output set to Dante" } },
      { text: "In the Spotify app on the producer computer, open <b>Connect to a device</b> and make sure the current device is <b>This computer</b>, so Spotify plays through the Mac's Dante output.",
        image: { src: "assets/troubleshooting/spotify-device.jpg", alt: "Spotify Connect to a device panel showing This computer as the current device", caption: "Spotify playing on this computer" } }
    ]
  },
  {
    id: "no-sd21-audio",
    system: "Audio",
    title: "No DiGiCo SD 21 audio",
    steps: [
      { see: "dante-network" }
    ]
  },

  /* ------------------------------------------------------- LIGHTING */
  {
    id: "vista-not-controlling",
    system: "Lighting",
    title: "Vista isn't controlling all or some lights",
    steps: [
      { text: "Check for lights on the <b>Vista M1</b>. Unplug the USB from the back of it, wait 5 seconds, and plug it back in.",
        image: { src: "assets/troubleshooting/vista-m1.jpg", alt: "Jands Vista M1 lighting controller", caption: "Vista M1" } },
      { text: "<b>Reset the Vista dongles.</b> There are 2 dongles under the keyboard, one on the left and one on the right. Remove both, wait 5 seconds, and put them back. Then wait another 15 seconds." },
      { text: "<b>Restart the Vista software.</b> Right-click the Vista app and choose Quit. Wait for the white dot under the icon to disappear before reopening it. If it asks about saving unsaved changes, use your judgment." }
    ]
  },

  /* ---------------------------------------------------------- VIDEO */
  {
    id: "camera-black",
    system: "Video",
    title: "Camera is black",
    info: "Each camera's SDI out feeds its monitor, and the monitor's SDI out feeds the system. Work from the camera toward the system.",
    steps: [
      "Check that the camera shows a <b>green</b> power light. If not, turn it on with the switch on the upper right side of the camera body.",
      "Check that the monitor shows a <b>green</b> power light. If not, turn it on with the switch on the back, upper right side of the monitor.",
      "Make sure every SDI cable is firmly connected.",
      "Check the ethernet power cable."
    ]
  }
];
