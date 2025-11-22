// src/components/CustomerDetails.js

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase'; 
import { doc, getDoc, collection, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Container, Card, Button, Modal, Form, Badge, Row, Col, Alert, InputGroup } from 'react-bootstrap'; 
import { 
  TelephoneFill, 
  GeoAltFill, 
  FileTextFill, 
  PlusLg, 
  PencilSquare, 
  Trash, 
  JournalCheck, 
  ExclamationTriangleFill, 
  CalendarEvent,
  ShieldCheck,
  CurrencyRupee, 
  Speedometer2,   
  CashCoin,
  InfoCircleFill,
  PersonCircle,
  Clock,
  ChatRightTextFill, 
  TelephoneOutboundFill, 
  EnvelopeAtFill, 
  StarFill 
} from 'react-bootstrap-icons';

// ===============================================
// NEW: Policy Health Status Helper
// ===============================================
const getPolicyHealth = (dueDateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Ignore time for comparison
    const dueDate = new Date(dueDateStr);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { variant: 'danger', text: 'Overdue', icon: 'ExclamationTriangleFill' };
    } else if (diffDays <= 7) {
        return { variant: 'warning', text: 'Due Soon', icon: 'ClockFill' };
    } else {
        return { variant: 'success', text: 'On Track', icon: 'CheckCircleFill' };
    }
};

