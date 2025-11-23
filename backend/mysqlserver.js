const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bodyParser = require("body-parser");

let con;

// Establish MySQL connection
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
const port = 3001;

// Middleware
app.use(bodyParser.json());
app.use(cors());

app.get("/appointments/:id", async (req, res) => {
    try {
        const userId = req.params.id;
        const query = "SELECT A.appointment_id ,DATE_FORMAT(A.appointment_date, '%Y-%m-%d') AS appointment_date,U.full_name,A.appointment_time,A.room_id,A.status FROM Appointments A INNER JOIN Doctors D ON A.doctor_id=D.doctor_id Inner Join Users U on D.user_id=U.user_id where A.patient_id=?";
        const [rows] = await con.query(query, [userId]);
        res.json(rows);
    } catch (err) {
        console.error("Error executing query:", err);
        res.status(500).send("Database query failed");
    }
});

app.get("/labs/:id", async (req, res) => {
    try {
        const userId = req.params.id;
        const query = "SELECT l.labtest_id,l.test_type,DATE_FORMAT(l.test_date,'%Y-%m-%d') AS test_date,l.test_time FROM LabTests l join labreports b on l.labtest_id=b.labtest_id where l.patient_id=? and b.result='N/A'";
        const [rows] = await con.query(query, [userId]);
        res.json(rows);
    } catch (err) {
        console.error("Error executing query:", err);
        res.status(500).send("Database query failed");
    }
});

app.get("/doctor/:id", async (req, res) => {
    try {
        const aId = req.params.id;
        const query = "Select d.start_time,d.end_time from doctors d join Appointments a on d.doctor_id=a.doctor_id where a.appointment_id=?";
        const [row] = await con.query(query, [aId]);
        res.json(row[0]);
    } catch (err) {
        console.error("Error executing query:", err);
        res.status(500).send("Database query failed");
    }
});

app.get("/doctors/:id", async (req, res) => {
    try {
        const aId = req.params.id;
        const query = "Select start_time,end_time from doctors where doctor_id=?";
        const [row] = await con.query(query, [aId]);
        res.json(row[0]);
    } catch (err) {
        console.error("Error executing query:", err);
        res.status(500).send("Database query failed");
    }
});

app.get("/profiles/:id", async (req, res) => {
    try {
        const pid = req.params.id;
        const query = "Select DATE_FORMAT(u.date_of_birth, '%Y-%m-%d') AS date_of_birth,u.full_name,u.email,u.contact_number,u.password,p.status from users u join patients p on u.user_id=p.user_id where p.patient_id=?";
        const [row] = await con.query(query, [pid]);
        res.json(row[0]);
    } catch (err) {
        console.error("Error executing query:", err);
        res.status(500).send("Database query failed");
    }
});
app.get("/lprofiles/:id", async (req, res) => {
    try {
        const pid = req.params.id;
        const query = "Select DATE_FORMAT(u.date_of_birth, '%Y-%m-%d') AS date_of_birth,u.full_name,u.email,u.contact_number,u.password,l.hire_date from users u join labstaff l on u.user_id=l.user_id where l.lab_staff_id=?";
        const [row] = await con.query(query, [pid]);
        res.json(row[0]);
    } catch (err) {
        console.error("Error executing query:", err);
        res.status(500).send("Database query failed");
    }
});

app.get("/labstaffreports/:id", async (req, res) => {
    try {
        const pid = req.params.id;
        const query = "Select r.labreport_id,DATE_FORMAT(l.test_date, '%Y-%m-%d') as test_date,l.test_time,l.test_type,l.patient_id from labtests l join labreports r on l.labtest_id=r.labtest_id where r.result='N/A' and l.staff_id=?";
        const [row] = await con.query(query, [pid]);
        res.json(row);
    } catch (err) {
        console.error("Error executing query:", err);
        res.status(500).send("Database query failed");
    }
});

app.get("/doctors", async (req, res) => {
    try {
        const query = "SELECT U.full_name,D.specialization,D.doctor_id FROM Users U INNER JOIN Doctors D on D.user_id=U.user_id";
        const [rows] = await con.query(query);
        res.json(rows);
    } catch (err) {
        console.error("Error executing query:", err);
        res.status(500).send("Database query failed");
    }
});

