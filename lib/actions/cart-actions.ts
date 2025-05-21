'use server';

// Define the CartItem type
export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
  specialInstructions?: string | null;
};

// Function to process cart items from JSON string
export async function getCartItems(cartData: string | null): Promise<CartItem[]> {
  if (!cartData) {
    return [];
  }

  try {
    return JSON.parse(cartData) as CartItem[];
  } catch (error) {
    console.error('Error parsing cart data:', error);
    return [];
  }
}

// Function to process adding an item to the cart
export async function processAddToCart(
  cartData: string | null,
  item: CartItem
): Promise<string> {
  // Parse current cart
  const cart = await getCartItems(cartData);
  
  // Check if item already exists in cart
  const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.id);
  
  if (existingItemIndex >= 0) {
    // Update existing item quantity
    cart[existingItemIndex].quantity += item.quantity;
    
    // Update special instructions if provided
    if (item.specialInstructions) {
      cart[existingItemIndex].specialInstructions = item.specialInstructions;
    }
  } else {
    // Add new item to cart
    cart.push(item);
  }
  
  // Return updated cart as JSON string
  return JSON.stringify(cart);
}

// Function to process updating cart item quantity
export async function processUpdateCartItem(
  cartData: string | null,
  itemId: string, 
  quantity: number
): Promise<string> {
  // Parse current cart
  const cart = await getCartItems(cartData);
  
  // Find the item
  const itemIndex = cart.findIndex(item => item.id === itemId);
  
  if (itemIndex === -1) {
    // Item not found, return unchanged cart
    return cartData || '[]';
  }
  
  if (quantity <= 0) {
    // Remove item if quantity is 0 or less
    cart.splice(itemIndex, 1);
  } else {
    // Update quantity
    cart[itemIndex].quantity = quantity;
  }
  
  // Return updated cart as JSON string
  return JSON.stringify(cart);
}

// Function to clear the cart after checkout
export async function clearCart(): Promise<void> {
  localStorage.removeItem('cart');
}

// Function to remove item from cart
export async function removeFromCart(
  itemId: string
): Promise<{ success: boolean; message: string }> {
  const cartData = localStorage.getItem('cart');
  const updatedCartData = await processUpdateCartItem(cartData, itemId, 0);
  
  if (updatedCartData === '[]') {
    localStorage.removeItem('cart');
    return {
      success: true,
      message: 'Item removed from cart'
    };
  } else {
    localStorage.setItem('cart', updatedCartData);
    return {
      success: true,
      message: 'Cart updated'
    };
  }
} 