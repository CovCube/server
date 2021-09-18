window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll(".icon-edit").forEach(element => {
        element.addEventListener('click', editUserEventHandler);
    });

    document.getElementById("new_user_add").addEventListener('click', addUserEventListenter);
    document.getElementById("new_user_exit").addEventListener('click', exitUserEventListenter);
});

function editUserEventHandler(event) {
    let userId = event.target.id.split("_")[0];

    //Hide name span
    document.getElementById(userId+"_name_span").style.display = 'none';
    //Hide buttons
    document.getElementById(userId+"_edit").style.display = 'none';
    document.getElementById(userId+"_delete").style.display = 'none';
    //Show input fields
    document.getElementById(userId+"_name_input").type = 'text';
    document.getElementById(userId+"_password_input").type = 'password';
    //Show submit/reset buttons
    document.getElementById(userId+"_submit").type = 'submit';
    document.getElementById(userId+"_reset").type = 'reset';
}

function addUserEventListenter(event) {
    //Hide add button
    document.getElementById("new_user_add").style.display = 'none';
    //Show input fields
    document.getElementById("new_user_name_input").type = 'text';
    document.getElementById("new_user_password_input").type = 'password';
    //Show submit/exit buttons
    document.getElementById("new_user_submit").type = 'submit';
    document.getElementById("new_user_exit").style.display = '';
}

function exitUserEventListenter(event) {
    //Hide input fields
    document.getElementById("new_user_name_input").type = 'hidden';
    document.getElementById("new_user_password_input").type = 'hidden';
    //Hide submit/exit buttons
    document.getElementById("new_user_submit").type = 'hidden';
    document.getElementById("new_user_exit").style.display = 'none';
    //Show add button
    document.getElementById("new_user_add").style.display = '';
}