app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const query = "SELECT * FROM Users WHERE email=? AND password=?";
        const [users] = await con.query(query, [username, password]);
        if (users.length === 0) {
            return res.status(400).send({ success: false, message: "Invalid id or password" });
        }
        const user = users[0];

        if (user.role === 'patient') {
            const query = "SELECT * FROM Patients WHERE user_id=?";
            const [patients] = await con.query(query, [user.user_id]);

            if (patients.length > 0) {
                user.patient_id = patients[0].patient_id;

            }
        }
        else if (user.role === 'labstaff') {
            const query = "SELECT * FROM labstaff WHERE user_id=?";
            const [labstaff] = await con.query(query, [user.user_id]);

            if (labstaff.length > 0) {
                user.lab_staff_id = labstaff[0].lab_staff_id;

            }
        }
        else if (user.role ==='doctor') {
            const query = "SELECT * FROM doctors WHERE user_id=?";
            const [dd] = await con.query(query, [user.user_id]);
            if (dd.length > 0) {
                user.doctor_id = dd[0].doctor_id;
            }
        }
        else if (user.role ==='admin') {
            const query = "SELECT * FROM admin WHERE user_id=?";
            const [dd] = await con.query(query, [user.user_id]);
            if (dd.length > 0) {
                user.admin_id = dd[0].admin_id;
            }
        }

        res.send({ success: true, user });
    } catch (error) {
        console.error("Error executing query:", error);
        res.status(500).send({ success: false, message: "An error occurred" });
    }
});
   app.post('/api/signup', async (req, res) => {
    const { fullName, email, dob, contactNumber, password } = req.body;
  
    // Validate input (Basic validation for non-empty fields)
    if (!fullName || !email || !dob || !contactNumber || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
  
    try {
      const [results] = await con.query('SELECT * FROM users WHERE email = ?', [email]);
      if (results.length > 0) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      const [maxUserResult] = await con.query('SELECT MAX(user_id) AS maxUserId FROM users');
      const maxUserId = maxUserResult[0].maxUserId || 0; // Default to 0 if no users exist
  
      const newUserId = maxUserId + 1;
  
      const query = 'INSERT INTO users (user_id,full_name, email, date_of_birth, contact_number, password, role) VALUES (?, ?, ?, ?, ?, ?,?)';
      await con.query(query, [newUserId,fullName, email, dob, contactNumber, password, 'patient']);
  
      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      console.error('Error executing query:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });
  

app.post("/resheduleApp", async (req, res) => {
    try {
        const { id, date, time } = req.body;
        const query = "UPDATE Appointments SET appointment_date = ?, appointment_time = ?, status = 'pending' WHERE appointment_id = ?";
        const [result] = await con.query(query, [date, time, id]);
        res.send({ success: true, result });
    } catch (error) {
        console.error("Error executing query:", error);
        res.status(500).send({ success: false, message: "Failed to reschedule appointment" });
    }
});

app.post("/reshedulelab", async (req, res) => {
    try {
        const { id, date, time } = req.body;
        const query = "UPDATE LabTests SET test_date = ?, test_time= ? WHERE labtest_id = ?";
        const [result] = await con.query(query, [date, time, id]);
        res.send({ success: true, result });
    } catch (error) {
        console.error("Error executing query:", error);
        res.status(500).send({ success: false, message: "Failed to reschedule appointment" });
    }
});

app.post("/confirmApp", async (req, res) => {
    try {
        const { pid, date, time, did } = req.body;
        const [rows] = await con.query("SELECT MAX(appointment_id) AS max_id FROM Appointments");

        let nextAppointmentId = "A1";
        if (rows[0].max_id) {
            const maxNumericId = parseInt(rows[0].max_id.substring(1), 10);
            nextAppointmentId = `A${maxNumericId + 1}`;
        }

        const query = `
            INSERT INTO Appointments 
            (appointment_id, patient_id, doctor_id, appointment_date, appointment_time, status) 
            VALUES (?, ?, ?, ?, ?, 'pending')
        `;
        const [result] = await con.query(query, [nextAppointmentId, pid, did, date, time]);

        res.send({ success: true, result });
    } catch (error) {
        console.error("Error executing query:", error);
        res.status(500).send({ success: false, message: "Failed to schedule appointment" });
    }
});


app.delete('/appointments/:id', async (req, res) => {
    try {
        const appointmentId = req.params.id;
        const query = 'DELETE FROM Appointments WHERE appointment_id = ?';
        const [result] = await con.query(query, [appointmentId]);
        if (result.affectedRows > 0) {
            res.status(200).send({ success: true, message: 'Appointment deleted successfully' });
        } else {
            res.status(404).send({ success: false, message: 'Appointment not found' });
        }
    } catch (error) {
        console.error('Error deleting appointment:', error);
        res.status(500).send({ success: false, message: 'Internal server error' });
    }
});

app.delete('/lab/:id', async (req, res) => {
    try {
        const appointmentId = req.params.id;
        const query = 'DELETE FROM labtests WHERE labtest_id = ?';
        const [result] = await con.query(query, [appointmentId]);
        if (result.affectedRows > 0) {
            res.status(200).send({ success: true, message: 'Lab test deleted successfully' });
        } else {
            res.status(404).send({ success: false, message: 'Lab test not found' });
        }
    } catch (error) {
        console.error('Error deleting appointment:', error);
        res.status(500).send({ success: false, message: 'Internal server error' });
    }
});

app.post("/confirmtest", async (req, res) => {
    try {
        const { pid, date, time, test } = req.body;
        let [rows] = await con.query("SELECT MAX(labtest_id) AS max_id FROM labtests");

        let nextAppointmentId = "L1";
        if (rows[0].max_id) {
            const maxNumericId = parseInt(rows[0].max_id.substring(1), 10);
            nextAppointmentId = `L${maxNumericId + 1}`;
        }
        const query = `
           INSERT INTO labtests (labtest_id, test_date, test_time, test_type, patient_id, staff_id)
           VALUES (?, ?, ?, ?, ?, 'L101');
        `;
        const [result] = await con.query(query, [nextAppointmentId, date, time, test, pid]);

         [rows] = await con.query("SELECT MAX(labtest_id) AS max_id FROM labreports");

        let nextAppointment = "LR1";
        if (rows[0].max_id) {
            const maxNumericId = parseInt(rows[0].max_id.substring(1), 10);
            nextAppointment = `LR${maxNumericId + 1}`;
        }
        const labReportQuery = `
           Insert into labreports(labreport_id,labtest_id,result) values(?,?,?);
        `;
        const [labReportResult]  = await con.query(labReportQuery, [nextAppointment, nextAppointmentId,'N/A']);
        res.send({ success: true, result });


    } catch (error) {
        console.error("Error executing query:", error);
        res.status(500).send({ success: false, message: "Failed to schedule appointment" });
    }
});

app.post("/ambulance", async (req, res) => {
    try {
        const { pid, address } = req.body;
        const [rows] = await con.query("SELECT MAX(call_id) AS max_id FROM Calls");

        let nextAppointmentId = "C1";
        if (rows[0].max_id) {
            const maxNumericId = parseInt(rows[0].max_id.substring(1), 10);
            nextAppointmentId = `C${maxNumericId + 1}`;
        }

        const query = `
            INSERT INTO Calls (call_id, patient_id, date, time, address)
            VALUES (?, ?, CURDATE(), CURTIME(), ?);
        `;
        const [result] = await con.query(query, [nextAppointmentId, pid, address]);

        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().split('T')[0];
        const formattedTime = currentDate.toLocaleTimeString('en-US', { hour12: false });

        res.send({
            success: true,
            call_id: nextAppointmentId,
            date: formattedDate,
            time: formattedTime,
            address,
        });

    } catch (error) {
        console.error("Error executing query:", error);
        res.status(500).send({ success: false, message: "Failed to schedule appointment" });
    }
});

app.get("/labreports/:patientId", async (req, res) => {
    const { patientId } = req.params;

    try {

        const query =
            `Select R.labreport_id,DATE_FORMAT(L.test_date, '%Y-%m-%d') AS result_date,L.test_type from LabReports R
             inner join labtests l on l.labtest_id=R.labtest_id where l.patient_id=? and R.result!='N/A'`;

        const [readyReports] = await con.query(query, [patientId]);

        const query2 =
            `Select R.labreport_id,DATE_FORMAT(L.test_date, '%Y-%m-%d') AS result_date,L.test_type from LabReports R
         inner join labtests l on l.labtest_id=R.labtest_id where l.patient_id=? and R.result='N/A'`;

        const [inProgressReports] = await con.query(query2, [patientId]);

        res.send({ success: true, readyReports, inProgressReports });
    } catch (error) {
        console.error("Error fetching lab reports:", error);
        res.status(500).send({ success: false, message: "Failed to fetch lab reports" });
    }
});


app.get("/labtests/:id", async (req, res) => {
    const { id } = req.params;
    const testType = req.query.testType;

    try {
        let query = "";
        if (testType === "Blood Test") {
            query = `
        SELECT resultId, gender,DATE_FORMAT(dob, '%Y-%m-%d') as dob, age, bloodType, hemoglobin, plateletsCount
        FROM BloodTestResults
        WHERE labreport_id = ?
      `;
        } else if (testType === "Diabetic Test") {
            query = `
        SELECT resultId, gender,DATE_FORMAT(dob, '%Y-%m-%d') as dob, age, bloodType, HbA1c, estimatedAvgGlucose
        FROM DiabeticTestResults
        WHERE labreport_id = ?
      `;
        } else if (testType === "Genetic Test") {
            query = `
        SELECT resultId, gender,DATE_FORMAT(dob, '%Y-%m-%d') as dob, age, bloodType, gene, DNADescription, ProteinDescription
        FROM GeneticTestResults
        WHERE labreport_id = ?
      `;
        } else {
            return res.status(400).json({ error: "Invalid test type" });
        }

        const [results] = await con.query(query, [id]);
        if (results.affectedRows == 0) {
            return res.status(404).json({ error: "Result not found" });
        }
        res.json(results[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Failed to fetch data" });
    }
});

app.get("/medicines", async (req, res) => {
    try {
        const query = "SELECT * FROM Medicines";
        const [rows] = await con.query(query);
        res.json(rows);
    } catch (err) {
        console.error("Error executing query:", err);
        res.status(500).send("Database query failed");
    }
});

app.post("/orders", async (req, res) => {
    try {
        const { id, order_date, cost, address } = req.body;
        const query = 'INSERT INTO orders (order_date, patient_id, cost) VALUES (?, ?, ?)';
        const [result] = await con.query(query, [order_date, id, cost]);
        res.send({ success: true, message: 'Order placed successfully' });
    } catch (error) {
        console.error("Error executing query:", error);
        res.status(500).send({ success: false, message: "Failed to place the order" });
    }
});

// Add Blood Test Results
app.post('/addBloodTest', async (req, res) => {
    const [rows] = await con.query("SELECT MAX(resultId) AS max_id FROM bloodtestresults");

    let nextAppointmentId = "B1";
    if (rows[0].max_id) {
        const maxNumericId = parseInt(rows[0].max_id.substring(1), 10);
        nextAppointmentId = `B${maxNumericId + 1}`;
    }
    const { labReportId, gender, dob, age, bloodType, hemoglobin, plateletsCount } = req.body;

    const sql = `
      INSERT INTO bloodtestresults 
      (resultId, labreport_id, gender, dob, age, bloodType, hemoglobin, plateletsCount) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await con.query(sql, [nextAppointmentId, labReportId, gender, dob, age, bloodType, hemoglobin, plateletsCount]);
    const q = "Update labreports set result='Available' where labreport_id=?";
    await con.query(q, [labReportId]);

    res.send({ success: true, message: 'Record added!' });
});

// Add Diabetic Test Results
app.post('/addDiabeticTest', async (req, res) => {
    const { labReportId, gender, dob, age, bloodType, HbA1c, estimatedAvgGlucose } = req.body;
    const [rows] = await con.query("SELECT MAX(resultId) AS max_id FROM diabetictestresults");

    let nextAppointmentId = "D1";
    if (rows[0].max_id) {
        const maxNumericId = parseInt(rows[0].max_id.substring(1), 10);
        nextAppointmentId = `D${maxNumericId + 1}`;
    }
    const sql = `
      INSERT INTO diabetictestresults 
      (resultId,labreport_id, gender, dob, age, bloodType, HbA1c, estimatedAvgGlucose) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await con.query(sql, [nextAppointmentId, labReportId, gender, dob, age, bloodType, HbA1c, estimatedAvgGlucose]);
    const q = "Update labreports set result='Available' where labreport_id=?";
    await con.query(q, [labReportId]);

    res.send({ success: true, message: 'Record added!' });

});

// Add Genetic Test Results
app.post('/addGeneticTest', async (req, res) => {
    const { labReportId, gender, dob, age, bloodType, gene, DNADescription, ProteinDescription } = req.body;
    const [rows] = await con.query("SELECT MAX(resultId) AS max_id FROM genetictestresults");

    let nextAppointmentId = "G1";
    if (rows[0].max_id) {
        const maxNumericId = parseInt(rows[0].max_id.substring(1), 10);
        nextAppointmentId = `G${maxNumericId + 1}`;
    }
    const sql = `
      INSERT INTO genetictestresults 
      (resultId,labreport_id, gender, dob, age, bloodType, gene, DNADescription, ProteinDescription) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const q = "Update labreports set result='Available' where labreport_id=?";
    await con.query(q, [labReportId]);
    res.send({ success: true, message: 'Record added!' });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
