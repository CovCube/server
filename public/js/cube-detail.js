const deleteSensorActuatorHTML = '<img class="icon-delete" src="/static/img/minus-solid.svg" height="20px" alt="Delete">';

window.addEventListener('DOMContentLoaded', () => {

    //Add listener for form reset event
    document.getElementById('form').addEventListener('reset', resetForm);

    //Add listeners for add icons
    document.getElementById("add-sensor-button").addEventListener('click', addSensorActuatorEventHandler.bind(this, "sensor"));
    document.getElementById("add-actuator-button").addEventListener('click', addSensorActuatorEventHandler.bind(this, "actuator"));

    //Add listeners for remove icons
    document.getElementById('sensors').querySelectorAll('.icon-delete').forEach(element => {
        element.addEventListener('click', removeSensorActuatorEventHandler.bind(this, 'sensor'));
    });
    document.getElementById('actuators').querySelectorAll('.icon-delete').forEach(element => {
        element.addEventListener('click', removeSensorActuatorEventHandler.bind(this, 'actuator'));
    });   
});


function resetForm() {
    let original_sensors = document.getElementById('original_sensors_input').value.split(',');
    console.log(original_sensors);
    let sensors_input = document.getElementById('sensors_input').value.split(',');
    console.log(sensors_input);
    let original_actuators = document.getElementById('original_actuators_input').value.split(',');
    console.log(original_actuators);
    let actuators_input = document.getElementById('actuators_input').value.split(',');
    console.log(actuators_input);

    original_sensors.forEach((value) => {
        if (!sensors_input.includes(value)) {
            addSensorActuator('sensor', value);
        } else {
            let index = sensors_input.indexOf(value);
            sensors_input.splice(index, 1);
        }
    });

    original_actuators.forEach((value) => {
        if (!actuators_input.includes(value)) {
            addSensorActuator('actuator', value);
        } else {
            let index = actuators_input.indexOf(value);
            actuators_input.splice(index, 1);
        }
    });
    
    sensors_input.forEach((value) => {
        //If value is empty, skip the rest
        if (!value) return;
        removeSensorActuator('sensor', value);
    })
    
    actuators_input.forEach((value) => {
        //If value is empty, skip the rest
        if (!value) return;
        removeSensorActuator('actuator', value);
    })

    document.getElementById('sensors_input').value = original_sensors;
    document.getElementById('actuators_input').value = original_actuators;
}

function addSensorActuatorEventHandler (type) {

    let select_elem = document.getElementById('additional_'+type+'s_select');
    let option = select_elem.selectedOptions.item(0).value;

    //Add to form data
    let input = document.getElementById(type+'s_input');
    if (input.value.length == 0) {
        input.value = input.value.concat(option);
    } else {
        input.value = input.value.concat(',', option);
    }

    addSensorActuator(type, option);
}

function addSensorActuator (type, option) {
    //Add row and cells
    let table = document.getElementById(type+'s');
    let new_row = table.insertRow(table.rows.length-1);
    new_row.id = type + '_row_' + option;
    let name_cell = new_row.insertCell();
    let delete_cell = new_row.insertCell();
    let input_elem = document.createElement('input');
    input_elem.type = 'hidden';
    input_elem.value = option;
    new_row.appendChild(input_elem);
    //Populate cells
    name_cell.innerHTML = option;
    delete_cell.innerHTML = deleteSensorActuatorHTML;
    delete_cell.children[0].addEventListener('click', removeSensorActuatorEventHandler.bind(this, type));

    //Remove option from select
    let option_elem = document.getElementById('add-'+type+'-'+option);
    option_elem.parentNode.removeChild(option_elem);

    //Remove select if empty
    if (document.getElementById('additional_'+type+'s_select').children.length == 0) {
        document.getElementById('additional_'+type+'s_row').style.display= 'none';
    }
}

function removeSensorActuatorEventHandler (type, event) {

    let row = event.currentTarget.parentNode.parentNode;
    let option = row.querySelector('input').value;

    //Remove from form data
    let input = document.getElementById(type+'s_input');
    let splits = input.value.split(',');
    input.value = splits.filter(split => split !== option);

    removeSensorActuator(type, option);
}

function removeSensorActuator (type, option) {
    let row = document.getElementById(type+'_row_'+option);
    //Remove row
    row.parentNode.removeChild(row);

    //Add as option
    let select_elem = document.getElementById('additional_'+type+'s_select');
    let option_elem = new Option(option, option);
    option_elem.id = 'add-'+type+'-'+option;
    option_elem.addEventListener('click', addSensorActuator.bind(this, type));
    select_elem.appendChild(option_elem);

    //Make selection visible, if not
    let addition_row = document.getElementById('additional_'+type+'s_row');
    if (addition_row.style.display == 'none') {addition_row.style.display = ''};
}