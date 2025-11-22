// src/components/Dashboard.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Container, Button, Modal, Form, Alert, InputGroup, ListGroup, Card, Row, Col, Spinner, Dropdown, Badge } from 'react-bootstrap'; 
import { 
  PersonPlusFill, 
  Trash, 
  ExclamationTriangleFill,
  Search,
  TelephoneFill,
  GeoAltFill,
  ChevronRight,
  ShieldLockFill,
  CreditCard2Front, 
  PersonGear,
  CameraFill,
  SortAlphaDown,
  PeopleFill, 
  ClipboardData, 
  Clock, 
  CurrencyRupee,
  CalendarEvent,
  JournalCheck,
  ArrowRight
} from 'react-bootstrap-icons'; 

// ====================================================================
// CLOUDINARY CONFIGURATION
// ====================================================================
const CLOUD_NAME = process.env.REACT_APP_CLOUD_NAME;
const UPLOAD_PRESET = process.env.REACT_APP_UPLOAD_PRESET;
const CLOUDINARY_URL = CLOUD_NAME 
    ? `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload` 
    : null;

// ===============================================
// Policy Health Status Helper (for Dashboard Analytics)
// ===============================================
const getPolicyHealth = (dueDateStr) => {
    if (!dueDateStr) return 'onTrack';

    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const dueDate = new Date(dueDateStr);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return 'overdue'; // Danger
    } else if (diffDays <= 7) {
        return 'dueSoon'; // Warning
    } else {
        return 'onTrack'; // Success
    }
};

// ===============================================
// ADVANCED FEATURE 1: Dashboard Analytics Hook
// ===============================================
const useDashboardAnalytics = (customers) => {
    const [analytics, setAnalytics] = useState({
        totalPolicies: 0,
        dueSoonCount: 0,
        overdueCount: 0,
        totalAnnualPremium: 0,
    });

    useEffect(() => {
        let policies = 0;
        let dueSoon = 0;
        let overdue = 0;
        let annualPremium = 0;
        
        const policiesRefPromises = customers.map(async (customer) => {
            const customerPoliciesRef = collection(db, "customers", customer.id, "policies");
            const policiesSnapshot = await getDocs(query(customerPoliciesRef));
            
            policiesSnapshot.docs.forEach(policyDoc => {
                const policy = policyDoc.data();
                const premium = Number(policy.premium || 0);

                policies++;
                annualPremium += premium * (policy.mode === 'Monthly' ? 12 : policy.mode === 'Quarterly' ? 4 : policy.mode === 'Half-Yearly' ? 2 : 1);
                
                const health = getPolicyHealth(policy.dueDate);

                if (health === 'dueSoon') {
                    dueSoon++;
                } else if (health === 'overdue') {
                    overdue++;
                }
            });
        });

        Promise.all(policiesRefPromises).then(() => {
            setAnalytics({
                totalPolicies: policies,
                dueSoonCount: dueSoon,
                overdueCount: overdue,
                totalAnnualPremium: annualPremium,
            });
        });

    }, [customers]); 

    return analytics;
};
// ===============================================

