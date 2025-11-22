// src/components/CustomNavbar.js

import React, { useState, useEffect, useCallback } from 'react';
import { Nav, Container, Button, Offcanvas } from 'react-bootstrap'; 
import { useNavigate, useLocation, NavLink, useSearchParams } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; 
import { 
  ShieldLockFill, 
  BoxArrowRight, 
  GridFill, 
  PersonCircle, 
  List, 
  HouseDoorFill,
  PersonPlusFill,
  ChevronLeft,
  FileEarmarkPlus,
  KeyFill 
} from 'react-bootstrap-icons';

export default function CustomNavbar() {
  // === 1. HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP ===
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [user, setUser] = useState(null);
  const [agentData, setAgentData] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  
  const [isMobileNavVisible, setIsMobileNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  
  // --- Derived State (Safe to run after hooks) ---
  // Ensure paths are checked correctly
  const isCustomerDetailsPage = location.pathname.startsWith('/customer/') && location.pathname.split("/").length === 3;
  const isLedgerPage = location.pathname.startsWith('/ledger/');
  const isDashboardSelectedMode = location.pathname === '/dashboard' && searchParams.get('selected');
  const currentCustomerId = isCustomerDetailsPage ? location.pathname.split("/")[2] : null;
  // ------------------------

  // Function to fetch Firestore data
  const fetchAgentData = useCallback(async (currentUser) => {
    if (!currentUser) return;
    try {
        const docRef = doc(db, "agents", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            setAgentData(docSnap.data());
        }
    } catch (error) {
        console.error("Error fetching agent data for navbar:", error);
    }
  }, []);

  // Auth State Effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchAgentData(currentUser);
      } else {
        setAgentData(null);
      }
    });
    return () => unsubscribe();
  }, [fetchAgentData]); 

  // Scroll Effect
  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        if (window.scrollY > lastScrollY && window.scrollY > 100) {
          setIsMobileNavVisible(false);
        } else {
          setIsMobileNavVisible(true);
        }
        setLastScrollY(window.scrollY);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', controlNavbar);
      return () => {
        window.removeEventListener('scroll', controlNavbar);
      };
    }
  }, [lastScrollY]);
  
  // === 2. CONDITIONAL RETURN (Must be placed AFTER all Hooks) ===
  // CHECK: Navbar should be hidden on Landing, Login, and Signup pages
  if (location.pathname === '/' || location.pathname === '/signup' || location.pathname === '/login') { 
    return null; 
  }
  // =============================================================

  const handleLogout = async () => {
    await signOut(auth);
    setShowMenu(false); 
    navigate("/");
  };

  const handleNav = (path) => {
    navigate(path);
    setShowMenu(false);
  };
  
  const handleBackToList = () => {
    setSearchParams({}); 
  };

  const handleOpenAddModal = () => {
    navigate('/dashboard', { state: { openAddModal: true } });
  };

  const handleTriggerPolicyModal = () => {
    window.dispatchEvent(new Event('openAddPolicyModal'));
  };

  // Variables for easy access to profile data
  const userDisplayName = user?.displayName || agentData?.name || "Agent";
  const userEmail = user?.email || "N/A";
  const userAgentCode = agentData?.agentCode || "NA-001";
  const userPhotoURL = agentData?.photoURL || null; // Fetched from Firestore
  const userInitial = userDisplayName.charAt(0).toUpperCase();


  return (
    <>
      {/* ================= NEW DESKTOP COMMAND BAR (SIDE DOCK) ================= */}
      <nav className="d-none d-lg-flex zenith-command-bar">
        {/* Top Section: Agent Profile */}
        <div className="agent-profile-dock-header">
            <NavLink to="/profile" className="profile-link-desktop" title={userDisplayName}>
                <div 
                    className="profile-dock-avatar"
                    style={{ background: userPhotoURL ? 'transparent' : 'rgba(13, 110, 253, 0.1)' }}
                >
                    {userPhotoURL ? (
                        <img src={userPhotoURL} alt="Profile" className="w-100 h-100 object-fit-cover" />
                    ) : (
                        userInitial
                    )}
                </div>
            </NavLink>
             <div className="dock-separator"></div>
        </div>

        {/* Navigation Section */}
        <div className="zenith-command-bar-nav">
            <NavLink to="/dashboard" className={({ isActive }) => "zenith-nav-icon-link" + (isActive && !isDashboardSelectedMode ? " active" : "")} title="Dashboard">
              <HouseDoorFill size={20} />
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => "zenith-nav-icon-link" + (isActive ? " active" : "")} title="Profile">
              <PersonCircle size={20} />
            </NavLink>
            {/* UPDATED: Reports link added for desktop */}
            <NavLink to="/reports" className={({ isActive }) => "zenith-nav-icon-link" + (isActive ? " active" : "")} title="Reports">
              <GridFill size={20} />
            </NavLink>
            <button className="zenith-nav-icon-link" onClick={handleOpenAddModal} title="Add Customer">
                <PersonPlusFill size={20} />
            </button>
             <div className="dock-separator"></div>
            <button className="zenith-nav-icon-link logout-btn" onClick={handleLogout} title="Log Out">
              <BoxArrowRight size={20} />
            </button>
        </div>
      </nav>

      {/* ================= MOBILE NAVBAR (Bottom Dock) - UNCHANGED ================= */}
      <nav className={`d-lg-none zenith-navbar-mobile ${(!isMobileNavVisible || showMenu) ? 'hidden' : ''}`}>
        
        {/* 1. HOME BUTTON (Fix applied here) */}
        <NavLink 
          to="/dashboard" 
          onClick={(e) => {
              if (location.pathname === '/dashboard' && searchParams.get('selected')) {
                  e.preventDefault();
                  handleBackToList();
              }
          }} 
          className={({ isActive }) => "zenith-dock-item" + (isActive && !isCustomerDetailsPage && !isLedgerPage ? " active" : "")}
        >
          <HouseDoorFill className="icon" />
          <span>Home</span>
        </NavLink>
        
        {/* 2. BACK BUTTON (FIXED LOGIC) */}
        {(isCustomerDetailsPage || isDashboardSelectedMode || isLedgerPage) ? (
            <button 
              className="zenith-dock-item" 
              onClick={() => {
                if (isLedgerPage) {
                  navigate(-1); // Ledger -> Customer Details
                } 
                else if (isCustomerDetailsPage) {
                  // Customer Details -> Dashboard with selected customer (to maintain state)
                  navigate(`/dashboard?selected=${currentCustomerId}`); 
                } 
                else if (isDashboardSelectedMode) {
                  // Dashboard selected -> Dashboard full list (clears selection)
                  handleBackToList(); 
                }
              }}
            >
                <ChevronLeft className="icon" />
                <span>Back</span>
            </button>
        ) : (
            <button className="zenith-dock-item" onClick={handleOpenAddModal}>
                <PersonPlusFill className="icon" />
                <span>Add</span>
            </button>
        )}

        {/* 3. DYNAMIC BUTTON (Profile OR Add OR Policy) */}
        {(isDashboardSelectedMode || isCustomerDetailsPage || isLedgerPage) ? (
            // Agar Customer Details page par hain, toh "Add Policy" dikhao
            isCustomerDetailsPage ? (
              <button className="zenith-dock-item" onClick={handleTriggerPolicyModal}>
                  <FileEarmarkPlus className="icon" />
                  <span>Policy</span>
              </button>
            ) : (
              // Baki jagah normal "Add" button (Dashboard selection etc.)
              <button className="zenith-dock-item" onClick={handleOpenAddModal}>
                  <PersonPlusFill className="icon" />
                  <span>Add</span>
              </button>
            )
        ) : (
            // Main pages par Profile
            <NavLink 
              to="/profile" 
              className={({ isActive }) => "zenith-dock-item" + (isActive ? " active" : "")}
            >
              <PersonCircle className="icon" />
              <span>Profile</span>
            </NavLink>
        )}

        {/* 4. MORE BUTTON */}
        <button className="zenith-dock-item" onClick={() => setShowMenu(true)}>
          <List className="icon" />
          <span>More</span>
        </button>
      </nav>

      {/* ================= MOBILE OFFCANVAS (Menu) ================= */}
      <Offcanvas show={showMenu} onHide={() => setShowMenu(false)} placement="bottom" className="zenith-offcanvas">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title className="fw-bold d-flex align-items: center gap-2">
            <ShieldLockFill className="text-primary"/> Menu
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="d-flex flex-column justify-content-between">
          <Container>
            {/* UPDATED: Full Profile Display Card with Image/Initial Logic */}
            {user && (
              <div className="p-3 bg-light rounded-3 mb-4 d-flex align-items-center gap-3 border">
                <div 
                    className="user-avatar rounded-circle overflow-hidden d-flex align-items-center justify-content-center flex-shrink-0" 
                    style={{width: '55px', height: '55px', fontSize: '24px', backgroundColor: '#e9ecef'}}
                >
                  {/* LOGIC TO DISPLAY PROFILE PICTURE OR INITIAL */}
                  {userPhotoURL ? (
                      <img src={userPhotoURL} alt="Profile" className="w-100 h-100 object-fit-cover" />
                  ) : (
                      userInitial
                  )}
                </div>
                <div>
                  <h5 className="m-0 fw-bold">{userDisplayName}</h5>
                  <small className="text-muted d-flex align-items-center gap-1">
                    <KeyFill size={12}/> AGENT ID: {userAgentCode}
                  </small>
                  <small className="text-muted d-block">{userEmail}</small>
                </div>
              </div>
            )}
            
            <Nav className="flex-column gap-2">
              <Nav.Link onClick={() => handleNav('/dashboard')} className="fs-5 py-2 nav-hover d-flex align-items-center gap-3">
                <HouseDoorFill /> Dashboard
              </Nav.Link>
              <Nav.Link onClick={() => handleNav('/profile')} className="fs-5 py-2 nav-hover d-flex align-items-center gap-3">
                <PersonCircle /> My Profile 
              </Nav.Link>
              {/* UPDATED: Reports link added to mobile menu */}
              <Nav.Link onClick={() => handleNav('/reports')} className="fs-5 py-2 nav-hover d-flex align-items-center gap-3">
                <GridFill /> Reports
              </Nav.Link>
            </Nav>
          </Container>
          <Container className="mt-4 border-top pt-3">
            <Button variant="danger" size="lg" className="w-100 d-flex align-items-center justify-content-center gap-2 shadow-sm rounded-pill" onClick={handleLogout}>
              <BoxArrowRight /> Log Out
            </Button>
            <div className="text-center mt-3 text-muted small">PremiumLedger v1.0</div>
          </Container>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}