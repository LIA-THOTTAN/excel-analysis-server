
const mongoose = require('mongoose');
const dotenv = require('dotenv').config();
const User = require('../models/userModel'); 

async function seedSuperAdmin() {
    const superAdminEmail = 'superadmin@gmail.com';
    const superAdminPassword = 'superadmin@123';
    const superAdminName = 'Super Admin';

    try {
        await mongoose.connect(process.env.MONGO_URI);

        const existingSuperAdmin = await User.findOne({ email: superAdminEmail });
        if (existingSuperAdmin) {
            console.log('Superadmin already exists. Skipping...');
            mongoose.connection.close();
            return;
        }

        
        await User.create({
            name: superAdminName,
            email: superAdminEmail,
            password: superAdminPassword,
            role: 'superadmin',
        });

        console.log('✅ Superadmin created with password superadmin@123');
        mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error creating superadmin:', error);
        mongoose.connection.close();
    }
}

seedSuperAdmin();
