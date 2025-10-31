Steps I’d take:

1. Open the Firebase console → Project Settings → “General” tab → find the Web App you created and copy the config object. Confirm each value matches your [.env.local](vscode-file://vscode-app/c:/Users/Paul_/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) entries (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, etc.) with no extra spaces or quotes.
2. If you recently changed the env file, stop the dev server and restart `npm run dev` so Vite picks up the new variables.
3. In Firebase Authentication → Settings → Authorized domains, make sure `localhost` (and whatever domain you’re testing on) is listed.
4. If the API key has restrictions in Google Cloud Console, either lift them or include `https://localhost:5173` (and any other origin you need) in the allowed referrers.
5. After fixing the config, refresh the page and try sign-in again. The popup cancellation errors should disappear once Firebase accepts the key.
