const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bodyParser = require("body-parser");

let con;

mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "abc123",
    database: "healthify",
})
    .then((connection) => {
        con = connection;
        console.log("Connected to MySQL database!");
    })
    .catch((err) => {
        console.error("Error connecting to MySQL:", err);
    });

const app = express();
const port = 3002;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Backend login route for doctors
app.post('/doctor/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const query = `
            SELECT 
                D.doctor_id, 
                U.full_name, 
                D.specialization, 
                U.contact_number
            FROM 
                Doctors D
            INNER JOIN 
                Users U ON D.user_id = U.user_id
            WHERE 
                U.email = ? AND U.password = ?;
        `;
        const [rows] = await con.query(query, [email, password]);

        if (rows.length === 0) {
            return res.status(400).send('Invalid email or password');
        }

        // Send back doctor data (doctorId, full name, specialization, etc.)
        res.json({ doctor: rows[0] });
    } catch (err) {
        console.error("Error executing query:", err);
        res.status(500).send("Failed to login");
    }
});


// 1. View Doctor’s Appointments
app.get("/doctor/appointments/:id", async (req, res) => {
    try {
        const doctorId = req.params.id;
        const query = `
            SELECT 
                A.appointment_id,
                DATE_FORMAT(A.appointment_date, '%Y-%m-%d') AS appointment_date,
                A.appointment_time,
                P.full_name AS patient_name,
                A.room_id,
                A.status
            FROM 
                Appointments A
            INNER JOIN 
                Patients P ON A.patient_id = P.patient_id
            WHERE 
                A.doctor_id = ?
            ORDER BY 
                A.appointment_date DESC;
        `;
        const [rows] = await con.query(query, [doctorId]);
        res.json(rows);
    } catch (err) {
        console.error("Error executing query:", err);
        res.status(500).send("Failed to fetch appointments");
    }
});

// 2. Update Appointment Status
app.put("/doctor/appointments/:id", async (req, res) => {
    try {
        const appointmentId = req.params.id;
        const { status } = req.body; // Status can be 'Confirmed', 'Completed', 'Cancelled'
        const query = "UPDATE Appointments SET status = ? WHERE appointment_id = ?";
        const [result] = await con.query(query, [status, appointmentId]);
        res.send({ success: true, result });
    } catch (err) {
        console.error("Error executing query:", err);
        res.status(500).send("Failed to update appointment status");
    }
});

// 3. Get Doctor’s Profile
app.get("/doctor/profile/:id", async (req, res) => {
    try {
        const doctorId = req.params.id;
        const query = `
            SELECT 
                D.doctor_id, 
                U.full_name, 
                D.specialization, 
                D.phone_number
            FROM 
                Doctors D
            INNER JOIN 
                Users U ON D.user_id = U.user_id
            WHERE 
                D.doctor_id = ?;
        `;
        const [rows] = await con.query(query, [doctorId]);
        res.json(rows[0] || {});
    } catch (err) {
        console.error("Error executing query:", err);
        res.status(500).send("Failed to fetch doctor profile");
    }
});
app.get('/api/doctor-profile/:id', async (req, res) => {
    try {
      const { id } = req.params;
      console.log(id);
      const [user] = await con.query('Select a.*,u.* from users u join doctors a on a.user_id=u.user_id where a.user_id=?', [id]);
      if (user.length === 0) {
        return res.status(404).send('User not found');
      }
      res.send(user[0]);
    } catch (err) {
      console.error('Error fetching user:', err);
      res.status(500).send('Failed to fetch user');
    }
  });
// 4. Get All Patients for a Doctor
app.get("/api/patients/:id", async (req, res) => {
    try {
        const doctorId = req.params.id;
        const query = `
            Select u.full_name,DATE_FORMAT(u.date_of_birth, '%Y-%m-%d') AS date_of_birth,u.contact_number,a.status,a.appointment_time,p.patient_id,a.appointment_id from 
            users u join patients p on u.user_id=p.user_id
            join appointments a on
            p.patient_id=a.patient_id where a.doctor_id=?;
        `;
        const [rows] = await con.query(query, [doctorId]);
        res.json(rows);
    } catch (err) {
        console.error("Error executing query:", err);
        res.status(500).send("Failed to fetch patients");
    }
});


app.get('/api/appointments/:id', async (req, res) => {
    try {
        const doctorId = req.params.id;
        const query = `Select * from appointments where doctor_id=?`;
        const [rows] = await con.query(query, [doctorId]);
        res.json(rows);
    } catch (err) {
        console.error("Error executing query:", err);
        res.status(500).send("Failed to fetch patients");
    }

});

app.get('/api/diagnosis/:id', async (req, res) => {
    try {
        const Id = req.params.id;
        const query = `Select * from diagnosis where patient_id=?`;
        const [rows] = await con.query(query, [Id]);
        res.json(rows);
    } catch (err) {
        console.error("Error executing query:", err);
        res.status(500).send("Failed to fetch patients");
    }

});

app.put('/api/appointments/:id/cancel', async (req, res) => {
    try {
        const appointmentId = req.params.id;

        // SQL query to update the appointment status to 'Cancelled'
        const query = `UPDATE appointments SET status = 'Cancelled' WHERE appointment_id = ?`;
        const [result] = await con.query(query, [appointmentId]);

        // Check if any rows were affected (i.e., an appointment was updated)
        if (result.affectedRows > 0) {
            res.status(200).json({ message: 'Appointment status updated to Cancelled successfully' });
        } else {
            res.status(404).json({ message: 'Appointment not found' });
        }
    } catch (err) {
        console.error("Error executing query:", err);
        res.status(500).send("Failed to update appointment status");
    }
});

app.put('/api/reshedule/:id', async (req, res) => {
    try {
        const appointmentId = req.params.id;
        const { date, time } = req.body;

        // Validate input
        if (!date || !time) {
            return res.status(400).json({ message: "Date and time are required" });
        }

        // SQL query to update the appointment date and time
        const query = `
            UPDATE appointments 
            SET appointment_date = ?, appointment_time = ? 
            WHERE appointment_id = ?`;
        const [result] = await con.query(query, [date, time, appointmentId]);

        // Check if any rows were affected (i.e., an appointment was updated)
        if (result.affectedRows > 0) {
            res.status(200).json({ message: "Appointment rescheduled successfully" });
        } else {
            res.status(404).json({ message: "Appointment not found" });
        }
    } catch (err) {
        console.error("Error executing query:", err);
        res.status(500).send("Failed to reschedule appointment");
    }
});

app.post("/api/prescriptions", async (req, res) => {
    try {
        const { patientId, medicine, dosage, duration, diagnosis } = req.body;
        
        const query = `
            INSERT INTO Prescriptions (patient_id, medicine, dosage, duration, diagnosis, date)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        const currentDate = new Date().toISOString().slice(0, 19).replace("T", " "); 
        
        const [result] = await con.query(query, [patientId, medicine, dosage, duration, diagnosis, currentDate]);
        
        res.send({ success: true, message: "Prescription saved successfully", result });
    } catch (err) {
        console.error("Error executing query:", err);
        res.status(500).send("Failed to save prescription");
    }
});

