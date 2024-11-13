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
  app.use(cors({ origin: 'https://bad-ass-bb-qs-ecommerce.vercel.app' }));
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

  app.post('/newPurchase', async (req, res) => {
    const orderData = {
      name: "John Doe",
      address: "1234 BBQ St, Grill Town, FL 56789",
      phone: "123-456-7890",
      email: "tecnodael@gmail.com",
      total: "149.99",
      products: [
        {
          imageUrl: "https://via.placeholder.com/80",
          title: "Smoky BBQ Grill",
          price: "99.99"
        },
        {
          imageUrl: "https://via.placeholder.com/80",
          title: "BBQ Sauce Set",
          price: "25.00"
        },
        {
          imageUrl: "https://via.placeholder.com/80",
          title: "Grill Brush",
          price: "25.00"
        }
      ]
    };
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
      res.status(200).send('EMAIL SENT ');
    } catch (error) {
      console.error('ERROR SENDING MAIL: ', error);
    }
  });


    
  app.listen(8080, () => {
      console.log(`Server running on http://localhost:8080`);
  });




