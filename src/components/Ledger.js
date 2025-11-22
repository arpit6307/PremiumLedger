// src/components/Ledger.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; 
import { db } from '../firebase';
import { doc, getDoc, collection, addDoc, onSnapshot, query, orderBy, deleteDoc, updateDoc, getDocs } from 'firebase/firestore'; // FIXED: getDocs इंपोर्ट किया गया
import { 
  Wallet2, 
  ClockHistory, 
  CheckCircleFill, 
  ArrowRepeat,
  CurrencyRupee,
  FileText,
  CashCoin,
  CalendarEvent,
  PencilSquare,
  Trash,
  ExclamationTriangleFill
} from 'react-bootstrap-icons';
import { Container, Card, Button, Form, ProgressBar, Badge, Row, Col, Nav, Tab, InputGroup, Modal, Alert, Spinner } from 'react-bootstrap'; 

// Utility function to format date for input[type="date"]
const getFormattedDate = (date) => {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
};

export default function Ledger() {
  const { customerId, policyId } = useParams();

  const [policy, setPolicy] = useState(null);
  const [payments, setPayments] = useState([]);
  
  // States for new features
  const [paymentForm, setPaymentForm] = useState({ 
      amount: '', 
      date: getFormattedDate(new Date()),
      note: ''
  });
  const [editId, setEditId] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // FIX: paymentsCollectionRef को useEffect के बाहर परिभाषित करना
  const paymentsCollectionRef = collection(db, "customers", customerId, "policies", policyId, "payments");

  // 1. Fetch Data
  useEffect(() => {
    const fetchPolicy = async () => {
      const docRef = doc(db, "customers", customerId, "policies", policyId);
      const snap = await getDoc(docRef);
      if (snap.exists()) setPolicy(snap.data());
    };
    fetchPolicy();

    // Real-time listener for payments
    const q = query(paymentsCollectionRef, orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setPayments(snap.docs.map(d => ({ 
          id: d.id, 
          // Firestore Timestamps to Date objects
          date: d.data().date?.toDate ? d.data().date.toDate() : (d.data().date ? new Date(d.data().date) : new Date()),
          ...d.data() 
      })));
    });
    // FIX: paymentsCollectionRef (dependency for the query) को dependency array में शामिल किया गया
    return () => unsubscribe(); 
  }, [customerId, policyId, paymentsCollectionRef]); // FIXED: Dependency Array

  // 2. Calculations
  const totalCollected = payments.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const premiumValue = Number(policy?.premium || 0);
  const remaining = premiumValue > 0 ? premiumValue - totalCollected : 0;
  const progress = premiumValue > 0 ? (totalCollected / premiumValue) * 100 : 0;
  const isComplete = remaining <= 0;

  // 3. Add/Edit Payment Handler (Consolidated)
  const handleSavePayment = async (e) => {
    e.preventDefault();
    setError('');

    const amountNum = Number(paymentForm.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
        setError("Please enter a valid amount.");
        return;
    }
    
    setLoading(true);
    try {
        const dataToSave = {
            amount: amountNum,
            date: paymentForm.date, // ISO string format from date input
            note: paymentForm.note || 'No notes.',
            updatedAt: new Date().toISOString()
        };

        if (editId) {
            await updateDoc(doc(paymentsCollectionRef, editId), dataToSave);
        } else {
            await addDoc(paymentsCollectionRef, { 
                ...dataToSave,
                createdAt: new Date().toISOString()
            });
        }
        
        // Reset form and close modal
        setPaymentForm({ amount: '', date: getFormattedDate(new Date()), note: '' });
        setEditId(null);
        setShowFormModal(false);

    } catch (err) {
        console.error("Error saving payment:", err);
        setError(`Failed to save payment: ${err.message}`);
    }
    setLoading(false);
  };
  
  // 4. Edit Modal Opener
  const openEditModal = (payment) => {
      setPaymentForm({
          amount: String(payment.amount),
          // Ensure date is formatted correctly for input type="date"
          date: getFormattedDate(payment.date), 
          note: payment.note || ''
      });
      setEditId(payment.id);
      setShowFormModal(true);
      setError('');
  };

  // 5. Delete Confirmation Prompt
  const promptDelete = (id) => {
      setDeleteId(id);
      setShowDeleteModal(true);
  };
  
  // 6. Confirm Deletion
  const confirmDelete = async () => {
      if (!deleteId) return;
      setLoading(true);
      try {
          await deleteDoc(doc(paymentsCollectionRef, deleteId));
          setShowDeleteModal(false);
          setDeleteId(null);
      } catch (err) {
          setError(`Deletion failed: ${err.message}`);
          console.error("Error deleting transaction:", err);
      }
      setLoading(false);
  };

  // 7. Renew Policy (Unchanged logic)
  const handleRenew = async () => {
    console.warn("Policy Renewal Initiated. Deleting all payments...");
    
    setLoading(true);
    try {
      const q = query(paymentsCollectionRef);
      const snapshot = await getDocs(q);
      
      const deletePromises = snapshot.docs.map((paymentDoc) => 
        deleteDoc(doc(paymentsCollectionRef, paymentDoc.id))
      );
      await Promise.all(deletePromises);
      console.log("Policy Renewed Successfully!");
    } catch (err) {
      console.error("Error during renewal:", err);
    }
    setLoading(false);
  };
  
  // Handler to open Add Modal
  const openAddModal = () => {
      setPaymentForm({ amount: '', date: getFormattedDate(new Date()), note: '' });
      setEditId(null);
      setShowFormModal(true);
      setError('');
  };


  if (!policy) return <div className="p-5 text-center text-muted fw-bold">Loading Ledger...</div>;

  return (
    <>
      <Container className="details-page-container pb-5 pt-4">
        
        {/* === 1. HERO LEDGER CARD === */}
        <Card className="customer-hero-card border-0 mb-4 overflow-hidden">
          <div className="hero-bg-pattern"></div>
          <Card.Body className="position-relative z-1 p-4">
            <Row className="align-items-center">
              <Col xs={12} md={8} className="d-flex flex-column flex-md-row align-items-center gap-3 gap-md-4 mb-4 mb-md-0 text-center text-md-start">
                
                {/* Icon Avatar */}
                <div className="profile-avatar-lg shadow-lg flex-shrink-0">
                   <FileText size={32} />
                </div>
                
                {/* Policy Info */}
                <div className="w-100">
                  <Badge bg="white" className="text-primary mb-2 px-2 py-1 bg-opacity-25 border border-white border-opacity-50">
                    {policy.mode} Plan
                  </Badge>
                  <h2 className="text-white fw-bold mb-2 mb-md-1">Policy #{policy.policyNo}</h2>
                  
                  <div className="d-flex flex-column flex-md-row align-items-center gap-2 gap-md-4 text-white-50 small">
                    <span className="d-flex align-items-center gap-2 p-1 px-3 rounded-pill bg-white bg-opacity-10 border border-white border-opacity-25">
                      <CalendarEvent className="text-warning" /> Due: {policy.dueDate}
                    </span>
                  </div>
                </div>
              </Col>
              
              {/* Stats Glass Box */}
              <Col xs={12} md={4}>
                <div className="stats-glass-box p-3 rounded-4">
                   <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-white-50 small fw-bold">COLLECTED</span>
                      <span className="text-white fw-bold d-flex align-items-center">
                        <CurrencyRupee size={12}/> {totalCollected.toLocaleString('en-IN')}
                      </span>
                   </div>
                   
                   {/* Modern Progress Bar */}
                   <ProgressBar className="mb-3" style={{height: '8px'}}>
                      <ProgressBar 
                        now={progress} 
                        variant={isComplete ? "success" : "info"} 
                        animated={!isComplete}
                      />
                   </ProgressBar>

                   <div className="d-flex justify-content-between align-items-center">
                      <span className="text-white-50 small fw-bold">BALANCE</span>
                      <span className={`fw-bold d-flex align-items-center ${isComplete ? 'text-success' : 'text-warning'}`} style={{fontSize: '1.1rem'}}>
                        {isComplete ? <CheckCircleFill/> : <><CurrencyRupee size={14}/>{remaining.toLocaleString('en-IN')}</>}
                      </span>
                   </div>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* === 2. MAIN CONTENT (Tabs) === */}
        <Card className="policy-card-modern border-0 shadow-sm overflow-hidden">
          <Tab.Container defaultActiveKey="payment">
            <Card.Header className="bg-white border-bottom-0 p-0 pt-2">
              <Nav variant="pills" className="nav-justified p-2 gap-2 custom-ledger-tabs">
                <Nav.Item>
                  <Nav.Link eventKey="payment" className="rounded-pill d-flex align-items-center justify-content-center gap-2 py-2" onClick={openAddModal}>
                    <Wallet2 /> Add Payment
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="history" className="rounded-pill d-flex align-items-center justify-content-center gap-2 py-2">
                    <ClockHistory /> History
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Header>

            <Card.Body className="p-4">
              <Tab.Content>
                
                {/* TAB 1: ADD PAYMENT (Default view is form modal now) */}
                <Tab.Pane eventKey="payment">
                  {isComplete ? (
                    <div className="text-center py-4">
                      <div className="mb-3 text-success">
                        <CheckCircleFill size={60} />
                      </div>
                      <h4 className="fw-bold text-dark">Payment Cycle Complete!</h4>
                      <p className="text-muted mb-4">All premiums for this cycle have been collected.</p>
                      
                      <Button variant="outline-success" onClick={handleRenew} className="rounded-pill px-4 py-2 d-flex align-items-center gap-2 mx-auto" disabled={loading}>
                        <ArrowRepeat /> {loading ? 'Processing...' : 'Renew Cycle'}
                      </Button>
                    </div>
                  ) : (
                    // When not complete, prompt to open the modal
                    <div className="text-center py-4">
                        <p className="text-muted">Click the button below to log a new payment.</p>
                        <Button variant="primary" onClick={openAddModal} className="rounded-pill px-4 py-2">
                            <CashCoin size={20}/> Log Payment
                        </Button>
                    </div>
                  )}
                </Tab.Pane>

                {/* TAB 2: HISTORY - With Edit and Delete */}
                <Tab.Pane eventKey="history">
                  {error && <Alert variant="danger">{error}</Alert>}
                  <div className="transaction-list">
                    {payments.map((p) => {
                      const dateString = p.date.toLocaleDateString ? p.date.toLocaleDateString() : 'N/A';
                      const timeString = p.date.toLocaleTimeString ? p.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';
                      
                      return (
                      <div key={p.id} className="d-flex justify-content-between align-items-center p-3 mb-2 bg-light rounded-3 border-start border-4 border-primary">
                        <div className="d-flex align-items-center gap-3">
                           <div className="bg-white p-2 rounded-circle shadow-sm text-primary">
                             <CashCoin size={20}/>
                           </div>
                           <div>
                              <div className="fw-bold text-dark d-flex align-items-center gap-1">
                                  Payment: <span className="text-success">₹{Number(p.amount).toLocaleString('en-IN')}</span>
                              </div>
                              <small className="text-muted">{dateString} at {timeString}</small>
                           </div>
                        </div>
                        <div className="d-flex gap-2">
                            <Button variant="light" size="sm" className="rounded-circle p-2" onClick={() => openEditModal(p)} title="Edit Transaction">
                                <PencilSquare size={14}/>
                            </Button>
                            <Button variant="light" size="sm" className="rounded-circle p-2 text-danger" onClick={() => promptDelete(p.id)} title="Delete Transaction">
                                <Trash size={14}/>
                            </Button>
                        </div>
                      </div>
                    )})}

                    {payments.length === 0 && (
                      <div className="text-center py-5 opacity-50">
                        <ClockHistory size={40} className="mb-2"/>
                        <p>No transactions recorded for this policy cycle.</p>
                      </div>
                    )}
                  </div>
                </Tab.Pane>

              </Tab.Content>
            </Card.Body>
          </Tab.Container>
        </Card>
      </Container>
      
      {/* === MODAL 1: ADD / EDIT PAYMENT FORM === */}
      <Modal show={showFormModal} onHide={() => setShowFormModal(false)} centered backdrop="static">
          <Modal.Header closeButton className="border-0 pb-0">
              <Modal.Title className="fw-bold h5 modal-title-advanced">{editId ? 'Edit Transaction' : 'Log New Payment'}</Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-3">
              {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
              <Form onSubmit={handleSavePayment}>
                  
                  {/* Amount Input */}
                  <Form.Group className="mb-3">
                      <Form.Label className="small text-muted text-uppercase fw-bold">Amount Received</Form.Label>
                      <InputGroup>
                          <InputGroup.Text className='bg-light border-end-0'><CurrencyRupee /></InputGroup.Text>
                          <Form.Control 
                            required 
                            type="number" 
                            placeholder="e.g. 500" 
                            value={paymentForm.amount} 
                            onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} 
                            className="border-start-0 ps-0 fw-bold"
                          />
                      </InputGroup>
                  </Form.Group>
                  
                  {/* Date Input (New Feature) */}
                  <Form.Group className="mb-3">
                      <Form.Label className="small text-muted text-uppercase fw-bold">Payment Date</Form.Label>
                      <InputGroup>
                          <InputGroup.Text className='bg-light border-end-0'><CalendarEvent /></InputGroup.Text>
                          <Form.Control 
                            required 
                            type="date" 
                            value={paymentForm.date} 
                            onChange={e => setPaymentForm({...paymentForm, date: e.target.value})} 
                            className="border-start-0 ps-0"
                          />
                      </InputGroup>
                  </Form.Group>

                  {/* Note Input */}
                  <Form.Group className="mb-4">
                      <Form.Label className="small text-muted text-uppercase fw-bold">Notes (Optional)</Form.Label>
                      <Form.Control 
                          as="textarea"
                          rows={2}
                          placeholder="Payment mode, remarks..."
                          value={paymentForm.note} 
                          onChange={e => setPaymentForm({...paymentForm, note: e.target.value})} 
                      />
                  </Form.Group>
                  
                  <div className="d-grid">
                      <Button variant="primary" type="submit" className="rounded-pill shadow-sm btn-hover-lift" disabled={loading}>
                          {loading ? <Spinner as="span" animation="border" size="sm" /> : (editId ? 'Update Transaction' : 'Confirm Deposit')}
                      </Button>
                  </div>
              </Form>
          </Modal.Body>
      </Modal>

      {/* === MODAL 2: DELETE CONFIRMATION MODAL === */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered size="sm">
          <Modal.Body className="text-center p-4">
              <div className="text-danger mb-3">
                 <ExclamationTriangleFill size={40} />
              </div>
              <h5 className="fw-bold mb-2">Delete Transaction?</h5>
              <p className="text-muted small mb-4">
                  Are you sure you want to permanently delete this payment record?
              </p>
              <div className="d-grid gap-2">
                  <Button variant="danger" onClick={confirmDelete} className="rounded-pill" disabled={loading}>
                      {loading ? 'Deleting...' : 'Yes, Delete Record'}
                  </Button>
                  <Button variant="light" onClick={() => setShowDeleteModal(false)} className="rounded-pill">
                      Cancel
                  </Button>
              </div>
          </Modal.Body>
      </Modal>
    </>
  );
}