window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll(".icon-edit").forEach(element => {
        element.addEventListener('click', editUserEventHandler);
    });
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