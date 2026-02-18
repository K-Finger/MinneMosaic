# MemoryMosaic
Won 1st Place 🥇 at MinneHack 2026.

[Click here](https://memorymosaic-khaki.vercel.app/) to see the live demo.

Members: Kieran Finger, Qise Salem, Justin Nguyen, Victor Hofstetter

MemoryMosaic is a collaborative, never-ending mosaic where anyone can upload an image and snap it into place on a shared infinite canvas. Each tile is mended together, making a community-built collage.

Hover over any tile to read its caption and learn the story behind it.

![MemoryMosaic view](public/view.png)

![MemoryMosaic preview](public/readmepreview.png)

## Technical Implementation
MemoryMosaic is built with a Next.js App and a Typescript React frontend. Images are stored in Supabase Storage with placement metadata (position, size, caption). The canvas uses magnetic snapping that lets users align images to the existing mosaic without gaps or overlaps. 

The project is *~1,078 lines of code* excluding shadcn components.

## Credits
Built with [Next.js](https://nextjs.org/), [react-konva](https://konvajs.org/docs/react/), [Supabase](https://supabase.com/), [shadcn/ui](https://ui.shadcn.com/)
