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
const port = 3003;

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

// Fetch all users
app.get('/api/users', async (req, res) => {
    try {
      const [users] = await con.query("SELECT user_id, full_name, email FROM Users where role!='admin';");
      res.send(users);
    } catch (err) {
      console.error('Error fetching users:', err);
      res.status(500).send('Failed to fetch users');
    }
});

  
app.get('/api/medicines', async (req, res) => {
    try {
      const [users] = await con.query("SELECT medicine_id, name, stock, expiry_date, category, description, price FROM medicines;");
      res.send(users);
    } catch (err) {
      console.error('Error fetching users:', err);
      res.status(500).send('Failed to fetch users');
    }
});
// Delete a user
app.delete('/api/users/:id', async (req, res)=>{
    try {
      const { id } = req.params;
      const [result] = await con.query('DELETE FROM Users WHERE user_id=?', [id]);
  
      if (result.affectedRows === 0) {
        return res.status(404).send('User not found');
      }
  
      res.send({ success: true, message: 'User deleted successfully' });
    } catch (err) {
      console.error('Error deleting user:', err);
      res.status(500).send('Failed to delete user');
    }
});
  
// Fetch user by ID
app.get('/api/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const [user] = await con.query('SELECT user_id, full_name, email FROM Users WHERE user_id= ?', [id]);
      if (user.length === 0) {
        return res.status(404).send('User not found');
      }
      res.send(user[0]);
    } catch (err) {
      console.error('Error fetching user:', err);
      res.status(500).send('Failed to fetch user');
    }
  });
  
  // Update user by ID
  app.put('/api/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { full_name, email } = req.body;
      const [result] = await con.query(
        'UPDATE Users SET full_name = ?, email = ? WHERE user_id = ?',
        [full_name, email, id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).send('User not found');
      }
      res.send({ success: true, message: 'User updated successfully' });
    } catch (err) {
      console.error('Error updating user:', err);
      res.status(500).send('Failed to update user');
    }
  });

  app.put('/api/medicines/:id/stock', async (req, res) => {
    const { id } = req.params;
    const { stock } = req.body;
  
    try {
      const [result] = await con.query(
        "UPDATE medicines SET stock = ? WHERE medicine_id = ?",
        [stock, id]
      );
  
      if (result.affectedRows === 0) {
        return res.status(404).send('Medicine not found');
      }
  
      res.send({ message: 'Stock updated successfully' });
    } catch (err) {
      console.error('Error updating stock:', err);
      res.status(500).send('Failed to update stock');
    }
  });

  app.delete('/api/medicines/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      const [result] = await con.query(
        "DELETE FROM medicines WHERE medicine_id = ?",
        [id]
      );
  
      if (result.affectedRows === 0) {
        return res.status(404).send('Medicine not found');
      }
  
      res.send({ message: 'Medicine deleted successfully' });
    } catch (err) {
      console.error('Error deleting medicine:', err);
      res.status(500).send('Failed to delete medicine');
    }
  });
  
  app.post('/api/medicinesadd', async (req, res) => {
    const { name, category, description, stock, price, date } = req.body;
  
    try {
      const query = `
        INSERT INTO Medicines (name, category, description, stock, price, expiry_date)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      await con.query(query, [name, category, description, stock, price, date]);
      res.status(201).send({ message: 'Medicine added successfully' });
    } catch (error) {
      console.error('Error adding medicine:', error);
      res.status(500).send({ error: 'Failed to add medicine' });
    }
  });
  app.get('/api/admin-profile/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const [user] = await con.query('Select a.*,u.* from users u join admin a on a.user_id=u.user_id where a.user_id= ?', [id]);
      if (user.length === 0) {
        return res.status(404).send('User not found');
      }
      res.send(user[0]);
    } catch (err) {
      console.error('Error fetching user:', err);
      res.status(500).send('Failed to fetch user');
    }
  });
  
  
  
app.listen(port, () => {
    console.log(`Admin's backend running on port ${port}`);
});
