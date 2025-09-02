import fs from 'fs';
import path from 'path';
import { DisplayLinkStructuredResult } from '../types.js';

// Product interfaces
interface ProductVariant {
  id: number;
  title: string;
  price: string;
  available: boolean;
}

interface Product {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  price: string;
  vendor: string;
  product_type: string;
  tags: string[];
  variants: ProductVariant[];
  images: Array<{
    src: string;
    width: number;
    height: number;
  }>;
}

interface ProductsData {
  products: Product[];
}

// Load and parse products data
function loadProductsData(): ProductsData {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'products.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error loading products data:', error);
    throw new Error('Failed to load products data');
  }
}

// Extract key features from product HTML description
function extractFeatures(bodyHtml: string): string[] {
  const features: string[] = [];
  
  // Extract bottle count
  const bottleMatch = bodyHtml.match(/\((\d+)\)\s*Bottle[s]?\s*of\s*Shanky's\s*Whip/i);
  if (bottleMatch) {
    features.push(`${bottleMatch[1]} bottle${bottleMatch[1] !== '1' ? 's' : ''}`);
  }

  // Extract shot glasses
  const shotGlassMatch = bodyHtml.match(/\((\d+)\)\s*Custom\s*shot\s*glasses/i);
  if (shotGlassMatch) {
    features.push(`${shotGlassMatch[1]} shot glasses`);
  }

  // Extract mini bottles
  const miniMatch = bodyHtml.match(/\((\d+)\)\s*Bottles\s*of\s*Shanky's\s*Whip\s*50ml/i);
  if (miniMatch) {
    features.push(`${miniMatch[1]} mini bottles (50ml)`);
  }

  // Extract tote bags
  const toteMatch = bodyHtml.match(/\((\d+)\)\s*Shanky's\s*Whip\s*(?:Canvas\s*)?Tote\s*Bag[s]?/i);
  if (toteMatch) {
    features.push(`${toteMatch[1]} tote bag${toteMatch[1] !== '1' ? 's' : ''}`);
  }

  // Extract pour spouts
  const pourSpoutMatch = bodyHtml.match(/\((\d+)\)\s*Shanky's\s*Whip\s*Ostrich\s*Head\s*Pour\s*Spout[s]?/i);
  if (pourSpoutMatch) {
    features.push(`${pourSpoutMatch[1]} pour spout${pourSpoutMatch[1] !== '1' ? 's' : ''}`);
  }

  // Check for special items
  if (bodyHtml.includes('Life-Size Emu')) {
    features.push('life-size emu');
  }
  if (bodyHtml.includes('Shot Glasses')) {
    features.push('shot glasses');
  }
  if (bodyHtml.includes('Scarf')) {
    features.push('scarf');
  }
  if (bodyHtml.includes('Pennant')) {
    features.push('pennant');
  }
  if (bodyHtml.includes('Bandana')) {
    features.push('bandana');
  }

  // Check for free shipping
  if (bodyHtml.includes('FREE SHIPPING')) {
    features.push('free shipping');
  }

  return features;
}

// Categorize products
function categorizeProduct(product: Product): string {
  const title = product.title.toLowerCase();
  const bodyHtml = product.body_html.toLowerCase();

  if (title.includes('party animal') || bodyHtml.includes('emu')) {
    return 'Premium Bundle';
  }
  if (title.includes('shot glass gift pack')) {
    return 'Shot Glass Bundle';
  }
  if (title.includes('pour spout bundle')) {
    return 'Pour Spout Bundle';
  }
  if (title.includes('boxes of minis') || title.includes('box of minis')) {
    return 'Mini Bottles Bundle';
  }
  if (title.includes('thrice as nice') || title.includes('perfect pair') || title.includes('one and one')) {
    return 'Tote Bag Bundle';
  }
  if (title.includes('750ml') || title.includes('summer special')) {
    return 'Single Bottle';
  }
  
  return 'Bundle';
}

// Search and filter products
export async function searchProducts(params: {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  features?: string[];
  sortBy?: 'price' | 'name' | 'value';
  limit?: number;
}): Promise<{
  content: Array<{
    type: string;
    text: string;
  }>;
  structuredContent?: DisplayLinkStructuredResult;
}> {
  console.log('🔍 Product search called with params:', JSON.stringify(params, null, 2));

  try {
    const productsData = loadProductsData();
    let filteredProducts = productsData.products.map(product => ({
      ...product,
      price: product.variants[0]?.price || '0',
      category: categorizeProduct(product),
      features: extractFeatures(product.body_html)
    }));

    // Apply text search filter
    if (params.query) {
      const query = params.query.toLowerCase();
      filteredProducts = filteredProducts.filter(product => 
        product.title.toLowerCase().includes(query) ||
        product.body_html.toLowerCase().includes(query) ||
        product.features.some(feature => feature.toLowerCase().includes(query)) ||
        product.category.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (params.category) {
      filteredProducts = filteredProducts.filter(product => 
        product.category.toLowerCase().includes(params.category!.toLowerCase())
      );
    }

    // Apply price filters
    if (params.minPrice !== undefined) {
      filteredProducts = filteredProducts.filter(product => 
        parseFloat(product.price) >= params.minPrice!
      );
    }

    if (params.maxPrice !== undefined) {
      filteredProducts = filteredProducts.filter(product => 
        parseFloat(product.price) <= params.maxPrice!
      );
    }

    // Apply features filter
    if (params.features && params.features.length > 0) {
      filteredProducts = filteredProducts.filter(product =>
        params.features!.some(feature =>
          product.features.some(productFeature =>
            productFeature.toLowerCase().includes(feature.toLowerCase())
          )
        )
      );
    }

    // Sort products
    if (params.sortBy) {
      switch (params.sortBy) {
        case 'price':
          filteredProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
          break;
        case 'name':
          filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case 'value':
          // Sort by value (features per dollar)
          filteredProducts.sort((a, b) => {
            const aValue = a.features.length / parseFloat(a.price);
            const bValue = b.features.length / parseFloat(b.price);
            return bValue - aValue;
          });
          break;
      }
    }

    // Apply limit
    const limit = params.limit || 10;
    const results = filteredProducts.slice(0, limit);

    console.log(`📊 Found ${results.length} products matching criteria`);

    if (results.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No products found matching your criteria. Try adjusting your search terms or filters.'
        }]
      };
    }

    // Build response text
    const responseLines: string[] = [];
    responseLines.push(`🥃 **Found ${results.length} Shanky's Whip Product${results.length !== 1 ? 's' : ''}**\n`);

    results.forEach((product, index) => {
      const priceNum = parseFloat(product.price);
      responseLines.push(`**${index + 1}. ${product.title}**`);
      responseLines.push(`   💰 Price: $${priceNum.toFixed(2)}`);
      responseLines.push(`   📦 Category: ${product.category}`);
      
      if (product.features.length > 0) {
        responseLines.push(`   ✨ Includes: ${product.features.join(', ')}`);
      }
      
      // Calculate value score
      const valueScore = product.features.length / priceNum;
      if (valueScore > 0.1) {
        responseLines.push(`   🎯 Great Value! (${product.features.length} features for $${priceNum.toFixed(2)})`);
      }
      
      responseLines.push('');
    });

    // Add shopping recommendations
    if (results.length > 1) {
      responseLines.push('🛒 **Shopping Tips:**');
      
      const cheapest = results.reduce((min, product) => 
        parseFloat(product.price) < parseFloat(min.price) ? product : min
      );
      responseLines.push(`💸 Most Affordable: ${cheapest.title} ($${parseFloat(cheapest.price).toFixed(2)})`);
      
      const bestValue = results.reduce((best, product) => {
        const currentValue = product.features.length / parseFloat(product.price);
        const bestValue = best.features.length / parseFloat(best.price);
        return currentValue > bestValue ? product : best;
      });
      responseLines.push(`🎯 Best Value: ${bestValue.title} (${bestValue.features.length} features for $${parseFloat(bestValue.price).toFixed(2)})`);
    }

    // Create structured content for the top result
    const topProduct = results[0];
    const structuredContent: DisplayLinkStructuredResult = {
      action: "display_link",
      data: {
        url: `https://shop-us.shankyswhip.com/products/${topProduct.handle}`,
        title: `Shop ${topProduct.title}`,
        description: `${topProduct.category} - $${parseFloat(topProduct.price).toFixed(2)} - ${topProduct.features.join(', ')}`,
        open_in_new_tab: true,
        auto_navigate: false
      }
    };

    return {
      content: [{
        type: 'text',
        text: responseLines.join('\n')
      }],
      structuredContent
    };

  } catch (error) {
    console.error('❌ Error in product search:', error);
    return {
      content: [{
        type: 'text',
        text: `Sorry, I encountered an error while searching products: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}

// Tool definition
export const productSearchToolDefinition = {
  name: "search-shankys-whip-products",
  title: "Search Shanky's Whip Products",
  description: "Search and filter Shanky's Whip products by category, price, features, and more. Find the perfect bundle or bottle for any occasion.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search term to find products (e.g., 'shot glass', 'mini bottles', 'bundle', 'emu')",
      },
      category: {
        type: "string",
        description: "Product category filter",
        enum: ["Shot Glass Bundle", "Pour Spout Bundle", "Mini Bottles Bundle", "Tote Bag Bundle", "Single Bottle", "Premium Bundle", "Bundle"]
      },
      minPrice: {
        type: "number",
        minimum: 0,
        description: "Minimum price filter (in USD)",
      },
      maxPrice: {
        type: "number",
        minimum: 0,
        description: "Maximum price filter (in USD)",
      },
      features: {
        type: "array",
        items: { type: "string" },
        description: "Filter by specific features (e.g., ['shot glasses', 'tote bag', 'free shipping'])",
      },
      sortBy: {
        type: "string",
        enum: ["price", "name", "value"],
        description: "Sort results by price (low to high), name (A-Z), or value (best value first)",
        default: "value"
      },
      limit: {
        type: "number",
        minimum: 1,
        maximum: 20,
        default: 5,
        description: "Maximum number of products to return (default: 5)",
      },
    },
    required: [],
  },
  outputSchema: {
    type: "object",
    properties: {
      action: { type: "string" },
      data: {
        type: "object",
        properties: {
          url: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          open_in_new_tab: { type: "boolean" },
          auto_navigate: { type: "boolean" },
        },
        required: ["url", "title", "description", "open_in_new_tab", "auto_navigate"],
      },
    },
    required: ["action", "data"],
  },
};