app.get('/api/prescriptions/:patientId', async (req, res) => {
    const { patientId } = req.params;
    try {
        const [history] = await con.query(
            'SELECT DATE_FORMAT(date, "%Y-%m-%d") AS date, diagnosis, CONCAT(medicine, " - ", dosage, " - ", duration) AS prescription FROM Prescriptions WHERE patient_id = ?',
            [patientId]
        );
        res.json(history);
    } catch (err) {
        console.error('Error fetching patient history:', err);
        res.status(500).send('Failed to fetch history');
    }
});

app.post("/api/update-profile", async (req, res) => {
    try {
        const { id, name, email, password } = req.body;

        if (!id|| !name || !email || !password) {
            return res.status(400).send({ success: false, message: "All fields are required." });
        }

        const query = `
            UPDATE Users 
            SET full_name = ?, email = ?, password = ?
            WHERE user_id = ?
        `;

        const [result] = await con.query(query, [name, email, password,id]);

        if (result.affectedRows === 0) {
            return res.status(404).send({ success: false, message: "User not found." });
        }

        res.send({ success: true, message: "Profile updated successfully", result });
    } catch (err) {
        console.error("Error executing query:", err);
        res.status(500).send({ success: false, message: "Failed to update profile." });
    }
});


app.listen(port, () => {
    console.log(`Doctor's backend running on port ${port}`);
});
