## Fuzzy Plane

Input variables (3-4):
- Distance from left wall
- Distance from right wall
- Left-eye ray distance
- Right-eye ray distance

Output variable:
- Plane tilt acceleration

Rules (10-15):
1. If <very-close> to left wall, <big-right> tilt,
2. If <very-close> to right wall, <big-left> tilt,
3. If <close> to left wall, <small-right> tilt,
4. If <close> to right wall, <small-left> tilt,
5. If <far> from left wall, <small-left> tilt, //optional
6. If <far> from right wall, <small-right> tilt, //optional

7. If <very-close> to left-eye, <big-right> tilt,
8. If <very-close> to right-eye, <big-left> tilt,
9. If <close> to left-eye, <small-right> tilt,
10. If <close> to right-eye, <small-left> tilt,

# Development
First, run the development server:
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.js`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
