import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MarketplaceProvider, useMarketplace } from './context/MarketplaceContext';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { ArtisanDashboard } from './pages/ArtisanDashboard';
import { CartPage } from './pages/CartPage';
import { WishlistPage } from './pages/WishlistPage';
import { ProductDetailsPage } from './pages/ProductDetailsPage';
import { CustomizeProductPage } from './pages/CustomizeProductPage';
import { ProductCustomizerModal } from './components/ProductCustomizerModal';
import { CartCheckoutDrawer } from './components/CartCheckoutDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { AuthRequiredModal } from './components/AuthRequiredModal';
import { HeartHandsLogo } from './components/HeartHandsLogo';
import { Product, Order } from './types';

const VALID_VIEWS = [
  'home',
  'login',
  'signup',
  'customer-dashboard',
  'customer-profile',
  'artisan-dashboard',
  'cart',
  'wishlist',
  'product-details',
  'customize',
];

const MainApp: React.FC = () => {
  const { currentUser, isAuthenticated, isLoading } = useAuth();
  const {
    isCartOpen,
    closeCart,
    addToCart,
    openCart,
    isAuthModalOpen,
    authModalReason,
    closeAuthModal,
  } = useMarketplace();

  // Navigation State - Initial page routing:
  // When a user opens the website link for the first time, Login page appears first.
  // If already authenticated, they can be taken directly to the Home Page.
  const [selectedProductId, setSelectedProductId] = useState<string | null>(() => {
    if (window.location.hash && window.location.hash.includes('id=')) {
      return window.location.hash.split('id=')[1]?.split('&')[0] || null;
    }
    return null;
  });

  const [currentView, setCurrentView] = useState<string>(() => {
    if (window.location.hash) {
      const raw = window.location.hash.replace('#', '');
      const base = raw.split('?')[0];
      if (VALID_VIEWS.includes(base)) {
        return base;
      }
    }
    return isAuthenticated ? 'home' : 'login';
  });
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeDiscount, setActiveDiscount] = useState(0);

  // Global Category & Subcategory Filter State
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('All');

  const handleSelectCategory = (category: string, subcategory?: string) => {
    setSelectedCategory(category);
    setSelectedSubcategory(subcategory || 'All');
    if (currentView !== 'home') {
      handleNavigate('home');
    }
    setTimeout(() => {
      const el = document.getElementById('catalog-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 120);
  };

  // Synchronize browser history / URL hash if desired
  useEffect(() => {
    const handleHashChange = () => {
      const raw = window.location.hash.replace('#', '');
      const [view, query] = raw.split('?');
      if (VALID_VIEWS.includes(view)) {
        setCurrentView(view);
        if (query && query.includes('id=')) {
          const id = query.split('id=')[1]?.split('&')[0];
          if (id) setSelectedProductId(id);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    if (window.location.hash) {
      handleHashChange();
    }
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (view: string) => {
    const [baseView, query] = view.split('?');
    if (VALID_VIEWS.includes(baseView)) {
      setCurrentView(baseView);
      if (query && query.includes('id=')) {
        const id = query.split('id=')[1]?.split('&')[0];
        if (id) setSelectedProductId(id);
      }
    } else {
      setCurrentView(view);
    }
    window.location.hash = view;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProductId(product.id);
    handleNavigate(`product-details?id=${product.id}`);
  };

  const handleOpenCustomize = (product?: Product) => {
    if (product) {
      setSelectedProductId(product.id);
      handleNavigate(`customize?id=${product.id}`);
    } else {
      handleNavigate('customize');
    }
  };

  const handleOpenCheckout = (discountAmount: number) => {
    setActiveDiscount(discountAmount);
    setIsCheckoutOpen(true);
  };

  const handleOrderSuccess = (order: Order) => {
    setIsCheckoutOpen(false);
    // Directly guide user to Customer Dashboard to track the order!
    handleNavigate('customer-dashboard');
  };

  // Brand Loading Screen with official logo
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFF9F5] flex flex-col items-center justify-center p-6 select-none animate-fade-in">
        <div className="text-center space-y-4">
          <HeartHandsLogo variant="loading" priority />
          <div className="flex items-center justify-center gap-2 pt-2">
            <span className="w-2 h-2 rounded-full bg-[#E89FB2] animate-ping" />
            <p className="text-xs font-semibold text-[#8C6D6D] tracking-wide">
              Loading Heart &amp; Hands...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Protected Route Logic
  const renderContent = () => {
    switch (currentView) {
      case 'login':
        return <LoginPage onNavigate={handleNavigate} />;

      case 'signup':
        return <SignupPage onNavigate={handleNavigate} />;

      case 'customer-profile':
      case 'customer-dashboard':
        if (!isAuthenticated) {
          return (
            <div className="min-h-[calc(100vh-100px)] flex items-center justify-center p-6 bg-[#FFF9F5]">
              <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-[#F2D7D9] text-center space-y-4 shadow-sm">
                <HeartHandsLogo variant="compact" className="w-16 h-16 mx-auto mb-2" />
                <h3 className="text-xl font-bold text-[#4A2C2C]">
                  Sign In to View Customer Orders &amp; Profile
                </h3>
                <p className="text-xs text-[#8C6D6D] leading-relaxed">
                  Please log in or create a customer account to track your personalized pieces, manage your profile, and view orders.
                </p>
                <div className="pt-2 flex gap-3 justify-center">
                  <button
                    onClick={() => handleNavigate('login')}
                    className="px-5 py-2.5 rounded-lg bg-[#E89FB2] hover:bg-[#D8869B] text-white text-xs font-bold shadow-md shadow-[#E89FB2]/20 cursor-pointer transition-all"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => handleNavigate('signup')}
                    className="px-5 py-2.5 rounded-lg bg-white border border-[#F2D7D9] text-[#4A2C2C] text-xs font-bold hover:bg-[#FFF9F5] cursor-pointer transition-colors"
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            </div>
          );
        }
        return (
          <CustomerDashboard
            onNavigate={handleNavigate}
            onSelectProduct={handleSelectProduct}
            initialTab={currentView === 'customer-profile' ? 'profile' : 'orders'}
          />
        );

      case 'artisan-dashboard':
        if (!isAuthenticated) {
          return (
            <div className="min-h-[calc(100vh-100px)] flex items-center justify-center p-6 bg-[#FFF9F5]">
              <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-[#F2D7D9] text-center space-y-4 shadow-sm">
                <HeartHandsLogo variant="compact" className="w-16 h-16 mx-auto mb-2" />
                <h3 className="text-xl font-bold text-[#4A2C2C]">
                  Artisan Studio Access
                </h3>
                <p className="text-xs text-[#8C6D6D] leading-relaxed">
                  Please log in with your Artisan credentials to manage your inventory, commissions, and crafting milestones.
                </p>
                <div className="pt-2 flex gap-3 justify-center">
                  <button
                    onClick={() => handleNavigate('login')}
                    className="px-5 py-2.5 rounded-lg bg-[#E89FB2] hover:bg-[#D8869B] text-white text-xs font-bold shadow-md shadow-[#E89FB2]/20 cursor-pointer transition-all"
                  >
                    Log In as Artisan
                  </button>
                  <button
                    onClick={() => handleNavigate('signup')}
                    className="px-5 py-2.5 rounded-lg bg-white border border-[#F2D7D9] text-[#4A2C2C] text-xs font-bold hover:bg-[#FFF9F5] cursor-pointer transition-colors"
                  >
                    Join as Artisan
                  </button>
                </div>
              </div>
            </div>
          );
        }

        // If authenticated but role is customer, show friendly prompt with 1-click switch
        if (currentUser?.role !== 'artisan') {
          return (
            <div className="min-h-[calc(100vh-100px)] flex items-center justify-center p-6 bg-[#FFF9F5]">
              <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-[#F2D7D9] text-center space-y-4 shadow-sm">
                <HeartHandsLogo variant="compact" className="w-16 h-16 mx-auto mb-2" />
                <h3 className="text-xl font-bold text-[#4A2C2C]">
                  Artisan Role Required
                </h3>
                <p className="text-xs text-[#8C6D6D] leading-relaxed">
                  You are currently logged in as a Customer (<span className="font-bold text-[#4A2C2C]">{currentUser?.fullName}</span>). The Artisan Dashboard is reserved for makers to fulfill orders and manage inventory.
                </p>
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => handleNavigate('customer-dashboard')}
                    className="px-5 py-2.5 rounded-lg bg-[#E89FB2] hover:bg-[#D8869B] text-white text-xs font-bold shadow-md shadow-[#E89FB2]/20 cursor-pointer transition-all"
                  >
                    Go to Customer Dashboard
                  </button>
                </div>
              </div>
            </div>
          );
        }

        return (
          <ArtisanDashboard
            onNavigate={handleNavigate}
            onSelectProduct={handleSelectProduct}
          />
        );

      case 'cart':
        return (
          <CartPage
            onNavigate={handleNavigate}
            onOpenCheckout={handleOpenCheckout}
          />
        );

      case 'wishlist':
        return (
          <WishlistPage
            onNavigate={handleNavigate}
          />
        );

      case 'product-details':
        return (
          <ProductDetailsPage
            productId={selectedProductId}
            onNavigate={handleNavigate}
            onOpenCustomize={handleOpenCustomize}
            onSelectProduct={handleSelectProduct}
            onOpenCheckout={handleOpenCheckout}
          />
        );

      case 'customize':
        return (
          <CustomizeProductPage
            initialProductId={selectedProductId}
            onNavigate={handleNavigate}
            onSelectProduct={handleSelectProduct}
          />
        );

      case 'home':
      default:
        return (
          <HomePage
            onSelectProduct={handleSelectProduct}
            onNavigate={handleNavigate}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat, subcat) => {
              setSelectedCategory(cat);
              setSelectedSubcategory(subcat || 'All');
            }}
            selectedSubcategory={selectedSubcategory}
            onSelectSubcategory={(subcat) => setSelectedSubcategory(subcat)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9F5] text-[#4A2C2C]">
      {/* Universal Navigation Header */}
      <Navbar 
        currentView={currentView} 
        onNavigate={handleNavigate}
        onSelectCategory={handleSelectCategory}
      />

      {/* Main View Area */}
      <main className="flex-1">{renderContent()}</main>

      {/* Product Customizer & Inscription Modal */}
      <ProductCustomizerModal
        product={selectedProductForModal}
        isOpen={!!selectedProductForModal}
        onClose={() => setSelectedProductForModal(null)}
        onAddToCart={(product, selections, quantity) => {
          addToCart(product, selections, quantity);
          setSelectedProductForModal(null);
          openCart();
        }}
      />

      {/* Cart & Quick Checkout Drawer */}
      <CartCheckoutDrawer
        isOpen={isCartOpen}
        onClose={closeCart}
        onOpenCheckout={handleOpenCheckout}
        onNavigate={handleNavigate}
      />

      {/* Wishlist Saved Treasures Drawer */}
      <WishlistDrawer />

      {/* Auth Prompt Modal when guests try to save to cart or wishlist */}
      <AuthRequiredModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        reason={authModalReason}
        onNavigate={handleNavigate}
      />

      {/* Multi-step Bespoke Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        discount={activeDiscount}
        onOrderSuccess={handleOrderSuccess}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MarketplaceProvider>
        <MainApp />
      </MarketplaceProvider>
    </AuthProvider>
  );
};

export default App;
