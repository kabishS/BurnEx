# 🔥 Burn-Ex

> **AI-Based Smart Fitness & Gym Management System**

Burn-Ex is a full-stack fitness web application that combines **AI-powered workout tracking**, **calorie estimation**, **health analytics**, and **gym management** into one platform.

Using **MediaPipe Pose** and **TensorFlow.js**, the application performs real-time pose detection and exercise tracking directly in the browser, allowing users to monitor workouts without sending camera data to external servers.

---

## 🌟 Features

### 👤 Member Dashboard

- Secure Login & Registration
- AI-Based Exercise Detection
- Live Rep Counter
- Real-Time Calorie Estimation
- BMI Calculator
- BMR Calculator
- Personalized Food Suggestions
- Workout History
- Walking Route Tracker
- Weekly Fitness Tasks
- Daily Streak Tracking
- Analytics Dashboard
- Profile Management
- Join Gym using Gym Code

---

### 🏢 Gym Owner Dashboard

- Create and Manage Gym
- Generate Gym Join Code
- View All Members
- Remove Members
- Daily Leaderboard
- Weekly Leaderboard
- Monthly Leaderboard
- Monitor Member Progress

---

## 🤖 AI Features

Burn-Ex uses **MediaPipe Pose** to detect body landmarks in real time.

Supported exercises include:

- Squats
- Push-ups
- Bicep Curls
- Jumping Jacks

Calorie estimation is calculated using:

```
Calories Burned =
MET × Weight × Exercise Duration × Movement Intensity
```

Movement intensity is calculated using **TensorFlow.js**, allowing more accurate calorie estimation.

---

## 📊 Health Features

- BMI Calculator
- BMI Speedometer
- BMR Calculator
- Daily Calorie Requirement
- Smart Food Recommendations

---

## 🚶 Walking Tracker

Users can:

- Select Start Location
- Select Destination
- View Walking Route
- Save Walking History

Built with:

- Leaflet.js
- OpenStreetMap
- Nominatim
- OSRM

---

## 📈 Analytics

The analytics dashboard provides:

- Daily Calories Burned
- Weekly Progress
- Monthly Progress
- Exercise Distribution
- Workout Trends

Powered by **Chart.js**.

---

# 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| HTML5 | Structure |
| CSS3 | Styling |
| Bootstrap 5 | Responsive Design |
| JavaScript (ES6) | Application Logic |
| Supabase | Database & Authentication |
| MediaPipe Pose | Pose Detection |
| TensorFlow.js | Movement Analysis |
| Chart.js | Analytics Charts |
| Leaflet.js | Maps |
| OpenStreetMap | Map Provider |
| Nominatim | Geocoding |
| OSRM | Route Generation |
| Git & GitHub | Version Control |

---

# 📁 Project Structure

```
Burn-Ex/
│
├── index.html
├── dashboard.html
├── workout.html
├── analytics.html
├── history.html
├── food.html
├── walking.html
├── weektask.html
├── profile.html
├── admin.html
├── admin-members.html
├── admin-leaderboard.html
│
├── css/
├── js/
├── assets/
├── data/
└── README.md
```

---

# ⚙️ Installation

### Clone the repository

```bash
git clone https://github.com/your-username/Burn-Ex.git
```

### Open the project

```bash
cd Burn-Ex
```

### Configure Supabase

Update the following values in `js/supabase.js`:

```javascript
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
```

### Run the project

Open `index.html` in your browser or use a local development server.

---

# 🔒 Privacy

- Camera data never leaves the user's device.
- Pose estimation runs entirely in the browser.
- Only workout statistics are stored in Supabase.

---

# 🎯 Learning Outcomes

This project helped improve skills in:

- Computer Vision
- MediaPipe Pose
- TensorFlow.js
- JavaScript
- SQL & Supabase
- Database Design
- Responsive Web Development
- Data Visualization
- REST APIs

---

# 🚀 Future Enhancements

- AI Workout Recommendations
- Nutrition Tracking
- Mobile Application
- Wearable Device Integration
- Social Challenges
- Voice-Based Fitness Coach

---

# 📸 Screenshots

Add screenshots of your project here.

```
assets/screenshots/login.png
assets/screenshots/dashboard.png
assets/screenshots/workout.png
assets/screenshots/admin.png
```

---

# 👨‍💻 Author

**Your Name**

Java Full Stack Developer

- GitHub: https://github.com/your-username
- LinkedIn: https://linkedin.com/in/your-profile

---

## ⭐ Support

If you found this project useful, please consider giving it a ⭐ on GitHub.

---

## 📄 License

This project is licensed under the MIT License.
