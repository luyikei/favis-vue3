'use strict';
import { create, all } from 'mathjs'

const config = { }
const math = create(all, config)

import {Data} from './Data.js'

let range = function(n) {
  return Array.from(new Array(n), (x, i) => i);
}

export class CSVData extends Data {
    constructor(csvData) {
      let rawmat = math.matrix(csvData);
      let names = csvData.columns;
      let row_names = range(csvData.length).map(i => "Factor " + (i + 1));
      super(rawmat, names, row_names);
    }
}

