import * as fs from 'fs';
import AMETLLER_STORES from "./ametller_data_stores.json"
import SPAIN_CODES from "./ametller_data_spain.json"

interface GEOJSON {
  type: string,
  features: {
    type: string,
    properties: {
      ID_CP: number,
      COD_POSTAL: string,
      ALTA_DB: string,
      CODIGO_INE: number,
    },
    geometry: {
      type: string,
      coordinates: number[][][]
    }
  }[]
}

let ZIPS: {
  [key: string]: GEOJSON | null
} = {
  "08": null,
  "17": null,
  "25": null,
  "41": null,
  "43": null,
}
const init = async () => {

  await Promise.all(Object.entries(AMETLLER_STORES).map(async ([
    storeName,
    zipCodes,
  ]) => {
    let GEOJson: GEOJSON = {
      "type": "FeatureCollection",
      "features": []
    }
    console.info(`${storeName}:`)

    for await (const zipCode of zipCodes) {
      const target = zipCode.slice(0, 2);
      const municipio = SPAIN_CODES.resources.find(e => e.zip === target);
      let geoLocations = ZIPS[target];
      if(!municipio){
        console.error(`Not fount data for ${zipCode}`)
        return
      }
      if(!geoLocations){
        try{
          console.error(`Loading data for ${municipio.name}`)
          const data = await fs.promises.readFile(`${municipio.path}`, 'utf8')
          geoLocations = await JSON.parse(data)
          console.error(`END of load for ${municipio.name}`)
          ZIPS[target] = geoLocations
        }catch(e){
          console.error(e)
          throw new Error(`Erro getting data ${zipCode}`)
        }
       
      }
      if (geoLocations) {
        const founded = geoLocations.features.find(e => e.properties.COD_POSTAL === zipCode);
        if (founded) {
          console.error(`Adding feature for ${municipio.name}`)
          GEOJson.features.push(founded)
        }
      }
      console.info(`${zipCode}: ${municipio.name} \n`)
    }

    console.info(`Writing File`)
    fs.writeFile(`data/AMETLLER/${storeName}.geojson`, JSON.stringify(GEOJson, null, 2), err => {
      if (err) {
        console.error(err);
      } else {
        console.info('Correct file write')
      }
    })
    console.info(`END`)
  }));
}

init()