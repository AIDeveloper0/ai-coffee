export interface Coffee {
  id: string;
  name: string;
  origin: string;
  tastingNotes: string[];
  process?: string;
  variety?: string;
  producer?: string;
  roaster?: string;
  style?: string;
}

export interface Pastry {
  id: string;
  name: string;
  origin: string;
  price: number;
  currency: "EUR";
  notableDescription: string;
  tastingNotes: string[];
  image?: string;
}

export const coffees: Coffee[] = [
  {
    id: "sweetspot-standard",
    name: "Sweetspot Standard",
    origin: "Antioquia, Colombia - Caicedo Community",
    tastingNotes: ["orange", "hazelnut", "caramel", "chocolate", "balanced body"],
    process: "Washed",
    variety: "Caturra, Colombia",
    producer: "9 small farmers of the Caicedo Community",
    roaster: "Johannes Bayer",
    style: "Espresso / Milk drinks",
  },
  {
    id: "bluebird-kenia-washed-mamuto-aa",
    name: "Bluebird Kenia washed Mamuto AA",
    origin: "Kirinyaga, Kenya - Mamuto Single Estate",
    tastingNotes: ["red currants", "cherry", "bright acidity", "clean finish"],
    process: "Washed",
    variety: "SL28",
    producer: "Mamuto Single Estate Farm",
    style: "Guest espresso / Filter",
  },
  {
    id: "sweetspot-ethiopia-filter",
    name: "Sweetspot Ethiopia (filter example)",
    origin: "Yirgacheffe, Ethiopia",
    tastingNotes: ["bergamot", "floral", "citrus", "tea-like"],
    process: "Washed",
    variety: "Heirloom",
    producer: "Smallholder producers",
    style: "Filter",
  },
  {
    id: "sweetspot-colombia-decaf",
    name: "Sweetspot Colombia Decaf",
    origin: "Huila, Colombia",
    tastingNotes: ["caramel", "red apple", "chocolate", "smooth"],
    process: "EA decaf",
    variety: "Caturra, Castillo",
    style: "Espresso / Milk drinks",
  },
  {
    id: "house-espresso",
    name: "House Espresso",
    origin: "Brazil / Colombia blend",
    tastingNotes: ["hazelnut", "milk chocolate", "brown sugar", "low acidity"],
    process: "Washed / Natural blend",
    style: "Espresso",
  },
  {
    id: "flat-white",
    name: "Flat White",
    origin: "Blend",
    tastingNotes: ["sweet milk", "chocolate", "balanced body"],
    style: "Milk drink",
  },
  {
    id: "cappuccino",
    name: "Cappuccino",
    origin: "Blend",
    tastingNotes: ["cocoa", "creamy", "sweet"],
    style: "Milk drink",
  },
  {
    id: "americano",
    name: "Americano",
    origin: "Blend",
    tastingNotes: ["roasted nuts", "dark chocolate", "balanced"],
    style: "Black coffee",
  },
  {
    id: "filter-ethiopia-yirg",
    name: "Filter - Ethiopia Yirgacheffe",
    origin: "Yirgacheffe, Ethiopia",
    tastingNotes: ["lemon", "jasmine", "black tea", "high acidity"],
    process: "Washed",
    style: "Filter",
  },
  {
    id: "filter-kenya-nyeri",
    name: "Filter - Kenya Nyeri",
    origin: "Nyeri, Kenya",
    tastingNotes: ["blackcurrant", "grapefruit", "winey"],
    process: "Washed",
    style: "Filter",
  },
  {
    id: "nomad-rotating",
    name: "Nomad Guest",
    origin: "Seasonal rotating",
    tastingNotes: ["surprise", "adventurous", "varies"],
    style: "Guest",
  },
  {
    id: "decaf-espresso",
    name: "Decaf Espresso",
    origin: "Latin America",
    tastingNotes: ["chocolate", "almond", "smooth"],
    process: "Decaf",
    style: "Espresso",
  },
];

export const pastries: Pastry[] = [
  {
    id: "banana-bread",
    name: "Banana Bread",
    origin: "Coffee Twins",
    price: 3.6,
    currency: "EUR",
    notableDescription: "Denser, nut-infused loaf with lower sugar than standard.",
    tastingNotes: ["banana", "nutty", "moderate sweetness"],
    image:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "croissant",
    name: "Croissant",
    origin: "Coffee Twins",
    price: 2.3,
    currency: "EUR",
    notableDescription: "French butter base with light lamination.",
    tastingNotes: ["buttery", "light", "flaky"],
    image:
      "https://images.unsplash.com/photo-1509440159596-0259088772df?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "franzbrotchen",
    name: "Franzbrotchen",
    origin: "Coffee Twins",
    price: 2.6,
    currency: "EUR",
    notableDescription: "Caramelized cinnamon layers.",
    tastingNotes: ["caramel", "cinnamon", "buttery"],
    image:
      "https://images.unsplash.com/photo-1509440159596-0249088772aa?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "pain-au-chocolat",
    name: "Pain au chocolat",
    origin: "Coffee Twins",
    price: 2.6,
    currency: "EUR",
    notableDescription: "Dark chocolate core with butter-rich dough.",
    tastingNotes: ["dark chocolate", "buttery", "sweet"],
    image:
      "https://images.unsplash.com/photo-1509440159596-0249088772cc?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "zimtknoten",
    name: "Zimtknoten",
    origin: "Bageri",
    price: 3.7,
    currency: "EUR",
    notableDescription: "Scandinavian cinnamon twist with cardamom accent.",
    tastingNotes: ["cinnamon", "cardamom", "sweet spice"],
    image:
      "https://images.unsplash.com/photo-1481390422864-46e6735f4d36?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "kardamomknoten",
    name: "Kardamomknoten",
    origin: "Bageri",
    price: 3.9,
    currency: "EUR",
    notableDescription: "Spicy-sweet Nordic yeasted bun.",
    tastingNotes: ["cardamom", "sweet spice", "yeasted dough"],
    image:
      "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=600&q=80",
  },
];
