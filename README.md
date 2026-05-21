# Troute

A mobile-friendly static travel itinerary page for GitHub Pages.

## Run locally

Open `index.html` directly in a browser, or serve the folder:

```powershell
node dev-server.js
```

Then open `http://localhost:4173`.

## Deploy to GitHub Pages

1. Create a GitHub repository named `troute`.
2. Push this folder to `https://github.com/atmosuner/troute`.
3. In GitHub, open `Settings > Pages`.
4. Set `Source` to `Deploy from a branch`.
5. Select the `main` branch and `/root`, then save.

The site will be available at:

```text
https://atmosuner.github.io/troute/
```

## Itinerary JSON shape

```json
{
  "name": "Istanbul Long Weekend",
  "traveler": "Atmos",
  "days": [
    {
      "date": "2026-06-12",
      "title": "Arrival and old city",
      "stops": [
        {
          "time": "09:30",
          "title": "Check in",
          "location": "Sirkeci Mansion, Istanbul",
          "notes": "Leave bags and refresh.",
          "reservation": "Hotel booking",
          "confirmation": "SM-2048"
        }
      ]
    }
  ]
}
```

## GitHub API key

Do not paste a GitHub token into chat or commit it to this repository. If you want Codex to push for you later, create a fine-grained personal access token in GitHub with access only to the target repository and `Contents: Read and write`, then set it in your local terminal as an environment variable for that session.

```powershell
$env:GITHUB_TOKEN = "YOUR_TOKEN_HERE"
```

After that, Codex can use the token from the environment without exposing it in source files.
