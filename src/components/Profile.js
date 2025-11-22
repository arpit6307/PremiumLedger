// src/components/Profile.js

import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Row, Col, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { 
    PersonCircle, 
    EnvelopeFill, 
    PhoneFill, 
    KeyFill, 
    GeoAltFill, 
    LockFill, 
    PencilSquare, 
    PeopleFill, 
    ClipboardData,
    CloudUploadFill 
} from 'react-bootstrap-icons';
import { auth, db } from '../firebase';
import { onAuthStateChanged, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';


// ===============================================
// Custom Hook for Agent Performance Data (Advanced Feature)
// Fetches key metrics (Total Clients/Policies)
// ===============================================
const useAgentPerformance = (agentUid) => {
    const [performance, setPerformance] = useState({ totalClients: 0, totalPolicies: 0 });

    useEffect(() => {
        if (!agentUid) return;

        const fetchPerformance = async () => {
            try {
                // Fetch all customers (Assuming current agent owns all customers for this simple app structure)
                const customersRef = collection(db, "customers");
                const customerSnapshot = await getDocs(customersRef);
                
                let clients = 0;
                let policies = 0;

                for (const customerDoc of customerSnapshot.docs) {
                    clients++;
                    
                    // Fetch nested policies count
                    const policiesRef = collection(db, "customers", customerDoc.id, "policies");
                    const policiesSnapshot = await getDocs(policiesRef);
                    policies += policiesSnapshot.size;
                }

                setPerformance({ totalClients: clients, totalPolicies: policies });

            } catch (e) {
                console.error("Error fetching agent performance:", e);
                // Graceful failure
            }
        };

        fetchPerformance();
    }, [agentUid]);

    return performance;
};
// ===============================================


// ===============================================
// Main Profile Component
// ===============================================
export default function Profile() {
    // === STATE ===
    const [user, setUser] = useState(null);
    const [agentData, setAgentData] = useState(null); // Firestore data
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [formState, setFormState] = useState({ name: '', phone: '', address: '', agentCode: '' });
    
    // Custom Hook for Advanced Feature
    const { totalClients, totalPolicies } = useAgentPerformance(user?.uid);
    
    // === DATA FETCHING ===
    const fetchUserData = useCallback(async (currentUser) => {
        if (!currentUser) {
            setLoading(false);
            return;
        }
        
        try {
            const docRef = doc(db, "agents", currentUser.uid);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                setAgentData(data);
                // Initialize form state with current data
                setFormState({
                    name: currentUser.displayName || data.name || '',
                    phone: data.phone || '',
                    address: data.address || '',
                    agentCode: data.agentCode || '',
                });
            }
        } catch (e) {
            console.error("Error fetching agent data:", e);
            setError("Error loading profile data.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                fetchUserData(currentUser);
            } else {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [fetchUserData]);

    // === HANDLERS ===
    const handleInputChange = (e) => {
        setFormState({ ...formState, [e.target.name]: e.target.value });
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (!user) {
            setError("User not authenticated.");
            setLoading(false);
            return;
        }

        try {
            const { name, phone, address } = formState;
            const docRef = doc(db, "agents", user.uid);
            
            // 1. Update Firebase Auth Profile (Display Name)
            if (user.displayName !== name) {
                await updateProfile(user, { displayName: name });
            }
            
            // 2. Update Firestore Agent Data
            await updateDoc(docRef, {
                name: name,
                phone: phone,
                address: address,
                lastUpdated: new Date().toISOString()
            }, { merge: true });

            setSuccess("Profile updated successfully!");
            setIsEditing(false); // Exit edit mode
            fetchUserData(auth.currentUser); // Re-fetch to refresh state
            
        } catch (e) {
            console.error("Profile update error:", e);
            setError(`Failed to update profile: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSimulatedPhotoUpload = async () => {
        // --- Advanced Feature: Simulated Photo Upload ---
        setSuccess('');
        setError('');
        
        // Mock a new URL (In a real app, use firebase/storage)
        const placeholderURL = `https://picsum.photos/200/200?random=${Date.now()}`; 
        
        try {
            // Simulate upload delay
            setLoading(true);
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 1. Update Firebase Auth (for profile photo)
            await updateProfile(auth.currentUser, { photoURL: placeholderURL });
            
            // 2. Update Firestore (optional, but good practice)
            await updateDoc(doc(db, "agents", user.uid), {
                photoURL: placeholderURL
            });
            
            setSuccess("Profile photo updated successfully (Simulated).");
            fetchUserData(auth.currentUser); // Re-fetch to update UI
            
        } catch(e) {
             setError("Simulated photo upload failed.");
             console.error(e);
        } finally {
            setLoading(false);
        }
    }
    
    const handleChangePassword = async () => {
        if (!user || !user.email) {
            setError("Cannot initiate password reset. User email not found.");
            return;
        }
        try {
            await sendPasswordResetEmail(auth, user.email);
            alert(`Password reset link sent to ${user.email}. Please check your inbox.`);
            setSuccess("Password reset link sent! Check your email.");
        } catch (e) {
            setError("Failed to send reset email. Ensure your email is correct.");
            console.error("Password reset error:", e);
        }
    };
    
    // Helper to get initials
    const userInitial = formState.name ? formState.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : '?');
    const displayPhotoURL = user?.photoURL || agentData?.photoURL || null;


    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" role="status" className='mb-3'/>
                <p className='text-muted fw-bold'>LOADING AGENT PROFILE...</p>
            </Container>
        );
    }
    
    if (!user) {
        return (
            <Container className="py-5">
                <Alert variant="danger" className='fw-bold'>
                    Please log in to view your profile.
                </Alert>
            </Container>
        );
    }
    
    // --- MAIN RENDER ---
    return (
        <Container className="py-4 py-lg-5 profile-page-advanced">
            <h2 className="fw-bold text-dark mb-4">My Agent Profile</h2>

            {/* Success and Error Alerts */}
            {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible className='fw-bold'>{success}</Alert>}
            {error && <Alert variant="danger" onClose={() => setError('')} dismissible className='fw-bold'>{error}</Alert>}
            
            <Row className="g-4">
                {/* === LEFT COLUMN: PROFILE CARD & STATS === */}
                <Col lg={4}>
                    <Card className="p-4 h-100 profile-hero-card text-center">
                        <div className="d-flex flex-column align-items-center mb-4">
                            {/* Profile Image/Initial */}
                            <div className="profile-avatar-xl mb-3 position-relative">
                                {displayPhotoURL ? (
                                    <img src={displayPhotoURL} alt="Profile" className="w-100 h-100 object-fit-cover rounded-circle" />
                                ) : (
                                    userInitial
                                )}
                            </div>
                            
                            {/* Photo Upload Button (Advanced Feature) */}
                            <Button variant="outline-primary" size="sm" className="rounded-pill fw-bold" onClick={handleSimulatedPhotoUpload} disabled={loading}>
                                <CloudUploadFill className='me-2'/> Change Photo
                            </Button>
                        </div>
                        
                        <h4 className="fw-bolder text-dark mb-1">{formState.name}</h4>
                        <p className="text-primary fw-bold small mb-3 d-flex align-items-center justify-content-center gap-1">
                            <KeyFill size={12}/> AGENT ID: {formState.agentCode || 'N/A'}
                        </p>
                        
                        {/* Agent Performance Snapshot (Advanced Feature) */}
                        <div className="p-3 mt-3 rounded-3 profile-stats-box">
                            <p className='fw-bold text-uppercase small text-muted mb-3 border-bottom pb-2'>My Snapshot (Real-time)</p>
                            <Row className="text-center">
                                <Col xs={6}>
                                    <h5 className="fw-bolder text-primary mb-0">{totalClients.toLocaleString()}</h5>
                                    <small className='text-muted d-flex align-items-center justify-content-center gap-1'><PeopleFill/> Clients</small>
                                </Col>
                                <Col xs={6} className='border-start'>
                                    <h5 className="fw-bolder text-info mb-0">{totalPolicies.toLocaleString()}</h5>
                                    <small className='text-muted d-flex align-items-center justify-content-center gap-1'><ClipboardData/> Policies</small>
                                </Col>
                            </Row>
                        </div>
                    </Card>
                </Col>

                {/* === RIGHT COLUMN: DETAILS & SETTINGS === */}
                <Col lg={8}>
                    {/* DETAILS CARD */}
                    <Card className="p-4 mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                            <h5 className="fw-bold m-0 text-dark">Personal Information</h5>
                            <Button 
                                variant={isEditing ? "success" : "primary"} 
                                size="sm" 
                                className="rounded-pill fw-bold" 
                                onClick={() => isEditing ? handleUpdateProfile(new Event('submit')) : setIsEditing(true)}
                                type={isEditing ? "submit" : "button"}
                                disabled={loading}
                            >
                                <PencilSquare className='me-2'/> {isEditing ? "Save Changes" : "Edit Profile"}
                            </Button>
                        </div>
                        
                        <Form onSubmit={handleUpdateProfile}>
                            {/* Name and Email Row */}
                            <Row className="g-3 mb-3">
                                <Col md={6}>
                                    <ProfileDetailItem 
                                        label="Full Name" 
                                        icon={PersonCircle} 
                                        value={formState.name} 
                                        name="name"
                                        isEditing={isEditing} 
                                        onChange={handleInputChange}
                                    />
                                </Col>
                                <Col md={6}>
                                    <ProfileDetailItem 
                                        label="Email Address (Login ID)" 
                                        icon={EnvelopeFill} 
                                        value={user.email} 
                                        isEditing={false} // Email change is complex, keep read-only here
                                        tooltip="Email can only be updated via the Security Console."
                                    />
                                </Col>
                            </Row>
                            
                            {/* Phone and Address Row */}
                            <Row className="g-3 mb-3">
                                <Col md={6}>
                                    <ProfileDetailItem 
                                        label="Phone Number" 
                                        icon={PhoneFill} 
                                        value={formState.phone} 
                                        name="phone"
                                        isEditing={isEditing} 
                                        onChange={handleInputChange}
                                        type="tel"
                                    />
                                </Col>
                                <Col md={6}>
                                    <ProfileDetailItem 
                                        label="Operating Address" 
                                        icon={GeoAltFill} 
                                        value={formState.address} 
                                        name="address"
                                        isEditing={isEditing} 
                                        onChange={handleInputChange}
                                    />
                                </Col>
                            </Row>

                            {/* Hidden submit button to allow form submission via Enter key */}
                            {isEditing && <button type="submit" style={{ display: 'none' }} />}
                        </Form>
                        
                        {/* Security Settings (Advanced Feature) */}
                        <div className="mt-5 pt-3 border-top">
                            <h5 className="fw-bold m-0 text-dark mb-3">Security & Access</h5>
                            <Card className='p-3 shadow-sm'>
                                <Row className="align-items-center">
                                    <Col xs={1}><LockFill size={20} className='text-danger'/></Col>
                                    <Col xs={7}>
                                        <p className="fw-bold m-0">Change Password</p>
                                        <small className="text-muted">Maintain account security by updating your password regularly.</small>
                                    </Col>
                                    <Col xs={4} className="text-end">
                                        <Button variant="outline-danger" size="sm" className="rounded-pill" onClick={handleChangePassword}>
                                            Reset
                                        </Button>
                                    </Col>
                                </Row>
                            </Card>
                        </div>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

// ===============================================
// Detail Item Sub-Component (Re-usable for display/edit)
// ===============================================
const ProfileDetailItem = ({ label, icon: Icon, value, name, isEditing, onChange, type = 'text', tooltip }) => (
    <div className='profile-detail-group'>
        <label className="text-muted small fw-bold mb-1 d-block">{label}</label>
        <div className="input-group">
            <span className="input-group-text bg-light border-end-0">
                <Icon size={18} className='text-primary'/>
            </span>
            <Form.Control
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                readOnly={!isEditing}
                placeholder={`Enter ${label}`}
                className={!isEditing ? 'bg-white border-start-0' : 'border-start-0'}
                title={tooltip || ''}
            />
        </div>
    </div>
);