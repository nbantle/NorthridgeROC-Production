/*
  BOOT UP / BOOT DOWN
  ---------------------------------------------------------------
  steps:      shown in order, numbered automatically.
              icon = any Lucide icon name (https://lucide.dev/icons)
              items can use <b>bold</b> for buttons and states.
  checklist:  checkable items. Give each a unique id.
              parts  = small buttons inside one item (all must be tapped)
              weekly = shows a "Weekly" label and the last date it was checked
*/
window.ROC = window.ROC || {};

ROC.boot = {
  up: {
    label: "Boot Up",
    steps: [
      { where: "FOH", icon: "sliders-horizontal", title: "FOH Console",
        items: [
          "Press the <b>ON</b> button at the bottom left of the FOH console. It turns <b>green</b> when powered on.",
          "Load the correct FOH session on the Quantum 225."
        ] },
      { where: "Backstage", icon: "zap", title: "Mini Breakers",
        items: [
          "Open the breaker box just inside the curtains.",
          "Switch the 6 small breakers <b>on</b> (flip toward the inside)."
        ] },
      { where: "Backstage", icon: "server", title: "Sequencer",
        items: [
          "Find the tall rack just past the breaker box. The sequencer is at the top.",
          "Toggle the sequencer on. It starts flashing <b>green</b>."
        ] },
      { where: "Producer Station", icon: "monitor", title: "Producer Station",
        items: [
          "Open Vista and load the show file."
        ] }
    ],
    checklist: [
      { id: "monitor-cam15", text: "Power on the center monitor for Camera 1.5", icon: "monitor" },
      { id: "cam-batteries", text: "Insert handheld batteries", icon: "battery-full",
        parts: ["Cam 1", "Cam 2", "Cam 3"], partIcon: "video" },
      { id: "roaming-cam", text: "Review roaming cam setup", icon: "camera",
        parts: ["Chargers", "Camera balance", "Tally lights"] },
      { id: "blackmagic-rec", text: "Open the Blackmagic recording app", icon: "circle-dot" },
      { id: "unity-open", text: "Verify Unity is open on the producer computer", icon: "monitor-check" },
      { id: "s-series-save", text: "Save the weekly S series file", icon: "save", weekly: true }
    ]
  },

  down: {
    label: "Boot Down",
    steps: [
      { where: "Lighting", icon: "lightbulb", title: "House Lights & Vista",
        items: [
          "Turn <b>on</b> the house light panel, second from the bottom.",
          "Release Vista lights."
        ] },
      { where: "Backstage", icon: "zap", title: "Mini Breakers",
        items: [
          "Open the breaker box just inside the curtains.",
          "Switch the 6 small breakers <b>off</b> (flip toward the outside)."
        ] },
      { where: "Backstage", icon: "server", title: "Sequencer",
        items: [
          "At the top of the tall rack, toggle the sequencer once.",
          "Let it finish powering off."
        ] },
      { where: "FOH", icon: "sliders-horizontal", title: "FOH Console",
        items: [
          "Shut down the Quantum 225.",
          "Press the <b>OFF</b> button at the bottom left of the console. The ON button flashes, then powers off after about 30 seconds."
        ] }
    ],
    checklist: []
  }
};
