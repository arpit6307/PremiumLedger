// src/components/Login.js
import React, { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, InputGroup, Modal } from 'react-bootstrap';
import { ShieldLockFill, BoxArrowInRight, Eye, EyeSlash, EnvelopeAt } from 'react-bootstrap-icons';
import { PersonFillGear } from 'react-bootstrap-icons'; // NEW: Register link के लिए नया आइकॉन

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      // Firebase error codes को user-friendly बनाया
      let errorMessage = 'ERROR: Invalid Credentials. Access Denied.';
      if (err.code === 'auth/user-not-found') {
          errorMessage = 'ERROR: Agent not found. Please Sign Up.';
      } else if (err.code === 'auth/wrong-password') {
          errorMessage = 'ERROR: Incorrect Password Input.';
      } else if (err.code === 'auth/invalid-email') {
          errorMessage = 'ERROR: Invalid Email Format.';
      }
      setError(errorMessage);
      console.error(err);
    }
    setLoading(false);
  }

  async function handleResetPassword() {
    // Ensuring email is clean before attempting reset
    const targetEmail = email.trim();
    if(!targetEmail) {
        setError("STATUS: Email field is required for password reset.");
        setShowForgotModal(false);
        return;
    }
    try {
        setMessage('');
        setError('');
        setLoading(true);
        await sendPasswordResetEmail(auth, targetEmail);
        setMessage('STATUS: Password Reset link dispatched. Check Email.');
        setShowForgotModal(false);
    } catch(err) {
        setError('RESET FAIL: Verify email address.');
        console.error(err);
    }
    setLoading(false);
  }

  return (
    <Container className="auth-container d-flex align-items-center justify-content-center">
      <div className="w-100" style={{ maxWidth: "450px" }}>
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
              <h2 className="fw-bold text-dark mt-2 mb-2">AGENT LOGIN</h2>
              <p className="text-muted small">
                  {loading ? 'STATUS: ACCESSING SYSTEM...' : 'ENTER CREDENTIALS TO INITIATE SESSION'}
              </p>
            </div>
            
            {error && <Alert variant="danger">{error}</Alert>}
            {message && <Alert variant="success">{message}</Alert>}

            <Form onSubmit={handleLogin}>
              <Form.Group className="mb-4">
                <Form.Label className="small text-muted text-uppercase fw-bold">User Email</Form.Label>
                <InputGroup>
                    {/* Input Group Styling App.css से आ रहा है */}
                    <InputGroup.Text><EnvelopeAt /></InputGroup.Text>
                    <Form.Control 
                      type="email" 
                      required 
                      value={email}
                      placeholder="Enter your email address"
                      onChange={(e) => setEmail(e.target.value)} 
                    />
                </InputGroup>
              </Form.Group>

              <Form.Group className="mb-5">
                <div className="d-flex justify-content-between align-items-end">
                    <Form.Label className="small text-muted text-uppercase fw-bold">Auth Key</Form.Label>
                    {/* NEW: नया लिंक स्टाइल */}
                    <span 
                        role="button" 
                        className="small fw-bold auth-link-primary" 
                        onClick={() => setShowForgotModal(true)}
                    >
                        Forgot Key?
                    </span>
                </div>
                <InputGroup>
                    <Form.Control 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={password}
                    placeholder="Enter your password"
                    onChange={(e) => setPassword(e.target.value)} 
                    />
                    <Button variant="outline-secondary" onClick={() => setShowPassword(!showPassword)} title="SHOW/HIDE PASSWORD">
                        {showPassword ? <EyeSlash /> : <Eye />}
                    </Button>
                </InputGroup>
              </Form.Group>

              {/* NEW: प्रीमियम प्राइमरी बटन */}
              <Button 
                disabled={loading} 
                className="w-100 py-3 d-flex align-items-center justify-content-center gap-2 btn-hover-lift rounded-pill" 
                variant="primary"
                type="submit"
              >
                <BoxArrowInRight /> {loading ? 'INITIATING...' : 'SECURE LOG IN'}
              </Button>
            </Form>

            {/* NEW: उन्नत विभाजक (separator) */}
            <div className="auth-separator-advanced"></div>

            <div className="text-center">
              <small className="text-muted">NEW AGENT? </small>
              {/* NEW: साइनअप पेज पर रीडायरेक्ट करने के लिए उन्नत लिंक */}
              <Link to="/signup" className="fw-bold auth-link-primary d-inline-flex align-items-center gap-1">
                  <PersonFillGear size={16}/> Register New Account
              </Link>
            </div>
          </Card.Body>
        </Card>

        {/* Forgot Password Modal */}
        <Modal show={showForgotModal} onHide={() => setShowForgotModal(false)} centered>
            <Modal.Header closeButton className="border-0">
                <Modal.Title className="modal-title-advanced">PASSWORD RESET</Modal.Title>
            </Modal.Header>
            <Modal.Body className="text-center py-4">
                <EnvelopeAt size={40} className="text-primary mb-3"/>
                <h5 className="fw-bold text-dark">Confirm Reset Target</h5>
                <p className="text-muted">
                    Reset link will be sent to: <strong>{email || "[USER EMAIL]"}</strong>
                </p>
            </Modal.Body>
            <Modal.Footer className="border-0">
                <Button variant="light" onClick={() => setShowForgotModal(false)} className="rounded-pill">Cancel</Button>
                <Button variant="primary" onClick={handleResetPassword} disabled={!email.trim()} className="rounded-pill">
                    Confirm & Send
                </Button>
            </Modal.Footer>
        </Modal>

      </div>
    </Container>
  );
}