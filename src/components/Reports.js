// src/components/Reports.js

import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Dropdown, Spinner, Alert } from 'react-bootstrap';
import { 
    GraphUp, 
    PeopleFill, 
    CurrencyRupee, 
    ClipboardData,
    CalendarCheck,
    ExclamationTriangleFill,
    Clock,
    ShieldCheck
} from 'react-bootstrap-icons';
import { db } from '../firebase';
import { collection, getDocs, onSnapshot } from 'firebase/firestore'; 


// ===============================================
// Policy Health Status Helper (Local copy for aggregation)
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
// REAL-TIME DATA AGGREGATION HOOK
// ===============================================
const useRealTimeReports = (timeframe) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        
        // 1. Setup customers listener
        const customersRef = collection(db, "customers");
        // We use onSnapshot here to listen for changes to the main customer list
        const unsubscribe = onSnapshot(customersRef, async (snapshot) => {
            
            // Reset main counters
            let totalClients = snapshot.size;
            let totalPolicies = 0;
            let totalAnnualPremium = 0;
            let policyHealth = { onTrack: 0, dueSoon: 0, overdue: 0 };
            let monthlyPremiumTrend = {}; 

            // Timeframe filtering setup (Currently kept simple as M30 and YTD show all data)
            const filterDate = new Date();
            if (timeframe === 'YTD') {
                filterDate.setMonth(0, 1);
            }
            filterDate.setHours(0, 0, 0, 0);

            // Helper functions
            const getAnnualFactor = (mode) => {
                switch (mode) {
                    case 'Monthly': return 12;
                    case 'Quarterly': return 4;
                    case 'Half-Yearly': return 2;
                    case 'Yearly': return 1;
                    default: return 12;
                }
            };
            
            // 2. Aggregate data from each customer's nested 'policies' collection
            const policyPromises = snapshot.docs.map(async (customerDoc) => {
                const policiesRef = collection(db, "customers", customerDoc.id, "policies");
                // getDocs is used here for nested aggregation, inside the top-level onSnapshot
                const policiesSnapshot = await getDocs(policiesRef); 

                policiesSnapshot.docs.forEach(policyDoc => {
                    const policy = policyDoc.data();
                    const premium = Number(policy.premium || 0);
                    const dueDateStr = policy.dueDate;

                    if (premium > 0) {
                        // A. Calculate Total Policies and Annual Premium
                        totalPolicies++;
                        totalAnnualPremium += premium * getAnnualFactor(policy.mode);

                        // B. Policy Health Distribution
                        const healthStatus = getPolicyHealth(dueDateStr);
                        policyHealth[healthStatus]++;
                        
                        // C. Monthly Premium Trend (using due date month)
                        if (dueDateStr) {
                             const dueDate = new Date(dueDateStr);
                             
                             // Calculate the key (e.g., "2025-11")
                             const year = dueDate.getFullYear();
                             const month = dueDate.getMonth();
                             const trendKey = `${year}-${String(month + 1).padStart(2, '0')}`;
                            
                             // Aggregate premium due for the month
                             monthlyPremiumTrend[trendKey] = (monthlyPremiumTrend[trendKey] || 0) + premium;
                        }
                    }
                });
            });

            await Promise.all(policyPromises);

            // 3. Process Trend Data (Last 6 available months)
            const allKeys = Object.keys(monthlyPremiumTrend).sort();
            const sortedKeys = allKeys.slice(-6); // Last 6 months
            const trendData = sortedKeys.map(key => monthlyPremiumTrend[key]);
            
            // Generate labels for the chart
            const chartLabels = sortedKeys.map(key => {
                const [year, month] = key.split('-');
                return new Date(year, month - 1).toLocaleString('en-IN', { month: 'short', year: 'numeric' });
            });


            setData({
                totalClients: totalClients,
                totalPolicies: totalPolicies,
                annualPremium: totalAnnualPremium,
                policyHealth: policyHealth,
                monthlyPremiumTrend: trendData,
                monthlyTrendLabels: chartLabels,
            });
            setLoading(false);

        }, (e) => {
            console.error("Real-Time Reports Firestore Error:", e);
            setError("Could not fetch real-time reports data.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [timeframe]);

    return { data, loading, error };
};
// ----------------------------------------------------


// --- Small Metric Card Component (Unchanged) ---
const MetricCard = ({ title, value, icon: Icon, variant, change }) => (
    <Card className="h-100 p-3 shadow-sm border-0 report-metric-card">
        <div className="d-flex justify-content-between align-items-start">
            <div>
                <p className="text-muted small mb-0 fw-bold text-uppercase">{title}</p>
                <h4 className="fw-bolder mb-0 text-dark">
                    {title.includes('Premium') ? '₹ ' : ''}
                    {value.toLocaleString('en-IN')}
                </h4>
            </div>
            <Icon size={30} className={`text-${variant} p-1 rounded`} style={{ backgroundColor: `rgba(${variant === 'primary' ? '13, 110, 253, 0.1' : variant === 'success' ? '25, 135, 84, 0.1' : variant === 'info' ? '13, 202, 240, 0.1' : '108, 117, 125, 0.1'})` }} />
        </div>
        {/* Placeholder for change / date */}
        <small className={`mt-2 fw-bold text-muted`}>
            <span className='text-muted fw-normal'>Dynamic Data ({new Date().toLocaleDateString()})</span>
        </small>
    </Card>
);

// --- Chart Placeholder Component (Unchanged) ---
const ChartWidget = ({ title, icon: Icon, children }) => (
    <Card className="h-100 shadow-sm border-0">
        <Card.Header className="bg-white border-bottom-0 d-flex align-items-center gap-2 pt-4">
            <Icon size={20} className="text-primary"/>
            <h5 className="fw-bold m-0 text-dark">{title}</h5>
        </Card.Header>
        <Card.Body>
            {children}
        </Card.Body>
    </Card>
);


export default function Reports() {
    const [timeframe, setTimeframe] = useState('YTD'); 
    const { data: reportsData, loading, error } = useRealTimeReports(timeframe);

    // Data Processing for rendering
    const totalPolicies = reportsData?.totalPolicies || 0;
    const { onTrack, dueSoon, overdue } = reportsData?.policyHealth || { onTrack: 0, dueSoon: 0, overdue: 0 };
    
    // Icon mapping for policy health
    const HealthIconMap = {
        onTrack: ShieldCheck,
        dueSoon: Clock,
        overdue: ExclamationTriangleFill
    };
    
    // Determine max revenue for chart scaling
    const maxRevenue = reportsData?.monthlyPremiumTrend.length > 0 
        ? Math.max(...reportsData.monthlyPremiumTrend) : 1;


    return (
        <Container className="py-4 py-lg-5 reports-page-advanced">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold text-dark m-0">Performance Overview</h2>
                
                {/* Timeframe Filter Dropdown */}
                <Dropdown>
                    <Dropdown.Toggle variant="light" id="dropdown-timeframe" className='rounded-pill d-flex align-items-center gap-2 border fw-bold'>
                        <CalendarCheck /> Overall Performance
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                        <Dropdown.Item onClick={() => setTimeframe('YTD')} active={timeframe === 'YTD'}>
                            Year-to-Date (YTD)
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => setTimeframe('M30')} active={timeframe === 'M30'}>
                            Overall Performance
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </div>
            
            {error && <Alert variant="danger" className='fw-bold'>{error}</Alert>}

            {loading || !reportsData ? (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" role="status" className='mb-3'/>
                    <p className='text-muted fw-bold'>COMPILING REAL-TIME ANALYTICS...</p>
                </div>
            ) : (
                <>
                    {/* === 1. KEY METRIC CARDS (REAL DATA) === */}
                    <Row className="g-4 mb-5">
                        <Col lg={4}>
                            <MetricCard 
                                title="Total Clients" 
                                value={reportsData.totalClients} 
                                icon={PeopleFill} 
                                variant="primary"
                            />
                        </Col>
                        <Col lg={4}>
                            <MetricCard 
                                title="Total Policies" 
                                value={reportsData.totalPolicies} 
                                icon={ClipboardData} 
                                variant="info"
                            />
                        </Col>
                        <Col lg={4}>
                            <MetricCard 
                                title="Annual Premium Est." 
                                value={reportsData.annualPremium} 
                                icon={CurrencyRupee} 
                                variant="success"
                            />
                        </Col>
                    </Row>

                    {/* === 2. POLICY HEALTH DISTRIBUTION (REAL DATA) === */}
                    <Row className="g-4 mb-5">
                        <Col lg={5}>
                            <ChartWidget title="Policy Health Distribution" icon={ClipboardData}>
                                <div className="text-center py-2">
                                    <h6 className="fw-bold text-dark">Policy Status Snapshot</h6>
                                    <p className="text-muted small">Total Policies Analyzed: {totalPolicies.toLocaleString()}</p>
                                </div>
                                
                                {/* Data Breakdown (REAL DATA - FIX: Using HealthIconMap correctly) */}
                                <div className="d-flex flex-column gap-3 mt-4 small">
                                    
                                    {/* On Track */}
                                    <div className="d-flex justify-content-between align-items-center fw-bold text-success border-bottom pb-2">
                                        <div className='d-flex align-items-center gap-2'>
                                            {/* FIX: Using PascalCase Component */}
                                            {React.createElement(HealthIconMap.onTrack, { size: 16 })} <span>On Track</span>
                                        </div>
                                        <span>{onTrack.toLocaleString()} ({((onTrack / totalPolicies) * 100).toFixed(1)}%)</span>
                                    </div>
                                    
                                    {/* Due Soon */}
                                    <div className="d-flex justify-content-between align-items-center fw-bold text-warning border-bottom pb-2">
                                        <div className='d-flex align-items-center gap-2'>
                                            {/* FIX: Using PascalCase Component */}
                                            {React.createElement(HealthIconMap.dueSoon, { size: 16 })} <span>Due Soon (Next 7 Days)</span>
                                        </div>
                                        <span>{dueSoon.toLocaleString()} ({((dueSoon / totalPolicies) * 100).toFixed(1)}%)</span>
                                    </div>
                                    
                                    {/* Overdue */}
                                    <div className="d-flex justify-content-between align-items-center fw-bold text-danger">
                                        <div className='d-flex align-items-center gap-2'>
                                            {/* FIX: Using PascalCase Component */}
                                            {React.createElement(HealthIconMap.overdue, { size: 16 })} <span>Overdue</span>
                                        </div>
                                        <span>{overdue.toLocaleString()} ({((overdue / totalPolicies) * 100).toFixed(1)}%)</span>
                                    </div>
                                </div>
                            </ChartWidget>
                        </Col>
                        
                        {/* === 3. ANNUAL PREMIUM TREND (REAL DATA) === */}
                        <Col lg={7}>
                            <ChartWidget title="Last 6 Month Premium Due Trend" icon={GraphUp}>
                                <div className="text-center py-2">
                                    <h6 className="fw-bold text-dark">Monthly Premium Due (Lakhs)</h6>
                                </div>
                                <div className="py-4">
                                    <div className="bg-light rounded p-4 border mx-auto" style={{ height: '250px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: '10px' }}>
                                        {reportsData.monthlyPremiumTrend.length > 0 ? (
                                            reportsData.monthlyPremiumTrend.map((rev, index) => (
                                                <div 
                                                    key={index} 
                                                    className="text-center position-relative" 
                                                    style={{ 
                                                        width: '15%', 
                                                        height: `${(rev / maxRevenue) * 80 + 20}%`, 
                                                        backgroundColor: index === reportsData.monthlyPremiumTrend.length - 1 ? 'var(--primary-color)' : 'var(--secondary-color)', 
                                                        borderRadius: '5px 5px 0 0', 
                                                        opacity: 0.8, 
                                                        transition: 'all 0.5s ease' 
                                                    }}
                                                >
                                                    <small className='d-block fw-bold position-absolute' style={{top: '-25px', width: '100%', left: 0}} title={`₹${rev.toLocaleString()}`}>
                                                        ₹{(rev / 100000).toFixed(1)}L
                                                    </small>
                                                </div>
                                            ))
                                        ) : (
                                             <div className="text-center text-muted w-100 py-5">No Premium Due Data Available for the last 6 months.</div>
                                        )}
                                    </div>
                                    <div className="d-flex justify-content-around mt-2">
                                        {reportsData.monthlyTrendLabels.map((label, index) => (
                                            <small key={index} className='text-muted' style={{ width: '15%' }}>{label}</small>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-muted small text-center mt-3">
                                    This chart shows the total *Premium Due* in each of the last 6 months based on policy due dates.
                                </p>
                            </ChartWidget>
                        </Col>
                    </Row>
                </>
            )}
        </Container>
    );
}