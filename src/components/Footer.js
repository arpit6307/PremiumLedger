// src/components/Footer.js
import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { HeartFill, Github, Linkedin, EnvelopeAt, ShieldLock } from 'react-bootstrap-icons';

export default function Footer() {
  return (
    <footer className="bg-dark text-light py-4 mt-auto border-top border-secondary">
      <Container>
        <Row className="align-items-center text-center text-md-start">
          
          {/* Left Side: Brand & Copyright */}
          <Col md={4} className="mb-3 mb-md-0">
            <h6 className="text-warning d-flex align-items-center justify-content-center justify-content-md-start gap-2">
              <ShieldLock /> PremiumLedger
            </h6>
            <small className="text-white-50">
              &copy; {new Date().getFullYear()} All Rights Reserved.
            </small>
          </Col>

          {/* Center: Developer Credit */}
          <Col md={4} className="text-center mb-3 mb-md-0">
            <p className="mb-0 fw-bold" style={{letterSpacing: '0.5px'}}>
              Developed with <HeartFill className="text-danger mx-1" /> by <span className="text-info">Arpit Singh Yadav</span>
            </p>
            <small className="text-white-50">Making Insurance Easy</small>
          </Col>

          {/* Right Side: Social Links */}
          <Col md={4} className="text-center text-md-end">
            <div className="d-flex justify-content-center justify-content-md-end gap-3">
              {/* GitHub Link */}
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noreferrer"
                className="text-white-50 hover-text-white text-decoration-none" 
                title="GitHub"
              >
                <Github size={20} />
              </a>
              
              {/* LinkedIn Link */}
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noreferrer"
                className="text-white-50 hover-text-white text-decoration-none" 
                title="LinkedIn"
              >
                <Linkedin size={20} />
              </a>
              
              {/* Email Link (Yeh already valid tha) */}
              <a 
                href="mailto:arpit@example.com" 
                className="text-white-50 hover-text-white text-decoration-none" 
                title="Email"
              >
                <EnvelopeAt size={20} />
              </a>
            </div>
            
            <div className="mt-2">
                {/* Dummy Links ke liye '/' use kiya hai taaki warning na aaye */}
                <small>
                  <a href="/" className="text-decoration-none text-white-50 me-2">Privacy</a>
                </small>
                <small>
                  <a href="/" className="text-decoration-none text-white-50">Terms</a>
                </small>
            </div>
          </Col>

        </Row>
      </Container>
    </footer>
  );
}