fetch('https://task-management-2-k29t.onrender.com/api/auth/forgotpassword', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nency.trks028@gmail.com' })
})
.then(res => res.text().then(text => ({ status: res.status, text })))
.then(({ status, text }) => {
    console.log(`Status: ${status}`);
    try {
        console.log(JSON.stringify(JSON.parse(text), null, 2));
    } catch (e) {
        console.log('Raw Response (not JSON):');
        console.log(text.substring(0, 500));
    }
})
.catch(err => console.error(err));
