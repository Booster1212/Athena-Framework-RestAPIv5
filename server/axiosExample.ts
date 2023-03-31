import { OwnedVehicle } from '@AthenaShared/interfaces/vehicleOwned';
import * as APIConfig from './config/index';
import axios from 'axios';

axios
    .get('http://localhost:9970/api/protected/vehicles', {
        headers: {
            Authorization: `Bearer ${APIConfig.general.accessToken}`,
        },
    })
    .then((response) => {
        console.log(response.data);
        response.data.forEach((veh: OwnedVehicle, _index) => {
            console.log(veh.model);
        });
        console.log(`Received ${response.data.length} vehicles.`);
    })
    .catch((error) => {
        console.error(error);
    });
