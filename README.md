
# Web-based Photo Gallery

A personal photo gallery web application built with React (Vite) and TypeScript. It leverages Firebase for authentication and database management, and Cloudinary for optimized image storage and delivery (AVIF/JXL).

## Prerequisites

Before setting up the project, ensure you have the following:
* Node.js (v18 or higher)
* GitHub Account
* Google Account (for Firebase)
* Cloudinary Account (Free tier)

## 1. Installation

Clone the repository and install the dependencies.

```bash
git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
cd your-repo-name
npm install
```

## 2. Firebase Configuration (Backend)

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. **Authentication:**
   * Navigate to **Build > Authentication**.
   * Click **Get Started**.
   * Select the **Sign-in method** tab.
   * Enable **Google** and **Email/Password**.
3. **Firestore Database:**
   * Navigate to **Build > Firestore Database**.
   * Click **Create Database**.
   * Select **Test mode** for initial development (or configure rules for authorized users).
4. **Get Configuration Keys:**
   * Click the **Project Settings** (gear icon).
   * Scroll down to **Your apps** and click the **</>** (Web) icon.
   * Register a nickname for your app.
   * Copy the `firebaseConfig` values (apiKey, authDomain, etc.) for the next step.


## 3. Cloudinary Configuration (Storage)

1. Log in to the [Cloudinary Console](https://console.cloudinary.com/).
2. Navigate to **Settings > Upload**.
3. Scroll to **Upload presets** and click **Add upload preset**.
4. **Configure the Preset:**
   * **Name:** `gallery_preset` (or your preferred name).
   * **Signing Mode:** Select **Unsigned**.
5. **Incoming Transformation:**
   * Click **Edit** in the Incoming Transformation section.
   * Enter the following string exactly: `w_5712,h_5712,c_limit,f_avif,q_auto`
   * *Note:* This preserves the quality of standard photos while resizing excessively large images to fit within the 25MP free tier limit.
6. **Media Analysis:**
   * Set **Image metadata** to **On** (True) to extract EXIF data (Date, Camera, GPS).
7. Click **Save**.
8. Note your **Cloud Name** and the **Preset Name**.

## 4. Environment Variables

Create a `.env` file in the root directory of your project. Add your keys from the previous steps.

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=gallery_preset

```

*Note: Ensure `.env` is included in your `.gitignore` file.*

## 5. Local Development

Run the application locally to test authentication and uploading.

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

## 6. Deployment to GitHub Pages

### Step 1: Install Deploy Tool

Run the following command in your terminal:

```bash
npm install gh-pages --save-dev
```

### Step 2: Update Configuration Files

**1. Modify `vite.config.ts`:**
Set the `base` property to your repository name.

```typescript
export default defineConfig({
  plugins: [react()],
  base: '/your-repo-name/', // Important: surrounding slashes required
})
```

**2. Modify `package.json`:**
Add the `homepage` field and update the `scripts` section.

```json
{
  "name": "your-project-name",
  "homepage": "https://<GITHUB_USERNAME>.github.io/<REPO_NAME>",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview",
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

**3. Router Configuration:**
Ensure you are using `HashRouter` instead of `BrowserRouter` in `src/main.tsx` to prevent 404 errors when refreshing pages on GitHub Pages.

### Step 3: Deploy

Run the deployment script:

```bash
npm run deploy
```

## 7. Post-Deployment (Crucial)

After deploying, login will fail until you authorize your domain in Firebase.

1. Go to **Firebase Console > Authentication > Settings**.
2. Find **Authorized domains**.
3. Click **Add domain**.
4. Enter your GitHub Pages domain (e.g., `username.github.io`).
* Do not include `https://` or the repository path.


## How to Update

To update your live site after making code changes:

1. **Deploy the changes:**
```bash
npm run deploy
```

2. **Commit your source code:**
```bash
git add .
git commit -m "Update description"
git push origin main
```
