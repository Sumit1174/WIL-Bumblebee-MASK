// models/companyModel.js
import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  companyName: { type: String, required: true, unique: true },
  contactName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  interest: { type: String, required: true },
});

const Company = mongoose.model('Company', companySchema, 'companies'); // Specifies the 'companies' collection
export default Company;
