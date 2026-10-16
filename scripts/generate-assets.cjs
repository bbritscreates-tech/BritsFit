const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

// 1. Master BritsFit Emblem SVG
// Rounded navy squircle, turquoise-to-cyan gradient B ribbon, crisp white runner silhouette with circular head
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Dark navy background gradient -->
    <linearGradient id="navyBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#143466" />
      <stop offset="40%" stop-color="#102B55" />
      <stop offset="100%" stop-color="#091A36" />
    </linearGradient>

    <!-- Turquoise to Cyan / Electric Blue gradient for the dynamic 'B' ribbons -->
    <linearGradient id="bGradient" x1="15%" y1="0%" x2="85%" y2="100%">
      <stop offset="0%" stop-color="#22E4C6" />
      <stop offset="35%" stop-color="#12B8C7" />
      <stop offset="70%" stop-color="#00A3E0" />
      <stop offset="100%" stop-color="#1677E8" />
    </linearGradient>

    <!-- Upper loop subtle highlight -->
    <linearGradient id="topLoopGrad" x1="0%" y1="50%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="#2CF2D2" />
      <stop offset="60%" stop-color="#12B8C7" />
      <stop offset="100%" stop-color="#0284C7" />
    </linearGradient>

    <!-- Lower loop gradient -->
    <linearGradient id="bottomLoopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#12B8C7" />
      <stop offset="50%" stop-color="#0099DD" />
      <stop offset="100%" stop-color="#1677E8" />
    </linearGradient>

    <!-- Rim highlight for container -->
    <linearGradient id="rimGlow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.1" />
      <stop offset="50%" stop-color="#7DD3FC" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#38BDF8" stop-opacity="0.1" />
    </linearGradient>
  </defs>

  <!-- Squircle container (Dark Navy) -->
  <rect width="512" height="512" rx="116" fill="url(#navyBg)" />
  <rect x="2" y="2" width="508" height="508" rx="114" stroke="url(#rimGlow)" stroke-width="2" fill="none" />

  <!-- ========================================== -->
  <!-- THE FLOWING TURQUOISE-TO-CYAN LETTER 'B'  -->
  <!-- ========================================== -->

  <!-- Top Loop of 'B' -->
  <path
    d="M 276 142
       C 334 142 408 152 408 206
       C 408 244 372 258 328 262
       C 314 263 296 262 284 259
       C 310 248 354 238 354 204
       C 354 182 320 174 274 174
       C 246 174 220 180 196 190
       C 218 162 248 142 276 142
       Z"
    fill="url(#topLoopGrad)"
  />

  <!-- Bottom Loop of 'B' / Dynamic Forward Swoop -->
  <path
    d="M 318 260
       C 376 264 424 286 424 340
       C 424 402 364 426 294 426
       C 230 426 156 414 96 394
       C 142 384 218 362 268 334
       C 312 308 340 286 338 274
       C 336 268 328 264 318 260
       Z"
    fill="url(#bottomLoopGrad)"
  />

  <!-- Inner Dynamic Accent Arc connecting the waist -->
  <path
    d="M 284 256
       C 342 258 376 280 376 330
       C 376 366 338 388 288 392
       C 328 374 344 350 344 326
       C 344 296 312 282 272 278
       Z"
    fill="url(#bGradient)"
    opacity="0.85"
  />

  <!-- ========================================== -->
  <!-- DISTINCTIVE WHITE RUNNING ATHLETE SILHOUETTE -->
  <!-- ========================================== -->

  <!-- Circular White Head (tilted forward in sprint focus) -->
  <circle cx="294" cy="112" r="25" fill="#FFFFFF" />

  <!-- Athletic Runner's Body: Leaning torso, pumping lead arm, trailing arm, driving front knee, and trailing leg -->
  <!-- 1. Runner Torso & Core Drive -->
  <path
    d="M 284 144
       C 288 152 286 168 274 184
       L 242 232
       C 236 242 232 256 234 270
       C 236 284 246 294 256 304
       L 286 332
       C 292 338 290 346 282 348
       C 272 350 262 344 254 336
       L 220 298
       C 206 284 198 266 198 246
       C 198 222 210 200 228 178
       L 262 142
       C 268 136 278 136 284 144
       Z"
    fill="#FFFFFF"
  />

  <!-- 2. Runner's Forward Bent Arm (Sprint Propulsion) -->
  <path
    d="M 278 168
       C 298 174 326 186 342 204
       C 348 212 346 220 338 222
       C 330 224 322 218 316 210
       C 304 196 282 188 266 184
       Z"
    fill="#FFFFFF"
  />

  <!-- 3. Runner's Trailing Rear Arm -->
  <path
    d="M 238 190
       C 214 204 186 224 162 248
       C 156 254 148 252 146 244
       C 144 236 150 230 156 224
       C 182 198 212 180 238 170
       Z"
    fill="#FFFFFF"
  />

  <!-- 4. Runner's Trailing Leg (Propulsion off the ground) -->
  <path
    d="M 216 264
       C 196 290 164 326 128 362
       C 102 388 78 404 68 408
       C 62 410 56 406 58 398
       C 62 390 84 372 110 346
       C 148 308 182 270 204 246
       Z"
    fill="#FFFFFF"
  />

  <!-- 5. Runner's Forward High Stride Leg & Foot -->
  <path
    d="M 246 294
       C 260 308 280 326 298 348
       C 314 368 318 388 310 404
       C 306 412 296 414 292 406
       C 288 398 294 384 284 370
       C 270 350 252 334 238 318
       Z"
    fill="#FFFFFF"
  />
