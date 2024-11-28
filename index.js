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
      const response = await axios.post('https://api.affirm.com/api/v2/charges', {
        checkout_token: checkoutToken,
      }, {
        auth: {
          username:AFFIRM_PUBLIC_API_KEY, // Affirm sandbox public API key
          password:AFFIRM_PRIVATE_API_KEY, // Affirm sandbox private API key
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

    console.log('TRANSACTION KEY:');
    console.log(AUTHORIZE_TRANSACTION_KEY);
    console.log('API LOGIN ID');
    console.log(AUTHORIZE_API_LOGIN_ID);
    
    
  
    try {
      const response = await axios.post(
        "https://api.authorize.net/xml/v1/request.api", // Use the sandbox endpoint for testing
        {
          createTransactionRequest: {
            merchantAuthentication: {
              name: process.env.AUTHORIZE_API_LOGIN_ID, // API Login ID
              transactionKey: process.env.AUTHORIZE_TRANSACTION_KEY, // Transaction Key
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
    const { orderData, order_id } = req.body; // Destructure the request body
    const transporter = nodemailer.createTransport({
        service: 'Outlook',
        auth: {
            user: 'badassbbqs@outlook.com',
            pass: 'jismkjwsbsjirkmp', // Ensure this is a valid app password for Gmail
        },
    });
    
    const handlebarOptions = {  
        viewEngine: {
            extName: '.handlebars',
            partialsDir: path.resolve('./views'), // Ensure this directory exists
            defaultLayout: false,
        },
        viewPath: path.resolve('./views'), // Ensure this directory exists
        extName: '.handlebars',
    };
    
    transporter.use('compile', hbs(handlebarOptions)); // Use handlebars with the transporter
    
    const customerMailOptions = {
        from: 'tecnodael@gmail.com',
        to: orderData.email, // Ensure `email` exists in orderData
        subject: 'Badass BBQs - Thank You for Your Order! - ' + order_id,
        template: 'newPurchase', // Ensure this template file exists in the views directory
        context: { ...orderData, order_id }, // Pass both orderData and order_id to the template
    };

    try {
        await transporter.sendMail(customerMailOptions);
        res.status(200).send({ message: 'EMAIL SENT!' });
    } catch (error) {
        console.error('ERROR SENDING MAIL: ', error);
        res.status(500).send({ message: 'ERROR SENDING MAIL: ' + error });
    }
});


  app.post('/contactForm', async (req, res) => {
    const data = req.body.data
    const transporter = nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      secure: false, // Use STARTTLS
      auth: {
          user: 'badassbbqs@outlook.com',
          pass: 'jismkjwsbsjirkmp',
      },
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

  





  // TEST
  
  app.get("/testCredentials", async (req, res) => {

  const testCredentials = async () => {
      const isProduction = true; // Set to true for production
      const endpoint = isProduction
          ? "https://api.authorize.net/xml/v1/request.api"
          : "https://apitest.authorize.net/xml/v1/request.api";

      const requestData = {
          authenticateTestRequest: {
              merchantAuthentication: {
                  name: process.env.AUTHORIZE_API_LOGIN_ID, // Replace with your API Login ID
                  transactionKey: process.env.AUTHORIZE_TRANSACTION_KEY, // Replace with your Transaction Key
              },
          },
      };

      try {
          const response = await axios.post(endpoint, requestData, {
              headers: { "Content-Type": "application/json" },
          });

          console.log("Response Data:", response.data);
          if (response.data.messages.resultCode === "Ok") {
              console.log("✅ Credentials are valid.");
          } else {
              console.error(
                  "❌ Credentials are invalid:",
                  response.data.messages.message[0].text
              );
          }
      } catch (error) {
          console.error("Error testing credentials:", error.message);
      }
  };

  testCredentials();

  })
    
  app.listen(8080, () => {
      console.log(`Server running on http://localhost:8080`);
  });




