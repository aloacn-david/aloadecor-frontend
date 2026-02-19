# ALO Decor - Shopify Sync Ecommerce Website

This is a React + TypeScript ecommerce website that syncs with your Shopify store at www.aloadecor.com.

## Prerequisites

- Node.js 18+ and npm installed
- Shopify store with API access

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Shopify API

Edit `src/config.ts` and add your Shopify API credentials:

```typescript
export const SHOPIFY_CONFIG = {
  storeUrl: 'https://www.aloadecor.com',
  apiKey: 'your-api-key-here',
  apiSecret: 'your-api-secret-here',
  accessToken: 'your-access-token-here'
};
```

### 3. Start Development Server

```bash
npm run dev
```

The website will open at http://localhost:3000

### 4. Build for Production

```bash
npm run build
```

## Features

- Real-time product synchronization with Shopify
- Responsive product grid layout
- Product details display
- Image gallery
- Price and inventory management

## Project Structure

```
├── src/
│   ├── components/        # React components
│   ├── services/          # Shopify API service
│   ├── types/             # TypeScript type definitions
│   ├── config.ts          # Shopify configuration
│   └── main.tsx           # Application entry point
├── index.html             # HTML template
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies and scripts
```

## Shopify API Setup

1. Go to your Shopify admin panel
2. Navigate to Apps > Manage private apps
3. Create a new private app
4. Copy the API key, password, and access token
5. Update `src/config.ts` with these credentials

## License

MIT
