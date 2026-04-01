import { useState } from 'react';
import SearchPage from './SearchPage';
import AccountPage from './AccountPage';

const navItems = ['Dashboard', 'Profile Overview', 'Search Services', 'Bookings', 'Messages', 'Reviews', 'Settings'];

function MainPage() {
  const [active, setActive] = useState('Dashboard');
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedServiceID, setSelectedServiceID] = useState(null);

  const handleLogin = (userData) => {
    setCurrentUser(userData);
  };

  return (
    <div style={s.page}>

      <aside style={s.sidebar}>
        <div>
          <div style={s.logo}>
            <span style={{ fontWeight: 400 }}>peer</span>
            <span style={{ color: 'rgb(167, 139, 250)' }}>·</span>
            <span style={{ fontWeight: 700 }}>market</span>
          </div>
          <nav style={s.nav}>
            {navItems.map(item => (
              <div
                key={item}
                onClick={() => setActive(item)}
                style={{ ...s.navItem, ...(active === item ? s.navItemOn : {}) }}
              >
                {item}
              </div>
            ))}
          </nav>
        </div>

        <div style={s.sideFooter}>
          <div style={s.userAvatar}>JD</div>
          <div>
            <p style={s.userName}>Lenin Fonseca</p>
            <p style={s.userRole}>Provider</p>
          </div>
        </div>
      </aside>

      <main style={s.main}>
        {active === 'Dashboard' && <h1>Dashboard</h1>}
        {active === 'Profile Overview' && (
          <AccountPage username={currentUser?.username} onSelectService={setSelectedServiceID}  />
        )}
        {active === 'Search Services' && <SearchPage onSelectService={setSelectedServiceID} />}
        {active === 'Bookings' && <h1>Bookings</h1>}
        {active === 'Messages' && <h1>Messages</h1>}
        {active === 'Reviews' && <h1>Reviews</h1>}
        {active === 'Settings' && <h1>Settings</h1>}
      </main>

    </div>
  );
}

const s = {
  page: {
    height: '100vh',
    display: 'flex',
    fontFamily: "'Poppins', sans-serif",
    overflow: 'hidden',
  },
  sidebar: {
    width: '210px',
    background: '#0f0620',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    flexShrink: 0,
    padding: '0 0 20px',
  },
  logo: {
    color: 'white',
    fontSize: '18px',
    letterSpacing: '0.5px',
    padding: '26px 22px 22px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    marginBottom: '12px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
  },
  navItem: {
    padding: '9px 22px',
    fontSize: '13.5px',
    color: 'rgba(255,255,255,0.38)',
    cursor: 'pointer',
    fontWeight: '400',
    borderLeft: '2px solid transparent',
  },
  navItemOn: {
    color: 'white',
    fontWeight: '500',
    borderLeft: '2px solid rgb(167, 139, 250)',
    background: 'rgba(255,255,255,0.04)',
  },
  sideFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '18px 18px 0',
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgb(83, 58, 253), #c4b5fd)',
    color: 'white',
    fontSize: '11px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userName: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'white',
    margin: 0,
  },
  userRole: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.35)',
    margin: 0,
  },
  main: {
    flex: 1,
    background: '#f7f6ff',
  },
};

export default MainPage;
