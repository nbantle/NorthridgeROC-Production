# ROC Production Hub

A phone-friendly web app for the Northridge Rochester production and worship teams:

- **Boot Up/Down**: step-by-step procedures, plus the pre-service checklist
- **Automation Schedule**: what Companion runs on its own, and when, with the next automation up
- **Sunday Edits**: edit, export and YouTube checklist for the message and baptisms, reset every Sunday
- **PCO**: who is serving on Audio, Production, Music and Choir at the next Rochester service, from Planning Center
- **Roaming Camera**: setup and operating notes
- **Recurring Tasks**: weekly, monthly and quarterly upkeep that resets on its own
- **Troubleshooting**: searchable fixes, grouped by system
- **Support**: a form that emails questions and requests

It is a plain static site (HTML, CSS, JavaScript) with no build step, hosted on GitHub Pages.

## Editing content

Everything people read lives in the `data/` folder. Edit a file on GitHub, commit, and the site updates in a minute or two.

| File | What it holds |
| --- | --- |
| `data/boot.js` | Boot up and boot down steps, and the boot-up checklist |
| `data/schedule.js` | Companion automation times (keep in sync with Companion) |
| `data/edits.js` | Sunday Edits checklist for the message and each baptism |
| `data/tasks.js` | Weekly, monthly and quarterly tasks and their team |
| `data/roaming.js` | Roaming Camera page (empty until sections are added) |
| `data/pco.js` | Written automatically every morning. Don't edit by hand (see PCO below) |
| `data/troubleshooting.js` | Troubleshooting guides |
| `data/support.js` | Where support requests are emailed, and the request types |

Each file has notes at the top explaining its format. Rules worth knowing:

- Checklist and task `id`s are how the app remembers checks. Don't change an id once it's in use, and keep each one unique.
- Icons are [Lucide](https://lucide.dev/icons) names, like `power`, `monitor` or `wrench`.
- If you add a new file to `data/`, also add it to the list near the bottom of `index.html`. That list loads each file fresh on every visit, so people never get stuck on an old cached version.

## PCO: volunteers from Planning Center

A GitHub Action (`.github/workflows/refresh-pco.yml`) runs `scripts/refresh_pco.py` every morning around 9 AM Eastern. It finds the next Rochester Campus service in Planning Center Services, collects who is scheduled on the Audio, Production, Music and Choir teams (plus unfilled spots), and saves it to `data/pco.js`.

**One-time setup:** in the repo, go to **Settings → Secrets and variables → Actions → New repository secret** and add two secrets, using the same Planning Center personal access token as the PCO-Updates script:

- `PCO_APP_ID`: the token's Application ID
- `PCO_SECRET`: the token's Secret

Then go to the **Actions** tab, open **Refresh PCO volunteers**, and click **Run workflow** to fill the page right away.

- **Privacy:** the site is public, so only first name and last initial are saved ("Alex K."). Declined volunteers are left out.
- **Which teams show where:** the `CATEGORIES` list at the top of `scripts/refresh_pco.py` matches Planning Center team names to Audio, Production, Music and Choir. The run log on the Actions tab lists any team that didn't match.
- **If it stops updating:** the page shows a red note once the data is more than 30 hours old. Check the Actions tab for a failed run. GitHub also pauses scheduled actions after 60 days with no activity in the repo.

## Where checks are saved

Checkmarks are stored in each person's browser (localStorage). They stay on that phone or computer and are not shared between people.

## Turning on GitHub Pages

1. In the repo, go to **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**, branch **main**, folder **/ (root)**, and save.
3. The site appears at `https://nbantle.github.io/NorthridgeROC-Production/` after a minute or two.

On a phone, open the site and use **Add to Home Screen** to get an app icon.

## Fonts

The brand typefaces (Gotham and Futura) are licensed, so their files are not in this public repo. The site uses Gotham or Futura if they are installed on the device, and otherwise falls back to Montserrat and Jost from Google Fonts, which are close matches.
