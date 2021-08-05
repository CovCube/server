const deleteSensorActuatorHTML = '<img class="icon-delete" src="/static/img/minus-solid.svg" height="20px" alt="Delete">';

window.addEventListener('DOMContentLoaded', () => {

    //Add listeners for add icons
    document.getElementById("add-sensor-button").addEventListener('click', addSensorActuator.bind(this, "sensor"));
    document.getElementById("add-actuator-button").addEventListener('click', addSensorActuator.bind(this, "actuator"));

    //Add listeners for remove icons
    document.getElementById('sensors').querySelectorAll('.icon-delete').forEach(element => {
        element.addEventListener('click', removeSensorActuator.bind(this, 'sensor'));
    });
    document.getElementById('actuators').querySelectorAll('.icon-delete').forEach(element => {
        element.addEventListener('click', removeSensorActuator.bind(this, 'actuator'));
    });   
});

function addSensorActuator (type) {

    let select_elem = document.getElementById('additional_'+type+'s_select');
    let option = select_elem.selectedOptions.item(0).value;

    //Add to form data
    let input = document.getElementById(type+'s_input');
    if (input.value.length == 0) {
        input.value = input.value.concat(option);
    } else {
        input.value = input.value.concat(',', option);
    }
    
    //Add row and cells
    let table = document.getElementById(type+'s');
    let new_row = table.insertRow(table.rows.length-1);
    let name_cell = new_row.insertCell();
    let delete_cell = new_row.insertCell();
    let input_elem = document.createElement('input');
    input_elem.type = 'hidden';
    input_elem.value = option;
    new_row.appendChild(input_elem);
    //Populate cells
    name_cell.innerHTML = option;
    delete_cell.innerHTML = deleteSensorActuatorHTML;
    delete_cell.children[0].addEventListener('click', removeSensorActuator.bind(this, type));

    //Remove option from select
    let option_elem = document.getElementById('add-'+type+'-'+option);
    option_elem.parentNode.removeChild(option_elem);

    //Remove select if empty
    if (select_elem.children.length == 0) {
        document.getElementById('additional_'+type+'s_row').style.display= 'none';
    }
}

function removeSensorActuator (type, event) {

    let row = event.currentTarget.parentNode.parentNode;
    let option = row.querySelector('input').value;

    //Remove from form data
    let input = document.getElementById(type+'s_input');
    let splits = input.value.split(',');
    input.value = splits.filter(split => split !== option);

    //Remove row
    row.parentNode.removeChild(row);

    //Add as option
    let select_elem = document.getElementById('additional_'+type+'s_select');
    let option_elem = new Option(option, option);
    option_elem.id = 'add-'+type+'-'+option;
    option_elem.addEventListener('click', addSensorActuator.bind(this, type));
    select_elem.appendChild(option_elem);
}