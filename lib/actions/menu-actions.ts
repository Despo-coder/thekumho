"use client";



// Types for menu management
type MenuItemCreateData = {
  name: string;
  description?: string | null;
  price: number;
  image?: string | null;
  categoryId: string;
  isAvailable?: boolean;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isPescatarian?: boolean;
  isGlutenFree?: boolean;
  isDairyFree?: boolean;
  isNutFree?: boolean;
  isSpicy?: boolean;
  menuId: string;
};

type MenuItemUpdateData = Partial<MenuItemCreateData>;

type CategoryCreateData = {
  name: string;
  description?: string | null;
};

type CategoryUpdateData = Partial<CategoryCreateData>;

// Add these new types for API responses
type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number | bigint;
  image: string | null;
  isAvailable: boolean;
  menu: { id: string; name: string };
};

type Category = {
  id: string;
  name: string;
  items: MenuItem[];
};

type MenuApiResponse = {
  categories?: Category[];
  error?: string;
};

// Helper function to make API requests
// async function fetchApi(url: string, options?: RequestInit) {
//   const response = await fetch(url, {
//     ...options,
//     headers: {
//       ...options?.headers,
//       'Content-Type': 'application/json',
//     },
//   });

//   const data = await response.json();
//   if (!response.ok) {
//     throw new Error(data.error || 'An error occurred');
//   }
//   return data;
// }

// Menu Item Actions
export async function getMenuItems({
  categoryId,
  menuId,
  search,
  dietary,
}: {
  categoryId?: string;
  menuId?: string;
  search?: string;
  dietary?: string[];
} = {}) {
  try {
    // Build query params
    const params = new URLSearchParams();
    if (categoryId) params.append('categoryId', categoryId);
    if (menuId) params.append('menuId', menuId);
    if (search) params.append('search', search);
    if (dietary?.length) dietary.forEach(d => params.append('dietary', d));

    // Client-side data fetching
    const url = `/api/menu?${params.toString()}`;
    const response = await fetch(url);
    const data = await response.json() as MenuApiResponse;

    if (!response.ok) {
      return { error: data.error || 'Failed to fetch menu items' };
    }

    // Flatten the categories structure into an array of menu items
    let menuItems: (MenuItem & { category: { id: string; name: string } })[] = [];
    if (data && data.categories && Array.isArray(data.categories)) {
      data.categories.forEach((category: Category) => {
        if (category.items && Array.isArray(category.items)) {
          // Add category info to each item
          const itemsWithCategory = category.items.map((item: MenuItem) => ({
            ...item,
            category: {
              id: category.id,
              name: category.name
            }
          }));
          menuItems = [...menuItems, ...itemsWithCategory];
        }
      });
    }

    return { menuItems };
  } catch (error) {
    console.error("Error fetching menu items:", error);
    return { error: "Failed to fetch menu items" };
  }
}

export async function getMenuItem(id: string) {
  try {
    // Client-side data fetching
    const response = await fetch(`/api/menu/${id}`);
    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Menu item not found' };
    }

    return { menuItem: data };
  } catch (error) {
    console.error("Error fetching menu item:", error);
    return { error: "Failed to fetch menu item" };
  }
}

export async function createMenuItem(data: MenuItemCreateData) {
  try {
    const response = await fetch('/api/menu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      return { error: result.error || 'Failed to create menu item' };
    }
    
    return { menuItem: result };
  } catch (error) {
    console.error("Error creating menu item:", error);
    return { error: "Failed to create menu item" };
  }
}

export async function updateMenuItem(id: string, data: MenuItemUpdateData) {
  try {
    const response = await fetch(`/api/menu/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      return { error: result.error || 'Failed to update menu item' };
    }
    
    return { menuItem: result };
  } catch (error) {
    console.error("Error updating menu item:", error);
    return { error: "Failed to update menu item" };
  }
}

export async function deleteMenuItem(id: string) {
  try {
    const response = await fetch(`/api/menu/${id}`, {
      method: 'DELETE',
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      return { error: result.error || 'Failed to delete menu item' };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting menu item:", error);
    return { error: "Failed to delete menu item" };
  }
}

export async function updateMenuItemAvailability(id: string, isAvailable: boolean) {
  try {
    return await updateMenuItem(id, { isAvailable });
  } catch (error) {
    console.error("Error updating menu item availability:", error);
    return { error: "Failed to update menu item availability" };
  }
}

// Batch operations for menu items
export async function updateBatchMenuItems(
  itemIds: string[],
  data: MenuItemUpdateData
) {
  try {
    const response = await fetch('/api/menu/batch', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ itemIds, data }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      return { error: result.error || 'Failed to update batch menu items' };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error updating batch menu items:", error);
    return { error: "Failed to update batch menu items" };
  }
}

// Category Actions
export async function getCategories() {
  try {
    const response = await fetch('/api/categories');
    const data = await response.json();
    
    if (!response.ok) {
      return { error: data.error || 'Failed to fetch categories' };
    }
    
    return { categories: data };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return { error: "Failed to fetch categories" };
  }
}

export async function getCategory(id: string) {
  try {
    const response = await fetch(`/api/categories/${id}`);
    const data = await response.json();
    
    if (!response.ok) {
      return { error: data.error || 'Category not found' };
    }
    
    return { category: data };
  } catch (error) {
    console.error("Error fetching category:", error);
    return { error: "Failed to fetch category" };
  }
}

export async function createCategory(data: CategoryCreateData) {
  try {
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      return { error: result.error || 'Failed to create category' };
    }
    
    return { category: result };
  } catch (error) {
    console.error("Error creating category:", error);
    return { error: "Failed to create category" };
  }
}

export async function updateCategory(id: string, data: CategoryUpdateData) {
  try {
    const response = await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      return { error: result.error || 'Failed to update category' };
    }
    
    return { category: result };
  } catch (error) {
    console.error("Error updating category:", error);
    return { error: "Failed to update category" };
  }
}

export async function deleteCategory(id: string) {
  try {
    // First check if category has items
    const categoryData = await getCategory(id);
    if (categoryData.error) {
      return { error: categoryData.error };
    }
    
    if (categoryData.category.items.length > 0) {
      return { 
        error: "Cannot delete category with menu items. Please delete or move all items first." 
      };
    }
    
    const response = await fetch(`/api/categories/${id}`, {
      method: 'DELETE',
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      return { error: result.error || 'Failed to delete category' };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting category:", error);
    return { error: "Failed to delete category" };
  }
}

// Menu Actions - Server Actions
// The rest of the file will use server actions with direct Prisma access

// Image upload helper - This will need to be implemented with your preferred storage solution
export async function uploadMenuItemImage(file: File) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      return { error: result.error || 'Failed to upload image' };
    }
    
    return { imageUrl: result.url };
  } catch (error) {
    console.error("Error uploading image:", error);
    return { error: "Failed to upload image" };
  }
}
