import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
    reference: { type: String, required: true },
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    status: { type: String, required: true, default: 'Pending' },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    paymentMethod: { type: String, required: true },
    userEmail: {type: String, required: true}
});

const Payment = mongoose.model('Payment', PaymentSchema);
export default Payment;