// ===============================================
// ADVANCED FEATURE 3: Activity Log Preview Component
// ===============================================
const ActivityLogPreview = ({ customerId, navigate }) => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        // Find ALL policies for this customer
        const fetchRecentPayments = async () => {
            const policiesRef = collection(db, "customers", customerId, "policies");
            const policiesSnapshot = await getDocs(policiesRef);
            
            let allRecentPayments = [];
            
            // Iterate through each policy to get its recent payments
            for (const policyDoc of policiesSnapshot.docs) {
                const paymentsRef = collection(db, "customers", customerId, "policies", policyDoc.id, "payments");
                const q = query(paymentsRef, orderBy("date", "desc"), limit(1)); // Get the last payment for each policy
                const paymentsSnapshot = await getDocs(q);
                
                paymentsSnapshot.docs.forEach(paymentDoc => {
                    const data = paymentDoc.data();
                    allRecentPayments.push({
                        ...data,
                        policyName: policyDoc.data().planName || policyDoc.data().policyNo,
                        policyId: policyDoc.id,
                        // Ensure date is a Date object if saved as ISO string, or use .toDate() if using server timestamp
                        date: data.date?.toDate ? data.date.toDate() : (data.date ? new Date(data.date) : new Date(0)) 
                    });
                });
            }
            
            // Sort all recent payments together by date and take top 5
            allRecentPayments.sort((a, b) => b.date - a.date);
            setPayments(allRecentPayments.slice(0, 5));
            setLoading(false);
        };
        
        fetchRecentPayments();
    }, [customerId]);

    return (
        <Card className='p-4 shadow-sm border-0 mt-4'>
            <h5 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3"><JournalCheck size={20} className='text-info'/> Recent Ledger Activity</h5>
            
            {loading ? (
                <div className='text-center'><Spinner animation='border' size='sm' variant='info'/></div>
            ) : payments.length > 0 ? (
                <ListGroup variant="flush">
                    {payments.map((payment, index) => (
                        <ListGroup.Item key={index} className='d-flex justify-content-between align-items-center small p-2 border-0 border-bottom'>
                            <div>
                                <span className='fw-bold text-dark d-block'>₹{Number(payment.amount).toLocaleString()} Paid</span>
                                <small className='text-muted'>{payment.policyName}</small>
                            </div>
                            <small className='text-success fw-bold d-flex align-items-center gap-1'>
                                <CalendarEvent size={12}/> {new Date(payment.date).toLocaleDateString()}
                            </small>
                        </ListGroup.Item>
                    ))}
                    <div className='text-end mt-2'>
                        <Button variant='link' size='sm' className='text-primary fw-bold p-0 d-flex align-items-center gap-1 float-end' onClick={() => navigate(`/customer/${customerId}`)}>
                             View Full Portfolio <ArrowRight size={14}/>
                        </Button>
                    </div>
                </ListGroup>
            ) : (
                <div className='text-center text-muted small p-3'>
                    No recent payments recorded for this client.
                </div>
            )}
        </Card>
    );
};
// ===============================================


// ====================================================================
// Customer List Item Component (Refined Styling + Status Tag)
// ====================================================================
const CustomerListItem = React.memo(({ customer, selectedCustomerId, handleSelectCustomer }) => {
  const isActive = selectedCustomerId === customer.id;
  
  const initial = customer?.name?.charAt(0)?.toUpperCase() || 'C'; 
  const policyCount = customer?.policyCount ?? 0;
  const totalPremium = customer?.totalPremium ?? 0;
  
  // Advanced Feature 2: Status Tags Logic
  const isHighValue = totalPremium > 50000; 
  const isNew = customer.createdAt && (new Date() - customer.createdAt.toDate()) / (1000 * 60 * 60 * 24) < 30; 

  return (
    <ListGroup.Item 
      key={customer.id} 
      className={`customer-list-item border-0 border-bottom py-3 ${isActive ? 'active' : 'hover-bg-gray'}`}
      onClick={() => handleSelectCustomer(customer.id)}
    >
      <div className="d-flex align-items-center gap-3">
        {/* Refined Initial/Photo Circle Styling */}
        <div className={`rounded-circle d-flex align-items-center justify-content-center fw-bold text-white overflow-hidden border`} 
             style={{width:'40px', height:'40px', fontSize:'1.1rem', backgroundColor: isActive ? '#fff' : 'var(--primary-color)'}}
        >
          {customer?.photoURL ? (
            <img src={customer.photoURL} alt="C" className="w-100 h-100 object-fit-cover" />
          ) : (
            <span style={{color: isActive ? 'var(--primary-color)' : '#fff'}}>
              {initial}
            </span>
          )}
        </div>
        <div className='d-flex flex-column text-truncate' style={{maxWidth: '180px'}}>
          {/* Customer Name + Status Tags */}
          <div className="fw-bold mb-0 text-truncate d-flex align-items-center gap-2">
              <span className='text-truncate'>{customer.name}</span>
              {isHighValue && <Badge pill bg="success" className="small fw-normal px-2">Value</Badge>}
              {isNew && !isHighValue && <Badge pill bg="info" className="small fw-normal px-2">New</Badge>}
          </div>
          <small className={isActive ? 'text-white-50' : 'text-muted'}>
            {policyCount} Policies | ₹{totalPremium.toLocaleString()}
          </small>
        </div>
      </div>
      <ChevronRight size={14} className={isActive ? 'text-white' : 'text-muted'} />
    </ListGroup.Item>
  );
});


