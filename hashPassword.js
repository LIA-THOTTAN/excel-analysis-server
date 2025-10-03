const bcrypt = require('bcryptjs');

const generateHash = async () => {
    const password = 'admin1@123'; // <-- CHANGE THIS
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log(hashedPassword);
};

generateHash();