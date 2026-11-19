/*
  RECURRING TASKS
  ---------------------------------------------------------------
  Checks reset on their own: weekly every Monday, monthly on the 1st,
  quarterly on Jan 1, Apr 1, Jul 1 and Oct 1.

  team: P = Production, W = Worship, S = Shared (both teams)
  id:   must be unique and should never change once in use
        (it is how the app remembers what has been checked).
*/
window.ROC = window.ROC || {};

ROC.teams = {
  P: { name: "Production" },
  W: { name: "Worship" },
  S: { name: "Shared", note: "Both teams" }
};

ROC.tasks = {
  weekly: [
    { id: "wk-production-center", area: "Production Center", task: "Tidy", team: "P" },
    { id: "wk-tnd-setup", area: "Thursday Night Dinner", task: "Setup", team: "P" },
    { id: "wk-band-green-room", area: "Band Green Room", task: "Tidy", team: "W" },
    { id: "wk-tnd-cleanup", area: "Thursday Night Dinner", task: "Cleanup", team: "W" },
    { id: "wk-stage-tidy", area: "Stage", task: "Tidy", team: "W" },
    { id: "wk-shared-green-room", area: "Shared Green Room", task: "Tidy", team: "S" },
    { id: "wk-backstage-cables", area: "Backstage Cables", task: "Organize", team: "S" }
  ],
  monthly: [
    { id: "mo-kb-mouse-batteries", area: "Keyboard and Mouse Batteries", task: "Charge", team: "P" },
    { id: "mo-drum-cage-interior", area: "Drum Cage Interior", task: "Clean", team: "W" },
    { id: "mo-drum-cage-glass", area: "Drum Cage Glass", task: "Clean", team: "W" },
    { id: "mo-handheld-mics", area: "Handheld Microphones", task: "Sterilize", team: "W" }
  ],
  quarterly: [
    { id: "qt-haze-co2", area: "Haze CO2", task: "Replace", team: "P" },
    { id: "qt-electronic-motors", area: "Electronic Motors", task: "Dust", team: "P" },
    { id: "qt-stage-sweep-mop", area: "Stage", task: "Sweep and Mop", team: "W" },
    { id: "qt-audio-cables", area: "Audio Cables", task: "Test", team: "W" }
  ]
};
