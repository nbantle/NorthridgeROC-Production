/*
  SUNDAY EDITS
  ---------------------------------------------------------------
  The weekly edit-and-upload checklist. Checks reset every Sunday.

  message:  steps for the message
  baptism:  steps for baptisms (always shown; repeat them for each baptism)

  Each group has a title and items. Item fields:
    id:    unique within its list; don't change once in use
    text:  the step (<b>bold</b> works for preset names)
    note:  optional small line under the step
    path:  optional folder path, shown with a Copy button
    copy:  optional text to copy, shown with a Copy button
    link:  optional { href, label } shown as a link that opens in a new tab

  Placeholder: {year} becomes the current year.
*/
window.ROC = window.ROC || {};

ROC.edits = {
  message: [
    { title: "Edit", items: [
      { id: "msg-edit", text: "Edit the message",
        note: "Use the second service unless there's a specific reason it doesn't work." }
    ] },
    { title: "Export from DaVinci Resolve", items: [
      { id: "msg-export-video", text: "Export with the <b>Message ProRes + YouTube</b> preset",
        note: "Uploads to YouTube automatically." },
      { id: "msg-export-audio", text: "Export with the <b>Message Audio</b> preset",
        note: "Save it to this folder:",
        path: "Google Drive › Shared drives › Podcast › Message Audio › {year}" }
    ] },
    { title: "YouTube: once the upload finishes", note: "Open the new video in YouTube Studio.", items: [
      { id: "msg-yt-title", text: "Set the title to <b>Sermon Title | Communicator Name</b>" },
      { id: "msg-yt-description", text: "Update the sermon description" },
      { id: "msg-yt-monetization", text: "Turn monetization <b>on</b>" },
      { id: "msg-yt-playlist-recent", text: "Add to the <b>Recent Uploads from Northridge Church</b> playlist" },
      { id: "msg-yt-playlist-series", text: "Add to the <b>current series</b> playlist" },
      { id: "msg-yt-thumbnail", text: "Add the thumbnail",
        note: "Thumbnails are in this folder, inside the current series folder:",
        path: "Google Drive › Shared drives › Graphics › Sermon Graphics" },
      { id: "msg-yt-public", text: "Set visibility to <b>Public</b>" }
    ] }
  ],

  baptism: [
    { title: "Edit and export", items: [
      { id: "edit", text: "Edit the baptism" },
      { id: "export-oc", text: "Export with the <b>Northridge MP4.OC</b> preset" },
      { id: "export-yt", text: "Export with the <b>Northridge MP4 + YouTube</b> preset" }
    ] },
    { title: "YouTube", note: "No thumbnail needed here. Taylor handles baptism thumbnails.", items: [
      { id: "yt-title", text: "Set the title to <b>First Name Last Name | Stories of Life Change</b>" },
      { id: "yt-public", text: "Set visibility to <b>Public</b>" },
      { id: "yt-monetization", text: "Turn monetization <b>on</b>" },
      { id: "yt-playlist-recent", text: "Add to the <b>Recent Uploads from Northridge Church</b> playlist" },
      { id: "yt-playlist-stories", text: "Add to the <b>Stories of Life Change</b> playlist" }
    ] }
  ]
};
