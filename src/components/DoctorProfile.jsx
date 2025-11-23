import React, { useState,useEffect } from 'react';
import { FaCalendarAlt, FaUserAlt, FaFileAlt, FaStethoscope, FaUserEdit } from 'react-icons/fa'; 
import Footer from './DFooter';
import Header from './DHeader';
import { useNavigate } from 'react-router-dom';
import '../Styling/Doctor.css';

function DoctorHome() {

  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCancelPopup, setShowCancelPopup] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [appointmentsData, setAppointmentsData] = useState(null);
  const user = JSON.parse(sessionStorage.getItem('user'));

  async function loadData() {
    try {
      const id=user.doctor_id
      const response = await fetch(`http://localhost:3002/api/appointments/${id}`);
      if (response.ok) {
        const data = await response.json();
        setAppointmentsData(data);
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

  // const patientsData = [
  //   { name: 'Maham Farooqi', appointmentTime: '10:00 AM' },
  //   { name: 'Rameen Rafiq', appointmentTime: '11:30 AM' },
  // ];
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const todayDate = getTodayDate();
  const todayAppointments = appointmentsData
    ? appointmentsData.filter((appointment) => appointment.appointment_date === todayDate)
    : [];

  // const filteredPatients = todayDate.filter((patient) =>
  //   patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //   patient.appointmentTime.includes(searchTerm)
  // );

  const filteredAppointments = appointmentsData
  ? appointmentsData.filter((appointment) =>
      appointment.patient_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.appointment_time.includes(searchTerm)
    )
  : [];

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleEditProfileClick = () => {
    navigate('/doctor/Profile');
  };

  const handleGoToScheduleClick = () => {
    navigate('/doctor/schedule');
  };

  const handleRescheduleClick = (appointment) => {
    navigate('/doctor/patients', { state: { rescheduleAppointment: appointment } });
  };

  const handleCancelClick = (appointment) => {
    setAppointmentToCancel(appointment.appointment_id);
    console.log(appointment.appointment_id)
    setShowCancelPopup(true);
  };

  const confirmCancel = async () => {
    try {
      // Send the request to update the appointment status to 'Cancelled'
      const response = await fetch(`http://localhost:3002/api/appointments/${appointmentToCancel}/cancel`, {
        method: 'PUT',
      });
  
      if (response.ok) {
        const data = await response.json();
        alert(data.message);
  
        setAppointmentsData((prevData) =>
          prevData.filter((appointment) => appointment.id !== appointmentToCancel.id)
        );
      } else {
        const errorData = await response.json();
        alert(`Failed to cancel: ${errorData.message}`);
      }
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      alert('An error occurred while cancelling the appointment');
    } finally {
      setShowCancelPopup(false);
      setAppointmentToCancel(null);
    }
  };
  

  const closeCancelPopup = () => {
    setShowCancelPopup(false);
    setAppointmentToCancel(null);
  };


  return (
    <div className="doctor-home">
      <Header />
      <div className="doctor-home-content">
        <h1 className="welcome-heading">Welcome, {user.full_name}</h1>
        <p className="welcome-subheading">Manage your appointments and patients seamlessly.</p>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search patients by id..."
            className="search-input"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        <div className="summary-tiles">
          <div className="tile">
            <h2>Upcoming Appointments</h2>
            <FaCalendarAlt className="tile-icon" />
            <p>{filteredAppointments.length} Scheduled</p>
            <button className="action-btn" onClick={handleGoToScheduleClick}>
              Go to Schedule
            </button>
          </div>
          <div className="tile">
            <h2>Today's Patients</h2>
            <FaUserAlt className="tile-icon" />
            <p>{todayAppointments.length} Consultations</p>
            <button className="action-btn" onClick={() => navigate('/doctor/patient-history')}>
              Patient History
            </button>
          </div>
          <div className="tile">
            <h2>Reports</h2>
            <FaFileAlt className="tile-icon" />
            <p>3 Awaiting Review</p>
            <button className="action-btn" onClick={() => navigate('/doctor/reports')}>
              Review Reports
            </button>
          </div>
        </div>

        {/* <div className="notifications">
          <h2>Recent Notifications</h2>
          <ul className="notifications-list">
            <li>New appointment scheduled for 11:30 AM with Rameen Rafiq</li>
            <li>Pending reports for 3 patients</li>
            <li>Reminder: Check today's patient history</li>
          </ul>
        </div> */}

        <div className="appointment-actions">
          <h2>Upcoming Appointments</h2>
          <div className="appointments-table-container">
            <table className="appointments-table">
              <thead>
                <tr>
                  <th>Patient_ID</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((appointment, index) => (
                  <tr key={index}>
                    <td>{appointment.patient_id}</td>
                    <td>{appointment.appointment_time}</td>
                    <td>{appointment.status}</td>
                    <td>
                      <button
                        className="action-btn"
                        onClick={() => handleRescheduleClick(appointment)}
                      >
                        Reschedule
                      </button>
                      <button
                        className="action-btn"
                        onClick={() => handleCancelClick(appointment)}
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="interaction-settings">
          {/* <div className="patient-interaction">
            <h2>Patient Interaction</h2>
            <FaStethoscope className="button-icon" style={{ color: 'black', marginBottom: '10px' }} />
            <button className="chat-btn" onClick={() => navigate('/doctor/chats')}>
              Chat with Patients
            </button>
          </div> */}
          {/* <div className="edit-profile">
            <h2>Profile Setting</h2>
            <FaUserEdit className="button-icon" style={{ color: 'black', marginBottom: '10px' }} />
            <button className="edit-profile-btn" onClick={handleEditProfileClick}>
              Edit Profile
            </button>
          </div> */}
        </div>

        {showCancelPopup && (
          <div className="cancel-popup">
            <div className="popup-content">
              <h3>Cancel Appointment</h3>
              <p>Are you sure you want to cancel the appointment for {appointmentToCancel.patient} at {appointmentToCancel.time}?</p>
              <div className="popup-actions">
                <button className="confirm-btn" onClick={confirmCancel}>
                  Yes, Cancel
                </button>
                <button className="cancel-btn" onClick={closeCancelPopup}>
                  No, Keep
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default DoctorHome;
