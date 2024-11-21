  import dotenv from 'dotenv';
  import express from 'express';
  import bodyParser from 'body-parser';
  import cors from 'cors';
  import axios from 'axios';

  import hbs from 'nodemailer-express-handlebars';
  import path from 'path';
  import nodemailer from 'nodemailer'
  import OpenAI from "openai";

  dotenv.config();

  const app = express();
  app.use(cors({ origin: '*' }));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  const AFFIRM_PRIVATE_API_KEY = process.env.AFFIRM_PRIVATE_API_KEY
  const AFFIRM_PUBLIC_API_KEY = process.env.AFFIRM_PUBLIC_API_KEY



  // ===== AFFIRM ===== //
 
  app.post('/api/confirm-order', (req, res) => {
    const checkoutToken = req.body.checkout_token;
    console.log(checkoutToken);
  
    if (!checkoutToken) {
      return res.status(400).json({ error: 'No checkout token provided' });
    }
  
    // Redirect to the frontend confirmation page with the checkout token as a URL parameter
    res.redirect(`https://bad-ass-bb-qs-ecommerce.vercel.app/checkout-confirmation?checkout_token=${checkoutToken}`);
  });

  app.post('/api/authorize-charge', async (req, res) => {
    const { checkoutToken } = req.body;
    console.log(checkoutToken);
    
  
    try {
      const response = await axios.post('https://sandbox.affirm.com/api/v2/charges', {
        checkout_token: checkoutToken,
      }, {
        auth: {
          username:'ENJBDHG33UOBFFPO', // Affirm sandbox public API key
          password:'xdLBMW2WoNSmbwjKN9WFh1jVWm3EVEz5', // Affirm sandbox private API key
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


  // ======= AUTHORIZE.NET ======= //  
  app.post("/api/payment", async (req, res) => {
    const { opaqueData, amount } = req.body;
  
    try {
      const response = await axios.post(
        "https://apitest.authorize.net/xml/v1/request.api",
        {
          createTransactionRequest: {
            merchantAuthentication: {
              name: process.env.AUTHORIZE_API_LOGIN_ID,
              transactionKey: process.env.AUTHORIZE_TRANSACTION_KEY,
            },
            transactionRequest: {
              transactionType: "authCaptureTransaction",
              amount: amount,
              payment: {
                opaqueData,
              },
            },
          },
        }
      );
  
      if (response.data.messages.resultCode === "Ok") {
        res.status(200).json({
          transactionId: response.data.transactionResponse.transId,
        });
      } else {
        throw new Error(response.data.messages.message[0].text);
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  


  
  // ======= EMAIL FORWARD ======= //
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


  // ========= OPEN AI ========= //



  const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_SECRET_KEY,
    organization: process.env.OPENAI_ORGANIZATION_ID,
    project: process.env.OPENAI_PROJECT_ID,
  });


  app.post("/generate-text", async (req, res) => {
    const { prompt } = req.body; // Get the prompt from the request body
  
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }
  
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo", // Specify the model
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000, // Set the maximum tokens for the response
      });
  
      // Extract the generated text from the response
      const generatedText = response.choices[0].message.content.trim();
  
      // Send the response back to the client
      res.status(200).json(generatedText);
    } catch (error) {
      console.error("Error generating text:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to generate text" });
    }
  });

  

  
    
  app.listen(8080, () => {
      console.log(`Server running on http://localhost:8080`);
  });




