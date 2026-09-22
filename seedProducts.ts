import { StoredProduct, StoredOrder, StoredNotification } from "./db";

export function getSeedProducts(): StoredProduct[] {
  return [
  {
    "id": "prod_necklace",
    "title": "Freshwater Pearl Halo & Pink Bell Flower Pendant Necklace",
    "description": "An ethereal heirloom necklace handcrafted with a delicate chain and a circular halo of lustrous freshwater seed pearls encircling a hand-blown translucent pink bell blossom and green leaf charm.",
    "category": "Jewelry",
    "mainCategory": "Jewelry",
    "subcategory": "Necklaces",
    "price": 999,
    "artisanId": "user_artisan_seed_1",
    "artisanName": "Clara Vance",
    "artisanShop": "Vance Keepsakes & Atelier",
    "image": "/products/handmade_necklace_1788674101596.jpg",
    "images": [
      "/products/handmade_necklace_1788674101596.jpg"
    ],
    "inStock": true,
    "stockCount": 12,
    "status": "Active",
    "rating": 4.98,
    "reviewCount": 38,
    "badge": "Artisan Favorite",
    "craftTimeDays": 3,
    "material": "Handmade Heirloom Materials",
    "sizeDimensions": "Standard Artisan Dimensions",
    "shippingInfo": "Packed in signature keepsake packaging. Ships in 3-5 days.",
    "customOptions": {
      "allowEngraving": true,
      "engravingPlaceholder": "Initials on clasp tag (e.g. M & S)",
      "engravingMaxChars": 12,
      "materials": [
        "14k Gold Vermeil",
        "Sterling Silver 925",
        "Rose Gold"
      ],
      "fonts": [
        "Calligraphy Script",
        "Vintage Serif",
        "Clean Minimalist"
      ],
      "giftWrapAvailable": true
    },
    "createdAt": "2026-08-15T10:00:00Z"
  },
  {
    "id": "prod_choker",
    "title": "Olive Seed Bead Fairycore Choker with Cutout Star Pendant",
    "description": "Artisan beaded choker woven with faceted green seed beads and fairycore crystal accents, centered with a dainty sterling silver open star pendant. Soft, lightweight, and effortlessly layerable.",
    "category": "Jewelry",
    "mainCategory": "Jewelry",
    "subcategory": "Chokers",
    "price": 499,
    "artisanId": "user_artisan_seed_1",
    "artisanName": "Clara Vance",
    "artisanShop": "Vance Keepsakes & Atelier",
    "image": "/products/handmade_choker_1788674128986.jpg",
    "images": [
      "/products/handmade_choker_1788674128986.jpg"
    ],
    "inStock": true,
    "stockCount": 20,
    "status": "Active",
    "rating": 4.94,
    "reviewCount": 45,
    "badge": "Trending Now",
    "craftTimeDays": 2,
    "material": "Handmade Heirloom Materials",
    "sizeDimensions": "Standard Artisan Dimensions",
    "shippingInfo": "Packed in signature keepsake packaging. Ships in 3-5 days.",
    "customOptions": {
      "allowEngraving": true,
      "engravingPlaceholder": "Custom length (e.g. 14\" + 2\" extender)",
      "engravingMaxChars": 20,
      "materials": [
        "Forest & Olive Green",
        "Sage & Iridescent White",
        "Emerald & Gold Tone"
      ],
      "fonts": [
        "Romantic Script",
        "Clean Minimalist"
      ],
      "giftWrapAvailable": true
    },
    "createdAt": "2026-08-15T10:00:00Z"
  },
  {
    "id": "prod_earrings",
    "title": "Celestial Wire-Wrapped Moon & Peridot Gemstone Chandelier Earrings",
    "description": "Hand-sculpted golden wire crescent moon frames with fine wire-wrapped sunbeams, suspended with genuine faceted peridot teardrops, green moss tourmalines, and cascading beaded fringe.",
    "category": "Jewelry",
    "mainCategory": "Jewelry",
    "subcategory": "Earrings",
    "price": 899,
    "artisanId": "user_artisan_seed_1",
    "artisanName": "Clara Vance",
    "artisanShop": "Vance Keepsakes & Atelier",
    "image": "/products/handmade_earrings_1788674150898.jpg",
    "images": [
      "/products/handmade_earrings_1788674150898.jpg"
    ],
    "inStock": true,
    "stockCount": 8,
    "status": "Active",
    "rating": 5,
    "reviewCount": 27,
    "badge": "Artisan Masterpiece",
    "craftTimeDays": 4,
    "material": "Handmade Heirloom Materials",
    "sizeDimensions": "Standard Artisan Dimensions",
    "shippingInfo": "Packed in signature keepsake packaging. Ships in 3-5 days.",
    "customOptions": {
      "allowEngraving": false,
      "engravingPlaceholder": "",
      "engravingMaxChars": 0,
      "materials": [
        "14k Gold Fill Wire",
        "Antique Bronze Wire",
        "Sterling Silver Wire"
      ],
      "fonts": [
        "Vintage Serif"
      ],
      "giftWrapAvailable": true
    },
    "createdAt": "2026-08-15T10:00:00Z"
  },
  {
    "id": "prod_sakura_blossom_cuff",
    "title": "Cherry Blossom Enamel & Wire Arm Cuff Bracelet",
    "description": "Hand-formed golden arm cuff with fluid organic branch lines, featuring delicate pink cherry blossom enamel blooms and budding branches. Rests comfortably and adjusts gently to the wrist or upper arm.",
    "category": "Jewelry",
    "mainCategory": "Jewelry",
    "subcategory": "Bracelets",
    "price": 699,
    "artisanId": "user_artisan_seed_1",
    "artisanName": "Clara Vance",
    "artisanShop": "Vance Keepsakes & Atelier",
    "image": "/products/handmade_bracelet_1788674173378.jpg",
    "images": [
      "/products/handmade_bracelet_1788674173378.jpg"
    ],
    "inStock": true,
    "stockCount": 10,
    "status": "Active",
    "rating": 4.96,
    "reviewCount": 32,
    "badge": "Hand-Sculpted",
    "craftTimeDays": 3,
    "material": "Handmade Heirloom Materials",
    "sizeDimensions": "Standard Artisan Dimensions",
    "shippingInfo": "Packed in signature keepsake packaging. Ships in 3-5 days.",
    "customOptions": {
      "allowEngraving": true,
      "engravingPlaceholder": "Wrist diameter (e.g. 6.2 in)",
      "engravingMaxChars": 18,
      "materials": [
        "Polished 14k Gold Tone",
        "Brushed Silver Tone",
        "Rose Gold Wire"
      ],
      "fonts": [
        "Calligraphy Script",
        "Clean Minimalist"
      ],
      "giftWrapAvailable": true
    },
    "createdAt": "2026-08-15T10:00:00Z"
  },
  {
    "id": "prod_ring",
    "title": "Handcrafted 14k Gold Wire Dainty Bow Statement Ring",
    "description": "Elegantly shaped by hand from tarnish-resistant gold wire into a whimsical bow with fluid ribbon tails. Comfortable, lightweight, and adjustable to gently hug any finger.",
    "category": "Jewelry",
    "mainCategory": "Jewelry",
    "subcategory": "Rings",
    "price": 349,
    "artisanId": "user_artisan_seed_1",
    "artisanName": "Clara Vance",
    "artisanShop": "Vance Keepsakes & Atelier",
    "image": "/products/handmade_ring_1788674192178.jpg",
    "images": [
      "/products/handmade_ring_1788674192178.jpg"
    ],
    "inStock": true,
    "stockCount": 25,
    "status": "Active",
    "rating": 4.91,
    "reviewCount": 52,
    "badge": "Bestseller",
    "craftTimeDays": 2,
    "material": "Handmade Heirloom Materials",
    "sizeDimensions": "Standard Artisan Dimensions",
    "shippingInfo": "Packed in signature keepsake packaging. Ships in 3-5 days.",
    "customOptions": {
      "allowEngraving": false,
      "engravingPlaceholder": "",
      "engravingMaxChars": 0,
      "materials": [
        "14k Solid Gold Fill",
        "Sterling Silver 925",
        "Rose Gold Wire"
      ],
      "fonts": [
        "Clean Minimalist"
      ],
      "giftWrapAvailable": true
    },
    "createdAt": "2026-08-15T10:00:00Z"
  },
  {
    "id": "prod_charm",
    "title": "Hand-Sculpted Stargazer Lily Resin Keychain Charm",
    "description": "A botanical miniature blossom hand-sculpted in durable polymer clay, featuring delicate crimson brushstroke petals, hand-applied freckled details, and a high-gloss protective resin glaze on silver hardware.",
    "category": "Jewelry, Crafts",
    "mainCategory": "Jewelry",
    "subcategory": "Charms & Pendants",
    "price": 299,
    "artisanId": "user_artisan_seed_1",
    "artisanName": "Clara Vance",
    "artisanShop": "Vance Keepsakes & Atelier",
    "image": "/products/handmade_charm_1788674210820.jpg",
    "images": [
      "/products/handmade_charm_1788674210820.jpg"
    ],
    "inStock": true,
    "stockCount": 18,
    "status": "Active",
    "rating": 4.95,
    "reviewCount": 41,
    "badge": "Hand-Painted",
    "craftTimeDays": 2,
    "material": "Handmade Heirloom Materials",
    "sizeDimensions": "Standard Artisan Dimensions",
    "shippingInfo": "Packed in signature keepsake packaging. Ships in 3-5 days.",
    "customOptions": {
      "allowEngraving": true,
      "engravingPlaceholder": "Stamped mini disc initial (e.g. K)",
      "engravingMaxChars": 3,
      "materials": [
        "Stargazer Pink Lily",
        "White Calla Lily",
        "Blush Peony"
      ],
      "fonts": [
        "Romantic Script",
        "Vintage Serif"
      ],
      "giftWrapAvailable": true
    },
    "createdAt": "2026-08-15T10:00:00Z"
  },
  {
    "id": "prod_clay_keepsake_keychain",
    "title": "Good Things Take Time Ceramic Clay Bead Keepsake Keychain",
    "description": "Inspired by gentle daily reminders: handcrafted polymer clay beads with initial letters, smiling pink heart charm, fluffy white cloud, and a hand-lettered tag reading \"good things take time ♡\" on cream linen.",
    "category": "Accessories, Crafts",
    "mainCategory": "Accessories",
    "subcategory": "Keychains",
    "price": 349,
    "artisanId": "user_artisan_seed_1",
    "artisanName": "Clara Vance",
    "artisanShop": "Vance Keepsakes & Atelier",
    "image": "/products/clay_keepsake_keychain_1788805651059.jpg",
    "images": [
      "/products/clay_keepsake_keychain_1788805651059.jpg"
    ],
    "inStock": true,
    "stockCount": 28,
    "status": "Active",
    "rating": 5,
    "reviewCount": 57,
    "badge": "Pinterest Viral",
    "craftTimeDays": 2,
    "material": "Handmade Heirloom Materials",
    "sizeDimensions": "Standard Artisan Dimensions",
    "shippingInfo": "Packed in signature keepsake packaging. Ships in 3-5 days.",
    "customOptions": {
      "allowEngraving": true,
      "engravingPlaceholder": "Your custom initial beads (e.g. A, S, M)",
      "engravingMaxChars": 5,
      "materials": [
        "Pastel Pink & Cloud White",
        "Sage Green & Daisies",
        "Butter Yellow & Lavender"
      ],
      "fonts": [
        "Artisan Handprint",
        "Calligraphy Script"
      ],
      "giftWrapAvailable": true
    },
    "createdAt": "2026-08-15T10:00:00Z"
  },
  {
    "id": "prod_clay_tote_charm",
    "title": "Hand-Painted Initial & Monstera Leaf Clay Bag Charm",
    "description": "Artisan bag charm with custom letter initial charm, pastel pink flower, green patterned monstera leaf, and dangling butterfly charm on a sturdy gold lobster swivel clip for canvas tote bags.",
    "category": "Accessories, Crafts",
    "mainCategory": "Accessories",
    "subcategory": "Keychains",
    "price": 399,
    "artisanId": "user_artisan_seed_1",
    "artisanName": "Clara Vance",
    "artisanShop": "Vance Keepsakes & Atelier",
    "image": "/products/clay_tote_charm_1788805731042.jpg",
    "images": [
      "/products/clay_tote_charm_1788805731042.jpg"
    ],
    "inStock": true,
    "stockCount": 15,
    "status": "Active",
    "rating": 4.96,
    "reviewCount": 34,
    "badge": "Tote Essential",
    "craftTimeDays": 2,
    "material": "Handmade Heirloom Materials",
    "sizeDimensions": "Standard Artisan Dimensions",
    "shippingInfo": "Packed in signature keepsake packaging. Ships in 3-5 days.",
    "customOptions": {
      "allowEngraving": true,
      "engravingPlaceholder": "Choose single initial letter (A-Z)",
      "engravingMaxChars": 2,
      "materials": [
        "Sunny Pastels & Leaf",
        "Warm Terracotta & Sage",
        "Lilac Garden & Blossom"
      ],
      "fonts": [
        "Calligraphy Script",
        "Clean Minimalist"
      ],
      "giftWrapAvailable": true
    },
    "createdAt": "2026-08-15T10:00:00Z"
  },
  {
    "id": "prod_seashell_pearl_phone_charm",
    "title": "Freshwater Pearl & Cowrie Shell Coastal Phone Wristlet Charm",
    "description": "An ethereal seaside phone strap strung with real white cowrie shells, pastel ceramic stars, baroque freshwater pearls, translucent amber stones, and a tiny silver starfish charm on durable cord.",
    "category": "Accessories",
    "mainCategory": "Accessories",
    "subcategory": "Phone Charms",
    "price": 349,
    "artisanId": "user_artisan_seed_1",
    "artisanName": "Clara Vance",
    "artisanShop": "Vance Keepsakes & Atelier",
    "image": "/products/seashell_phone_charm_1788805689564.jpg",
    "images": [
      "/products/seashell_phone_charm_1788805689564.jpg"
    ],
    "inStock": true,
    "stockCount": 30,
    "status": "Active",
    "rating": 4.98,
    "reviewCount": 49,
    "badge": "Bestseller",
    "craftTimeDays": 1,
    "material": "Handmade Heirloom Materials",
    "sizeDimensions": "Standard Artisan Dimensions",
    "shippingInfo": "Packed in signature keepsake packaging. Ships in 3-5 days.",
    "customOptions": {
      "allowEngraving": true,
      "engravingPlaceholder": "Name or word on mini disc (e.g. HOPE)",
      "engravingMaxChars": 6,
      "materials": [
        "Coastal Shell & Pearl",
        "Pastel Candy Stars",
        "Moody Starlight Silver"
      ],
      "fonts": [
        "Clean Minimalist"
      ],
      "giftWrapAvailable": true
    },
    "createdAt": "2026-08-15T10:00:00Z"
  },
  {
    "id": "prod_wildflower_resin_quote_bookmark",
    "title": "Pressed Botanical Wildflower Bookmark with Silk Tassel",
    "description": "Translucent handmade resin bookmark embedded with real pressed purple wildflowers, golden flakes, and a typewriter quote reading \"fall in love with as many things as possible\" with a terracotta tassel.",
    "category": "Art & Stationery, Crafts",
    "mainCategory": "Art & Stationery",
    "subcategory": "Bookmarks",
    "price": 299,
    "artisanId": "user_artisan_seed_1",
    "artisanName": "Clara Vance",
    "artisanShop": "Vance Keepsakes & Atelier",
    "image": "/products/pressed_flower_bookmark_1788805710373.jpg",
    "images": [
      "/products/pressed_flower_bookmark_1788805710373.jpg"
    ],
    "inStock": true,
    "stockCount": 30,
    "status": "Active",
    "rating": 4.97,
    "reviewCount": 62,
    "badge": "Hand-Pressed",
    "craftTimeDays": 1,
    "material": "Handmade Heirloom Materials",
    "sizeDimensions": "Standard Artisan Dimensions",
    "shippingInfo": "Packed in signature keepsake packaging. Ships in 3-5 days.",
    "customOptions": {
      "allowEngraving": true,
      "engravingPlaceholder": "Custom quote line or name (e.g. Read On, Sarah)",
      "engravingMaxChars": 30,
      "materials": [
        "Pressed Wildflower & Gold Flakes",
        "Forget-Me-Not Blue",
        "Autumn Amber Leaves"
      ],
      "fonts": [
        "Artisan Handprint",
        "Vintage Serif"
      ],
      "giftWrapAvailable": true
    },
    "createdAt": "2026-08-15T10:00:00Z"
  },
  {
    "id": "prod_antique_lace_heirloom_journal",
    "title": "Antique Lace-Covered Heirloom Hardcover Journal",
    "description": "A breathtaking heirloom journal bound in delicate vintage floral lace over ivory linen, centered with an ornate engraved brass \"Journal\" plaque and vintage metal button closure on rich wood.",
    "category": "Art & Stationery",
    "mainCategory": "Art & Stationery",
    "subcategory": "Journaling & Paper Crafts",
    "price": 1399,
    "artisanId": "user_artisan_seed_1",
    "artisanName": "Clara Vance",
    "artisanShop": "Vance Keepsakes & Atelier",
    "image": "/products/lace_heirloom_journal_1788805671287.jpg",
    "images": [
      "/products/lace_heirloom_journal_1788805671287.jpg"
    ],
    "inStock": true,
    "stockCount": 8,
    "status": "Active",
    "rating": 5,
    "reviewCount": 44,
    "badge": "Heirloom Masterpiece",
    "craftTimeDays": 4,
    "material": "Handmade Heirloom Materials",
    "sizeDimensions": "Standard Artisan Dimensions",
    "shippingInfo": "Packed in signature keepsake packaging. Ships in 3-5 days.",
    "customOptions": {
      "allowEngraving": true,
      "engravingPlaceholder": "Engrave your title on the brass plaque (e.g. Clara’s Diary)",
      "engravingMaxChars": 20,
      "materials": [
        "Antique Ivory Lace & Brass",
        "Midnight Black Lace & Bronze",
        "Vintage Tea-Dyed Lace"
      ],
      "fonts": [
        "Calligraphy Script",
        "Vintage Serif"
      ],
      "giftWrapAvailable": true
    },
    "createdAt": "2026-08-15T10:00:00Z"
  },
  {
    "id": "prod_home_craft",
    "title": "Distressed Leather Heirloom Book Hardcover with Pressed Forget-Me-Nots",
    "description": "A handcrafted rigid book hardcover bound in rich vegetable-tanned dark brown distressed leather, featuring a circular porthole framing genuine pressed blue forget-me-not botanical blooms. Custom fitted for heirloom books or refillable journals with leather lace closure.",
    "category": "Home & Décor, Art & Stationery",
    "mainCategory": "Home & Décor",
    "subcategory": "Decorative Items",
    "price": 1299,
    "artisanId": "user_artisan_seed_1",
    "artisanName": "Clara Vance",
    "artisanShop": "Vance Keepsakes & Atelier",
    "image": "/products/handmade_home_craft_1788674250650.jpg",
    "images": [
      "/products/handmade_home_craft_1788674250650.jpg"
    ],
    "inStock": true,
    "stockCount": 7,
    "status": "Active",
    "rating": 4.99,
    "reviewCount": 39,
    "badge": "Heirloom Craft",
    "craftTimeDays": 5,
    "material": "Handmade Heirloom Materials",
    "sizeDimensions": "Standard Artisan Dimensions",
    "shippingInfo": "Packed in signature keepsake packaging. Ships in 3-5 days.",
    "customOptions": {
      "allowEngraving": true,
      "engravingPlaceholder": "Name or dedication debossed on leather spine",
      "engravingMaxChars": 32,
      "materials": [
        "Distressed Walnut Brown",
        "Aged Saddle Tan",
        "Midnight Forest Green"
      ],
      "fonts": [
        "Cormorant Classic",
        "Vintage Serif",
        "Romantic Script"
      ],
      "giftWrapAvailable": true
    },
    "createdAt": "2026-08-15T10:00:00Z"
  },
  {
    "id": "prod_gift",
    "title": "Pink Tulip Bouquet & Love Letter Envelope Keepsake Keychain",
    "description": "A thoughtful personalized gift featuring a wrapped bundle of polymer clay pink tulips with bow tie, accompanied by a miniature love letter envelope with a pink wax seal heart and sweet strawberry charm.",
    "category": "Gifts",
    "mainCategory": "Gifts",
    "subcategory": "Handmade Keepsakes",
    "price": 399,
    "artisanId": "user_artisan_seed_1",
    "artisanName": "Clara Vance",
    "artisanShop": "Vance Keepsakes & Atelier",
    "image": "/products/handmade_gift_1788674225864.jpg",
    "images": [
      "/products/handmade_gift_1788674225864.jpg"
    ],
    "inStock": true,
    "stockCount": 15,
    "status": "Active",
    "rating": 5,
    "reviewCount": 64,
    "badge": "Perfect Gift",
    "craftTimeDays": 3,
    "material": "Handmade Heirloom Materials",
    "sizeDimensions": "Standard Artisan Dimensions",
    "shippingInfo": "Packed in signature keepsake packaging. Ships in 3-5 days.",
    "customOptions": {
      "allowEngraving": true,
      "engravingPlaceholder": "Name or secret note on envelope back",
      "engravingMaxChars": 24,
      "materials": [
        "Blush Pink Tulips",
        "Pastel Lavender Bouquet",
        "Sunshine Yellow Tulips"
      ],
      "fonts": [
        "Calligraphy Script",
        "Artisan Handprint"
      ],
      "giftWrapAvailable": true
    },
    "createdAt": "2026-08-15T10:00:00Z"
  },
  {
    "id": "prod_custom_creation",
    "title": "Seafoam Suede Traveler Notebook with Hand-Tooled Butterflies",
    "description": "Crafted from soft sage seafoam suede leather, hand-stamped with leafy branches and dancing butterflies. Features a vintage sculptural bronze snake & butterfly clasp closure on leather wrap cord.",
    "category": "Custom Creations",
    "mainCategory": "Custom Creations",
    "subcategory": "Customized Accessories",
    "price": 1199,
    "artisanId": "user_artisan_seed_1",
    "artisanName": "Clara Vance",
    "artisanShop": "Vance Keepsakes & Atelier",
    "image": "/products/handmade_custom_creation_1788674270122.jpg",
    "images": [
      "/products/handmade_custom_creation_1788674270122.jpg"
    ],
    "inStock": true,
    "stockCount": 9,
    "status": "Active",
    "rating": 4.97,
    "reviewCount": 33,
    "badge": "Artisan Signature",
    "craftTimeDays": 4,
    "material": "Handmade Heirloom Materials",
    "sizeDimensions": "Standard Artisan Dimensions",
    "shippingInfo": "Packed in signature keepsake packaging. Ships in 3-5 days.",
    "customOptions": {
      "allowEngraving": true,
      "engravingPlaceholder": "Custom motto, initials, or coordinates",
      "engravingMaxChars": 28,
      "materials": [
        "Seafoam Mint Suede",
        "Dusk Violet Suede",
        "Warm Honey Caramel"
      ],
      "fonts": [
        "Artisan Handprint",
        "Vintage Serif",
        "Calligraphy Script"
      ],
      "giftWrapAvailable": true
    },
    "createdAt": "2026-08-15T10:00:00Z"
  }
];
}

