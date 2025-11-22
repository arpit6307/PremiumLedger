// src/components/LandingPage.js

import React from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap'; 
import { Link } from 'react-router-dom';
import { 
    ShieldLockFill, 
    PeopleFill, 
    Clipboard,
    GraphUp,
    KeyFill,
    CurrencyRupee,
    PersonFillGear, 
    Speedometer2, 
    TrophyFill
} from 'react-bootstrap-icons'; 

// --- Advanced Feature Card Component (Adapted for Light Theme) ---
const AdvancedFeatureCard = ({ icon: Icon, title, subtitle, badge }) => (
    <Col md={6} lg={4}>
        <Card className="h-100 p-4 border-0 landing-card-light">
            <div className={`icon-wrapper-sm text-${badge.toLowerCase()}`}>
                <Icon size={30} />
            </div>
            <Card.Title className="fw-bold fs-5 mt-3 text-dark">{title}</Card.Title>
            <Card.Text className='text-muted small'>{subtitle}</Card.Text>
            <Badge bg={`outline-${badge.toLowerCase()}`} className='align-self-start landing-badge-pill-light'>{badge}</Badge>
        </Card>
    </Col>
);

export default function LandingPage() {
  return (
    <div className="landing-container d-flex flex-column align-items-center text-center py-5">
      <Container className="p-4 p-md-5">
        
        {/* === SECTION 1: HERO - ACCESS MODULE (LIGHT THEME) === */}
        <div className="hero-mission-control mb-5 text-dark">
          
          <div className="d-flex align-items-center justify-content-center gap-3 mb-4">
            <ShieldLockFill size={60} className="text-primary glow-text-light" />
            <span className="brand-text-dark fs-2 fw-bold" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                PREMIUM LEDGER
            </span>
          </div>

          <h1 className="display-4 fw-bold text-dark">
            AGENT PORTAL ACTIVATED
          </h1>
          <p className="lead text-muted mx-auto mb-5" style={{ maxWidth: '700px' }}>
            Your high-performance operative kit awaits. Seamlessly managing clients and policy wealth in a secure, real-time environment.
          </p>
          
          {/* --- ADVANCED ACCESS MODULE (Adapted for Light BG) --- */}
          <div className="d-flex justify-content-center">
            <div className="access-module-container-light shadow-lg">
                <Link to="/login" className="access-module-link login-link-light">
                    <KeyFill size={20} />
                    <span className="fw-bold">INITIATE LOGIN</span>
                </Link>
                <Link to="/signup" className="access-module-link signup-link-light">
                    <PersonFillGear size={20} />
                    <span className="fw-bold">REGISTER AGENT</span>
                </Link>
            </div>
          </div>
        </div>
        
        {/* === SECTION 2: CORE MODULES (FEATURES) === */}
        <Row className="g-4 mb-5 text-start pt-5">
            <Col xs={12}>
                <h3 className="fw-bold text-primary mb-5 text-center text-uppercase">
                    // CORE SYSTEMS MODULE
                </h3>
            </Col>
            
            <AdvancedFeatureCard 
                icon={PeopleFill}
                title="CLIENT SYNCHRONIZATION"
                subtitle="Maintain a secure, real-time database. Advanced filtering, quick search, and Cloudinary image hosting for visual ID."
                badge="Primary"
            />
            
            <AdvancedFeatureCard 
                icon={Clipboard}
                title="POLICY HEALTH ANALYZER"
                subtitle="Instant status updates: Overdue, Due Soon, and On-Track warnings are calculated automatically. Eliminate manual checks."
                badge="Success"
            />
            
            <AdvancedFeatureCard 
                icon={CurrencyRupee}
                title="LEDGER FLOW LOGISTICS"
                subtitle="Log micro-payments with precision. Track premium collection against the full policy value and enable quick renewal cycles."
                badge="Warning"
            />
        </Row>

        {/* === SECTION 3: INTELLIGENCE & FUTURE-PROOFING === */}
        <Row className="g-4 pt-5 text-start">
            <Col xs={12}>
                <h3 className="fw-bold text-dark mb-5 text-center text-uppercase">
                    // HIGH-VALUE INTELLIGENCE
                </h3>
            </Col>
            
            <AdvancedFeatureCard 
                icon={GraphUp}
                title="PERFORMANCE RATING"
                subtitle="A calculated Score / 100 based on client volume and annualized premium. Benchmark your success for optimal growth."
                badge="Info"
            />
            
            <AdvancedFeatureCard 
                icon={TrophyFill}
                title="MILESTONE TRACKER"
                subtitle="Visualize your path to Bronze, Silver, and Gold agent tiers. Automatic identification of your next achievable goal."
                badge="Success"
            />
            
            <AdvancedFeatureCard 
                icon={Speedometer2}
                title="ZERO-FRICTION DESIGN"
                subtitle="Engineered for speed and mobile-first productivity. All core functions are accessible via the ultra-minimalist dock."
                badge="Secondary"
            />
        </Row>
        
        {/* The unwanted FINAL CTA / "LAUNCH DASHBOARD" section is removed. */}

      </Container>
    </div>
  );
}