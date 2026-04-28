import User from '../models/User.js';

const seedAdmin = async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        const adminExists = await User.findOne({ email: adminEmail });

        if (!adminExists) {
            await User.create({
                name: 'Super Admin',
                email: adminEmail,
                password: adminPassword,
                role: 'admin'
            });
            console.log('✅ Static Super Admin created successfully');
        } else {
            console.log('ℹ️ Static Super Admin already exists');
        }
    } catch (error) {
        console.error('❌ Error seeding admin:', error.message);
    }
};

export default seedAdmin;
