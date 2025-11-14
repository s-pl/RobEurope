## RobEurope Frontend

Single-page app for the RobEurope program built with React 19, Vite 7, Tailwind CSS and the in-house shadcn-style component set. It consumes the Express API located in `../backend` and mirrors its auth, profile, competitions and content endpoints.

### Requirements

- Node.js >= 20
- npm >= 10

### Install dependencies

```powershell
npm install
```

### Development server

```powershell
npm run dev
```

The app runs on http://localhost:5173 with hot module replacement.

### Production build

```powershell
npm run build
npm run preview
```

### API base URL

The frontend needs to talk to the backend API which can live either on your machine (`http://localhost:85`) or in the cloud deployment (`http://46.101.255.106:85`).

1. Copy `.env.example` to `.env` and define the desired origin:

	```env
	VITE_API_BASE_URL=http://localhost:85/api
	# VITE_API_BASE_URL=http://46.101.255.106:85/api
	```

2. Restart the dev server after changing the file.

3. When no env var is provided the app automatically tries the known hosts (localhost first, then 46.101.255.106). The first reachable host is cached in `localStorage` under the key `robeurope:apiBaseUrl` so subsequent sessions reuse it.

If you ever need to switch manually without rebuilding, open the browser console and run:

```js
localStorage.setItem('robeurope:apiBaseUrl', 'http://46.101.255.106:85/api');
location.reload();
```

### Styling stack

- Tailwind CSS utility layer
- Custom shadcn-like primitives (`Button`, `Card`, `Input`, `Select`, etc.)
- `Space Grotesk` typography + lucide icons
- Optional GSAP animations on the hero robot tile

### Profile page countries dropdown

The profile screen fetches `/countries` as soon as it mounts. If the request fails because the API is unreachable you will see a red helper text under the select component explaining the issue. Ensure the API base URL points to a reachable server as described above.
