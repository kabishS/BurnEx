# Burn-Ex — AI-Based Calorie Estimation System | hackathon project | AI project

A gym web app with **two dashboards** — a member side for live pose-tracked
workouts, and a gym-owner (admin) side for managing members and leaderboards.
Pose tracking and calorie estimation run **entirely on-device** via MediaPipe
Pose and TensorFlow.js — no external AI API calls. Data (accounts, workouts,
walks, gyms) is stored in **Supabase**, so it's shared across devices rather
than trapped in one browser.

## One-time setup: create the Supabase tables

1. Open your project at https://supabase.com/dashboard → **SQL Editor** → **New query**.
2. Paste the contents of `data/schema.sql` and click **Run**.
3. That's it — `js/supabase.js` already points at your project URL and anon key.

The tables (`gyms`, `users`, `workouts`, `walks`) and permissive row-level
security policies are created for you. See the security note inside
`data/schema.sql` — this app authenticates with its own username/password
table rather than Supabase Auth, so the policies simply let the app's public
key read/write everything, the same trust model the earlier localStorage
version had (now shared across devices instead of per-browser). If you're
putting this in front of real users, swap in Supabase Auth + policies scoped
to `auth.uid()`.

## Running it

A couple of pages `fetch()` local JSON (`data/exercises.json`,
`data/foods.json`, `data/met-values.json`), so serve the folder over HTTP
rather than opening files with `file://`:

```bash
cd Burn-Ex
python3 -m http.server 8080
# then open http://localhost:8080
```

## Accounts & gyms

- **Gym owner (admin):** registers with a gym name → gets a unique 6-character
  gym code to hand out to members. Sees a gym dashboard, a member list, and a
  gym-wide leaderboard.
- **Member:** registers with an optional gym code (or adds one later from
  Profile) → tracked workouts count toward that gym's leaderboard.

## Pages

| Page | Purpose |
|---|---|
| `index.html` | Login / signup — the app's home page (role: member or gym owner) |
| `dashboard.html` | Member stats, daily goal ring, 7-day chart, recent activity |
| `workout.html` | Live camera workout — pose tracking, rep counting, calorie estimate |
| `history.html` | Full session log (workouts + walks), filterable |
| `analytics.html` | 30-day trend, activity mix, weekly totals |
| `food.html` | Meal ideas filtered by category, scaled to today's remaining calories |
| `walking.html` | Manual walk logging with a start→end route map |
| `weektask.html` | Monday–Saturday task checklist with a streak counter |
| `profile.html` | Edit personal details, view/join gym |
| `admin.html` | Gym owner dashboard |
| `admin-members.html` | Manage members linked to your gym code |
| `admin-leaderboard.html` | Full gym leaderboard, admin view |

There's no separate marketing landing page anymore — `index.html` is the
login/signup screen itself. (The unused hero SVGs from the old landing page
are still in `assets/images/` if you want to reuse them elsewhere.)

## Walking route map

`walking.html` includes a "Start place" / "End place" field. On submit it:
1. Geocodes both place names via the free Nominatim API (OpenStreetMap).
2. Fetches a walking route between them from the public OSRM demo server
   (falls back to a straight line if that's unreachable).
3. Draws it on a Leaflet map, and estimates distance from the route if you
   didn't type one in yourself.

Past walks with a saved route get a 🗺️ button in the history table to
redraw that route on demand.

## Exercise tracking & the calorie-while-idle fix

`data/exercises.json` defines the joints and angle thresholds used per
exercise (squat, push-up, bicep curl, jumping jack). `js/reps.js` runs the
angle-based rep state machine; `js/tensorflow.js` scores movement intensity
from landmark velocity; `js/calories.js` turns MET × weight × intensity into
a live kcal/sec burn rate.

Previously, calories accrued every second a session was open, even before
anyone stepped into frame or if they stepped out mid-session. `workout.js`
now only adds calories on ticks where MediaPipe actually detected a person
in view that second (`window._personDetected`), so idle/empty-frame time no
longer counts.

## No seed data

There is no demo account and no pre-populated workouts, members, or
leaderboard entries — the app is empty on first load by design. Register an
account to begin.

## Recent additions

- **Signup now asks age & gender** (in addition to weight/height) for member
  accounts, so BMI and BMR can be calculated. Gym owner signup skips all four
  — those fields don't apply to an admin account.
- **Food page is now a BMI/BMR page**: a speedometer gauge shows your BMI
  with a status alert (Underweight / Good weight / Overweight / Overfat),
  your BMR (estimated calories burned per day at rest) is shown alongside
  it, and the meal suggestions below are reordered to prioritize
  calorie-dense options if you're underweight or lighter/high-protein
  options if you're overweight or overfat.
- **Live Workout has size controls** — Small/Medium/Large buttons plus a
  Fullscreen toggle above the camera stage.
- **Logout now asks for confirmation** before ending your session.
- **Password fields have a show/hide (👁) toggle.**
- **Forgot password** (`forgot-password.html`) — since Burn-Ex doesn't send
  email, this verifies your username against the email you signed up with,
  then lets you set a new password directly. Good enough for a personal/demo
  deployment; swap in Supabase Auth's real email-based reset if this goes in
  front of strangers.
- **Calorie-while-undetected bug hardened further**: MediaPipe keeps
  predicting a pose for a few frames after someone leaves the shot (smoothed
  landmarks), so the earlier "no landmarks = no calories" check wasn't
  always enough. `workout.js` now also checks the average visibility score
  of the torso joints and only counts calories when that's above threshold.

## Leaderboard → Weekly Tasks (member side)

The member-facing leaderboard was replaced with `weektask.html` — a
Monday–Saturday checklist (Sunday's a rest day, no task, and skipping it
never breaks your streak). Each day has a default task from
`data/weektasks.json`, a "Mark complete" button per day, a weekly
progress bar, and a streak counter that walks backward from today
through consecutive completed task-days.

This needed one new table, `task_completions`. If you already ran
`data/schema.sql` before this feature existed, run
`data/schema_add_weektask.sql` once in the Supabase SQL editor to add it
— `data/schema.sql` itself was also updated, so a fresh setup only needs
that one file.

The gym-owner-side leaderboard (`admin.html`, `admin-leaderboard.html`)
is unchanged — gym owners can still see and rank their members by
calories burned.
