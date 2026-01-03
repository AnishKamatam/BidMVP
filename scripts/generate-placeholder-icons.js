// scripts/generate-placeholder-icons.js
// Script to generate placeholder PWA icons
// Requires sharp package: npm install -D sharp

const fs = require('fs')
const path = require('path')

// Icon sizes required for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512]

async function generatePlaceholderIcons() {
  try {
    // Try to use sharp if available
    let sharp
    try {
      sharp = require('sharp')
    } catch (e) {
      console.log('⚠️  sharp package not installed.')
      console.log('📦 Install it with: npm install -D sharp')
      console.log('📝 Or create icons manually - see public/icons/README.md')
      return
    }

    const iconsDir = path.join(process.cwd(), 'public', 'icons')
    
    // Ensure directory exists
    if (!fs.existsSync(iconsDir)) {
      fs.mkdirSync(iconsDir, { recursive: true })
    }

    console.log('🎨 Generating placeholder icons...')

    // Create each icon size
    for (const size of iconSizes) {
      const filename = `icon-${size}x${size}.png`
      const filepath = path.join(iconsDir, filename)

      // Create SVG for icon: blue circle with "BM" text on white background
      const svg = `
        <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${size}" height="${size}" fill="#FFFFFF"/>
          <circle cx="${size/2}" cy="${size/2}" r="${size/3}" fill="#3B82F6"/>
          <text x="${size/2}" y="${size/2 + (size/20)}" font-family="Arial, sans-serif" 
                font-size="${Math.floor(size/6)}" fill="white" text-anchor="middle" 
                dominant-baseline="middle" font-weight="bold">BM</text>
        </svg>
      `

      // Convert SVG to PNG
      await sharp(Buffer.from(svg))
        .resize(size, size)
        .png()
        .toFile(filepath)

      console.log(`✅ Generated ${filename}`)
    }

    console.log('\n✨ All placeholder icons generated!')
    console.log('📝 Note: Replace these with your actual app icon design.')
    console.log('   See public/icons/README.md for icon design guidelines.')
  } catch (error) {
    console.error('❌ Error generating icons:', error.message)
    console.log('\n📝 Please create icons manually - see public/icons/README.md')
  }
}

generatePlaceholderIcons()

