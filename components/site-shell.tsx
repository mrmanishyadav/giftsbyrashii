'use client';
import Link from 'next/link';
import {
  ChevronRight,
  Gift,
  Heart,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  Package,
  PackageSearch,
  Search,
  ShoppingBag,
  Sparkles,
  UserPlus,
  UserRound,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useCart } from './cart-provider';

type StoreConfig = {
  navigation?: { label: string; url: string }[];
  announcements?: { text: string }[];
  settings?: {
    shipping?: { freeShippingAbove?: number };
    store?: { name?: string; supportEmail?: string; supportPhone?: string; whatsapp?: string };
    social?: Record<string, string>;
  };
};

type SessionState = {
  authenticated: boolean;
  fullName?: string;
  email?: string;
};

export function Logo() {
  return (
    <Link href="/" className="brand" aria-label="GiftsByRashii home">
      <span className="brand-gift">
        <Gift size={18} />
      </span>
      <span>
        Gifts<span>ByRashii</span>
      </span>
    </Link>
  );
}

const defaults = [
  ['Home', '/'],
  ['New & Noteworthy', '/shop'],
  ['Occasions', '/occasion/birthday'],
  ['Recipients', '/recipient/for-her'],
  ['Personalised', '/category/personalised-gifts'],
  ['Build a Hamper', '/hamper-builder'],
  ['Corporate Gifting', '/corporate-gifting'],
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [links, setLinks] = useState(defaults);
  const [session, setSession] = useState<SessionState>({ authenticated: false });
  const [announcement, setAnnouncement] = useState('A little gifting joy, made for you');
  const [shipping, setShipping] = useState('Free shipping above ₹999 · Made with love in India');
  const { count, wishlist } = useCart();
  const pathname = usePathname();

  useEffect(() => {
    Promise.all([
      fetch('/api/storefront-config').then(async (r) => (await r.json()) as StoreConfig),
      fetch('/api/auth/session', { cache: 'no-store' }).then(async (r) => (await r.json()) as SessionState),
    ])
      .then(([data, auth]) => {
        if (data.navigation?.length) {
          const managed = data.navigation.map((x) => [x.label, x.url]);
          setLinks(managed.some(([, url]) => url === '/') ? managed : [['Home', '/'], ...managed]);
        }
        if (data.announcements?.[0]) setAnnouncement(data.announcements[0].text);
        if (data.settings?.shipping?.freeShippingAbove) {
          setShipping(`Free shipping above ₹${data.settings.shipping.freeShippingAbove} · Made with love in India`);
        }
        setSession(auth);
      })
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', close);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', close);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (url: string) => {
    const target = url.split('?')[0];
    return target === '/' ? pathname === '/' : pathname === target || pathname.startsWith(`${target}/`);
  };

  const accountHref = session.authenticated ? '/account' : '/login';

  return (
    <>
      <div className="announcement">
        <span>
          <Sparkles size={14} />
          {announcement}
        </span>
        <span className="announcement-extra">{shipping}</span>
      </div>

      <header className="site-header">
        <div className="header-main shell">
          <button
            className="mobile-menu"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
          >
            <Menu size={22} />
          </button>

          <Logo />

          <form className="search-box" action="/search">
            <Search size={18} />
            <input name="q" aria-label="Search gifts" placeholder="Search gifts, people or occasions…" />
            <kbd>⌘ K</kbd>
          </form>

          <nav className="header-actions" aria-label="Account actions">
            <Link
              href={accountHref}
              aria-label={session.authenticated ? 'My account' : 'Sign in'}
              className={`header-action-account ${isActive('/account') || isActive('/login') || isActive('/signup') ? 'active' : ''}`}
            >
              <UserRound size={20} />
            </Link>
            <Link
              href="/account/wishlist"
              aria-label="Wishlist"
              className={`cart-link ${isActive('/account/wishlist') ? 'active' : ''}`}
            >
              <Heart size={20} />
              {wishlist.length > 0 && <span>{wishlist.length}</span>}
            </Link>
            <Link
              href="/cart"
              aria-label={`Cart with ${count} items`}
              className={`cart-link ${isActive('/cart') ? 'active' : ''}`}
            >
              <ShoppingBag size={20} />
              {count > 0 && <span>{count}</span>}
            </Link>
          </nav>
        </div>

        <nav className="main-nav shell" aria-label="Main navigation">
          {links.map(([label, url]) => (
            <Link
              href={url}
              key={`${label}-${url}`}
              className={isActive(url) ? 'active' : ''}
              aria-current={isActive(url) ? 'page' : undefined}
            >
              {label}
            </Link>
          ))}
          <Link href="/shop?sort=sale" className="sale-link">
            The Gift Sale
          </Link>
        </nav>
      </header>

      {open && (
        <>
          <div
            className="mobile-drawer-backdrop"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="mobile-drawer" role="dialog" aria-modal="true" aria-label="Main menu">
            <div className="mobile-drawer-header">
              <Logo />
              <button
                className="mobile-drawer-close"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <form action="/search" className="mobile-drawer-search">
              <Search size={18} />
              <input
                name="q"
                aria-label="Search GiftsByRashii"
                placeholder="Search gifts, occasions, hampers…"
              />
            </form>

            {/* Mobile Account / Profile Card */}
            <div className="mobile-account-section">
              {session.authenticated ? (
                <div className="mobile-profile-card">
                  <div className="mobile-profile-header">
                    <div className="mobile-profile-avatar">
                      {(session.fullName ? session.fullName[0] : 'U').toUpperCase()}
                    </div>
                    <div className="mobile-profile-meta">
                      <span className="mobile-profile-badge">MEMBER</span>
                      <b>{session.fullName || 'Valued Member'}</b>
                    </div>
                  </div>

                  <div className="mobile-profile-grid">
                    <Link
                      href="/account"
                      onClick={() => setOpen(false)}
                      className={`mobile-profile-tile ${isActive('/account') ? 'active' : ''}`}
                    >
                      <UserRound size={17} />
                      <span>My Account</span>
                    </Link>
                    <Link
                      href="/account/orders"
                      onClick={() => setOpen(false)}
                      className={`mobile-profile-tile ${isActive('/account/orders') ? 'active' : ''}`}
                    >
                      <Package size={17} />
                      <span>My Orders</span>
                    </Link>
                    <Link
                      href="/account/wishlist"
                      onClick={() => setOpen(false)}
                      className={`mobile-profile-tile ${isActive('/account/wishlist') ? 'active' : ''}`}
                    >
                      <Heart size={17} />
                      <span>Wishlist {wishlist.length > 0 ? `(${wishlist.length})` : ''}</span>
                    </Link>
                    <Link
                      href="/account/addresses"
                      onClick={() => setOpen(false)}
                      className={`mobile-profile-tile ${isActive('/account/addresses') ? 'active' : ''}`}
                    >
                      <MapPin size={17} />
                      <span>Addresses</span>
                    </Link>
                  </div>

                  <form action="/api/auth/logout" method="post" className="mobile-logout-form">
                    <button type="submit" className="mobile-logout-button">
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </form>
                </div>
              ) : (
                <div className="mobile-guest-card">
                  <div className="mobile-guest-info">
                    <div className="mobile-guest-icon">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <b>Welcome to GiftsByRashii</b>
                      <p>Sign in to track orders, save wishlist & checkout faster.</p>
                    </div>
                  </div>

                  <div className="mobile-guest-buttons">
                    <Link
                      href="/login"
                      className="button button-primary mobile-btn"
                      onClick={() => setOpen(false)}
                    >
                      <LogIn size={16} />
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      className="button button-soft mobile-btn"
                      onClick={() => setOpen(false)}
                    >
                      <UserPlus size={16} />
                      Register
                    </Link>
                  </div>

                  <div className="mobile-guest-links">
                    <Link href="/track-order" onClick={() => setOpen(false)}>
                      <PackageSearch size={15} />
                      Track an Order
                    </Link>
                    <Link href="/account/wishlist" onClick={() => setOpen(false)}>
                      <Heart size={15} />
                      Wishlist {wishlist.length > 0 ? `(${wishlist.length})` : ''}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Category Links */}
            <div className="mobile-nav-block">
              <small className="mobile-nav-heading">EXPLORE COLLECTIONS</small>
              <nav className="mobile-nav-list">
                {links.map(([label, url]) => (
                  <Link
                    className={`mobile-nav-item ${isActive(url) ? 'active' : ''}`}
                    aria-current={isActive(url) ? 'page' : undefined}
                    onClick={() => setOpen(false)}
                    href={url}
                    key={`${label}-${url}`}
                  >
                    <span>{label}</span>
                    <ChevronRight size={17} className="mobile-nav-arrow" />
                  </Link>
                ))}
                <Link
                  href="/shop?sort=sale"
                  className={`mobile-nav-item sale-item ${isActive('/shop?sort=sale') ? 'active' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  <span className="sale-text">✨ The Gift Sale</span>
                  <span className="sale-pill">SALE</span>
                </Link>
              </nav>
            </div>

            {/* Support / Quick Links */}
            <div className="mobile-drawer-footer">
              <small className="mobile-nav-heading">HELP & SUPPORT</small>
              <div className="mobile-footer-links">
                <Link href="/track-order" onClick={() => setOpen(false)}>Track Order</Link>
                <Link href="/contact" onClick={() => setOpen(false)}>Contact Us</Link>
                <Link href="/about" onClick={() => setOpen(false)}>About Us</Link>
                <Link href="/pages/shipping-policy" onClick={() => setOpen(false)}>Shipping Policy</Link>
                <Link href="/pages/faqs" onClick={() => setOpen(false)}>FAQs</Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export function SiteFooter() {
  const [config, setConfig] = useState<StoreConfig>({});
  useEffect(() => {
    fetch('/api/storefront-config')
      .then(async (response) => (await response.json()) as StoreConfig)
      .then(setConfig)
      .catch(() => {});
  }, []);
  const store = config.settings?.store;
  const social = Object.entries(config.settings?.social ?? {}).filter(([, url]) => url);
  return (
    <footer className="footer">
      <div className="shell footer-grid">
        <div>
          <Logo />
          <p>Joyful gifting, thoughtfully curated in India. Every box is made to feel personal.</p>
          <div className="footer-social">
            {social.length ? (
              social.map(([name, url]) => (
                <a key={name} href={url} target="_blank" rel="noreferrer">
                  {name}
                </a>
              ))
            ) : (
              <>
                <span>Instagram</span>
                <span>Pinterest</span>
                <span>Facebook</span>
              </>
            )}
          </div>
          {store?.supportEmail && <a href={`mailto:${store.supportEmail}`}>{store.supportEmail}</a>}
          {store?.supportPhone && <a href={`tel:${store.supportPhone}`}>{store.supportPhone}</a>}
        </div>
        <div>
          <h3>Shop</h3>
          <Link href="/">Home</Link>
          <Link href="/shop">All gifts</Link>
          <Link href="/occasion/birthday">Birthdays</Link>
          <Link href="/category/personalised-gifts">Personalised</Link>
          <Link href="/hamper-builder">Build a hamper</Link>
        </div>
        <div>
          <h3>Help</h3>
          <Link href="/track-order">Track an order</Link>
          <Link href="/contact">Contact us</Link>
          <Link href="/pages/shipping-policy">Shipping</Link>
          <Link href="/pages/returns">Returns</Link>
          <Link href="/pages/faqs">FAQs</Link>
        </div>
        <div>
          <h3>A little joy in your inbox</h3>
          <p>Gifting ideas, launch notes and members-only offers.</p>
          <form action="/api/newsletter" method="post" className="newsletter">
            <input name="email" type="email" required placeholder="Email address" />
            <button aria-label="Subscribe">→</button>
          </form>
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>© 2026 {store?.name ?? 'GiftsByRashii'}</span>
        <span>Secure payments · Made with care</span>
      </div>
    </footer>
  );
}

export function StorefrontFrame({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
