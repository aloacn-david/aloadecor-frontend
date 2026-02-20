export interface ShopifyProduct { 
  id: number; 
  title: string; 
  description: string;
  images: { src: string }[];
  variants: {
    id?: number;
    product_id?: number;
    title: string;
    price: string;
    sku?: string;
    position?: number;
    inventory_policy?: string;
    compare_at_price?: string | null;
    option1?: string;
    option2?: string;
    option3?: string;
    created_at?: string;
    updated_at?: string;
    taxable?: boolean;
    barcode?: string;
    fulfillment_service?: string;
    grams?: number;
    inventory_management?: string;
    requires_shipping?: boolean;
    vendor?: string;
    metafields_global_title_tag?: string | null;
    metafields_global_description_tag?: string | null;
    image_id?: number | null;
    weight?: number;
    weight_unit?: string;
    inventory_item_id?: number;
    inventory_quantity?: number;
    old_inventory_quantity?: number;
    admin_graphql_api_id?: string;
  }[];
  category: string; // Add category field
  collections: Array<{ // Add collections field
    id: number;
    title: string;
    handle: string;
  }>;
  platformLinks: PlatformLinks;
}

export interface PlatformLinks {
  amazon1: string;
  amazon2: string;
  wf1: string;
  wf2: string;
  os1: string;
  os2: string;
  hd1: string;
  hd2: string;
  lowes: string;
  target: string;
  walmart: string;
  ebay: string;
  kohls: string;
}
