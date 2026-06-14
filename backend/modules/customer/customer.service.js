const db = require('../../config/db');
const CustomerModel = require('./customer.model');
const bcrypt = require('bcrypt');
const { sendMail } = require('../../utils/mailer');
const env = require('../../config/env');
const logger = require('../../utils/logger');

const generateTempPassword = () => {
  const uppers = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowers = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const symbols = '!@#$%^&*()';
  
  let password = '';
  password += uppers[Math.floor(Math.random() * uppers.length)];
  password += lowers[Math.floor(Math.random() * lowers.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  const all = uppers + lowers + digits + symbols;
  for (let i = 0; i < 8; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

const CustomerService = {
  getCustomers: async ({ page = 1, limit = 20, search, isActive, sortBy = 'SureName', sortOrder = 'ASC' }) => {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
    const offset = (pageNum - 1) * limitNum;

    const { rows, total } = await CustomerModel.findList({
      limit: limitNum,
      offset,
      search,
      isActive,
      sortBy,
      sortOrder
    });

    const totalPages = Math.ceil(total / limitNum);

    return {
      data: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    };
  },

  getCustomerById: async (id) => {
    const customer = await CustomerModel.findById(id);
    if (!customer) {
      throw new Error('Customer not found.');
    }
    return customer;
  },

  createCustomer: async (data) => {
    const {
      Title, FirstName, SureName, Email, HomePhone, WorkPhone, MobilePhone, BirthDate, Gender, AddressLine, City, PostCode, Note,
      Occupation, RegisterDate, HourlyRate, BankType, BankName, SortCode, AccountNo, IBAN
    } = data;

    // 1. Validation
    if (!FirstName || !SureName || !Email) {
      throw new Error('Missing required fields: FirstName, SureName, and Email are mandatory.');
    }

    const emailExists = await CustomerModel.checkEmailExists(Email);
    if (emailExists) {
      throw new Error('Email address is already in use.');
    }

    // 2. Generate Username
    const cleanFirst = FirstName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanSurname = SureName.toLowerCase().replace(/[^a-z0-9]/g, '');
    let baseUsername = `${cleanFirst}.${cleanSurname}`;
    let username = baseUsername;
    let counter = 1;
    while (await CustomerModel.checkUsernameExists(username)) {
      counter++;
      username = `${baseUsername}${counter}`;
    }

    // 3. Generate Temporary Password & Hash
    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // 4. Begin Transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    let createdResult;
    try {
      createdResult = await CustomerModel.create({
        personData: { Title, FirstName, SureName, Email, HomePhone, MobilePhone, BirthDate, Gender, AddressLine, City, PostCode, Note },
        customerData: { WorkPhone, Occupation, RegisterDate, Rate: HourlyRate, BankType, BankName, SortCode, AccountNo, IBAN },
        userData: { Username: username, Password: hashedPassword }
      }, connection);

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    // 5. Send Welcome Email (Fail-safe)
    let warning = null;
    try {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 8px;">
          <h2 style="color: #1C2541;">Welcome to Mopsy, ${FirstName}!</h2>
          <p>Your Mopsy customer account has been successfully set up.</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Login URL:</strong> <a href="${env.APP_URL}/login" style="color: #00B4D8; text-decoration: none;">${env.APP_URL}/login</a></p>
            <p style="margin: 5px 0;"><strong>Username:</strong> ${username}</p>
            <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background-color: #eee; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${tempPassword}</code></p>
          </div>
          <p style="color: #666; font-size: 13px;">Please log in at your earliest convenience to access your scheduled services, view invoices, and submit change requests.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999;">If you did not expect this account request, please contact your administrator.<br />— The Mopsy Team</p>
        </div>
      `;

      await sendMail({
        to: Email,
        subject: 'Welcome to Mopsy — Your account is ready',
        html: emailHtml
      });
    } catch (mailErr) {
      logger.error(`Failed to send welcome email to customer <${Email}>: ${mailErr.message}`);
      warning = 'User created successfully, but the welcome email could not be sent.';
    }

    const fullCustomer = await CustomerModel.findById(createdResult.customerId);
    return { customer: fullCustomer, warning };
  },

  updateCustomer: async (id, data) => {
    const {
      Title, FirstName, SureName, Email, HomePhone, WorkPhone, MobilePhone, BirthDate, Gender, AddressLine, City, PostCode, Note,
      Occupation, RegisterDate, HourlyRate, BankType, BankName, SortCode, AccountNo, IBAN
    } = data;

    // 1. Validation
    if (!FirstName || !SureName || !Email) {
      throw new Error('Missing required fields: FirstName, SureName, and Email are mandatory.');
    }

    const currentCustomer = await CustomerModel.findById(id);
    if (!currentCustomer) {
      throw new Error('Customer not found.');
    }

    const emailExists = await CustomerModel.checkEmailExists(Email, currentCustomer.PersonID);
    if (emailExists) {
      throw new Error('Email address is already in use by another person.');
    }

    // 2. Begin Transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      await CustomerModel.update(id, {
        personData: { Title, FirstName, SureName, Email, HomePhone, MobilePhone, BirthDate, Gender, AddressLine, City, PostCode, Note },
        customerData: { WorkPhone, Occupation, RegisterDate, Rate: HourlyRate, BankType, BankName, SortCode, AccountNo, IBAN }
      }, connection);

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    return CustomerModel.findById(id);
  },

  toggleCustomerStatus: async (id, isActive) => {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      await CustomerModel.updateStatus(id, isActive, connection);
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    return CustomerModel.findById(id);
  }
};

module.exports = CustomerService;
