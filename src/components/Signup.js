// src/components/Signup.js (Redesigned for Advanced Light Theme)
import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../firebase';
import { setDoc, doc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, InputGroup, Row, Col } from 'react-bootstrap';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/bootstrap.css';
import { 
  ShieldLockFill, 
  Eye, 
  EyeSlash, 
  PersonPlusFill,
  KeyFill, 
  At,
  Person
} from 'react-bootstrap-icons';

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agentCode: ''
  });
  const [phone, setPhone] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return setError("SECURITY ALERT: Passwords mismatch.");
    if (formData.password.length < 6) return setError("SECURITY ALERT: Password must be 6+ characters.");
    if (!phone) return setError("STATUS: Phone number required.");
    if (!formData.agentCode) return setError("STATUS: Agent Code required.");

    try {
      setError('');
      setLoading(true);
      
      // 1. Create User in Firebase Auth (Logic is unchanged)
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      
      // 2. Update Auth Profile
      await updateProfile(user, { displayName: formData.name });
      
      // 3. Save Agent Data in Firestore (Logic is unchanged)
      await setDoc(doc(db, "agents", user.uid), {
        name: formData.name,
        email: formData.email,
        phone: phone,
        agentCode: formData.agentCode, 
        photoURL: '', 
        joinedAt: new Date()
      });
      
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      let errorMessage = "REGISTRATION FAIL: Check error details.";
      if (err.code === 'auth/email-already-in-use') {
          errorMessage = "REGISTRATION FAIL: Email already exists in system. Use Log In.";
      }
      setError(errorMessage);
    }
    setLoading(false);
  };

  return (
    <Container className="auth-container d-flex align-items-center justify-content-center">
      <div className="w-100" style={{ maxWidth: "550px" }}> 
        {/* NEW: उन्नत कार्ड स्टाइल */}
        <Card className="border-0 auth-card-advanced">
          <Card.Body className="p-4 p-md-5">
            <div className="text-center mb-5">
              
              {/* उन्नत ब्रांडिंग हेडर */}
              <div className="auth-header-logo mx-auto mb-2">
                <ShieldLockFill size={30} className="text-primary" />
              </div>
              
              <span className="brand-text-dark fs-5 fw-bold" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  PREMIUM LEDGER
              </span>
              <h2 className="fw-bold text-dark mt-2 mb-2">AGENT REGISTRY</h2>
              <p className="text-muted small">
                  {loading ? 'STATUS: PROCESSING REQUEST...' : 'CREATE YOUR NEW NETWORK ACCESS POINT'}
              </p>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSignup}>
              
              {/* Row 1: Name and Agent Code */}
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label className="small text-muted text-uppercase fw-bold">Full Name</Form.Label>
                    <InputGroup>
                        <InputGroup.Text><Person /></InputGroup.Text>
                        <Form.Control 
                            type="text" 
                            required 
                            placeholder="Enter your full name" 
                            value={formData.name} 
                            onChange={(e) => setFormData({...formData, name: e.target.value})} 
                        />
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label className="small text-muted text-uppercase fw-bold">Agent Code</Form.Label>
                    <InputGroup>
                        <InputGroup.Text><KeyFill /></InputGroup.Text>
                        <Form.Control 
                            type="text" 
                            required 
                            placeholder="Unique Agent Code" 
                            value={formData.agentCode} 
                            onChange={(e) => setFormData({...formData, agentCode: e.target.value})} 
                        />
                    </InputGroup>
                  </Form.Group>
                </Col>
              </Row>

              {/* Row 2: Phone Number */}
              <Form.Group className="mb-4">
                <Form.Label className="small text-muted text-uppercase fw-bold">Phone Number</Form.Label>
                {/* PhoneInput now uses modern styling from App.css */}
                <PhoneInput 
                    country={'in'} 
                    value={phone} 
                    onChange={setPhone} 
                    inputStyle={{ width: '100%', height: '52px' }} 
                    enableSearch={true} 
                />
              </Form.Group>

              {/* Row 3: Email Address */}
              <Form.Group className="mb-4">
                <Form.Label className="small text-muted text-uppercase fw-bold">Email Address</Form.Label>
                 <InputGroup>
                    <InputGroup.Text><At /></InputGroup.Text>
                    <Form.Control 
                        type="email" 
                        required 
                        placeholder="Enter your email address"
                        value={formData.email} 
                        onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    />
                </InputGroup>
              </Form.Group>

              {/* Row 4: Password and Confirm Password */}
              <Row>
                <Col md={6} className="mb-4">
                  <Form.Group>
                    <Form.Label className="small text-muted text-uppercase fw-bold">Auth Key</Form.Label>
                    <InputGroup>
                      <Form.Control 
                        type={showPass ? "text" : "password"} 
                        required 
                        placeholder="Password"
                        value={formData.password} 
                        onChange={(e) => setFormData({...formData, password: e.target.value})} 
                      />
                      <Button variant="outline-secondary" onClick={() => setShowPass(!showPass)} title="SHOW/HIDE KEY">{showPass ? <EyeSlash /> : <Eye />}</Button>
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={6} className="mb-4">
                  <Form.Group>
                    <Form.Label className="small text-muted text-uppercase fw-bold">Confirm Key</Form.Label>
                    <InputGroup>
                      <Form.Control 
                        type={showConfirmPass ? "text" : "password"} 
                        required 
                        placeholder="Confirm Password"
                        value={formData.confirmPassword} 
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} 
                      />
                      <Button variant="outline-secondary" onClick={() => setShowConfirmPass(!showConfirmPass)} title="SHOW/HIDE KEY">{showConfirmPass ? <EyeSlash /> : <Eye />}</Button>
                    </InputGroup>
                  </Form.Group>
                </Col>
              </Row>

              {/* NEW: प्रीमियम प्राइमरी बटन */}
              <Button 
                disabled={loading} 
                className="w-100 py-3 d-flex align-items-center justify-content-center gap-2 btn-hover-lift rounded-pill" 
                variant="primary"
                type="submit"
              >
                 <PersonPlusFill /> {loading ? 'EXECUTING...' : 'CREATE PROFILE'}
              </Button>
            </Form>
            
            {/* NEW: उन्नत विभाजक */}
            <div className="auth-separator-advanced"></div>

            <div className="text-center">
              <small className="text-muted">HAVE ACCESS? </small>
              {/* UPDATED: /login पर रीडायरेक्ट करने के लिए उन्नत लिंक */}
              <Link to="/login" className="fw-bold auth-link-primary d-inline-flex align-items-center gap-1">
                  Log In to Network
              </Link>
            </div>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
}