</svg>`;

// 2. Full Logo SVG with Typography (Wordmark)
const fullLogoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 280" width="1024" height="280">
  <defs>
    <linearGradient id="flNavy" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#143466" />
      <stop offset="50%" stop-color="#102B55" />
      <stop offset="100%" stop-color="#091A36" />
    </linearGradient>
    <linearGradient id="flTopLoop" x1="0%" y1="50%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="#2CF2D2" />
      <stop offset="60%" stop-color="#12B8C7" />
      <stop offset="100%" stop-color="#0284C7" />
    </linearGradient>
    <linearGradient id="flBottomLoop" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#12B8C7" />
      <stop offset="50%" stop-color="#0099DD" />
      <stop offset="100%" stop-color="#1677E8" />
    </linearGradient>
    <linearGradient id="flRim" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.1" />
      <stop offset="50%" stop-color="#7DD3FC" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#38BDF8" stop-opacity="0.1" />
    </linearGradient>
  </defs>

  <!-- Icon scaled to 240x240 inside (20, 20) -->
  <g transform="translate(20, 20) scale(0.46875)">
    <rect width="512" height="512" rx="116" fill="url(#flNavy)" />
    <rect x="2" y="2" width="508" height="508" rx="114" stroke="url(#flRim)" stroke-width="2" fill="none" />
    <path d="M 276 142 C 334 142 408 152 408 206 C 408 244 372 258 328 262 C 314 263 296 262 284 259 C 310 248 354 238 354 204 C 354 182 320 174 274 174 C 246 174 220 180 196 190 C 218 162 248 142 276 142 Z" fill="url(#flTopLoop)" />
    <path d="M 318 260 C 376 264 424 286 424 340 C 424 402 364 426 294 426 C 230 426 156 414 96 394 C 142 384 218 362 268 334 C 312 308 340 286 338 274 C 336 268 328 264 318 260 Z" fill="url(#flBottomLoop)" />
    <circle cx="294" cy="112" r="25" fill="#FFFFFF" />
    <path d="M 284 144 C 288 152 286 168 274 184 L 242 232 C 236 242 232 256 234 270 C 236 284 246 294 256 304 L 286 332 C 292 338 290 346 282 348 C 272 350 262 344 254 336 L 220 298 C 206 284 198 266 198 246 C 198 222 210 200 228 178 L 262 142 C 268 136 278 136 284 144 Z" fill="#FFFFFF" />
    <path d="M 278 168 C 298 174 326 186 342 204 C 348 212 346 220 338 222 C 330 224 322 218 316 210 C 304 196 282 188 266 184 Z" fill="#FFFFFF" />
    <path d="M 238 190 C 214 204 186 224 162 248 C 156 254 148 252 146 244 C 144 236 150 230 156 224 C 182 198 212 180 238 170 Z" fill="#FFFFFF" />
    <path d="M 216 264 C 196 290 164 326 128 362 C 102 388 78 404 68 408 C 62 410 56 406 58 398 C 62 390 84 372 110 346 C 148 308 182 270 204 246 Z" fill="#FFFFFF" />
    <path d="M 246 294 C 260 308 280 326 298 348 C 314 368 318 388 310 404 C 306 412 296 414 292 406 C 288 398 294 384 284 370 C 270 350 252 334 238 318 Z" fill="#FFFFFF" />
  </g>

  <!-- Typography: BritsFit -->
  <text x="300" y="155" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="112" font-weight="900" letter-spacing="-2">
    <tspan fill="#102B55">Brits</tspan><tspan fill="#1677E8">Fit</tspan>
  </text>
  <text x="305" y="215" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="28" font-weight="700" fill="#12B8C7" letter-spacing="4">
    YOUR FITNESS. YOUR PROGRESS. YOUR JOURNEY.
  </text>
</svg>`;

