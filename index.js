import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import axios from 'axios';

dotenv.config();

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const AFFIRM_PRIVATE_API_KEY = process.env.AFFIRM_PRIVATE_API_KEY



app.post('/api/confirm', async (req, res) => {
    const checkoutToken = req.body.checkout_token;
    console.log(req.body);
    console.log(AFFIRM_PRIVATE_API_KEY);
    

    try {
      // Make a request to Affirm to authorize the charge
      const response = await axios.post('https://sandbox.affirm.com/api/v2/charges', {
        checkout_token: checkoutToken,
      }, {
        headers: {
          Authorization: `Bearer ${AFFIRM_PRIVATE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      // Handle success
      res.status(200).json({ message: 'Payment authorized', data: response.data });
    } catch (error) {
      console.error('Error authorizing payment:', JSON.stringify(error));
      res.status(500).json({ message: 'Payment authorization failed', error: error.message });
    }
  });


  app.post('/api/test-affirm', async (req, res) => {
    
  
    try {
      const checkoutToken = '0TKTNYJ36HZLZKCP';
  
      const response = await axios.post(
        'https://sandbox.affirm.com/api/v2/transactions',
        { checkout_token: checkoutToken },
        {
          headers: {
            Authorization: `Bearer ${process.env.AFFIRM_PRIVATE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
  
      res.status(200).json({ message: 'Authorization successful', data: response.data });
    } catch (error) {
      console.error('Error authorizing payment:', error.response?.data || error.message);
      res.status(500).json({
        message: 'Payment authorization failed',
        error: error.response?.data || error.message,
      });
    }
  })
  
  
app.listen(8080, () => {
    console.log(`Server running on http://localhost:8080`);
});




