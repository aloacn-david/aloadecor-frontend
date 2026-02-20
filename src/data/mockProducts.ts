import { ShopifyProduct } from '../types/shopify';

export const mockProducts: ShopifyProduct[] = [
  {
    id: 1,
    title: 'Modern Pendant Light',
    description: 'Elegant modern pendant light perfect for dining rooms and living spaces. Features adjustable height and energy-efficient LED lighting.',
    images: [
      { src: 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=400' }
    ],
    variants: [
      { title: 'Chrome', price: '129.99', sku: 'PEND-001-CHR' },
      { title: 'Brushed Nickel', price: '139.99', sku: 'PEND-001-BN' },
      { title: 'Matte Black', price: '149.99', sku: 'PEND-001-BLK' }
    ],
    category: 'Pendant Lights',
    collections: [{ id: 1, title: 'Modern Lighting', handle: 'modern-lighting' }],
    platformLinks: {
      amazon1: '',
      amazon2: '',
      wf1: '',
      wf2: '',
      os1: '',
      os2: '',
      hd1: '',
      hd2: '',
      lowes: '',
      target: '',
      walmart: '',
      ebay: '',
      kohls: ''
    }
  },
  {
    id: 2,
    title: 'Crystal Chandelier',
    description: 'Stunning crystal chandelier with 12 lights. Perfect for grand entryways and formal dining rooms.',
    images: [
      { src: 'https://images.unsplash.com/photo-1540932296774-3ed6915e7e64?w=400' }
    ],
    variants: [
      { title: 'Clear Crystal', price: '499.99', sku: 'CHAND-001-CLR' },
      { title: 'Amber Crystal', price: '549.99', sku: 'CHAND-001-AMB' }
    ],
    category: 'Chandeliers',
    collections: [{ id: 2, title: 'Luxury Lighting', handle: 'luxury-lighting' }],
    platformLinks: {
      amazon1: '',
      amazon2: '',
      wf1: '',
      wf2: '',
      os1: '',
      os2: '',
      hd1: '',
      hd2: '',
      lowes: '',
      target: '',
      walmart: '',
      ebay: '',
      kohls: ''
    }
  },
  {
    id: 3,
    title: 'Industrial Floor Lamp',
    description: 'Industrial-style floor lamp with adjustable arm and dimmable LED bulb. Perfect for reading nooks and home offices.',
    images: [
      { src: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400' }
    ],
    variants: [
      { title: 'Bronze', price: '89.99', sku: 'FLOOR-001-BRZ' },
      { title: 'Silver', price: '99.99', sku: 'FLOOR-001-SLV' }
    ],
    category: 'Floor Lamps',
    collections: [{ id: 3, title: 'Industrial Style', handle: 'industrial-style' }],
    platformLinks: {
      amazon1: '',
      amazon2: '',
      wf1: '',
      wf2: '',
      os1: '',
      os2: '',
      hd1: '',
      hd2: '',
      lowes: '',
      target: '',
      walmart: '',
      ebay: '',
      kohls: ''
    }
  },
  {
    id: 4,
    title: 'LED Strip Lighting Kit',
    description: 'Flexible LED strip lighting kit with remote control. Perfect for under-cabinet lighting, accent lighting, and more.',
    images: [
      { src: 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=400' }
    ],
    variants: [
      { title: 'Warm White', price: '49.99', sku: 'LED-001-WW' },
      { title: 'Cool White', price: '49.99', sku: 'LED-001-CW' },
      { title: 'RGB Color', price: '69.99', sku: 'LED-001-RGB' }
    ],
    category: 'LED Lighting',
    collections: [{ id: 4, title: 'Smart Home', handle: 'smart-home' }],
    platformLinks: {
      amazon1: '',
      amazon2: '',
      wf1: '',
      wf2: '',
      os1: '',
      os2: '',
      hd1: '',
      hd2: '',
      lowes: '',
      target: '',
      walmart: '',
      ebay: '',
      kohls: ''
    }
  },
  {
    id: 5,
    title: 'Wall Sconce Set',
    description: 'Set of 2 modern wall sconces with frosted glass shades. Perfect for hallways, bathrooms, and bedrooms.',
    images: [
      { src: 'https://images.unsplash.com/photo-1513506003011-3b03c801659a?w=400' }
    ],
    variants: [
      { title: 'Chrome', price: '79.99', sku: 'Sconce-001-CHR' },
      { title: 'Matte Black', price: '89.99', sku: 'Sconce-001-BLK' }
    ],
    category: 'Wall Lights',
    collections: [{ id: 5, title: 'Modern Lighting', handle: 'modern-lighting' }],
    platformLinks: {
      amazon1: '',
      amazon2: '',
      wf1: '',
      wf2: '',
      os1: '',
      os2: '',
      hd1: '',
      hd2: '',
      lowes: '',
      target: '',
      walmart: '',
      ebay: '',
      kohls: ''
    }
  },
  {
    id: 6,
    title: 'Smart Bulb Starter Kit',
    description: 'Wi-Fi enabled smart LED bulbs with voice control compatibility. Change colors and brightness with your phone.',
    images: [
      { src: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400' }
    ],
    variants: [
      { title: '4-Pack', price: '59.99', sku: 'SMART-001-4PK' },
      { title: '8-Pack', price: '99.99', sku: 'SMART-001-8PK' }
    ],
    category: 'Smart Lighting',
    collections: [{ id: 6, title: 'Smart Home', handle: 'smart-home' }],
    platformLinks: {
      amazon1: '',
      amazon2: '',
      wf1: '',
      wf2: '',
      os1: '',
      os2: '',
      hd1: '',
      hd2: '',
      lowes: '',
      target: '',
      walmart: '',
      ebay: '',
      kohls: ''
    }
  }
];