// 3. Splash Screen Graphic (Dark Navy Fullscreen with prominent emblem & tagline)
const splashSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
  <defs>
    <radialGradient id="splashBg" cx="50%" cy="45%" r="65%">
      <stop offset="0%" stop-color="#14366A" />
      <stop offset="40%" stop-color="#0F284F" />
      <stop offset="70%" stop-color="#0A1C38" />
      <stop offset="100%" stop-color="#050F1F" />
    </radialGradient>

    <linearGradient id="spBTop" x1="0%" y1="50%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="#2CF2D2" />
      <stop offset="60%" stop-color="#12B8C7" />
      <stop offset="100%" stop-color="#0284C7" />
    </linearGradient>

    <linearGradient id="spBBottom" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#12B8C7" />
      <stop offset="50%" stop-color="#0099DD" />
      <stop offset="100%" stop-color="#1677E8" />
    </linearGradient>

    <linearGradient id="spNavyCard" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1A407D" />
      <stop offset="100%" stop-color="#0D2245" />
    </linearGradient>

    <linearGradient id="spRim" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.2" />
      <stop offset="50%" stop-color="#7DD3FC" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#38BDF8" stop-opacity="0.2" />
    </linearGradient>
  </defs>

  <!-- Midnight Navy Radial Background -->
  <rect width="1080" height="1920" fill="url(#splashBg)" />

  <!-- Ambient background glow behind logo -->
  <circle cx="540" cy="800" r="320" fill="#12B8C7" opacity="0.08" />
  <circle cx="540" cy="800" r="200" fill="#1677E8" opacity="0.12" />

  <!-- Prominent Central Logo Emblem (380x380 centered at x=350, y=610) -->
  <g transform="translate(350, 610) scale(0.7421875)">
    <rect width="512" height="512" rx="116" fill="url(#spNavyCard)" />
    <rect x="2" y="2" width="508" height="508" rx="114" stroke="url(#spRim)" stroke-width="2.5" fill="none" />
    <path d="M 276 142 C 334 142 408 152 408 206 C 408 244 372 258 328 262 C 314 263 296 262 284 259 C 310 248 354 238 354 204 C 354 182 320 174 274 174 C 246 174 220 180 196 190 C 218 162 248 142 276 142 Z" fill="url(#spBTop)" />
    <path d="M 318 260 C 376 264 424 286 424 340 C 424 402 364 426 294 426 C 230 426 156 414 96 394 C 142 384 218 362 268 334 C 312 308 340 286 338 274 C 336 268 328 264 318 260 Z" fill="url(#spBBottom)" />
    <circle cx="294" cy="112" r="25" fill="#FFFFFF" />
    <path d="M 284 144 C 288 152 286 168 274 184 L 242 232 C 236 242 232 256 234 270 C 236 284 246 294 256 304 L 286 332 C 292 338 290 346 282 348 C 272 350 262 344 254 336 L 220 298 C 206 284 198 266 198 246 C 198 222 210 200 228 178 L 262 142 C 268 136 278 136 284 144 Z" fill="#FFFFFF" />
    <path d="M 278 168 C 298 174 326 186 342 204 C 348 212 346 220 338 222 C 330 224 322 218 316 210 C 304 196 282 188 266 184 Z" fill="#FFFFFF" />
    <path d="M 238 190 C 214 204 186 224 162 248 C 156 254 148 252 146 244 C 144 236 150 230 156 224 C 182 198 212 180 238 170 Z" fill="#FFFFFF" />
    <path d="M 216 264 C 196 290 164 326 128 362 C 102 388 78 404 68 408 C 62 410 56 406 58 398 C 62 390 84 372 110 346 C 148 308 182 270 204 246 Z" fill="#FFFFFF" />
    <path d="M 246 294 C 260 308 280 326 298 348 C 314 368 318 388 310 404 C 306 412 296 414 292 406 C 288 398 294 384 284 370 C 270 350 252 334 238 318 Z" fill="#FFFFFF" />
  </g>

  <!-- BritsFit Brand Typography -->
  <text x="540" y="1080" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="92" font-weight="900" letter-spacing="-1">
    <tspan fill="#FFFFFF">Brits</tspan><tspan fill="#1677E8">Fit</tspan>
  </text>

  <!-- Tagline -->
  <text x="540" y="1150" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="28" font-weight="700" fill="#12B8C7" letter-spacing="3">
    YOUR FITNESS. YOUR PROGRESS. YOUR JOURNEY.
  </text>

  <!-- Subtitle -->
  <text x="540" y="1205" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="20" font-weight="500" fill="#94A3B8" letter-spacing="1">
    Personal &amp; Family Fitness Tracking
  </text>