// ===============================================
// MAIN COMPONENT
// ===============================================
export default function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [customer, setCustomer] = useState(null);
  const [policies, setPolicies] = useState([]);
  
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [formError, setFormError] = useState('');

  // UPDATED: Added sumAssured and notes to form data
  const [policyForm, setPolicyForm] = useState({
    policyNo: '', planName: '', premium: '', mode: 'Monthly', dueDate: '', sumAssured: '', notes: ''
  });

  // UPDATED: Fetch customer data and policies
  useEffect(() => {
    const fetchCustomer = async () => {
      const docRef = doc(db, "customers", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setCustomer(docSnap.data());
    };
    fetchCustomer();

    const policiesRef = collection(db, "customers", id, "policies");
    const q = query(policiesRef, orderBy("dueDate", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPolicies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [id]);

  const openAddModal = useCallback(() => {
    // UPDATED: Reset all fields including new ones
    setPolicyForm({ 
        policyNo: '', planName: '', premium: '', mode: 'Monthly', dueDate: '', sumAssured: '', notes: '' 
    });
    setEditId(null);
    setFormError('');
    setShowFormModal(true);
  }, []);

  useEffect(() => {
    const handleNavbarTrigger = () => openAddModal();
    window.addEventListener('openAddPolicyModal', handleNavbarTrigger);
    return () => window.removeEventListener('openAddPolicyModal', handleNavbarTrigger);
  }, [openAddModal]);

  const totalPremium = policies.reduce((sum, p) => sum + Number(p.premium), 0);

  const openEditModal = (policy) => {
    // UPDATED: Load all fields including new ones for editing
    setPolicyForm({
      policyNo: policy.policyNo,
      planName: policy.planName,
      premium: policy.premium,
      mode: policy.mode,
      dueDate: policy.dueDate,
      sumAssured: policy.sumAssured || '', // Default empty string if undefined
      notes: policy.notes || '' 
    });
    setEditId(policy.id);
    setFormError('');
    setShowFormModal(true);
  };

  const promptDelete = (policyId) => {
    setDeleteId(policyId);
    setShowDeleteModal(true);
  };

  const handleSavePolicy = async (e) => {
    e.preventDefault();
    if (!policyForm.policyNo || !policyForm.premium || !policyForm.dueDate) {
      setFormError("Policy No, Premium aur Due Date zaroori hain.");
      return;
    }

    try {
      const dataToSave = {
        ...policyForm,
        premium: Number(policyForm.premium),
        sumAssured: policyForm.sumAssured ? Number(policyForm.sumAssured) : 0, // Convert to number
        status: 'Active'
      };

      if (editId) {
        const docRef = doc(db, "customers", id, "policies", editId);
        await updateDoc(docRef, dataToSave);
      } else {
        await addDoc(collection(db, "customers", id, "policies"), {
          ...dataToSave,
          createdAt: new Date()
        });
      }
      setShowFormModal(false);
    } catch (err) {
      console.error("Error:", err);
      setFormError("Save karne mein dikkat aayi.");
    }
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await deleteDoc(doc(db, "customers", id, "policies", deleteId));
        setShowDeleteModal(false);
        setDeleteId(null);
      } catch (err) {
        console.error("Error deleting:", err);
      }
    }
  };

  if (!customer) return <div className="p-5 text-center text-muted fw-bold">Loading Profile...</div>;

  return (
    <>
      {/* MODIFIED: Relying on minimal CSS padding from App.css for zero scroll */}
      <Container className="details-page-container"> 
        
        {/* === 1. MODERN PROFILE CARD (FIXED TOP SECTION) === */}
        <Card className="customer-hero-card border-0 mb-4 overflow-hidden">
          <div className="hero-bg-pattern"></div>
          <Card.Body className="position-relative z-1 p-4">
            <Row className="align-items-center">
              <Col xs={12} md={8} className="d-flex flex-column flex-md-row align-items-center gap-3 gap-md-4 mb-4 mb-md-0 text-center text-md-start">
                
                <div className="profile-avatar-lg shadow-lg flex-shrink-0 overflow-hidden p-0 border-3 border-white">
                   {customer.photoURL ? (
                       <img 
                            src={customer.photoURL} 
                            alt={customer.name} 
                            className="w-100 h-100 object-fit-cover" 
                       />
                   ) : (
                       <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-transparent text-white">
                           {customer.name.charAt(0).toUpperCase()}
                       </div>
                   )}
                </div>
                
                <div className="w-100">
                  <h2 className="text-white fw-bold mb-2 mb-md-1">{customer.name}</h2>
                  <div className="d-flex flex-column flex-md-row align-items-center align-items-md-center gap-2 gap-md-4 text-white-50 small">
                    <span className="d-flex align-items-center gap-2 p-1 px-3 rounded-pill bg-white bg-opacity-10 border border-white border-opacity-25">
                      <TelephoneFill className="text-warning" /> {customer.phone}
                    </span>
                    {customer.address && (
                      <span className="d-flex align-items-center gap-2 p-1 px-3 rounded-pill bg-white bg-opacity-10 border border-white border-opacity-25">
                        <GeoAltFill className="text-info" /> {customer.address}
                      </span>
                    )}
                  </div>
                </div>
              </Col>
              
              <Col xs={12} md={4}>
                <div className="stats-glass-box p-3 rounded-4 d-flex justify-content-around align-items-center mt-2 mt-md-0">
                   <div className="text-center">
                      <div className="d-flex align-items-center justify-content-center gap-1 text-white-50 mb-1">
                        <Speedometer2 size={12}/>
                        <small className="fw-bold" style={{fontSize: '0.7rem'}}>POLICIES</small>
                      </div>
                      <h3 className="text-white m-0 fw-bold">{policies.length}</h3>
                   </div>
                   <div className="stats-separator"></div>
                   <div className="text-center">
                      <div className="d-flex align-items-center justify-content-center gap-1 text-white-50 mb-1">
                        <CashCoin size={12}/>
                        <small className="fw-bold" style={{fontSize: '0.7rem'}}>PREMIUM/MO</small>
                      </div>
                      <h3 className="text-white m-0 fw-bold d-flex align-items-center justify-content-center">
                        <CurrencyRupee size={18} /> {totalPremium.toLocaleString()}
                      </h3>
                   </div>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* === 2. CUSTOMER DETAILS AND PORTFOLIO SECTION === */}
        <Row className="g-2 g-md-4"> 
            
            {/* Left Column: Customer Info & Direct Actions (Updated) */}
            <Col lg={4}>
                <Card className="shadow-sm border-0 h-100">
                    <Card.Body className="p-3 p-md-4">
                        <h5 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3"><PersonCircle size={20} className='text-primary'/> Contact & Info</h5>
                        
                        {/* Direct Contact Buttons */}
                        <div className="d-flex gap-2 mb-4">
                            {/* NEW: Call Button */}
                            <Button 
                                href={`tel:${customer.phone}`} 
                                variant="outline-success" 
                                className="flex-grow-1 rounded-pill d-flex align-items-center justify-content-center gap-2 btn-hover-lift"
                                style={{padding: '0.5rem 1rem'}}
                            >
                                <TelephoneOutboundFill /> Call
                            </Button>
                            {/* NEW: Dummy Email Button (Since email is not saved on customer object in the provided file) */}
                            <Button 
                                href="mailto:customer@example.com"
                                variant="outline-info" 
                                className="flex-grow-1 rounded-pill d-flex align-items-center justify-content-center gap-2 btn-hover-lift"
                                style={{padding: '0.5rem 1rem'}}
                            >
                                <EnvelopeAtFill /> Email
                            </Button>
                        </div>

                        <div className="profile-detail-row border-0 px-0 bg-white py-1">
                            <TelephoneFill size={20} className="icon-wrapper text-muted" />
                            <div>
                                <small className="text-muted d-block">Phone</small>
                                <span className="fw-medium text-dark">+{customer.phone}</span>
                            </div>
                        </div>
                        
                        {customer.address && (
                            <div className="profile-detail-row border-0 px-0 bg-white py-1">
                                <GeoAltFill size={20} className="icon-wrapper text-muted" />
                                <div>
                                    <small className="text-muted d-block">Address</small>
                                    <span className="fw-medium text-dark">{customer.address}</span>
                                </div>
                            </div>
                        )}
                        
                        <div className="profile-detail-row border-0 px-0 bg-white py-1">
                            <CalendarEvent size={20} className="icon-wrapper text-muted" />
                            <div>
                                <small className="text-muted d-block">Client Since</small>
                                <span className="fw-medium text-dark">
                                    {customer.createdAt?.toDate()?.toLocaleDateString() || 'N/A'}
                                </span>
                            </div>
                        </div>

                    </Card.Body>
                </Card>
            </Col>
            
            {/* Right Column: Policies List (Main Focus on Mobile) */}
            <Col xs={12} lg={8}>
                
                {/* Policies Header */}
                <div className="d-flex justify-content-between align-items-end mb-3 px-1 mt-3 mt-lg-0">
                    <div>
                        <h5 className="text-uppercase text-muted fw-bold letter-spacing-1 mb-0" style={{fontSize: '0.85rem'}}>Portfolio</h5>
                        <h3 className="fw-bold text-dark m-0">Active Policies ({policies.length})</h3>
                    </div>
                    <Button variant="primary" onClick={openAddModal} className="d-none d-lg-flex align-items-center gap-2 rounded-pill px-4 shadow-sm btn-hover-lift">
                        <PlusLg /> Add Policy
                    </Button>
                </div>

                <Row className="g-2">
                    {policies.map(policy => {
                        const health = getPolicyHealth(policy.dueDate);
                        
                        let HealthIconComponent;
                        if (health.icon === 'ExclamationTriangleFill') HealthIconComponent = ExclamationTriangleFill;
                        else if (health.icon === 'ClockFill') HealthIconComponent = Clock;
                        else HealthIconComponent = ShieldCheck;

                        return (
                            <Col md={12} key={policy.id}>
                                <Card className="policy-card-modern h-100 border-0 shadow-sm">
                                    <div className={`status-strip bg-${health.variant}`}></div> 
                                    <Card.Body className="p-3 p-md-4 d-flex flex-column">
                                        
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div>
                                                <Badge bg="light" text="dark" className="border mb-1 fw-normal px-2 py-1 d-inline-flex align-items-center gap-1">
                                                    <InfoCircleFill className="text-primary"/> #{policy.policyNo}
                                                </Badge>
                                                <h5 className="fw-bold text-dark m-0">{policy.planName || 'Investment Plan'}</h5>
                                            </div>
                                            <div className="dropdown-action">
                                                <Button variant="light" size="sm" className="rounded-circle p-2" onClick={() => openEditModal(policy)}>
                                                    <PencilSquare className="text-muted"/>
                                                </Button>
                                            </div>
                                        </div>
                                        
                                        {/* Policy Details Grid (Updated) */}
                                        <div className="policy-details-grid mb-3">
                                            
                                            {/* Premium */}
                                            <div className="detail-item">
                                                <label>Premium (Mode)</label>
                                                <strong className="text-dark fs-6 d-flex align-items-center">
                                                    <CurrencyRupee size={12} />{Number(policy.premium).toLocaleString()}
                                                </strong>
                                                <small className='text-muted mt-1'>{policy.mode}</small>
                                            </div>
                                            
                                            {/* NEW: Sum Assured / Policy Value */}
                                            <div className="detail-item">
                                                <label>Policy Value</label>
                                                <strong className="text-dark fs-6 d-flex align-items-center">
                                                    <StarFill size={12} className='text-warning me-1' />
                                                    {Number(policy.sumAssured || 0).toLocaleString()}
                                                </strong>
                                            </div>

                                            <div className="detail-item full-width mt-1">
                                                <label>Next Due Date</label>
                                                <div className={`d-flex align-items-center gap-2 fw-bold text-${health.variant}`}>
                                                    <CalendarEvent /> {policy.dueDate}
                                                </div>
                                            </div>
                                            
                                            {/* Health Status Indicator */}
                                            <div className="detail-item full-width">
                                                <label>Health Status</label>
                                                <div className={`d-flex align-items-center gap-2 fw-bold text-${health.variant}`}>
                                                    <HealthIconComponent size={16} /> {health.text}
                                                </div>
                                            </div>
                                            
                                            {/* NEW: Policy Notes/Annotation */}
                                            {policy.notes && (
                                                <div className="detail-item full-width">
                                                    <label>Notes</label>
                                                    <div className="d-flex align-items-start gap-2 text-muted small">
                                                        <ChatRightTextFill size={14} className='mt-1 flex-shrink-0'/> 
                                                        <span style={{wordBreak: 'break-word'}}>{policy.notes}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-auto d-flex gap-2 customer-details-actions">
                                            <Button 
                                                variant="primary" 
                                                size="sm" // Smaller button for mobile fit
                                                className="flex-grow-1 rounded-pill d-flex align-items-center justify-content-center gap-2 btn-hover-lift"
                                                onClick={() => navigate(`/ledger/${id}/${policy.id}`)}
                                            >
                                                <JournalCheck /> Ledger
                                            </Button>
                                            <Button 
                                                variant="outline-danger" 
                                                className="rounded-circle p-2 d-flex align-items-center justify-content-center" 
                                                style={{width: '40px', height: '40px'}}
                                                onClick={() => promptDelete(policy.id)}
                                            >
                                                <Trash />
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        );
                    })}
                    
                    {policies.length === 0 && (
                        <Col xs={12}>
                            <div className="text-center py-5">
                                <div className="empty-state-container p-5 rounded-4 bg-white border border-dashed">
                                    <FileTextFill size={48} className="text-muted mb-3 opacity-50"/>
                                    <h5 className="fw-bold text-dark">No Policies Yet</h5>
                                    <p className="text-muted mb-4">Start by adding the first insurance policy for this customer.</p>
                                    <Button variant="outline-primary" onClick={openAddModal} className="rounded-pill px-4">
                                        Create Policy
                                    </Button>
                                </div>
                            </div>
                        </Col>
                    )}
                </Row>
            </Col>
        </Row>


        {/* === MODALS (Updated to include new fields) === */}
        <Modal show={showFormModal} onHide={() => setShowFormModal(false)} centered backdrop="static">
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="fw-bold h5">{editId ? 'Edit Policy Details' : 'New Policy'}</Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-3">
            {formError && <Alert variant="danger" className="py-2 small">{formError}</Alert>}
            <Form onSubmit={handleSavePolicy}>
              
              <Form.Group className="mb-3">
                <Form.Label className="small text-muted text-uppercase fw-bold">Policy Number</Form.Label>
                <Form.Control required type="text" placeholder="e.g. 123456789" className="fw-bold" value={policyForm.policyNo} onChange={e => setPolicyForm({...policyForm, policyNo: e.target.value})} />
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small">Plan Name</Form.Label>
                    <Form.Control type="text" value={policyForm.planName} placeholder='Jeevan Anand (Optional)' onChange={e => setPolicyForm({...policyForm, planName: e.target.value})} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small">Mode</Form.Label>
                    <Form.Select value={policyForm.mode} onChange={e => setPolicyForm({...policyForm, mode: e.target.value})}>
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Half-Yearly">Half-Yearly</option>
                      <option value="Yearly">Yearly</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                 <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small">Premium (₹)</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className='bg-white border-end-0 text-secondary'><CurrencyRupee /></InputGroup.Text>
                        <Form.Control required type="number" className="border-start-0 ps-0" value={policyForm.premium} onChange={e => setPolicyForm({...policyForm, premium: e.target.value})} />
                      </InputGroup>
                    </Form.Group>
                 </Col>
                 <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small">Sum Assured (₹)</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className='bg-white border-end-0 text-secondary'><StarFill /></InputGroup.Text>
                        <Form.Control type="number" className="border-start-0 ps-0" placeholder='0' value={policyForm.sumAssured} onChange={e => setPolicyForm({...policyForm, sumAssured: e.target.value})} />
                      </InputGroup>
                    </Form.Group>
                 </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label className="small">Next Due Date</Form.Label>
                <Form.Control required type="date" value={policyForm.dueDate} onChange={e => setPolicyForm({...policyForm, dueDate: e.target.value})} />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="small">Policy Notes (Optional)</Form.Label>
                <Form.Control 
                    as="textarea"
                    rows={2}
                    placeholder='E.g., Nominee: Wife, Rider: Term Life'
                    value={policyForm.notes} 
                    onChange={e => setPolicyForm({...policyForm, notes: e.target.value})} 
                />
              </Form.Group>
              
              <div className="d-grid gap-2">
                <Button variant="primary" size="lg" type="submit" className="rounded-pill shadow-sm btn-hover-lift">
                  {editId ? 'Save Changes' : 'Create Policy'}
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>

        {/* Delete Modal (Unchanged) */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered size="sm">
          <Modal.Body className="text-center p-4">
            <div className="text-danger mb-3">
               <ExclamationTriangleFill size={40} />
            </div>
            <h5 className="fw-bold mb-2">Delete Policy?</h5>
            <p className="text-muted small mb-4">This action cannot be undone. All ledger history for this policy will be lost.</p>
            <div className="d-grid gap-2">
              <Button variant="danger" onClick={confirmDelete} className="rounded-pill">Yes, Delete</Button>
              <Button variant="light" onClick={() => setShowDeleteModal(false)} className="rounded-pill">Cancel</Button>
            </div>
          </Modal.Body>
        </Modal>

      </Container>
    </>
  );
}