function validateForm() {
    let password = document.getElementById('password').value;
    let confirmpassword = document.getElementById('confirmpassword').value;

    if (password !== confirmpassword) {
        alert("Passwords do not match!");
        return false;
    }
    return true;
}
