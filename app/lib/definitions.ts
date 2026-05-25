export type Category = {
    category: string;
    product_count: number;
}

export type Product = {
  id: number;
  title: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  createdAt: Date;
  ProductImage?: { url: string }[];
};

