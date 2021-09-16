window.addEventListener('DOMContentLoaded', () => {
    document.getElementById("new_token_add").addEventListener('click', addTokenEventListenter);
    document.getElementById("new_token_exit").addEventListener('click', exitTokenEventListenter);
});

function addTokenEventListenter(event) {
    //Hide add button
    document.getElementById("new_token_add").style.display = 'none';
    //Show input fields
    document.getElementById("new_token_owner_input").type = 'text';
    //Show submit/exit buttons
    document.getElementById("new_token_submit").type = 'submit';
    document.getElementById("new_token_exit").style.display = '';
}

function exitTokenEventListenter(event) {
    //Hide input fields
    document.getElementById("new_token_owner_input").type = 'hidden';
    //Hide submit/exit buttons
    document.getElementById("new_token_submit").type = 'hidden';
    document.getElementById("new_token_exit").style.display = 'none';
    //Show add button
    document.getElementById("new_token_add").style.display = '';
}