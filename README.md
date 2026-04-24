# Skemly - AI-Powered Visual Workspace

Skemly is a modern, collaborative diagramming and visual workspace powered by AI.

## Features

- **AI-Powered Diagramming**: Generate diagrams from natural language descriptions.
- **Real-time Collaboration**: Work together with your team in real-time.
- **Versatile Tools**: Support for Flowcharts, Sequence Diagrams, ER Diagrams, and more.
- **Beautiful UI**: A clean, modern interface designed for focus and productivity.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Framer Motion, GSAP, Three.js.
- **Backend**: Node.js, Express, MongoDB, Redis, Socket.io.
- **AI**: Integration with OpenAI, Anthropic, and Cohere.
- **Payments**: Razorpay integration for subscriptions.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB
- Redis

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/skemly.git
   cd skemly
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create `.env` files in `apps/frontend` and `apps/backend` based on the provided `.env.example` files.

4. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```text
skemly/
├── apps/
│   ├── frontend/     # React frontend application
│   │   └── src/
│   │       └── assets/
│   │           ├── Skemly.png      # Main logo (288KB)
│   │           ├── docs.png        # Documentation image (234KB)
│   │           ├── hero.png        # Hero section image (44KB)
│   │           ├── react.svg       # React logo (unused)
│   │           └── vite.svg        # Vite logo (unused)
│   └── backend/      # Node.js backend API
├── packages/         # Shared packages and configurations
└── docker-compose.yml
```

## Assets & Branding

### Logo Usage
- **Primary Logo**: `apps/frontend/src/assets/Skemly.png`
  - Used in: Landing page navigation
  - Display size: 36x36px
  - Format: PNG (consider converting to SVG for better scalability)

### Images
- **Documentation Image**: `apps/frontend/src/assets/docs.png`
  - Used in: Documentation pages
  - Format: PNG (234KB - consider optimization)

- **Hero Image**: `apps/frontend/src/assets/hero.png`
  - Used in: Landing page hero section
  - Format: PNG (44KB)

### Icon Assets
- **Favicon**: `apps/frontend/public/favicon.svg`
- **Social Icons**: `apps/frontend/public/icons.svg` (sprite containing GitHub, Discord, Bluesky, X icons)

### Asset Optimization Recommendations
1. Convert `Skemly.png` to SVG format for better scalability and smaller file size
2. Optimize `docs.png` - current size (234KB) is too large for web use
3. Remove unused assets: `react.svg` and `vite.svg`
4. Consider creating WebP versions of raster images for better performance
5. Implement responsive image loading with multiple sizes

### Asset Usage in Code
- **Landing Page**: Uses `Skemly.png` in navigation bar
- **Dashboard**: Uses icon-based logo (Layers icon from lucide-react)
- **Favicon**: Set in `index.html` as `/favicon.svg`

## License

This project is licensed under the MIT License.
