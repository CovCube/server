window.addEventListener('DOMContentLoaded', () => {
    document.getElementById("new_app_add").addEventListener('click', addAppEventListenter);
    document.getElementById("new_app_exit").addEventListener('click', exitAppEventListenter);
});

function addAppEventListenter(event) {
    //Hide add button
    document.getElementById("new_app_add").style.display = 'none';
    //Show input fields
    document.getElementById("new_app_name_input").type = 'text';
    document.getElementById("new_app_address_input").type = 'text';
    //Show submit/exit buttons
    document.getElementById("new_app_submit").type = 'submit';
    document.getElementById("new_app_exit").style.display = '';
}

function exitAppEventListenter(event) {
    //Hide input fields
    document.getElementById("new_app_name_input").type = 'hidden';
    document.getElementById("new_app_address_input").type = 'hidden';
    //Hide submit/exit buttons
    document.getElementById("new_app_submit").type = 'hidden';
    document.getElementById("new_app_exit").style.display = 'none';
    //Show add button
    document.getElementById("new_app_add").style.display = '';
}