export interface Coffee {
  id: string;
  name: string;
  origin: string;
  tastingNotes: string[];
  process?: string;
  variety?: string;
  producer?: string;
  roaster?: string;
}

export interface Pastry {
  id: string;
  name: string;
  origin: string;
  price: number;
  currency: "EUR";
  notableDescription: string;
  tastingNotes: string[];
}

export const coffees: Coffee[] = [
  {
    id: "sweetspot-standard",
    name: "Sweetspot Standard",
    origin: "Antioquia, Colombia — Caicedo Community",
    tastingNotes: ["orange", "hazelnut", "caramel", "chocolate", "balanced body"],
    process: "Washed",
    variety: "Caturra, Colombia",
    producer: "9 small farmers of the Caicedo Community",
    roaster: "Johannes Bayer",
  },
  {
    id: "bluebird-kenia-washed-mamuto-aa",
    name: "Bluebird Kenia washed Mamuto AA",
    origin: "Kirinyaga, Kenya — Mamuto Single Estate",
    tastingNotes: ["red currants", "cherry", "bright acidity", "clean finish"],
    process: "Washed",
    variety: "SL28",
    producer: "Mamuto Single Estate Farm",
  },
  {
    id: "sweetspot-ethiopia-filter",
    name: "Sweetspot Ethiopia (filter example)",
    origin: "Yirgacheffe, Ethiopia",
    tastingNotes: ["bergamot", "floral", "citrus", "tea-like"],
    process: "Washed",
    variety: "Heirloom",
    producer: "Smallholder producers",
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
  },
  {
    id: "croissant",
    name: "Croissant",
    origin: "Coffee Twins",
    price: 2.3,
    currency: "EUR",
    notableDescription: "French butter base with light lamination.",
    tastingNotes: ["buttery", "light", "flaky"],
  },
  {
    id: "franzbrotchen",
    name: "Franzbrötchen",
    origin: "Coffee Twins",
    price: 2.6,
    currency: "EUR",
    notableDescription: "Caramelized cinnamon layers.",
    tastingNotes: ["caramel", "cinnamon", "buttery"],
  },
  {
    id: "pain-au-chocolat",
    name: "Pain au chocolat",
    origin: "Coffee Twins",
    price: 2.6,
    currency: "EUR",
    notableDescription: "Dark chocolate core with butter-rich dough.",
    tastingNotes: ["dark chocolate", "buttery", "sweet"],
  },
  {
    id: "zimtknoten",
    name: "Zimtknoten",
    origin: "Bageri",
    price: 3.7,
    currency: "EUR",
    notableDescription: "Scandinavian cinnamon twist with cardamom accent.",
    tastingNotes: ["cinnamon", "cardamom", "sweet spice"],
  },
  {
    id: "kardamomknoten",
    name: "Kardamomknoten",
    origin: "Bageri",
    price: 3.9,
    currency: "EUR",
    notableDescription: "Spicy-sweet Nordic yeasted bun.",
    tastingNotes: ["cardamom", "sweet spice", "yeasted dough"],
  },
];
