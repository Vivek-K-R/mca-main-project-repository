import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  useEffect(() => {
    // Get user data from localStorage
    const userString = localStorage.getItem('user');
    
    if (userString) {
      try {
        const userData = JSON.parse(userString);
        setUserRole(userData.role);
        setUserName(userData.name);
      } catch (err) {
        console.error("Error parsing user data:", err);
        localStorage.removeItem('user');
      }
    }
    
    // Add click outside listener to close dropdown
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    setIsLoggingOut(true);
    
    // Clear all authentication data
    localStorage.clear();
    
    setTimeout(() => {
      setUserRole('');
      setUserName('');
      setIsLoggingOut(false);
      navigate('/login');
    }, 300);
  };

  // Define navigation links based on user role
  const getNavLinks = () => {
    const commonLinks = [
      { to: '/', label: 'Home', icon: '🏠' }
    ];
    
    const studentLinks = [
      { to: '/student/dashboard', label: 'Dashboard', icon: '📊' },
      { to: '/student/upload', label: 'Upload Answer Sheet', icon: '📄' }
    ];
    
    const teacherLinks = [
      { to: '/teacher/dashboard', label: 'Dashboard', icon: '📊' },
      { to: '/teacher/answer-keys', label: 'Answer Keys', icon: '🔑' },
      { to: '/teacher/evaluate', label: 'Evaluate', icon: '✓' }
    ];
    
    if (userRole === 'student') {
      return [...commonLinks, ...studentLinks];
    } else if (userRole === 'teacher') {
      return [...commonLinks, ...teacherLinks];
    }
    
    return commonLinks;
  };

  const navLinks = getNavLinks();
  
  return (
    <nav style={styles.navbar}>
      <div style={styles.container}>
        {/* Logo and Navigation Links */}
        <div style={styles.leftSection}>
          {/* Logo */}
          <Link to="/" style={styles.logoLink}>
            <span style={styles.logo}>EvalSys</span>
          </Link>
          
          {/* Navigation Links */}
          <div style={styles.navLinks}>
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  ...styles.navLink,
                  ...(location.pathname === link.to ? styles.activeLink : {})
                }}
              >
                <span style={styles.navIcon}>{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        
        {/* User Profile and Dropdown */}
        <div style={styles.rightSection}>
          {!userRole ? (
            <div style={styles.authButtons}>
              <Link to="/login" style={styles.loginButton}>Log In</Link>
              <Link to="/signup" style={styles.signupButton}>Sign Up</Link>
            </div>
          ) : (
            <div style={styles.userDropdownContainer} ref={dropdownRef}>
              <div 
                style={styles.userProfile} 
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <span style={styles.userIcon}>
                  {userRole === 'student' ? '👨‍🎓' : '👨‍🏫'}
                </span>
                <span style={styles.userName}>{userName}</span>
                <span style={styles.dropdownArrow}>▼</span>
              </div>
              
              {showDropdown && (
                <div style={styles.dropdownMenu}>
                  <div style={styles.userRoleInfo}>
                    {userRole === 'student' ? 'Student Account' : 'Teacher Account'}
                  </div>
                  <button 
                    onClick={handleLogout}
                    style={styles.logoutButton}
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile Menu Button & Menu - Visible only on mobile */}
      <div style={styles.mobileMenuContainer}>
        <div style={styles.mobileTopBar}>
          <Link to="/" style={styles.mobileLogoLink}>
            <span style={styles.mobileLogo}>EvalSys</span>
          </Link>
          
          {userRole && (
            <div 
              style={styles.mobileUserProfile}
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <span style={styles.mobileUserIcon}>
                {userRole === 'student' ? '👨‍🎓' : '👨‍🏫'}
              </span>
              <span style={styles.mobileUserName}>{userName}</span>
            </div>
          )}
        </div>
        
        <div style={styles.mobileLinkContainer}>
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                ...styles.mobileLink,
                ...(location.pathname === link.to ? styles.activeMobileLink : {})
              }}
            >
              <span style={styles.mobileNavIcon}>{link.icon}</span>
              {link.label}
            </Link>
          ))}
          
          {userRole && (
            <button 
              onClick={handleLogout}
              style={styles.mobileLogoutButton}
              disabled={isLoggingOut}
            >
              <span style={styles.mobileNavIcon}>🚪</span>
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    width: '100%',
    borderBottom: '1px solid #EDE8DC'
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '60px',
    '@media (max-width: 768px)': {
      display: 'none'
    }
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
  },
  logoLink: {
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    marginRight: '32px'
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#B17F59',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
  },
  navLink: {
    color: '#4A4A4A',
    textDecoration: 'none',
    padding: '0 16px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    fontSize: '15px',
    transition: 'color 0.2s',
    position: 'relative'
  },
  activeLink: {
    color: '#B17F59',
    fontWeight: '500',
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '100%',
      height: '3px',
      backgroundColor: '#B17F59'
    }
  },
  navIcon: {
    marginRight: '8px',
    fontSize: '16px'
  },
  authButtons: {
    display: 'flex',
    alignItems: 'center',
  },
  loginButton: {
    color: '#B17F59',
    textDecoration: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    fontWeight: '500',
    marginRight: '12px'
  },
  signupButton: {
    backgroundColor: '#A5B68D',
    color: 'white',
    textDecoration: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    fontWeight: '500'
  },
  userDropdownContainer: {
    position: 'relative'
  },
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#F8F7F4'
    }
  },
  userIcon: {
    fontSize: '18px',
    marginRight: '8px'
  },
  userName: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#4A4A4A'
  },
  dropdownArrow: {
    fontSize: '10px',
    marginLeft: '8px',
    color: '#767676'
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '8px',
    backgroundColor: '#ffffff',
    borderRadius: '4px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    border: '1px solid #EDE8DC',
    width: '200px',
    overflow: 'hidden'
  },
  userRoleInfo: {
    padding: '12px 16px',
    borderBottom: '1px solid #EDE8DC',
    fontSize: '14px',
    color: '#767676',
    fontWeight: '500'
  },
  logoutButton: {
    width: '100%',
    padding: '12px 16px',
    textAlign: 'left',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#B17F59',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    '&:hover': {
      backgroundColor: '#F8F7F4'
    }
  },
  
  // Mobile styles
  mobileMenuContainer: {
    display: 'none',
    '@media (max-width: 768px)': {
      display: 'block'
    }
  },
  mobileTopBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 16px',
    height: '60px',
    borderBottom: '1px solid #EDE8DC'
  },
  mobileLogoLink: {
    textDecoration: 'none'
  },
  mobileLogo: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#B17F59'
  },
  mobileUserProfile: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer'
  },
  mobileUserIcon: {
    fontSize: '18px',
    marginRight: '8px'
  },
  mobileUserName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#4A4A4A'
  },
  mobileLinkContainer: {
    padding: '8px 16px',
    display: 'flex',
    flexDirection: 'column'
  },
  mobileLink: {
    color: '#4A4A4A',
    textDecoration: 'none',
    padding: '12px 8px',
    fontSize: '15px',
    display: 'flex',
    alignItems: 'center',
    borderBottom: '1px solid #F1F0EB'
  },
  activeMobileLink: {
    color: '#B17F59',
    fontWeight: '500'
  },
  mobileNavIcon: {
    marginRight: '12px',
    fontSize: '18px'
  },
  mobileLogoutButton: {
    background: 'none',
    border: 'none',
    textAlign: 'left',
    padding: '12px 8px',
    fontSize: '15px',
    color: '#B17F59',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    marginTop: '8px'
  }
};

export default Navbar;