import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { productsAPI, transactionsAPI } from "../services/api";
import { Product, CartItem } from "../types";

const POS: React.FC = () => {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "card" | "mobile_money"
  >("cash");
  const [amountTendered, setAmountTendered] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data.products);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const searchProducts = async (query: string) => {
    if (!query.trim()) {
      loadProducts();
      return;
    }

    try {
      const response = await productsAPI.search(query);
      setProducts(response.data.products);
    } catch (error) {
      console.error("Error searching products:", error);
    }
  };

  const handleBarcodeSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    try {
      const response = await productsAPI.getByBarcode(barcodeInput);
      addToCart(response.data.product);
      setBarcodeInput("");
    } catch (error) {
      alert("Product not found");
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { product, quantity: 1, discount: 0 }]);
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(
      cart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const calculateSubtotal = () => {
    return cart.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.16; // 16% VAT
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    const total = calculateTotal();
    const tendered = parseFloat(amountTendered) || 0;

    if (paymentMethod === "cash" && tendered < total) {
      alert("Amount tendered is less than total");
      return;
    }

    setLoading(true);

    try {
      const transactionData = {
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.price,
          discount: item.discount,
        })),
        subtotal: calculateSubtotal(),
        tax_amount: calculateTax(),
        discount_amount: 0,
        total_amount: total,
        payment_method: paymentMethod,
        amount_tendered: paymentMethod === "cash" ? tendered : total,
      };

      const response = await transactionsAPI.create(transactionData);

      alert(
        `Transaction completed! Change: KES ${response.data.change.toFixed(2)}`
      );

      // Reset
      setCart([]);
      setAmountTendered("");
      setShowPaymentModal(false);
      loadProducts();
    } catch (error: any) {
      alert(
        "Transaction failed: " +
          (error.response?.data?.error || "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Supermarket POS</h1>
          <div className="flex items-center gap-4">
            <span>Welcome, {user?.full_name}</span>
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Products</h2>

            {/* Barcode Scanner */}
            <form onSubmit={handleBarcodeSearch} className="mb-4">
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan or enter barcode..."
                className="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </form>

            {/* Search */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchProducts(e.target.value);
              }}
              placeholder="Search products..."
              className="w-full border rounded px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Product Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto">
              {products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="border rounded-lg p-4 hover:shadow-lg cursor-pointer transition"
                >
                  <h3 className="font-semibold text-sm mb-2">{product.name}</h3>
                  <p className="text-gray-600 text-xs mb-2">
                    {product.category_name}
                  </p>
                  <p className="text-blue-600 font-bold">
                    KES {product.price.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Stock: {product.stock_quantity}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Cart</h2>

            <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
              {cart.map((item) => (
                <div key={item.product.id} className="border-b pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-sm">
                      {item.product.name}
                    </h3>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-red-500 text-xs hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity - 1)
                        }
                        className="bg-gray-200 px-2 py-1 rounded text-sm"
                      >
                        -
                      </button>
                      <span className="font-semibold">{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity + 1)
                        }
                        className="bg-gray-200 px-2 py-1 rounded text-sm"
                      >
                        +
                      </button>
                    </div>
                    <span className="font-semibold">
                      KES {(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {cart.length === 0 && (
              <p className="text-gray-500 text-center py-8">Cart is empty</p>
            )}

            {/* Totals */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>KES {calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (16%):</span>
                <span>KES {calculateTax().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold">
                <span>Total:</span>
                <span>KES {calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded mt-4 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Checkout
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Payment</h2>

            <div className="mb-4">
              <p className="text-xl font-bold">
                Total: KES {calculateTotal().toFixed(2)}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="mobile_money">Mobile Money</option>
              </select>
            </div>

            {paymentMethod === "cash" && (
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">
                  Amount Tendered
                </label>
                <input
                  type="number"
                  value={amountTendered}
                  onChange={(e) => setAmountTendered(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {amountTendered && (
                  <p className="text-sm text-gray-600 mt-2">
                    Change: KES{" "}
                    {(parseFloat(amountTendered) - calculateTotal()).toFixed(2)}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={processPayment}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded disabled:bg-gray-400"
              >
                {loading ? "Processing..." : "Complete Payment"}
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={loading}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 rounded disabled:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
