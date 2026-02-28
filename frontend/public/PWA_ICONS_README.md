# PWA Icons Required

This directory needs the following icon files for the PWA to work properly:

## Required Icons

1. **pwa-192x192.png** (192x192 pixels)
   - Standard PWA icon for Android devices
   - Should be a square icon with the app logo
   - Background: White or transparent
   - Purpose: Display on home screen

2. **pwa-512x512.png** (512x512 pixels)
   - High-resolution PWA icon
   - Used for splash screens and larger displays
   - Should be maskable (safe zone in center 80%)
   - Purpose: Splash screen and high-DPI displays

3. **apple-touch-icon.png** (180x180 pixels)
   - iOS-specific icon
   - Should have rounded corners (iOS applies them)
   - No transparency (use solid background)
   - Purpose: iOS home screen icon

4. **favicon.ico** (32x32 pixels)
   - Browser tab icon
   - Multi-resolution ICO file preferred
   - Purpose: Browser tab/bookmark icon

## Design Guidelines

- Use the app's primary color (#4F46E5 - Indigo)
- Include a recognizable symbol (e.g., graduation cap, book, or AI symbol)
- Ensure good contrast for visibility
- Test on both light and dark backgrounds
- Follow Material Design icon guidelines for maskable icons

## Maskable Icon Safe Zone

For pwa-512x512.png (maskable):
- Keep important content within the center 80% circle
- Outer 10% on all sides may be cropped on some devices
- Use a solid background color that extends to edges

## Tools for Creation

- Figma, Adobe Illustrator, or Sketch for design
- PWA Asset Generator: https://github.com/elegantapp/pwa-asset-generator
- RealFaviconGenerator: https://realfavicongenerator.net/

## Temporary Placeholder

Until proper icons are created, the vite.svg is being used as a placeholder.
Replace these files before production deployment.