// --- Focus Panel Content (Dynamic Content) ---
const FocusPaneContent = ({ customer, onEdit, onDelete, onNavigate, analytics, customerId }) => {
  
  // Advanced Feature 2: Content when NO customer is selected
  if (!customer) {
    const totalPolicies = analytics.totalPolicies || 0;
    const onTrack = totalPolicies - analytics.overdueCount - analytics.dueSoonCount;
    const onTrackPercent = totalPolicies > 0 ? ((onTrack / totalPolicies) * 100).toFixed(0) : 0;
    
    return (
      <div className="focus-pane-placeholder d-flex flex-column align-items-center justify-content-center h-100 text-muted p-4"> 
        <Card className="p-4 w-100 shadow-lg border-0 bg-light" style={{maxWidth: '500px'}}>
            <div className="text-center mb-4">
                <ShieldLockFill size={40} className="text-primary mb-3 opacity-75" />
                <h4 className="fw-bold text-dark">Zenith Command Center</h4>
                <p className="small text-muted">Select a client from the list or view quick insights below.</p>
            </div>

            {/* Policy Health Summary (Advanced Insight) */}
            <h6 className="fw-bold text-uppercase small text-primary mb-3">Policy Health Summary</h6>
            <div className="d-flex justify-content-between align-items-center mb-3">
                 <span className='fw-bold text-success'>On Track</span>
                 <h4 className='fw-bolder text-success m-0'>{onTrackPercent}%</h4>
            </div>
            <div className="progress mb-4" role="progressbar" style={{ height: '8px' }}>
                <div className="progress-bar bg-success" style={{ width: `${onTrackPercent}%` }}></div>
            </div>

            <div className="d-flex justify-content-between align-items-center small">
                <div className='d-flex align-items-center gap-2 text-warning fw-bold'>
                    <Clock size={16}/> Due Soon: {analytics.dueSoonCount}
                </div>
                <div className='d-flex align-items-center gap-2 text-danger fw-bold'>
                    <ExclamationTriangleFill size={16}/> Overdue: {analytics.overdueCount}
                </div>
            </div>

             <div className="d-grid mt-4">
                 <Button variant="primary" className="rounded-pill py-2 btn-hover-lift" onClick={onEdit}>
                    <PersonPlusFill className='me-2'/> Add New Client
                 </Button>
             </div>
        </Card>
      </div>
    );
  }
  
  // Content when customer IS selected
  const customerName = customer.name || 'N/A';
  const customerPhone = customer.phone || 'N/A';
  const customerAddress = customer.address || null;
  const customerPhotoURL = customer.photoURL || null;
  const customerInitial = customerName.charAt(0).toUpperCase();

  return (
    <div className="focus-pane-content h-100 d-flex flex-column">
      <div className="p-3 p-md-0 mt-2 mt-md-0"> 
        
        {/* === HERO PROFILE CARD (Modern) === */}
        <Card className="customer-hero-card border-0 mb-4 overflow-hidden shadow-lg">
          <div className="hero-bg-pattern"></div>
          <Card.Body className="position-relative z-1 p-4 text-center text-md-start">
            <Row className="align-items-center">
                <Col xs={12} md={8} className='d-flex flex-column flex-md-row align-items-center gap-3'>
                    {/* Profile Avatar Logic */}
                    <div className="profile-avatar-lg shadow-lg mb-2 mb-md-0 flex-shrink-0 overflow-hidden p-0 border-3 border-white">
                        {customerPhotoURL ? (
                            <img src={customerPhotoURL} alt={customerName} className="w-100 h-100 object-fit-cover" />
                        ) : (
                            <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-transparent text-white">
                                {customerInitial}
                            </div>
                        )}
                    </div>
                    
                    <div className="w-100">
                        <h2 className="text-white fw-bold mb-1">{customerName}</h2>
                        <span className="d-inline-flex align-items-center justify-content-center gap-2 px-3 py-1 rounded-pill bg-white bg-opacity-10 border border-white border-opacity-10 text-white small">
                            <TelephoneFill className="text-warning" /> {customerPhone}
                        </span>
                    </div>
                </Col>
                <Col xs={12} md={4} className='mt-3 mt-md-0'>
                    <div className="stats-glass-box p-3 rounded-4">
                        <div className='text-center'>
                            <p className='text-white-50 small mb-1'>Total Premium (Monthly)</p>
                            <h4 className='text-white fw-bold m-0'>₹{customer.totalPremium ? customer.totalPremium.toLocaleString() : 0}</h4>
                        </div>
                    </div>
                </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* === CUSTOMER DETAILS & ACTIONS === */}
        <Card className="shadow-sm border-0 mb-4">
            <Card.Body>
                <h5 className="fw-bold mb-3 text-primary">Contact & Address</h5>
                <Row className="g-3 small">
                    <Col xs={12} className='d-flex align-items-center gap-2'>
                        <TelephoneFill className="text-muted" size={16} /> 
                        <span className='fw-medium'>{customerPhone}</span>
                    </Col>
                    {customerAddress && (
                        <Col xs={12} className='d-flex align-items-start gap-2'>
                            <GeoAltFill className="text-muted mt-1" size={16} /> 
                            <span className='fw-medium'>{customerAddress}</span>
                        </Col>
                    )}
                    <Col xs={12} className='mt-4'>
                        <h5 className="fw-bold mb-2 text-primary">Policy Summary</h5>
                        <div className="d-flex justify-content-between">
                            <span className="text-muted">Active Policies:</span>
                            <span className="fw-bold text-dark">{customer.policyCount || 0}</span>
                        </div>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
        
        {/* Advanced Feature 3: Activity Log Preview */}
        <ActivityLogPreview customerId={customerId} navigate={onNavigate} />


        {/* === ACTION BUTTONS (Refined - Grouped in Card) === */}
        <div className="d-grid gap-3 action-center-card mt-4">
          <Button 
            variant="primary" 
            size="lg" 
            className="rounded-pill shadow-sm py-3 d-flex align-items-center justify-content-center gap-2 btn-hover-lift" 
            onClick={() => onNavigate(`/customer/${customerId}`)}
          >
            <CreditCard2Front size={22} /> 
            <span className="fw-bold">View & Manage Policies</span>
          </Button>

          <div className="d-flex gap-3">
            <Button 
              variant="outline-secondary" 
              className="flex-grow-1 rounded-pill py-2 d-flex align-items-center justify-content-center gap-2 btn-hover-lift"
              onClick={() => onEdit(customer)}
            >
              <PersonGear /> Edit Profile
            </Button>
            <Button 
              variant="outline-danger" 
              className="rounded-pill px-4 d-flex align-items-center justify-content-center btn-hover-lift"
              onClick={() => onDelete(customer.id)}
            >
              <Trash />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- Main Dashboard Component ---
export default function Dashboard() {
  const [customers, setCustomers] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentId, setCurrentId] = useState(null); 
  const [deleteId, setDeleteId] = useState(null);   
  
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [imageFile, setImageFile] = useState(null); 
  const [uploading, setUploading] = useState(false); 
  
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name'); 

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCustomerId = searchParams.get('selected'); 

  const navigate = useNavigate();
  const location = useLocation();

  // Advanced Feature 1: Real-time Analytics Hook
  const analytics = useDashboardAnalytics(customers);

  const handleSelectCustomer = (id) => {
    if(id) setSearchParams({ selected: id });
    else setSearchParams({});
  };

  // Function to get policy summary for a customer (Unchanged logic)
  const getPolicySummary = useCallback(async (customerId) => {
    const policiesRef = collection(db, "customers", customerId, "policies");
    const policiesSnapshot = await getDocs(query(policiesRef));
    
    const policyCount = policiesSnapshot.size;
    
    const totalPremium = policiesSnapshot.docs.reduce((sum, doc) => {
        const policy = doc.data();
        return sum + Number(policy.premium || 0);
    }, 0);

    return { policyCount, totalPremium };
  }, []);


  // UPDATED: Fetch customers with policy summary (Unchanged logic)
  useEffect(() => {
    // Ordering by createdAt is safe and avoids the error related to initial render/data structure issues.
    const q = query(collection(db, "customers"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const customersDataPromises = snapshot.docs.map(async (doc) => {
        // Safe access to data and providing default object structure
        const customer = { id: doc.id, ...doc.data() }; 
        const summary = await getPolicySummary(customer.id);
        return { ...customer, ...summary };
      });
      
      const customersWithSummary = await Promise.all(customersDataPromises);
      setCustomers(customersWithSummary);
    }, (error) => {
      console.error("Firestore Error:", error);
    });
    
    return () => unsubscribe();
  }, [getPolicySummary]);

  const openAddModal = useCallback(() => {
    setFormData({ name: '', phone: '', address: '' });
    setImageFile(null);
    setCurrentId(null);
    setShowFormModal(true);
    setError('');
  }, []); 

  useEffect(() => {
    if (location.state?.openAddModal) {
      openAddModal();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate, openAddModal]);

  const openEditModal = (customer) => {
    setFormData({ 
        name: customer.name, 
        phone: customer.phone, 
        address: customer.address,
        photoURL: customer.photoURL
    });
    setImageFile(null);
    setCurrentId(customer.id);
    setShowFormModal(true);
    setError('');
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      setError("Name and Phone are required.");
      return;
    }
    
    // Cloudinary variables are now defined globally in this component's top scope
    if (!CLOUD_NAME || !UPLOAD_PRESET || !CLOUDINARY_URL) {
      setError("Configuration Error: Cloudinary settings missing. Please check your environment variables.");
      return;
    }

    setUploading(true); 
    let photoURL = formData.photoURL || ""; 
    
    try {
      if (imageFile) {
        const formDataPayload = new FormData(); 
        formDataPayload.append("file", imageFile); 
        formDataPayload.append("upload_preset", UPLOAD_PRESET); 

        const response = await fetch(CLOUDINARY_URL, {
          method: 'POST',
          body: formDataPayload,
        });
        
        const data = await response.json();
        
        if (response.ok && data.secure_url) {
           photoURL = data.secure_url;
        } else {
           throw new Error(data.error?.message || "Cloudinary upload failed.");
        }
      }

      const dataToSave = { 
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
      };
      
      if (photoURL) {
        dataToSave.photoURL = photoURL; 
      } 
      
      if (currentId) {
        const docRef = doc(db, "customers", currentId);
        await updateDoc(docRef, dataToSave);
      } else {
        await addDoc(collection(db, "customers"), {
          ...dataToSave,
          createdAt: new Date()
        });
      }
      setShowFormModal(false);

    } catch (err) {
      console.error("Error saving data or uploading image:", err);
      setError(`Error: ${err.message || 'Something went wrong with upload. Check console for details.'}`);
    }
    
    setUploading(false);
  };

  const promptDelete = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
    handleSelectCustomer(null); 
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await deleteDoc(doc(db, "customers", deleteId));
        setShowDeleteModal(false);
        setDeleteId(null);
      } catch (err) {
        console.error("Error deleting:", err);
      }
    }
  };

  // Filtering and Sorting Logic (Unchanged)
  const filteredAndSortedCustomers = useMemo(() => {
    let filtered = customers.filter(c => 
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (c.phone && c.phone.includes(searchQuery))
    );

    switch (sortBy) {
        case 'name':
            filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            break;
        case 'newest':
            filtered.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
            break;
        case 'policies':
            filtered.sort((a, b) => (b.policyCount || 0) - (a.policyCount || 0));
            break;
        default:
            filtered.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
    }
    return filtered;
  }, [customers, searchQuery, sortBy]);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  return (
    <>
      {/* Mobile Header (Fixed Top) */}
      {!selectedCustomerId && (
        <div className="dashboard-mobile-header d-lg-none d-flex align-items-center justify-content-between px-3 shadow-sm bg-white border-0" style={{ height: '60px', position: 'sticky', top: 0, zIndex: 1020 }}>
          <div className="d-flex align-items-center gap-2">
            <div className="bg-primary bg-opacity-10 p-2 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
              <ShieldLockFill size={20} className="text-primary" />
            </div>
            <span className="brand-text-dark fs-5 fw-bold" style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.5px', color: '#0d6efd' }}>
              PremiumLedger
            </span>
          </div>
        </div>
      )}

      <Container className="dashboard-container mt-lg-4"> 
        
        <Row className={`dashboard-layout ${selectedCustomerId ? 'focus-active' : ''}`}>
          
          {/* --- 1. Customer Lane (List) --- */}
          <Col md={4} lg={3} className="customer-lane">
            
            {/* Advanced Feature 2: Zenith Insight Panel (Sticky top on desktop) */}
            <div className="p-3 bg-white border-bottom shadow-sm dashboard-insight-panel dashboard-action-sticky">
                <p className='fw-bold text-uppercase small text-muted mb-2 border-bottom pb-2'>Zenith Insight</p>
                <Row className='small text-center'>
                    <Col xs={4}>
                        <h5 className='fw-bolder text-primary mb-0'>{customers.length.toLocaleString()}</h5>
                        <small className='text-muted d-flex align-items-center justify-content-center gap-1'><PeopleFill size={12}/> Clients</small>
                    </Col>
                     <Col xs={4}>
                        <h5 className='fw-bolder text-info mb-0'>{analytics.totalPolicies.toLocaleString()}</h5>
                        <small className='text-muted d-flex align-items-center justify-content-center gap-1'><ClipboardData size={12}/> Policies</small>
                    </Col>
                     <Col xs={4}>
                        <h5 className='fw-bolder text-success mb-0'>₹{(analytics.totalAnnualPremium / 100000).toFixed(1)}L</h5>
                        <small className='text-muted d-flex align-items-center justify-content-center gap-1'><CurrencyRupee size={12}/> Annual Est.</small>
                    </Col>
                </Row>
            </div>
            
            {/* Advanced Feature 1: Predictive Task List (Sticky Bar) */}
            {(analytics.overdueCount > 0 || analytics.dueSoonCount > 0) && (
                 <div className="p-3 bg-light border-bottom shadow-sm dashboard-action-items dashboard-action-sticky" style={{top: '80px'}}>
                    <p className='fw-bold text-uppercase small text-danger mb-2 border-bottom pb-2'>Immediate Action Items</p>
                    <div className='d-flex flex-column gap-2 small'>
                        {analytics.overdueCount > 0 && (
                            <div className='d-flex align-items-center gap-2 fw-bold text-danger'>
                                <ExclamationTriangleFill size={14}/> {analytics.overdueCount} Policies are Overdue
                            </div>
                        )}
                        {analytics.dueSoonCount > 0 && (
                            <div className='d-flex align-items-center gap-2 fw-bold text-warning'>
                                <Clock size={14}/> {analytics.dueSoonCount} Policies Due This Week
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            <div className="customer-lane-header border-top-0">
              
              {/* Filter and Sort Bar */}
              <div className='d-flex justify-content-between align-items-center'>
                <h5 className='fw-bold text-dark m-0'>Clients List</h5>
                <Dropdown onSelect={(key) => setSortBy(key)}>
                  <Dropdown.Toggle variant="light" className='rounded-pill btn-sm d-flex align-items-center gap-1' id="dropdown-basic">
                    <SortAlphaDown size={14}/> Sort
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item eventKey="newest">Newest</Dropdown.Item>
                    <Dropdown.Item eventKey="name">Name (A-Z)</Dropdown.Item>
                    <Dropdown.Item eventKey="policies">Total Policies</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>

              {/* Search Input (Refined) */}
              <InputGroup className="customer-search shadow-sm">
                <InputGroup.Text className="bg-white border-end-0"><Search className="text-muted"/></InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by name or phone..."
                  className="border-start-0 ps-0"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </InputGroup>
              
              {/* Desktop Add Button (Refined) */}
              <Button 
                variant="primary" 
                onClick={openAddModal} 
                className="d-none d-lg-flex align-items-center justify-content-center gap-2 btn-add-customer-desktop rounded-pill shadow-sm btn-hover-lift"
              >
                <PersonPlusFill /> New Customer
              </Button>
            </div>
            
            <ListGroup variant="flush" className="customer-list">
              {filteredAndSortedCustomers.map(customer => (
                customer && customer.id ? (
                    <CustomerListItem
                        key={customer.id}
                        customer={customer}
                        selectedCustomerId={selectedCustomerId}
                        handleSelectCustomer={handleSelectCustomer}
                    />
                ) : null
              ))}
              
              {customers.length === 0 && (
                 <div className="text-center text-muted p-5 mt-5">
                    <PersonPlusFill size={30} className="mb-3 opacity-50"/>
                    <p>No customers yet.</p>
                 </div>
              )}
            </ListGroup>
          </Col>
          
          {/* --- 2. Focus Panel (Details / Dynamic Insight) --- */}
          <Col md={8} lg={9} className="focus-pane p-0">
            <FocusPaneContent
              customer={selectedCustomer}
              onEdit={openEditModal} 
              onDelete={promptDelete}
              onNavigate={navigate}
              analytics={analytics}
              customerId={selectedCustomerId} 
            />
          </Col>

        </Row>
      </Container>
      
      {/* --- Modals (Refined) --- */}
      <Modal show={showFormModal} onHide={() => setShowFormModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">{currentId ? 'Edit Customer Profile' : 'Add New Customer'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSaveCustomer}>
            
            {/* Image Upload Input */}
            <div className="mb-4 text-center">
                <Form.Label htmlFor="image-upload" className="cursor-pointer">
                    <div className="d-inline-block position-relative">
                        <div className="bg-light rounded-circle d-flex align-items-center justify-content-center border" style={{width: '80px', height: '80px'}}>
                           {imageFile ? (
                               <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-100 h-100 rounded-circle object-fit-cover" />
                           ) : (
                               formData.photoURL ? (
                                   <img src={formData.photoURL} alt="Existing" className="w-100 h-100 rounded-circle object-fit-cover" />
                               ) : (
                                 <CameraFill size={30} className="text-secondary" />
                               )
                           )}
                        </div>
                        <div className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle p-1 d-flex align-items-center justify-content-center" style={{width:'24px', height:'24px'}}>
                            <PersonPlusFill size={12} />
                        </div>
                    </div>
                    <div className="small text-primary mt-2 fw-bold">Upload Photo</div>
                </Form.Label>
                <Form.Control 
                    id="image-upload" 
                    type="file" 
                    accept="image/*" 
                    className="d-none"
                    onChange={(e) => setImageFile(e.target.files[0])}
                />
            </div>

            <Form.Group className="mb-3">
              <Form.Label className="small text-muted text-uppercase fw-bold">Full Name</Form.Label>
              <Form.Control 
                type="text" 
                value={formData.name}
                placeholder="e.g. Amit Sharma"
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="fw-bold"
                required
              />
            </Form.Group>
            
            {/* Phone Input (Refined with InputGroup) */}
            <Form.Group className="mb-3">
              <Form.Label className="small text-muted text-uppercase fw-bold">Phone Number</Form.Label>
              <InputGroup>
                 <InputGroup.Text className='bg-light border-end-0'><TelephoneFill className='text-primary'/></InputGroup.Text>
                 <Form.Control 
                    type="tel" 
                    value={formData.phone}
                    placeholder="10-digit mobile number"
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                 />
              </InputGroup>
            </Form.Group>
            
            {/* Address Input (Refined with InputGroup) */}
            <Form.Group className="mb-4">
              <Form.Label className="small text-muted text-uppercase fw-bold">Address</Form.Label>
              <InputGroup>
                 <InputGroup.Text className='bg-light border-end-0'><GeoAltFill className='text-primary'/></InputGroup.Text>
                 <Form.Control 
                    as="textarea"
                    rows={2} 
                    value={formData.address}
                    placeholder="House No, Street, City..."
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                 />
              </InputGroup>
            </Form.Group>
            
            <div className="d-grid">
              <Button variant="primary" type="submit" className="rounded-pill py-2 shadow-sm btn-hover-lift" disabled={uploading}>
                {uploading ? <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/> Saving...</> : (currentId ? 'Update Customer' : 'Create Customer')}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered size="sm">
        <Modal.Header closeButton className="bg-danger text-white border-0">
          <Modal.Title className="d-flex align-items-center gap-2 fs-6">
            <ExclamationTriangleFill /> Confirm Delete
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          <p className="text-muted mb-4">
            Are you sure? This will permanently delete the customer and all their policies.
          </p>
          <div className="d-flex justify-content-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowDeleteModal(false)} className='rounded-pill'>Cancel</Button>
            <Button variant="danger" size="sm" onClick={confirmDelete} className='rounded-pill'>Delete Permanently</Button>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}