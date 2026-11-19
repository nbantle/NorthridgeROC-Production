/*
  AUTOMATION SCHEDULE
  ---------------------------------------------------------------
  Mirrors the time-based triggers in Bitfocus Companion.
  When a trigger changes in Companion, change it here too.

  times: [day, "HH:MM:SS" (24-hour), optional note]
         day = Sun Mon Tue Wed Thu Fri Sat, or Daily
  manual (on a day): something that is NOT automated on that day.
*/
window.ROC = window.ROC || {};

ROC.schedule = {
  updated: "Nov 19, 2026",

  automations: [
    { group: "Service Setup", name: "POWER UP (SERVICE)", icon: "power",
      times: [["Sun", "07:10:00"], ["Thu", "17:00:30"]] },
    { group: "Service Setup", name: "Services Live Tracking ON", icon: "radio",
      times: [["Thu", "18:35:00"], ["Sun", "08:15:00"]] },
    { group: "Service Setup", name: "SHUT DOWN", icon: "power-off",
      times: [["Sun", "14:00:00"],
              ["Thu", "16:30:00", "Intentional: resets the room before Thursday power up."],
              ["Wed", "21:00:00"],
              ["Thu", "20:30:00"]] },
    { group: "Service Setup", name: "Services Live Tracking OFF", icon: "radio",
      times: [["Daily", "06:00:00"], ["Thu", "20:00:00"], ["Sun", "13:45:00"]] },

    { group: "Lobby AV", name: "Lobby Spotify/MP1", icon: "music",
      times: [["Sun", "07:15:00"], ["Wed", "17:00:00"], ["Thu", "16:00:00"]] },
    { group: "Lobby AV", name: "Lobby DiGiCo/ME 1", icon: "sliders-horizontal",
      times: [["Sun", "08:05:00"], ["Wed", "18:45:00"], ["Thu", "18:35:00"]] },
    { group: "Lobby AV", name: "Lobby OFF", icon: "volume-x",
      times: [["Sun", "14:00:00"], ["Wed", "20:45:00"], ["Thu", "20:15:00"]] },
    { group: "Lobby AV", name: "Gathering Room Signage", icon: "tv",
      times: [["Thu", "17:01:30"]] },
    { group: "Lobby AV", name: "Auditorium Signage", icon: "tv",
      times: [["Thu", "18:30:00"]] }
  ],

  days: [
    { key: "Sun", name: "Sunday" },
    { key: "Wed", name: "Wednesday",
      manual: { name: "POWER UP", note: "Done by hand on Wednesdays. Follow the Boot Up steps." } },
    { key: "Thu", name: "Thursday" }
  ]
};
