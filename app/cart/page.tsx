'use client';
import Image from "next/image";

import { useCart } from '@/context/CartContext';
import { Trash2, ShoppingCart, Package } from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
  const { cart, removeFromCart, clearCart, increaseQuantity, decreaseQuantity } = useCart();

  const total = cart.reduce(
    (sum: number, item) => sum + item.price * item.quantity, 0
  );

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8 mx-auto max-w-3xl">
        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="flex items-center gap-2 bg-[var(--rust)] text-white px-6 py-3 rounded-lg hover:bg-[#b84f2e] transition-colors"
          >Clear Cart</button>
        )}
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-6 w-6 text-[var(--rust)]" />
          <h1 className="text-3xl font-bold text-[var(--navy)]">Shopping Cart</h1>
        </div>
      </div>
      {cart.length === 0 ? (
        <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md p-12 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="h-12 w-12 text-gray-300" />
          </div>
          <h2 className="text-2xl font-semibold text-[var(--navy)] mb-3">
            Your cart is empty
          </h2>
          <p className="text-gray-600 mb-8">
            Looks like you haven't added any items to your cart yet.
          </p>
          <Link href="/product-list">
            <button className="bg-[var(--rust)] text-white px-8 py-3 rounded-lg hover:bg-[#b84f2e] transition-colors font-semibold">
              Browse Products
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 mx-auto max-w-3xl">
          {cart.map(item => (
            <div key={item.id} className="bg-white rounded-lg shadow-md p-6 flex gap-6 hover:shadow-lg transition-shadow">
              <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden relative">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    width={96}
                    height={96}
                    className="object-cover"
                  />
                ) : (
                  <Package className="h-12 w-12 text-gray-300 mx-auto my-auto" />
                )}
              </div>
              <div className="flex items-start justify-between mb-2">
                <div className='flex-2'>
                  <div>
                    <h3 className="text-xl font-semibold text-[var(--navy)] mb-1">
                      {item.title}
                    </h3>
                    {/* <p className="text-sm text-gray-600 mb-2">
                      Quantity: {item.quantity}
                    </p> */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => decreaseQuantity(item.id)}
                        className="px-3 py-1 border rounded text-lg font-bold hover:bg-gray-100"
                      >
                        -
                      </button>
                      <span className="text-lg font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => increaseQuantity(item.id)}
                        disabled={item.quantity >= item.stock}
                        className="px-3 py-1 border rounded text-lg font-bold hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-[var(--rust)]">

                      <span className="font-semibold">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                    <span className="text-gray-500">
                      Unit price: ${item.price.toFixed(2)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>

              {/* <p>
                {item.title} — ${item.price.toFixed(2)} × {item.quantity}
              </p>
              <button onClick={() => removeFromCart(item.id)}>Remove</button> */}
            </div>
          ))}

          {/* <h3>Total: ${total.toFixed(2)}</h3> */}
          <div className="bg-gray-50 rounded-lg shadow-inner p-6 flex justify-between items-center">
            <h3 className="text-xl font-semibold text-[var(--navy)]">Total</h3>
            <span className="text-2xl font-bold text-[var(--rust)]">
              ${total.toFixed(2)}
            </span>
          </div>


         <div className="text-right">
           <Link href="/checkout">
            <button className="bg-[var(--rust)] text-white px-6 py-3 rounded-lg hover:bg-[#b84f2e] font-bold">
              CHECKOUT
            </button>
          </Link>
         </div>

          {/* <button onClick={clearCart}>Clear Cart</button> */}
        </div>
      )}
    </main>
  );
}

// import { useEffect, useState } from 'react';

// interface CartItem {
//   id: string;
//   title: string;
//   price: number;
//   quantity: number;
// }

// export default function Cart() {
//   const [cart, setCart] = useState<CartItem[]>([]);

//   useEffect(() => {
//     const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
//     setCart(savedCart);
//   }, []);

//   const removeItem = (id: string) => {
//     const updatedCart = cart.filter(item => item.id !== id);
//     setCart(updatedCart);
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//   };

//   const clearCart = () => {
//     setCart([]);
//     localStorage.removeItem('cart');
//   };

//   const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

//   return (
//     <main style={{ padding: '2rem' }}>
//       <h1>Handcrafted Haven</h1>
//       <h2>Shopping Cart</h2>

//       {cart.length === 0 ? (
//         <p>Your cart is empty.</p>
//       ) : (
//         <div>
//           {cart.map(item => (
//             <div key={item.id} style={{ marginBottom: '1rem' }}>
//               <p>
//                 {item.title} — ${item.price.toFixed(2)} × {item.quantity}
//               </p>
//               <button onClick={() => removeItem(item.id)}>Remove</button>
//             </div>
//           ))}

//           <h3>Total: ${total.toFixed(2)}</h3>
//           <button onClick={clearCart}>Clear Cart</button>
//         </div>
//       )}
//     </main>
//   );
// }