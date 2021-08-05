const deleteSensorActuatorHTML = '<img class="icon-delete" src="/static/img/minus-solid.svg" height="20px" alt="Delete">'

window.addEventListener('DOMContentLoaded', () => {

    document.getElementById("add-sensor-button").addEventListener('click', addSensorActuator.bind(this, "sensor"));
    document.getElementById("add-actuator-button").addEventListener('click', addSensorActuator.bind(this, "actuator"));
    
    function addSensorActuator (type) {

        let select_elem = document.getElementById('additional_'+type+'s_select');
        let option = select_elem.selectedOptions.item(0).value;

        //Add row and cells
        let table = document.getElementById(type+'s');
        let new_row = table.insertRow(table.rows.length-1);
        let name_cell = new_row.insertCell();
        let delete_cell = new_row.insertCell();
        //Populate cells
        name_cell.innerHTML = option;
        delete_cell.innerHTML = deleteSensorActuatorHTML;

        //Remove option from select
        let option_elem = document.getElementById('add-'+type+'-'+option);
        option_elem.parentNode.removeChild(option_elem);

        //Remove select if empty
        if (select_elem.children.length == 0) {
            document.getElementById('additional_'+type+'s_row').style.display= 'none';
        }
    }
});