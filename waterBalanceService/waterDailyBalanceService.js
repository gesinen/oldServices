const cron = require('node-cron');
const mysql = require('mysql');

var __awaiter = (this && this.__awaiter) || function(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function(resolve) { resolve(value); }); }
    return new(P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }

        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }

        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator],
        i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() { return this; }, i);

    function verb(n) { i[n] = o[n] && function(v) { return new Promise(function(resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }

    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function(mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Al8987154St12',
    //password: '',
    database: 'swat_gesinen'
});

/*
    * * * * *
    | | | | |
    | | | | day of week
    | | | month
    | | day of month
    | hour
    minute
*/
// Ejecuta esta funcion a las 00:00 todos los dias
getGroupHydricBalance()
cron.schedule('00 21 * * *', function() {
    console.log('running task');
    //getGroupHydricBalance()
});

function getDistanceBetweenDates(date1str, date2str) {
    const date1 = new Date(date1str);
    const date2 = new Date(date2str);
    const diffTime = Math.abs(date2 - date1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    /*console.log("date1str <-> date2str", date1str, date2str)
    console.log("date1 <-> date2", date1, date2)
    console.log(diffDays + " days");
    */
    return diffDays;
}

function formatDate(date) {
    const offset = date.getTimezoneOffset();
    date = new Date(date.getTime() - (offset * 60 * 1000));
    return date.toISOString().split('T')[0];
}

async function getGroupHydricBalance() {
    console.log("getGroupHydricBalance()")
    return __awaiter(this, void 0, void 0, function*() {
        let dateNow = new Date(Date.now());
        // Reference date
        // dateNow.setDate(dateNow.getDate() - 1);
        let dateNowFormated = dateNow.toISOString().split("T")[0];
        dateNow.setDate(dateNow.getDate() - 3);
        let date3before = dateNow.toISOString().split("T")[0];
        //let dateNow2 = new Date(Date.now());
        // DESCOMENTAR ESTA
        //dateNow2.setDate(dateNow2.getDate() - 1);
        //let insertObservationDate = dateNow2.toISOString().split("T")[0];
        // Obtengo las observaciones de hoy y los ultimos dos días -> obtengo el consumo diario de cada dispositivo
        return new Promise((resolve, reject) => {
            var selectSQL = `
            SELECT water_group.id as water_group_id, water_devices.id as water_device_id, water_module_observation.observation_value, water_module_observation.message_timestamp 
            as observation_timestamp FROM water_group INNER JOIN water_devices ON water_devices.water_group_id=water_group.id INNER JOIN water_module_observation ON 
            water_module_observation.device_id=water_devices.id WHERE water_module_observation.message_timestamp >= '` + date3before + `' and water_module_observation.message_timestamp <= '` +
                dateNowFormated + ` 23:59:00' ORDER BY water_group_id ASC, water_device_id ASC, observation_timestamp DESC;
            `;
            console.log("*** SelectGroupBalance ***", selectSQL);
            db.getConnection((error, conn) => {
                // If the connection with the database fails
                if (error) {
                    reject({
                        http: 401,
                        status: "Failed",
                        error: error,
                    });
                }
                conn.query(selectSQL, (err, results) => __awaiter(this, void 0, void 0, function*() {
                    var e_1, _a;
                    conn.release();
                    // If the query fails
                    if (err) {
                        reject({
                            http: 401,
                            status: "Failed",
                            error: err,
                        });
                    }
                    if (results) {
                        // Valores iniciales
                        var groupsBalanceRes = {};
                        let selectedDeviceId = results[0].water_device_id;
                        let selectedDeviceObservationValue = results[0].observation_value;
                        let selectedObservationDate = results[0].observation_timestamp;
                        let previousObservations = [];
                        let selectedGroupId = results[0].water_group_id;
                        let groupBalanceSum = 0;
                        if (results && results.length != 0) {
                            results.forEach((observation, index) => {
                                if (index == results.length - 1) {
                                    groupBalanceSum += getDeviceHydricBalance(selectedDeviceObservationValue, selectedObservationDate, previousObservations);
                                    groupsBalanceRes[selectedGroupId] = groupBalanceSum;
                                } // En la primera iteracion no se hace nada ya que los valores iniciales se han guardado antes
                                else if (index != 0) {
                                    //console.log("observation",observation)
                                    // Si cambia el dispositivo seleccionado
                                    if (selectedDeviceId != observation.water_device_id) {
                                        // Si el dispositivo es de otro grupo
                                        if (selectedGroupId != observation.water_group_id) {
                                            console.log("******* selectedGroupId ********", selectedGroupId);
                                            console.log("******* GROUP CHANGED ********", observation.water_group_id);
                                            // Guardo el valor del sumatorio junto con su id
                                            groupsBalanceRes[selectedGroupId] = groupBalanceSum;
                                            //reseteo el valor del sumatorio de balance de grupo 
                                            groupBalanceSum = 0
                                        } else { // Si es del mismo grupo 
                                            // Añado al sumatorio el balance del dispositivo (con el que estaba trabajando antes de cambiar)
                                            groupBalanceSum += getDeviceHydricBalance(selectedDeviceObservationValue, selectedObservationDate, previousObservations);
                                        }
                                        // Guardo los datos de la primera observacion del dispositivo (ahora trabajaré con este)
                                        selectedDeviceId = observation.water_device_id;
                                        selectedDeviceObservationValue = observation.observation_value;
                                        selectedObservationDate = observation.observation_timestamp;
                                        selectedGroupId = observation.water_group_id;
                                        // Reseteo el valor de las observaciones previas que empezaré a rellenar en la siguiente iteración
                                        previousObservations = [];
                                    } else {
                                        previousObservations.push(observation);
                                    }
                                }
                            });
                            console.log("groupsBalanceRes", groupsBalanceRes);
                            try {
                                for (var _b = __asyncValues(Object.keys(groupsBalanceRes)), _c; _c = yield _b.next(), !_c.done;) {
                                    const key = _c.value;
                                    console.log(`${key}: ${groupsBalanceRes[key]}`);
                                    storeHidridBalance(key, groupsBalanceRes[key], dateNowFormated);
                                }
                            } catch (e_1_1) { e_1 = { error: e_1_1 }; } finally {
                                try {
                                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                                } finally { if (e_1) throw e_1.error; }
                            }
                        }
                    }
                }));
            });
        });
    });
}

function storeHidridBalance(group_id, balance, date) {
    return __awaiter(this, void 0, void 0, function*() {
        return new Promise((resolve, reject) => {
            var selectSQL = `
  INSERT INTO water_module_group_balance (group_id, balance, date) VALUES (` + group_id + `, ` + balance + `, '` + date + `');
  `;
            console.log("selectSQL", selectSQL);
            db.getConnection((error, conn) => {
                // If the connection with the database fails
                if (error) {
                    reject({
                        http: 401,
                        status: "Failed",
                        error: error,
                    });
                }
                conn.query(selectSQL, (err, results) => {
                    conn.release();
                    // If the query fails
                    if (err) {
                        reject({
                            http: 401,
                            status: "Failed",
                            error: err,
                        });
                    }
                    if (results) {
                        console.log("INSERT RESULT: " + results);
                    }
                });
            });
        });
    });
}

function getDeviceHydricBalance(lastObservation, selectedObservationDate, previousObservations) {
    let formatedDate = formatDate(selectedObservationDate);
    let res = 0;
    console.log("previousObservations", previousObservations);
    for (let i = 0; i < previousObservations.length; i++) {
        let observation = previousObservations[i];
        let daysDifference = getDistanceBetweenDates(formatedDate, observation.observation_timestamp);
        if (daysDifference > 1) {
            console.log("*** MORE THAN ONE DAY DIFF ***")
            console.log("lastObservationDate", selectedObservationDate);
            console.log("lastObservation", lastObservation);
            console.log("observation[i]", observation.observation_value);
            console.log("\n");
            return (lastObservation - ((lastObservation + observation.observation_value) / daysDifference));
        } else {
            console.log("*** LESS THAN ONE DAY DIFF ***")
            console.log("lastObservationDate", selectedObservationDate);
            console.log("lastObservation", lastObservation);
            console.log("observation[i]", observation.observation_value);
            console.log("\n");
            return lastObservation - observation.observation_value;
        }
    }
    return res;
}