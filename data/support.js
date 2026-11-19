/*
  SUPPORT REQUESTS
  ---------------------------------------------------------------
  The Support page builds an email and opens the person's email app.
  The address is split in two so simple spam bots reading the page
  don't pick it up as easily. It is joined with "@" in the app.
*/
window.ROC = window.ROC || {};

ROC.support = {
  to: ["nbantle", "northridgerochester.com"],
  contactName: "Nate",
  subjectPrefix: "[ROC Hub]",
  types: [
    { id: "question", label: "Technical question", icon: "circle-help",
      placeholder: "What are you trying to do, and what's getting in the way?" },
    { id: "broken", label: "Something's broken", icon: "triangle-alert",
      placeholder: "What isn't working? What have you tried so far?" },
    { id: "content", label: "Add or change something", icon: "square-pen",
      placeholder: "What should be added or changed in this app?" }
  ]
};