</svg>`;

async function main() {
  const assetsDir = path.resolve(__dirname, '../public/assets');
  const publicDir = path.resolve(__dirname, '../public');

  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  // 1. Write SVGs
  fs.writeFileSync(path.join(assetsDir, 'britsfit-logo.svg'), logoSvg, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), logoSvg, 'utf8');
  console.log('Saved SVG vector assets.');

  // 2. Generate britsfit-icon.png (512x512)
  const iconResvg = new Resvg(logoSvg, { fitTo: { mode: 'width', value: 512 } });
  const iconPng = iconResvg.render().asPng();
  fs.writeFileSync(path.join(assetsDir, 'britsfit-icon.png'), iconPng);
  fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), iconPng);
  fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), iconPng);
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), iconPng);
  console.log('Saved britsfit-icon.png (512x512).');

  // 192x192 for PWA
  const pwa192Resvg = new Resvg(logoSvg, { fitTo: { mode: 'width', value: 192 } });
  fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192Resvg.render().asPng());
  console.log('Saved pwa-192x192.png.');

  // 3. Generate britsfit-logo.png (high resolution 1024x1024)
  const logo1024Resvg = new Resvg(logoSvg, { fitTo: { mode: 'width', value: 1024 } });
  const logo1024Png = logo1024Resvg.render().asPng();
  fs.writeFileSync(path.join(assetsDir, 'britsfit-logo.png'), logo1024Png);
  console.log('Saved britsfit-logo.png (1024x1024).');

  // 4. Generate britsfit-splash.png (branded startup screen graphic)
  const splashResvg = new Resvg(splashSvg, { fitTo: { mode: 'width', value: 1080 } });
  const splashPng = splashResvg.render().asPng();
  fs.writeFileSync(path.join(assetsDir, 'britsfit-splash.png'), splashPng);
  console.log('Saved britsfit-splash.png (1080x1920).');

  console.log('All branding assets generated successfully!');
}

main().catch(err => {
  console.error('Asset generation failed:', err);
  process.exit(1);
});
