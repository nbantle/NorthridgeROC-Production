# ROC Production Hub

A phone-friendly web app for the Northridge Rochester production and worship teams:

- **Boot Up / Down**: step-by-step procedures, plus the pre-service checklist
- **Automation Schedule**: what Companion runs on its own, and when, with the next automation up
- **Sunday Edits**: edit, export and YouTube checklist for the message and each baptism, reset every Sunday
- **Recurring Tasks**: weekly, monthly and quarterly upkeep that resets on its own
- **Troubleshooting**: searchable fixes, grouped by system

It is a plain static site (HTML, CSS, JavaScript) with no build step, hosted on GitHub Pages.

## Editing content

Everything people read lives in the `data/` folder. Edit a file on GitHub, commit, and the site updates in a minute or two.

| File | What it holds |
| --- | --- |
| `data/boot.js` | Boot up and boot down steps, and the boot-up checklist |
| `data/schedule.js` | Companion automation times (keep in sync with Companion) |
| `data/edits.js` | Sunday Edits checklist for the message and each baptism |
| `data/tasks.js` | Weekly, monthly and quarterly tasks and their team |
| `data/troubleshooting.js` | Troubleshooting guides |
| `data/support.js` | Where support requests are emailed, and the request types |

Each file has notes at the top explaining its format. Two rules worth knowing:

- Checklist and task `id`s are how the app remembers checks. Don't change an id once it's in use, and keep each one unique.
- Icons are [Lucide](https://lucide.dev/icons) names, like `power`, `monitor` or `wrench`.

## Where checks are saved

Checkmarks are stored in each person's browser (localStorage). They stay on that phone or computer and are not shared between people.

## Turning on GitHub Pages

1. In the repo, go to **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**, branch **main**, folder **/ (root)**, and save.
3. The site appears at `https://nbantle.github.io/NorthridgeROC-Production/` after a minute or two.

On a phone, open the site and use **Add to Home Screen** to get an app icon.

## Fonts

The brand typefaces (Gotham and Futura) are licensed, so their files are not in this public repo. The site uses Gotham or Futura if they are installed on the device, and otherwise falls back to Montserrat and Jost from Google Fonts, which are close matches.
