  import dotenv from 'dotenv';
  import express from 'express';
  import bodyParser from 'body-parser';
  import cors from 'cors';
  import axios from 'axios';

  import hbs from 'nodemailer-express-handlebars';
  import path from 'path';
  import nodemailer from 'nodemailer'


  dotenv.config();

  const app = express();
  app.use(cors({ origin: '*' }));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  const AFFIRM_PRIVATE_API_KEY = process.env.AFFIRM_PRIVATE_API_KEY
  const AFFIRM_PUBLIC_API_KEY = process.env.AFFIRM_PUBLIC_API_KEY


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

  app.post('/api/authorize-charge', async (req, res) => {
    const { checkoutToken } = req.body;
  
    try {
      const response = await axios.post('https://sandbox.affirm.com/api/v2/charges', {
        checkout_token: checkoutToken,
        order_id: 'YOUR_ORDER_ID', // Optional: Replace with your order ID if needed
      }, {
        auth: {
          username: AFFIRM_PUBLIC_API_KEY, // Affirm sandbox public API key
          password: AFFIRM_PRIVATE_API_KEY, // Affirm sandbox private API key
        },
      });
  
      // Get transaction_id from Affirm's response
      const { id: transactionId } = response.data;
  
      // Send transactionId back to the frontend
      res.status(200).json({ transactionId });
    } catch (error) {
      console.error('Error authorizing charge:', error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to authorize charge' });
    }
  });

  app.post('/newPurchase', async (req, res) => {
    const orderData = req.body.orderData
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'tecnodael@gmail.com',
            pass: 'fgfqjqbvkmbatyrn'
        }
    });
        
    const handlebarOptions = {
      viewEngine: {
          extName: '.handlebars',
          partialsDir: path.resolve('./views'),
          defaultLayout: false,
      },
      viewPath: path.resolve('./views'),
      extName: '.handlebars',
    };
    
    transporter.use('compile', hbs(handlebarOptions));
    const customerMailOptions = {
      from: 'tecnodael@gmail.com',
      to: orderData.email,
      subject: 'Badass BBQs - Thank You for Your Order!',
      template: 'newPurchase',
      context: orderData
    };

    try {
      await transporter.sendMail(customerMailOptions);
      res.status(200).send({ message: 'EMAIL SENT!' });
    } catch (error) {
      console.error('ERROR SENDING MAIL: ', error);
      res.send({ message: 'ERROR SENDING MAIL: ' +  error });
    }
  });

  app.post('/contactForm', async (req, res) => {
    const data = req.body.data
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'tecnodael@gmail.com',
            pass: 'fgfqjqbvkmbatyrn'
        }
    });
        
    const handlebarOptions = {
      viewEngine: {
          extName: '.handlebars',
          partialsDir: path.resolve('./views'),
          defaultLayout: false,
      },
      viewPath: path.resolve('./views'),
      extName: '.handlebars',
    };
    
    transporter.use('compile', hbs(handlebarOptions));
    const customerMailOptions = {
      from: 'tecnodael@gmail.com',
      to: 'tecnodael@gmail.com',
      subject: 'Badass BBQs - Contact Form',
      template: 'contactForm',
      context: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        message: data.message
      }
    };

    try {
      await transporter.sendMail(customerMailOptions);
      res.status(200).send({ message: 'EMAIL SENT!' });
    } catch (error) {
      console.error('ERROR SENDING MAIL: ', error);
      res.send({ message: 'ERROR SENDING MAIL: ' +  error });
    }
  });


    
  app.listen(8080, () => {
      console.log(`Server running on http://localhost:8080`);
  });