export function getSeedOrders(): StoredOrder[] {
  return [
    {
      id: "ord_101",
      orderNumber: "HH-7821",
      customerId: "user_customer_seed_1",
      customerName: "Eleanor Wright",
      customerEmail: "eleanor@example.com",
      customerPhone: "+91 98765 43210",
      shippingAddress: {
        fullName: "Eleanor Wright",
        street: "42 Willow Lane",
        city: "Bengaluru",
        state: "Karnataka",
        zipCode: "560001",
        country: "India"
      },
      items: [
        {
          cartItemId: "item_1",
          productId: "prod_necklace",
          product: {
            id: "prod_necklace",
            title: "Freshwater Pearl Halo & Pink Bell Flower Pendant Necklace",
            price: 999,
            image: "/products/handmade_necklace_1788674101596.jpg",
            category: "Jewelry"
          },
          quantity: 1,
          totalPrice: 999,
          customSelections: {
            material: "14k Gold Vermeil",
            engravingText: "E & W",
            font: "Calligraphy Script",
            giftWrap: true
          }
        }
      ],
      subtotal: 999,
      discount: 0,
      shippingFee: 49,
      tax: 0,
      total: 1048,
      status: "In Progress",
      createdAt: "2026-08-20T14:30:00Z",
      timeline: [
        {
          status: "Order Placed",
          date: "2026-08-20T14:30:00Z",
          note: "Order confirmed and allocated to artisan Clara Vance"
        }
      ]
    }
  ];
}

export function getSeedNotifications(): StoredNotification[] {
  return [
    {
      id: "notif_1",
      artisanId: "user_artisan_seed_1",
      title: "New Custom Order Received!",
      message: "Eleanor Wright placed order #HH-7821 for Freshwater Pearl Halo Necklace.",
      type: "new_order",
      read: false,
      createdAt: "2026-08-20T14:30:00Z"
    }
  ];
}
