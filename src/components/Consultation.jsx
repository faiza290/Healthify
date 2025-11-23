import React, { useState,useEffect } from 'react';
import { FaStethoscope, FaClipboardList } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from './DHeader';
import Footer from './DFooter';
import '../Styling/Consultation.css';

function Consultation() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [patientDetails, setPatientDetails] = useState(null);
    const [medicine, setMedicine] = useState('');
    const [dosage, setDosage] = useState('');
    const [duration, setDuration] = useState('');
    const [diagnosis, setDiagnosis] = useState(''); 
    const [savedPrescriptions, setSavedPrescriptions] = useState([]);
    const [prescriptionMessage, setPrescriptionMessage] = useState('');
    const [patientsData, setPatientsData] = useState([]);

    async function loadData() {
        try {
          const user= JSON.parse(sessionStorage.getItem('user'));
          const id=user.doctor_id
          const response = await fetch(`http://localhost:3002/api/patients/${id}`);
          if (response.ok) {
            const data = await response.json();
            setPatientsData(data);
          } else {
            console.error('Failed to fetch appointments:', response.statusText);
          }
        } catch (error) {
          console.error('Error fetching appointments:', error);
        }
    }
      
    
      useEffect(() => {
        loadData();
      }, []);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handlePatientSelection = (patient) => {
        setPatientDetails(patient);
    };

    const handleStartConsultation = () => {
        if (!patientDetails) {
            alert('Please select a patient first!');
            return;
        }
        navigate('/chat-room', { state: { patient: patientDetails } });
    };
    
    const handleSavePrescription = async () => {
        if (!medicine.trim() && !dosage.trim() && !duration.trim() && !diagnosis.trim()) {
            setPrescriptionMessage('No prescription or diagnosis provided.');
            return;
        }
    
        const prescriptionData = {
            patientId: patientDetails.patient_id,
            medicine,
            dosage,
            duration,
            diagnosis: diagnosis || patientDetails.condition, 
        };
    
        try {
            console.log(prescriptionData.patientId);
            const response = await fetch('http://localhost:3002/api/prescriptions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(prescriptionData),
            });
    
            if (response.ok) {
                const result = await response.json();
                alert(result.message);
    
                const newPrescription = {
                    date: new Date().toLocaleDateString(),
                    diagnosis: prescriptionData.diagnosis,
                    prescription: `${medicine} - ${dosage} - ${duration}`,
                };
                setSavedPrescriptions((prev) => [...prev, newPrescription]);
    
                setMedicine('');
                setDosage('');
                setDuration('');
                setDiagnosis('');
            } else {
                const error = await response.json();
                alert(`Failed to save prescription: ${error.message}`);
            }
        } catch (error) {
            console.error('Error saving prescription:', error);
            alert('An error occurred while saving the prescription.');
        }
    };    

    // const patientsData = [
    //     { id: 1, name: 'Maham Farooqi', age: 32, condition: 'Headache', image: '../Asset/patient2.jpg' },
    //     { id: 2, name: 'Rameen Rafiq', age: 28, condition: 'Back Pain', image: '../Asset/patient1.jpg' },
    // ];

    const filteredPatients =  (patientsData || []).filter((patient) =>
        patient.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="consultation-page">
            <Header />
            <div className="consultation-content">
                <h1 className="page-heading">Consultation Dashboard</h1>
                <p className="page-subheading">Manage your patient consultations here.</p>

                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Search patients..."
                        className="search-input"
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                </div>

                <div className="patient-list">
                    <h2 style={{ marginLeft: "7.5rem" }}>Patients</h2>
                    <div className="patients-table-container">
                        <table className="patients-table">
                            <thead>
                                <tr>
                                    <th>Patient</th>
                                    <th>Date of Birth</th>
                                    {/* <th>Condition</th> */}
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPatients.map((patient, index) => (
                                    <tr key={index}>
                                        <td className="patient-name-image">
                                            <img src={`../Asset/${patient.profile}.jpg`} 
                                            alt={patient.full_name} />
                                            <span>{patient.full_name}</span>
                                        </td>
                                        <td>{patient.date_of_birth}</td>
                                        {/* <td>{patient.condition}</td> */}
                                        <td>
                                            <button
                                                className="action-btn"
                                                onClick={() => handlePatientSelection(patient)}
                                            >
                                                Select
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {patientDetails && (
                    <div className="patient-consultation">
                        <h2>Consultation with {patientDetails.full_name}</h2>
                        {/* <div className="consultation-details">
                            <p><strong>Age:</strong> {patientDetails.age}</p>
                            <p><strong>Condition:</strong> {patientDetails.condition}</p>
                        </div> */}

                        {/* <div className="consultation-actions">
                            <button
                                className="action-btn"
                                onClick={handleStartConsultation}
                            >
                                Start Consultation
                            </button>
                        </div> */}

                        <div className="prescription-section">
                            <h3>Prescription</h3>
                            <div className="prescription-inputs">
                                <input
                                    type="text"
                                    placeholder="Medicine"
                                    value={medicine}
                                    onChange={(e) => setMedicine(e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="Dosage"
                                    value={dosage}
                                    onChange={(e) => setDosage(e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="Duration"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="Diagnosis"
                                    value={diagnosis}
                                    onChange={(e) => setDiagnosis(e.target.value)}
                                />
                            </div>
                            <button
                                className="save-prescription-btn"
                                onClick={handleSavePrescription}
                            >
                                Save Prescription
                            </button>
                            <div>
                                <h4>Saved Prescriptions:</h4>
                                {savedPrescriptions.length > 0 ? (
                                    <ul>
                                        {savedPrescriptions.map((pres, index) => (
                                            <li key={index}>
                                                {pres.prescription} - {pres.date} - Diagnosis: {pres.diagnosis}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>{prescriptionMessage || 'No medicine prescribed.'}</p>  
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="interaction-settings">
                    {/* <div className="patient-interaction">
                        <h2>Patient Interaction</h2>
                        <FaStethoscope className="button-icon" />
                        <button className="chat-btn" onClick={() => navigate('/doctor/chats')}>
                            Chat with Patients
                        </button>
                    </div> */}
                    <div className="patient-history" style={{ marginTop: "40px" }}>
                        <h2>Patient History</h2>
                        <FaClipboardList className="button-icon" />
                        <button className="patient-history-btn" onClick={() => navigate('/doctor/patient-history')}>
                            View History
                        </button>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}

export default Consultation;
